import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Card } from '@/components/Card';
import { ListItem } from '@/components/ListItem';
import { Screen } from '@/components/Screen';
import { moduleList } from '@/constants/modules';
import { useAppData } from '@/store/AppDataContext';
import { useAppLock } from '@/store/AppLockContext';
import { colors, fontSize, fontWeight, spacing } from '@/theme';
import { exportAppData, parseBackup, pickBackupText } from '@/utils/exportData';

type Busy = 'export' | 'import' | 'clear' | null;

export function MoreScreen() {
  const router = useRouter();
  const {
    flocks,
    cages,
    dailyRecords,
    expenses,
    storageError,
    loadFailed,
    retrySave,
    clearAllData,
    restoreData,
  } = useAppData();
  const { enabled: lockEnabled } = useAppLock();

  const [busy, setBusy] = useState<Busy>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const hubModules = moduleList.filter((m) => ['cages', 'assistant'].includes(m.id));

  const handleExport = async () => {
    setBusy('export');
    setNotice(null);
    try {
      await exportAppData({ flocks, cages, dailyRecords, expenses });
      setNotice('Backup ready to save or share.');
    } catch (error) {
      Alert.alert(
        'Export failed',
        error instanceof Error ? error.message : 'The backup could not be created.',
      );
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    setBusy('import');
    setNotice(null);
    try {
      const raw = await pickBackupText();
      if (raw === null) return;

      const restored = parseBackup(raw);
      Alert.alert(
        'Replace all records?',
        `This will replace everything on this phone with ${restored.flocks.length} flock(s), ` +
          `${restored.dailyRecords.length} collection(s) and ${restored.expenses.length} expense(s) ` +
          'from the backup.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                try {
                  await restoreData(restored);
                  setNotice('Backup restored.');
                } catch {
                  Alert.alert('Restore failed', 'The backup could not be saved to this device.');
                }
              })();
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Import failed',
        error instanceof Error ? error.message : 'That file could not be imported.',
      );
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete all data?',
      loadFailed
        ? 'The unreadable file and its encryption key will be removed from this phone. This cannot be undone.'
        : 'Every flock, collection and expense will be erased, along with the encryption key. Export a backup first if you want to keep your records. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy('clear');
              try {
                await clearAllData();
                setNotice('All records were deleted.');
              } catch {
                Alert.alert('Delete failed', 'The records could not be removed from this device.');
              } finally {
                setBusy(null);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <Screen>
      {storageError ? (
        <Card style={styles.errorCard}>
          <View style={styles.errorHead}>
            <MaterialCommunityIcons name="alert-outline" size={22} color={colors.danger} />
            <Text style={styles.errorTitle}>Storage problem</Text>
          </View>
          <Text style={styles.errorText}>{storageError}</Text>
          {!loadFailed ? (
            <Pressable
              onPress={() => void retrySave()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            >
              <Text style={styles.retryLabel}>Retry saving</Text>
            </Pressable>
          ) : (
            <Text style={styles.errorHint}>
              Make a note of any records you add before deleting the unreadable file below.
            </Text>
          )}
        </Card>
      ) : null}

      {notice ? (
        <View style={styles.notice}>
          <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.success} />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Security</Text>
      <Card padding={0} style={styles.listCard}>
        <ListItem
          icon="shield-lock-outline"
          iconColor={colors.primary}
          iconBg={colors.primarySoft}
          title="Security & privacy"
          subtitle="App lock, PIN, screenshots and backups"
          right={lockEnabled ? 'On' : 'Off'}
          rightColor={lockEnabled ? colors.success : colors.textMuted}
          onPress={() => router.push('/security' as Href)}
        />
      </Card>

      <Text style={styles.sectionLabel}>Your data</Text>
      <Card padding={0} style={styles.listCard}>
        <ListItem
          icon="file-export-outline"
          iconColor={colors.info}
          iconBg={colors.cageSoft}
          title={busy === 'export' ? 'Preparing backup…' : 'Export backup'}
          subtitle="Unencrypted JSON file — store it somewhere safe"
          showChevron={false}
          onPress={() => {
            if (busy === null) void handleExport();
          }}
        />
        <View style={styles.divider} />
        <ListItem
          icon="file-import-outline"
          iconColor={colors.info}
          iconBg={colors.cageSoft}
          title={busy === 'import' ? 'Reading backup…' : 'Import backup'}
          subtitle={loadFailed ? 'Delete the unreadable file first' : 'Replace this phone’s records'}
          showChevron={false}
          onPress={() => {
            if (busy === null && !loadFailed) void handleImport();
          }}
        />
        <View style={styles.divider} />
        <ListItem
          icon="trash-can-outline"
          iconColor={colors.danger}
          iconBg={colors.expenseSoft}
          title={busy === 'clear' ? 'Deleting…' : 'Delete all data'}
          subtitle="Erase every record and the encryption key"
          showChevron={false}
          onPress={() => {
            if (busy === null) confirmDelete();
          }}
        />
      </Card>
      <Text style={styles.dataHint}>
        Backups are plain JSON so they can be restored on another phone. Anyone who opens the file
        can read it — keep it private.
      </Text>

      <Text style={styles.sectionLabel}>Tools</Text>
      <Card padding={0} style={styles.listCard}>
        {hubModules.map((module, index) => (
          <View key={module.id}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <ListItem
              icon={module.icon}
              iconColor={module.color}
              iconBg={module.softColor}
              title={module.label}
              subtitle={module.description}
              onPress={() => router.push(module.href)}
            />
          </View>
        ))}
      </Card>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>About MundaIQ</Text>
        <Text style={styles.infoText}>
          Version 1.0.0 · Layer egg production tracker for Android.
        </Text>
        <Text style={styles.infoText}>
          Your records are encrypted on this device with a key held in the Android keystore. The
          app collects no analytics and sends nothing to a server. Export a backup before changing
          phones or clearing app data.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing['2xl'],
    marginBottom: spacing.md,
  },
  listCard: {
    paddingHorizontal: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  errorCard: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.expenseSoft,
    gap: spacing.sm,
  },
  errorHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  errorHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: colors.expenseSoft,
  },
  retryLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: colors.primarySoft,
  },
  noticeText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: fontWeight.medium,
  },
  dataHint: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  infoCard: {
    marginTop: spacing['2xl'],
    gap: spacing.xs,
  },
  infoTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.7,
  },
});
