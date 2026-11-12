import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { AppData } from '@/store/AppDataContext';
import { appDataSchema } from '@/store/appDataSchema';

const BACKUP_APP = 'MundaIQ';
const BACKUP_VERSION = 1;

type BackupFile = {
  app: typeof BACKUP_APP;
  formatVersion: typeof BACKUP_VERSION;
  exportedAt: string;
  data: unknown;
};

/**
 * Writes a readable JSON backup to the cache directory and opens the Android
 * share sheet so the farmer can save it to Drive, email it, and so on.
 *
 * The backup is intentionally *not* encrypted: it is meant to be restorable on
 * another device. The UI warns about this before exporting.
 */
export async function exportAppData(data: AppData): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }

  const payload: BackupFile = {
    app: BACKUP_APP,
    formatVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };

  const stamp = payload.exportedAt.slice(0, 10);
  const file = new File(Paths.cache, `mundaiq-backup-${stamp}.json`);
  file.create({ overwrite: true });
  file.write(JSON.stringify(payload, null, 2));

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save or share your MundaIQ backup',
    UTI: 'public.json',
  });
}

/** Lets the farmer pick a previously exported JSON file and returns its text. */
export async function pickBackupText(): Promise<string | null> {
  const picked = await File.pickFileAsync({
    mimeTypes: ['application/json', 'text/plain'],
  });
  if (picked.canceled) return null;
  return picked.result.text();
}

function describeParseError(error: unknown): string {
  if (error instanceof SyntaxError) return 'That file is not valid JSON.';
  return 'That file is not a MundaIQ backup.';
}

/** Parses and validates a backup before anything is written over live data. */
export function parseBackup(raw: string): AppData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(describeParseError(error));
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as Partial<BackupFile>).app !== BACKUP_APP ||
    (parsed as Partial<BackupFile>).formatVersion !== BACKUP_VERSION
  ) {
    throw new Error('That file is not a MundaIQ backup, or it was made by a newer version.');
  }

  const result = appDataSchema.safeParse((parsed as BackupFile).data);
  if (!result.success) {
    throw new Error('The backup is incomplete or contains invalid records.');
  }

  return result.data;
}
