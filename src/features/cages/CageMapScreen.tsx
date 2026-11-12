import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { SummaryItem, SummaryStrip } from '@/components/SummaryStrip';
import { houseBirdTotal, houseCageCount } from '@/data/mock';
import { useAppData } from '@/store/AppDataContext';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';
import {
  EGGS_PER_CRATE,
  gradeColor,
  gradeScale,
  houseFor,
  houseNames,
  houseResult,
  latestDate,
  LAY_RATE_TARGET,
  tint,
} from '@/utils/cage';
import { shortDate } from '@/utils/date';
import { formatCount } from '@/utils/format';

const TILE_WIDTH = 42;
const TILE_HEIGHT = 38;
const TILE_GAP = 4;

export function CageMapScreen() {
  const { dailyRecords } = useAppData();

  const allHouses = houseNames();
  const [house, setHouse] = useState(allHouses[0]);
  const [pickedDate, setPickedDate] = useState(() => latestDate(dailyRecords) ?? '');

  const dates = useMemo(
    () => Array.from(new Set(dailyRecords.map((r) => r.date))).sort((a, b) => (a < b ? 1 : -1)),
    [dailyRecords],
  );
  const date = dates.includes(pickedDate) ? pickedDate : (dates[0] ?? '');

  const result = useMemo(() => houseResult(house, date, dailyRecords), [house, date, dailyRecords]);
  const houseMeta = houseFor(house);

  const color = gradeColor(result.grade);
  const noData = result.grade === 'none';

  const summary: SummaryItem[] = [
    { label: 'Crates today', value: formatCount(result.crates), color: colors.egg },
    { label: 'Birds in row', value: formatCount(result.birds), color: colors.flock },
    { label: 'Crates this week', value: formatCount(result.weekCrates), color },
    { label: 'Cages', value: `${result.cageCount}`, color: colors.cage },
  ];

  return (
    <Screen>
      <SummaryStrip items={summary} />

      <SectionHeader title="Crates produced" />
      <Card style={styles.gradeCard}>
        <View style={styles.gradeHead}>
          <View
            style={[
              styles.gradePill,
              { backgroundColor: noData ? colors.border : tint(color, 0.16), borderColor: color },
            ]}
          >
            <Text style={[styles.gradePillLabel, { color: noData ? colors.textSecondary : color }]}>
              {gradeScale.find((g) => g.id === result.grade)?.label ?? 'No data'}
            </Text>
          </View>
          <Text style={styles.gradeRate}>{result.weekRate.toFixed(1)}%</Text>
        </View>

        <Text style={styles.countLine}>
          <Text style={styles.countStrong}>{formatCount(result.birds)}</Text> birds filled{' '}
          <Text style={styles.countStrong}>{formatCount(result.weekCrates)}</Text> of{' '}
          <Text style={styles.countStrong}>{formatCount(result.weekMaxCrates)}</Text> possible crates
          this week
        </Text>

        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${Math.min(result.weekRate, 100)}%`, backgroundColor: color }]} />
        </View>

        <View style={styles.dailyRow}>
          <Text style={styles.dailyText}>
            Today: {result.crates} crate{result.crates === 1 ? '' : 's'} filled
            {result.looseEggs > 0 ? ` · ${result.looseEggs} loose eggs` : ''}
          </Text>
        </View>

        <View style={styles.dimensions}>
          <Dimension label="Length" value={`${houseMeta?.lengthM ?? 0} m`} />
          <Dimension label="Width" value={`${houseMeta?.cageWidthM ?? 0} m`} />
          <Dimension label="Cages" value={String(result.cageCount)} />
          <Dimension label="Per cage" value={String(houseMeta?.birdsPerCage ?? 0)} />
        </View>

        <View style={styles.breakdown}>
          <Breakdown label="Crates today" value={formatCount(result.crates)} detail={`${EGGS_PER_CRATE} eggs`} />
          <Breakdown label="Eggs today" value={formatCount(result.eggs)} detail="whole" />
          <Breakdown label="Deaths" value={formatCount(result.mortality)} detail="row" />
          <Breakdown label="Row max" value={formatCount(result.capacity)} detail="birds" />
        </View>
      </Card>

      <SectionHeader title="House" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {allHouses.map((name) => {
          const active = name === house;
          return (
            <Pressable
              key={name}
              onPress={() => setHouse(name)}
              style={({ pressed }) => [
                styles.chip,
                active ? styles.chipActive : null,
                pressed ? styles.chipPressed : null,
              ]}
            >
              <Text style={[styles.chipText, active ? styles.chipTextActive : null]} numberOfLines={1}>
                {name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {houseMeta ? (
        <Text style={styles.houseMeta}>
          {houseMeta.lengthM} m · {houseCageCount(houseMeta)} cages · {houseBirdTotal(houseMeta)} birds ·{' '}
          {houseMeta.birdsPerCage} per cage
        </Text>
      ) : null}

      <SectionHeader title="Day" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {dates.map((value) => {
          const active = value === date;
          return (
            <Pressable
              key={value}
              onPress={() => setPickedDate(value)}
              style={({ pressed }) => [
                styles.chip,
                active ? styles.chipActive : null,
                pressed ? styles.chipPressed : null,
              ]}
            >
              <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{shortDate(value)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <SectionHeader title={`${house} layout`} />
      <Card padding={spacing.md}>
        <Text style={styles.stripHint}>
          {result.cageCount} cages in one row, each {houseMeta?.cageWidthM ?? 0} m wide across a{' '}
          {houseMeta?.lengthM ?? 0} m line. Scroll sideways.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stripScroll}>
          <View style={styles.strip}>
            {result.cages.map((cage) => (
              <View
                key={cage.cage.id}
                style={[
                  styles.tile,
                  {
                    backgroundColor: noData ? colors.border : tint(color, 0.18),
                    borderColor: noData ? colors.border : tint(color, 0.5),
                  },
                ]}
              />
            ))}
          </View>
        </ScrollView>

        <View style={styles.legend}>
          {gradeScale.map((band) => (
            <View key={band.id} style={styles.legendRow}>
              <View style={[styles.legendSwatch, { backgroundColor: band.color }]} />
              <Text style={styles.legendLabel}>
                {band.label}
                {band.detail ? ` ${band.detail}` : ''}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={styles.footnote}>
        The grade covers the whole row and the whole week: crates those birds filled against the
        crates they could fill at a {Math.round(LAY_RATE_TARGET * 100)}% lay rate. A crate holds{' '}
        {EGGS_PER_CRATE} eggs. Cages are shown for position only and are not graded.
      </Text>
    </Screen>
  );
}

function Breakdown({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View style={styles.breakdownCell}>
      <Text style={styles.breakdownValue}>{value}</Text>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownDetail}>{detail}</Text>
    </View>
  );
}

function Dimension({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dimensionCell}>
      <Text style={styles.dimensionValue}>{value}</Text>
      <Text style={styles.dimensionLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gradeCard: {
    gap: spacing.md,
  },
  gradeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gradePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  gradePillLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  gradeRate: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  gradeExplain: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  countLine: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  countStrong: {
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  track: {
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  dimensions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  dimensionCell: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  dimensionValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  dimensionLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  breakdown: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  breakdownCell: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  breakdownValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  breakdownLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  breakdownDetail: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  dailyRow: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dailyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  chipRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  houseMeta: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  stripHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  stripScroll: {
    marginHorizontal: -spacing.xs,
  },
  strip: {
    flexDirection: 'row',
    gap: TILE_GAP,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  tile: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  legend: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  legendSwatch: {
    width: 18,
    height: 18,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendLabel: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  footnote: {
    marginTop: spacing.lg,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
});