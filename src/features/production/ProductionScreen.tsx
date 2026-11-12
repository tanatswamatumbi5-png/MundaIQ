import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { ListItem } from '@/components/ListItem';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { SummaryItem, SummaryStrip } from '@/components/SummaryStrip';
import { Tag, TagTone } from '@/components/Tag';
import { useAppData } from '@/store/AppDataContext';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';
import { DailyRecord, FlockStage, LayerFlock } from '@/types';
import { dayOfMonth, shortDate } from '@/utils/date';
import { formatCount, formatCurrency } from '@/utils/format';
import {
  cratesFor,
  EGGS_PER_CRATE,
  flockWeek,
  gradeColor,
  houseCages,
  houseResult,
  latestDate,
  LAY_RATE_TARGET,
  type FlockWeek,
} from '@/utils/cage';
import { henDayRate, sumEggs, totalEggs } from '@/utils/production';

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

interface Row {
  house: string;
  cages: number;
  birds: number;
  crates: number;
  looseEggs: number;
  weekCrates: number;
  weekMaxCrates: number;
  weekRate: number;
  grade: FlockWeek['grade'];
  flocks: { flock: LayerFlock; week: FlockWeek }[];
}

/**
 * One record row, memoised so the list can recycle it and an expansion only
 * redraws that row.
 */
const RecordRow = React.memo(function RecordRow({
  record,
  edge,
  expanded,
  onToggle,
  onDelete,
}: {
  record: DailyRecord;
  edge: 'first' | 'last' | 'none';
  expanded: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string, label: string) => void;
}) {
  const rate = Math.round(henDayRate(record));

  return (
    <View
      style={[
        styles.rowShell,
        edge === 'first' ? styles.edgeFirst : null,
        edge === 'last' ? styles.edgeLast : null,
        expanded ? styles.edgeOpen : null,
      ]}
    >
      <Pressable onPress={() => onToggle(record.id)} style={({ pressed }) => [styles.record, pressed && styles.pressed]}>
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
          <Tag label={`${rate}%`} tone={rate >= 85 ? 'success' : rate >= 70 ? 'info' : 'warning'} />
        </View>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textMuted}
        />
      </Pressable>
      {expanded ? (
        <View style={styles.detailBox}>
          <Text style={styles.detailText}>
            {formatCount(record.intact)} salable · {formatCurrency(record.feedCost)} feed cost ·{' '}
            {cratesFor(record.intact)} of {EGGS_PER_CRATE} eggs to the next crate
          </Text>
          <Pressable onPress={() => onDelete(record.id, shortDate(record.date))} style={styles.deleteRow}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
            <Text style={styles.deleteText}>Delete record</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});

export function ProductionScreen() {
  const router = useRouter();
  const { flocks, dailyRecords, deleteRecord } = useAppData();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);

  const day = useMemo(() => latestDate(dailyRecords), [dailyRecords]);

  const dates = useMemo(
    () => Array.from(new Set(dailyRecords.map((r) => r.date))).sort((a, b) => (a < b ? 1 : -1)),
    [dailyRecords],
  );

  const summary = useMemo<SummaryItem[]>(() => {
    const weekCrates = dailyRecords.reduce((sum, r) => sum + cratesFor(r.intact), 0);
    const hens = flocks.reduce((sum, f) => sum + f.hens, 0);

    return [
      { label: 'Crates · 7 days', value: formatCount(weekCrates), color: colors.egg },
      { label: 'Eggs · 7 days', value: formatCount(sumEggs(dailyRecords)), color: colors.textPrimary },
      { label: 'Hens', value: formatCount(hens), color: colors.flock },
      { label: 'Flocks', value: String(flocks.length), color: colors.textSecondary },
    ];
  }, [dailyRecords, flocks]);

  /**
   * Rows are the spine of this screen. Each row carries the flocks housed in it,
   * and the flock figures come from the same records the row total is built
   * from, so the two never disagree.
   */
  const rowList = useMemo(() => {
    const byHouse = new Map<string, LayerFlock[]>();
    for (const flock of flocks) {
      const list = byHouse.get(flock.housing) ?? [];
      list.push(flock);
      byHouse.set(flock.housing, list);
    }

    const built: Row[] = [];
    const seen = new Set<string>();

    for (const house of byHouse.keys()) {
      seen.add(house);
      const cageList = houseCages(house);
      const result = houseResult(house, day, dailyRecords);
      const housed = byHouse.get(house) ?? [];

      built.push({
        house,
        cages: cageList.length,
        birds: cageList.reduce((sum, c) => sum + c.birds, 0),
        crates: result.crates,
        looseEggs: result.looseEggs,
        weekCrates: result.weekCrates,
        weekMaxCrates: result.weekMaxCrates,
        weekRate: result.weekRate,
        grade: result.grade,
        flocks: housed.map((flock) => ({ flock, week: flockWeek(flock.id, flock, dailyRecords) })),
      });
    }

    // Flocks with no row still need to be visible, so they trail the main list.
    const orphans = flocks.filter((f) => !seen.has(f.housing));
    if (orphans.length > 0) {
      built.push({
        house: 'Unassigned',
        cages: 0,
        birds: orphans.reduce((sum, f) => sum + f.hens, 0),
        crates: 0,
        looseEggs: 0,
        weekCrates: 0,
        weekMaxCrates: 0,
        weekRate: 0,
        grade: 'none',
        flocks: orphans.map((flock) => ({ flock, week: flockWeek(flock.id, flock, dailyRecords) })),
      });
    }

    return built;
  }, [flocks, dailyRecords, day]);

  const rowRecords = useMemo(() => {
    if (!openRow) return [];
    const ids = new Set(rowList.find((r) => r.house === openRow)?.flocks.map((f) => f.flock.id) ?? []);
    return dailyRecords
      .filter((r) => ids.has(r.flockId))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [dailyRecords, openRow, rowList]);

  const confirmDelete = useCallback(
    (recordId: string, label: string) => {
      Alert.alert('Delete record', `Remove the record for ${label}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteRecord(recordId) },
      ]);
    },
    [deleteRecord],
  );

  const toggle = useCallback((id: string) => setExpanded((open) => (open === id ? null : id)), []);
  const toggleRow = useCallback((house: string) => setOpenRow((open) => (open === house ? null : house)), []);

  const renderRecord = useCallback(
    ({ item, index }: { item: DailyRecord; index: number }) => {
      const edge = index === 0 ? 'first' : index === rowRecords.length - 1 ? 'last' : 'none';
      return (
        <RecordRow
          record={item}
          edge={expanded === item.id ? 'none' : edge}
          expanded={expanded === item.id}
          onToggle={toggle}
          onDelete={confirmDelete}
        />
      );
    },
    [rowRecords.length, expanded, toggle, confirmDelete],
  );

  const renderRow = useCallback(
    ({ item }: { item: Row }) => {
      const open = openRow === item.house;
      const color = gradeColor(item.grade);

      return (
        <Card padding={0} style={styles.rowCard}>
          <Pressable
            onPress={() => toggleRow(item.house)}
            style={({ pressed }) => [styles.rowHead, pressed && styles.pressed]}
          >
            <View style={styles.rowHeadMain}>
              <View style={styles.rowTitleLine}>
                <View style={[styles.houseTile, { backgroundColor: colors.cageSoft }]}>
                  <MaterialCommunityIcons name="grid" size={20} color={colors.cage} />
                </View>
                <View style={styles.textWrap}>
                  <Text style={styles.rowTitle}>{item.house}</Text>
                  <Text style={styles.subtitle}>
                    {item.house === 'Unassigned'
                      ? 'No row · not on the cage map'
                      : `${item.birds} birds · ${item.cages} cages`}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={[styles.rateText, { color }]}>{Math.round(item.weekRate)}%</Text>
                  <Text style={styles.rateCaption}>{gradeLabel(item.grade)}</Text>
                </View>
                <MaterialCommunityIcons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={colors.textMuted}
                />
              </View>

              <View style={styles.metricRow}>
                <Metric label="Birds" value={formatCount(item.birds)} />
                <Metric label="Crates today" value={String(item.crates)} />
                <Metric label="Crates · 7 days" value={`${item.weekCrates}/${item.weekMaxCrates}`} />
              </View>

              <View style={styles.track}>
                <View
                  style={[
                    styles.trackFill,
                    { width: `${Math.min(item.weekRate, 100)}%`, backgroundColor: color },
                  ]}
                />
              </View>
            </View>
          </Pressable>

          {open ? (
            <View style={styles.rowBody}>
              {item.flocks.map((entry, index) => (
                <View key={entry.flock.id}>
                  {index > 0 ? <View style={styles.bodyDivider} /> : null}
                  <ListItem
                    icon="turkey"
                    iconColor={colors.flock}
                    iconBg={colors.flockSoft}
                    title={entry.flock.name}
                    subtitle={`${entry.flock.breed} · ${entry.flock.ageWeeks} wks · ${formatCount(entry.flock.hens)} hens`}
                    right={`${entry.week.crates} cr`}
                    rightColor={gradeColor(entry.week.grade)}
                    onPress={() =>
                      router.push({ pathname: '/flock/[id]', params: { id: entry.flock.id } })
                    }
                  />
                  <View style={styles.flockMeta}>
                    <Tag label={stageLabel[entry.flock.stage]} tone={stageTone[entry.flock.stage]} />
                    <Text style={styles.flockMetaText}>
                      {entry.week.daysLogged} days · {formatCount(entry.week.eggs)} eggs ·{' '}
                      {entry.week.looseEggs} loose · {entry.week.mortality} lost ·{' '}
                      {Math.round(entry.week.feedKg)} kg feed
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.rowActions}>
                <Pressable
                  onPress={() => router.push({ pathname: '/record/new', params: { flockId: item.flocks[0]?.flock.id } })}
                  style={styles.action}
                >
                  <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
                  <Text style={styles.actionText}>Add record</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/cages')} style={styles.action}>
                  <MaterialCommunityIcons name="grid" size={18} color={colors.primary} />
                  <Text style={styles.actionText}>Cage map</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </Card>
      );
    },
    [openRow, toggleRow, router],
  );

  const header = useMemo(
    () => (
      <View>
        <SummaryStrip items={summary} />
        <SectionHeader
          title={`Rows · ${rowList.length}`}
          actionLabel="Add flock"
          onAction={() => router.push('/flock/new')}
        />
        {dates.length > 0 ? (
          <Text style={styles.dayNote}>
            Showing collections to {shortDate(day ?? dates[0])} · a crate holds {EGGS_PER_CRATE} eggs · grades
            compare crates against a {Math.round(LAY_RATE_TARGET * 100)}% lay rate
          </Text>
        ) : null}
      </View>
    ),
    [summary, rowList.length, dates, day, router],
  );

  const footer = useMemo(
    () =>
      openRow ? (
        <View style={styles.footer}>
          <SectionHeader title={`${shortDate(day ?? dates[0])} collections`} />
          {rowRecords.length === 0 ? (
            <Text style={styles.empty}>No records for this row yet.</Text>
          ) : (
            <FlatList
              data={rowRecords}
              keyExtractor={(item) => item.id}
              renderItem={renderRecord}
              scrollEnabled={false}
              ItemSeparatorComponent={Separator}
            />
          )}
        </View>
      ) : (
        <Text style={styles.emptyHint}>Tap a row to see its flocks and daily collections.</Text>
      ),
    [openRow, rowRecords, renderRecord, day, dates],
  );

  return (
    <Screen scroll={false}>
      <FlatList
        data={rowList}
        keyExtractor={(item) => item.house}
        renderItem={renderRow}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={<Text style={styles.empty}>No flocks yet. Add one to get started.</Text>}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        initialNumToRender={6}
        windowSize={7}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
      />
    </Screen>
  );
}

function gradeLabel(grade: FlockWeek['grade']): string {
  switch (grade) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'moderate':
      return 'Moderate';
    case 'fair':
      return 'Fair';
    case 'low':
      return 'Low';
    default:
      return 'No data';
  }
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const Separator = () => <View style={styles.bodyDivider} />;

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
  dayNote: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  rowCard: {
    overflow: 'hidden',
  },
  rowHead: {
    paddingVertical: spacing.md,
  },
  rowHeadMain: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  houseTile: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rateText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  rateCaption: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  track: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  rowBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  bodyDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  flockMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  flockMetaText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  footer: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  emptyHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  empty: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  rowShell: {
    backgroundColor: colors.card,
  },
  edgeFirst: {
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  edgeLast: {
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  edgeOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  record: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
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
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
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