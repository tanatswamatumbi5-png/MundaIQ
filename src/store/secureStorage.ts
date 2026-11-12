import AsyncStorage from '@react-native-async-storage/async-storage';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/ciphers/utils.js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/**
 * On-device storage for farm records.
 *
 * The JSON payload is encrypted with XChaCha20-Poly1305 before it touches
 * AsyncStorage. The 32-byte key lives in the OS keystore (SecureStore) and is
 * never written to disk in plaintext and never leaves the device.
 *
 * The `v5` plaintext key is read once so existing installs migrate without
 * losing data; it is removed as soon as the encrypted copy is written.
 */

const ENCRYPTED_KEY = 'munda-iq:data:v6';
const LEGACY_KEY = 'munda-iq:data:v5';
const DATA_KEY_ID = 'munda-iq.storage.key.v1';

type Envelope = {
  v: 1;
  n: string;
  c: string;
};

export type StoredData = {
  data: unknown;
  source: 'encrypted' | 'legacy' | 'none';
};

export class SecureStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecureStorageError';
  }
}

let cachedKey: Uint8Array | null = null;

async function getDataKey(): Promise<Uint8Array> {
  if (cachedKey) return cachedKey;

  const existing = await SecureStore.getItemAsync(DATA_KEY_ID);
  if (existing) {
    cachedKey = hexToBytes(existing);
    return cachedKey;
  }

  const key = Crypto.getRandomBytes(32);
  await SecureStore.setItemAsync(DATA_KEY_ID, bytesToHex(key), {
    // Android ignores this option; on iOS it keeps the key out of backups and
    // off other devices.
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  cachedKey = key;
  return key;
}

function decryptEnvelope(raw: string, key: Uint8Array): unknown {
  let envelope: Partial<Envelope>;
  try {
    envelope = JSON.parse(raw) as Partial<Envelope>;
  } catch {
    throw new SecureStorageError('Saved data could not be read.');
  }

  if (
    envelope.v !== 1 ||
    typeof envelope.n !== 'string' ||
    typeof envelope.c !== 'string'
  ) {
    throw new SecureStorageError('Saved data uses an unsupported format.');
  }

  try {
    const plaintext = xchacha20poly1305(key, hexToBytes(envelope.n)).decrypt(
      hexToBytes(envelope.c),
    );
    return JSON.parse(new TextDecoder().decode(plaintext));
  } catch {
    throw new SecureStorageError('Saved data could not be decrypted.');
  }
}

/** Reads and decrypts the current payload, with a one-time plaintext migration. */
export async function loadStoredData(): Promise<StoredData> {
  const encrypted = await AsyncStorage.getItem(ENCRYPTED_KEY);
  if (encrypted) {
    return { data: decryptEnvelope(encrypted, await getDataKey()), source: 'encrypted' };
  }

  const legacy = await AsyncStorage.getItem(LEGACY_KEY);
  if (legacy) {
    try {
      return { data: JSON.parse(legacy), source: 'legacy' };
    } catch {
      throw new SecureStorageError('Existing data could not be read.');
    }
  }

  return { data: null, source: 'none' };
}

/** Encrypts and persists the payload, then removes any legacy plaintext copy. */
export async function saveStoredData(data: unknown): Promise<void> {
  const key = await getDataKey();
  const nonce = Crypto.getRandomBytes(24);
  const plaintext = utf8ToBytes(JSON.stringify(data));
  const ciphertext = xchacha20poly1305(key, nonce).encrypt(plaintext);

  const envelope: Envelope = {
    v: 1,
    n: bytesToHex(nonce),
    c: bytesToHex(ciphertext),
  };

  await AsyncStorage.setItem(ENCRYPTED_KEY, JSON.stringify(envelope));
  await AsyncStorage.removeItem(LEGACY_KEY);
}

/** Destroys the encryption key as well as the ciphertext. */
export async function clearStoredData(): Promise<void> {
  await AsyncStorage.multiRemove([ENCRYPTED_KEY, LEGACY_KEY]);
  await SecureStore.deleteItemAsync(DATA_KEY_ID);
  cachedKey = null;
}
