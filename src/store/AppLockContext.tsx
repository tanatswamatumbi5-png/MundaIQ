import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'munda-iq.lock.pin.v1';
const BIOMETRICS_KEY = 'munda-iq.lock.biometrics.v1';
const ATTEMPTS_KEY = 'munda-iq.lock.attempts.v1';
const AUTO_LOCK_AFTER_MS = 15_000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

type PinRecord = {
  v: 1;
  salt: string;
  hash: string;
};

type AttemptRecord = {
  v: 1;
  count: number;
  until: number;
};

type AppLockContextValue = {
  ready: boolean;
  enabled: boolean;
  locked: boolean;
  biometricsAvailable: boolean;
  biometricsEnabled: boolean;
  error: string | null;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  enableLock: (pin: string) => Promise<void>;
  disableLock: (pin: string) => Promise<boolean>;
  changePin: (currentPin: string, nextPin: string) => Promise<boolean>;
  setBiometricsEnabled: (value: boolean) => Promise<void>;
  lockNow: () => void;
};

const AppLockContext = createContext<AppLockContextValue | null>(null);

const secureOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} as const;

export const PIN_PATTERN = /^\d{4,6}$/;

const PIN_ITERATIONS = 150_000;

async function hashPin(pin: string, salt: string): Promise<string> {
  // PBKDF2 slows down offline guessing of a short PIN. The PIN record only
  // ever lives in SecureStore, backed by the Android keystore.
  const derived = await pbkdf2Async(sha256, pin, utf8ToBytes(salt), {
    c: PIN_ITERATIONS,
    dkLen: 32,
  });
  return bytesToHex(derived);
}

async function readPinRecord(): Promise<PinRecord | null> {
  const raw = await SecureStore.getItemAsync(PIN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PinRecord>;
    if (parsed.v !== 1 || typeof parsed.salt !== 'string' || typeof parsed.hash !== 'string') {
      return null;
    }
    return { v: 1, salt: parsed.salt, hash: parsed.hash };
  } catch {
    return null;
  }
}

async function writePinRecord(pin: string): Promise<void> {
  const salt = Crypto.getRandomBytes(16);
  const saltHex = Array.from(salt, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const record: PinRecord = {
    v: 1,
    salt: saltHex,
    hash: await hashPin(pin, saltHex),
  };
  await SecureStore.setItemAsync(PIN_KEY, JSON.stringify(record), secureOptions);
}

async function readAttemptRecord(): Promise<AttemptRecord | null> {
  const raw = await SecureStore.getItemAsync(ATTEMPTS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AttemptRecord>;
    if (
      parsed.v !== 1 ||
      typeof parsed.count !== 'number' ||
      typeof parsed.until !== 'number'
    ) {
      return null;
    }
    return { v: 1, count: parsed.count, until: parsed.until };
  } catch {
    return null;
  }
}

async function writeAttemptRecord(count: number, until: number): Promise<void> {
  const record: AttemptRecord = { v: 1, count, until };
  await SecureStore.setItemAsync(ATTEMPTS_KEY, JSON.stringify(record), secureOptions);
}

async function clearAttemptRecord(): Promise<void> {
  await SecureStore.deleteItemAsync(ATTEMPTS_KEY);
}

export function AppLockProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabledState] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const attempts = useRef(0);
  const lockoutUntil = useRef(0);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [record, hardware, enrolled, biometricsPreference, savedAttempts] = await Promise.all([
          readPinRecord(),
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
          SecureStore.getItemAsync(BIOMETRICS_KEY),
          readAttemptRecord(),
        ]);
        if (cancelled) return;

        if (savedAttempts) {
          attempts.current = savedAttempts.count;
          lockoutUntil.current = savedAttempts.until;
          if (savedAttempts.until > Date.now()) {
            setError('Too many attempts. Wait 30 seconds and try again.');
          }
        }

        setEnabled(record !== null);
        setLocked(record !== null);
        setBiometricsAvailable(hardware && enrolled);
        setBiometricsEnabledState(biometricsPreference !== '0');
      } catch {
        if (!cancelled) setError('App lock could not be initialised on this device.');
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Keep financial records out of screenshots and the recent-apps thumbnail.
    ScreenCapture.preventScreenCaptureAsync().catch(() => undefined);

    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => undefined);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        backgroundedAt.current = Date.now();
        return;
      }

      if (state === 'active') {
        const since = backgroundedAt.current;
        backgroundedAt.current = null;
        if (since && Date.now() - since >= AUTO_LOCK_AFTER_MS) {
          setLocked(true);
        }
      }
    });

    return () => subscription.remove();
  }, [enabled]);

  const unlockWithPin = useCallback(async (pin: string): Promise<boolean> => {
    const now = Date.now();
    if (now < lockoutUntil.current) {
      setError('Too many attempts. Wait 30 seconds and try again.');
      return false;
    }

    const record = await readPinRecord();
    if (!record) {
      setError('App lock is not configured.');
      return false;
    }

    const hash = await hashPin(pin, record.salt);
    if (hash !== record.hash) {
      attempts.current += 1;
      if (attempts.current >= MAX_ATTEMPTS) {
        attempts.current = 0;
        lockoutUntil.current = now + LOCKOUT_MS;
        await writeAttemptRecord(0, lockoutUntil.current);
        setError('Too many attempts. Wait 30 seconds and try again.');
      } else {
        await writeAttemptRecord(attempts.current, 0);
        setError('Incorrect PIN.');
      }
      return false;
    }

    attempts.current = 0;
    lockoutUntil.current = 0;
    await clearAttemptRecord();
    setError(null);
    setLocked(false);
    return true;
  }, []);

  const unlockWithBiometrics = useCallback(async (): Promise<boolean> => {
    if (!biometricsAvailable || !biometricsEnabled) {
      setError('Biometric unlock is not available.');
      return false;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock MundaIQ',
        cancelLabel: 'Use PIN',
      });
      if (!result.success) {
        // Tapping "Use PIN" is a normal path, not an error worth shouting about.
        if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
          setError('Biometric unlock failed. Use your PIN.');
        }
        return false;
      }
      attempts.current = 0;
      lockoutUntil.current = 0;
      await clearAttemptRecord();
      setError(null);
      setLocked(false);
      return true;
    } catch {
      setError('Biometric unlock failed. Use your PIN.');
      return false;
    }
  }, [biometricsAvailable, biometricsEnabled]);

  const enableLock = useCallback(async (pin: string) => {
    if (!PIN_PATTERN.test(pin)) {
      throw new Error('PIN must be 4 to 6 digits.');
    }
    await writePinRecord(pin);
    await clearAttemptRecord();
    attempts.current = 0;
    lockoutUntil.current = 0;
    if (biometricsAvailable) {
      await SecureStore.setItemAsync(BIOMETRICS_KEY, '1', secureOptions);
      setBiometricsEnabledState(true);
    }
    setEnabled(true);
    setLocked(false);
    setError(null);
  }, [biometricsAvailable]);

  const disableLock = useCallback(async (pin: string): Promise<boolean> => {
    const record = await readPinRecord();
    if (!record) {
      setEnabled(false);
      return true;
    }
    const hash = await hashPin(pin, record.salt);
    if (hash !== record.hash) {
      setError('Incorrect PIN.');
      return false;
    }
    await SecureStore.deleteItemAsync(PIN_KEY);
    await SecureStore.deleteItemAsync(BIOMETRICS_KEY);
    await clearAttemptRecord();
    attempts.current = 0;
    lockoutUntil.current = 0;
    setEnabled(false);
    setLocked(false);
    setError(null);
    return true;
  }, []);

  const changePin = useCallback(async (currentPin: string, nextPin: string): Promise<boolean> => {
    const record = await readPinRecord();
    if (!record) {
      setError('App lock is not configured.');
      return false;
    }
    if (!PIN_PATTERN.test(nextPin)) {
      setError('New PIN must be 4 to 6 digits.');
      return false;
    }
    const hash = await hashPin(currentPin, record.salt);
    if (hash !== record.hash) {
      setError('Current PIN is incorrect.');
      return false;
    }
    await writePinRecord(nextPin);
    setError(null);
    return true;
  }, []);

  const setBiometricsEnabled = useCallback(async (value: boolean) => {
    await SecureStore.setItemAsync(BIOMETRICS_KEY, value ? '1' : '0', secureOptions);
    setBiometricsEnabledState(value);
  }, []);

  const lockNow = useCallback(() => setLocked(true), []);

  const value = useMemo<AppLockContextValue>(
    () => ({
      ready,
      enabled,
      locked,
      biometricsAvailable,
      biometricsEnabled,
      error,
      unlockWithPin,
      unlockWithBiometrics,
      enableLock,
      disableLock,
      changePin,
      setBiometricsEnabled,
      lockNow,
    }),
    [
      ready,
      enabled,
      locked,
      biometricsAvailable,
      biometricsEnabled,
      error,
      unlockWithPin,
      unlockWithBiometrics,
      enableLock,
      disableLock,
      changePin,
      setBiometricsEnabled,
      lockNow,
    ],
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock(): AppLockContextValue {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
}
