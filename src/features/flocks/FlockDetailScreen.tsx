import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { MiniBarChart } from '@/components/MiniBarChart';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { Tag, TagTone } from '@/components/Tag';
import { useAppData } from '@/store/AppDataContext';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';
import { FlockStage } from '@/types';
import { dayOfMonth, shortDate } from '@/utils/date';
import { formatCount, formatCurrency } from '@/utils/format';
import { dailyEggTotals, henDayRate, sumEggs, sumFeedCost, sumFeedKg, sumMortality, totalEggs } from '@/utils/production';

const stageLabel: Record<FlockStage, string> = {
  growing: 'Growing',
  laying: 'Laying',
  molting: 'Molting',
  culled: 'Culled',
};

const stageTone: Record<FlockStage, TagTone> = {
  growing: 'info',
  laying: 'success',
  molting: 'warning',
  culled: 'neutral',
};

export function FlockDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { flocks, dailyRecords, deleteFlock, deleteRecord } = useAppData();
  const [expanded, setExpanded] = useState<string | null>(null);

  const flock = flocks.find((f) => f.id === id);

  if (!flock) {
    return (
      <Screen>
        <Text style={styles.missing}>Flock not found.</Text>
      </Screen>
    );
  }

  const records = [...dailyRecords]
    .filter((r) => r.flockId === flock.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const latest = records[0];
  const rate = latest ? Math.round(henDayRate(latest)) : 0;
  const eggsWeek = sumEggs(records);
  const feedWeek = sumFeedKg(records);
  const feedCostWeek = sumFeedCost(records);
  const mortalityWeek = sumMortality(records);
  const chart = dailyEggTotals(records);

  return (
    <Screen>
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={[styles.iconTile, { backgroundColor: colors.flockSoft }]}>
            <MaterialCommunityIcons name="turkey" size={22} color={colors.flock} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{flock.name}</Text>
            <Text style={styles.headerSub}>
              {flock.breed} · {flock.housing} · {flock.ageWeeks} wks · {formatCount(flock.hens)} hens
            </Text>
          </View>
          <Tag label={stageLabel[flock.stage]} tone={stageTone[flock.stage]} />
          <Pressable
            onPress={() =>
              Alert.alert('Delete flock', `Remove "${flock.name}" and all of its daily records?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    deleteFlock(flock.id);
                    router.back();
                  },
                },
              ])
            }
            hitSlop={8}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>
        {flock.notes ? <Text style={styles.note}>{flock.notes}</Text> : null}
      </Card>

      <View style={styles.statGrid}>
        <StatCard
          icon="egg-outline"
          label="Eggs · 7 days"
          value={formatCount(eggsWeek)}
          tint={colors.egg}
          softColor={colors.eggSoft}
          style={styles.statTile}
          onPress={() => router.push('/production')}
        />
        <StatCard
          icon="chart-line"
          label="Latest rate"
          value={`${rate}%`}
          tint={colors.success}
          softColor={colors.primarySoft}
          style={styles.statTile}
          onPress={() => router.push('/performance')}
        />
        <StatCard
          icon="sack"
          label="Feed · 7 days"
          value={`${feedWeek.toFixed(0)} kg`}
          tint={colors.expense}
          softColor={colors.expenseSoft}
          style={styles.statTile}
          onPress={() => router.push('/expenses')}
        />
        <StatCard
          icon="alert-decagram-outline"
          label="Lost this week"
          value={formatCount(mortalityWeek)}
          tint={mortalityWeek > 0 ? colors.danger : colors.success}
          softColor={colors.expenseSoft}
          style={styles.statTile}
          onPress={() => router.push('/performance')}
        />
      </View>

      <SectionHeader title="Production · last 7 days" />
      <Card>
        <MiniBarChart data={chart} />
        <View style={styles.chartFooter}>
          <Text style={styles.chartText}>{formatCount(eggsWeek)} eggs this week</Text>
          <Text style={styles.chartText}>
            Feed {formatCurrency(feedCostWeek)} · {mortalityWeek} lost
          </Text>
        </View>
      </Card>

      <SectionHeader
        title="Daily records"
        actionLabel="Add"
        onAction={() =>
          router.push({ pathname: '/record/new', params: { flockId: flock.id } })
        }
      />
      <Card padding={0} style={styles.listCard}>
        {records.map((record, index) => {
          const recordRate = Math.round(henDayRate(record));
          const open = expanded === record.id;
          return (
            <View key={record.id}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                onPress={() => setExpanded(open ? null : record.id)}
                style={({ pressed }) => [styles.record, pressed && styles.pressed]}
              >
                <View style={[styles.iconTile, { backgroundColor: colors.eggSoft }]}>
                  <Text style={styles.iconText}>{String(dayOfMonth(record.date)).padStart(2, '0')}</Text>
                </View>
                <View style={styles.textWrap}>
                  <Text style={styles.title}>{shortDate(record.date)}</Text>
                  <Text style={styles.subtitle}>
                    {record.intact} whole · {record.broken} broken · {record.dirty} dirty
                  </Text>
                  <Text style={styles.meta}>
                    {record.feedKg} kg feed · {record.mortality} lost · {record.hensAtCollection} hens
                  </Text>
                </View>
                <View style={styles.recordRight}>
                  <Text style={styles.eggCount}>{formatCount(totalEggs(record))}</Text>
                  <Tag
                    label={`${recordRate}%`}
                    tone={recordRate >= 85 ? 'success' : recordRate >= 70 ? 'info' : 'warning'}
                  />
                </View>
                <MaterialCommunityIcons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
              {open ? (
                <View style={styles.detailBox}>
                  <Text style={styles.detailText}>
                    Feed cost {formatCurrency(record.feedCost)} · {record.broken + record.dirty} damaged ·
                    {record.hensAtCollection} hens counted at collection.
                  </Text>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Delete record', `Remove the record for ${shortDate(record.date)}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteRecord(record.id) },
                      ])
                    }
                    style={styles.deleteRow}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                    <Text style={styles.deleteText}>Delete record</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  missing: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    padding: spacing.lg,
  },
  headerCard: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  note: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  statTile: {
    flexBasis: '46%',
    flexGrow: 1,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  chartText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  listCard: {
    paddingHorizontal: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  record: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.eggSoft,
  },
  iconText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.egg,
  },
  textWrap: {
    flex: 1,
    gap: 1,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  recordRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  eggCount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.egg,
  },
  detailBox: {
    backgroundColor: colors.eggSoft,
    borderRadius: radius.sm,
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deleteText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.danger,
  },
});