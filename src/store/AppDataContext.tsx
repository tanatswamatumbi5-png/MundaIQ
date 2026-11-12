import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Cage, DailyRecord, Expense, LayerFlock } from '@/types';
import { colors, fontSize, spacing } from '@/theme';
import { appDataSchema } from './appDataSchema';
import { SecureStorageError, clearStoredData, loadStoredData, saveStoredData } from './secureStorage';

export type AppData = {
  flocks: LayerFlock[];
  cages: Cage[];
  dailyRecords: DailyRecord[];
  expenses: Expense[];
};

type AppDataContextValue = AppData & {
  ready: boolean;
  storageError: string | null;
  loadFailed: boolean;
  retrySave: () => Promise<void>;
  clearAllData: () => Promise<void>;
  restoreData: (next: AppData) => Promise<void>;
  addFlock: (flock: LayerFlock) => void;
  deleteFlock: (id: string) => void;
  updateCage: (cage: Cage) => void;
  addRecord: (record: DailyRecord) => void;
  deleteRecord: (id: string) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

const SAVE_DEBOUNCE_MS = 250;

function emptyData(): AppData {
  return { flocks: [], cages: [], dailyRecords: [], expenses: [] };
}

function describeStorageError(error: unknown): string {
  if (error instanceof SecureStorageError) return error.message;
  return 'Saved data could not be loaded. Your existing file has been left untouched.';
}

export function AppDataProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const hydrated = useRef(false);
  const writable = useRef(false);
  const loadFailedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = await loadStoredData();
        if (cancelled) return;

        if (stored.data !== null) {
          const parsed = appDataSchema.safeParse(stored.data);
          if (!parsed.success) {
            throw new SecureStorageError(
              'Saved data is not in a recognised format. Your existing file has been left untouched.',
            );
          }

          writable.current = true;
          setData(parsed.data);

          // One-time migration from the old plaintext key.
          if (stored.source === 'legacy') {
            await saveStoredData(parsed.data);
          }
        } else {
          writable.current = true;
        }
      } catch (error) {
        if (cancelled) return;
        writable.current = false;
        loadFailedRef.current = true;
        setLoadFailed(true);
        setStorageError(describeStorageError(error));
        // Keep the app usable, but never overwrite the unreadable file.
        setData(emptyData());
      } finally {
        if (!cancelled) {
          hydrated.current = true;
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current || !writable.current) return;

    const timer = setTimeout(() => {
      saveStoredData(data)
        .then(() => setStorageError(null))
        .catch(() => {
          writable.current = false;
          setStorageError('Changes could not be saved securely to this device.');
        });
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [data]);

  const retrySave = useCallback(async () => {
    if (loadFailedRef.current) return;
    try {
      await saveStoredData(data);
      writable.current = true;
      setStorageError(null);
    } catch {
      setStorageError('Changes could not be saved securely to this device.');
    }
  }, [data]);

  const restoreData = useCallback(async (next: AppData) => {
    await saveStoredData(next);
    writable.current = true;
    loadFailedRef.current = false;
    setLoadFailed(false);
    setStorageError(null);
    setData(next);
  }, []);

  const clearAllData = useCallback(async () => {
    await clearStoredData();
    writable.current = true;
    loadFailedRef.current = false;
    setLoadFailed(false);
    setStorageError(null);
    setData(emptyData());
  }, []);

  const value = useMemo<AppDataContextValue>(() => {
    const persist = (next: AppData) => setData(next);

    const nextId = (prefix: string) =>
      `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

    return {
      ...data,
      ready,
      storageError,
      loadFailed,
      retrySave,
      clearAllData,
      restoreData,
      addFlock: (flock) =>
        persist({ ...data, flocks: [...data.flocks, { ...flock, id: flock.id || nextId('flk') }] }),
      deleteFlock: (id) =>
        persist({
          ...data,
          flocks: data.flocks.filter((f) => f.id !== id),
          dailyRecords: data.dailyRecords.filter((r) => r.flockId !== id),
          cages: data.cages.map((c) => (c.flockId === id ? { ...c, flockId: '' } : c)),
        }),
      updateCage: (cage) =>
        persist({
          ...data,
          cages: data.cages.map((c) => (c.id === cage.id ? { ...c, ...cage } : c)),
        }),
      addRecord: (record) =>
        persist({
          ...data,
          // one collection per cage per day: logging again replaces that cage's row
          dailyRecords: [
            ...data.dailyRecords.filter((r) => !(r.cageId === record.cageId && r.date === record.date)),
            { ...record, id: record.id || nextId('rec') },
          ],
        }),
      deleteRecord: (id) =>
        persist({ ...data, dailyRecords: data.dailyRecords.filter((r) => r.id !== id) }),
      addExpense: (expense) =>
        persist({ ...data, expenses: [...data.expenses, { ...expense, id: expense.id || nextId('exp') }] }),
      updateExpense: (expense) =>
        persist({
          ...data,
          expenses: data.expenses.map((e) => (e.id === expense.id ? { ...e, ...expense } : e)),
        }),
      deleteExpense: (id) =>
        persist({ ...data, expenses: data.expenses.filter((e) => e.id !== id) }),
    };
  }, [data, ready, storageError, loadFailed, retrySave, clearAllData, restoreData]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Opening encrypted records…</Text>
      </View>
    );
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
