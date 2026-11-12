import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SummaryItem, SummaryStrip } from '@/components/SummaryStrip';
import { Tag, TagTone } from '@/components/Tag';
import { hatcheryBatches } from '@/data/mock';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';
import { HatcheryStage } from '@/types';
import { formatCount } from '@/utils/format';

const stageLabel: Record<HatcheryStage, string> = {
  incubating: 'Incubating',
  hatching: 'Hatching',
  hatched: 'Hatched',
  failed: 'Failed',
};

const stageTone: Record<HatcheryStage, TagTone> = {
  incubating: 'info',
  hatching: 'warning',
  hatched: 'success',
  failed: 'danger',
};

export function HatcheryScreen() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const incubating = hatcheryBatches
    .filter((b) => b.stage === 'incubating')
    .reduce((sum, b) => sum + b.eggsSet, 0);
  const hatching = hatcheryBatches
    .filter((b) => b.stage === 'hatching')
    .reduce((sum, b) => sum + b.eggsSet, 0);
  const hatched = hatcheryBatches.reduce(
    (sum, b) => sum + (b.chicksHatched ?? 0),
    0,
  );

  const summary: SummaryItem[] = [
    { label: 'Incubating', value: formatCount(incubating) },
    { label: 'Hatching', value: formatCount(hatching), color: colors.warning },
    { label: 'Chicks hatched', value: formatCount(hatched), color: colors.success },
  ];

  return (
    <Screen>
      <SummaryStrip items={summary} />
      <View style={styles.list}>
        {hatcheryBatches.map((batch) => {
          const progress =
            batch.stage === 'hatching' && batch.eggsSet > 0
              ? Math.round(((batch.chicksHatched ?? 0) / batch.eggsSet) * 100)
              : batch.stage === 'hatched' && batch.eggsSet > 0
                ? batch.hatchRate
                : 0;

          return (
            <Card
              key={batch.id}
              padding={spacing.lg}
              onPress={() => setExpanded(expanded === batch.id ? null : batch.id)}
            >
              <View style={styles.row}>
                <View style={[styles.iconTile, { backgroundColor: colors.hatcherySoft }]}>
                  <MaterialCommunityIcons
                    name="egg-outline"
                    size={22}
                    color={colors.hatchery}
                  />
                </View>
                <View style={styles.textWrap}>
                  <Text style={styles.title}>
                    {batch.batchCode} · {batch.breed}
                  </Text>
                  <Text style={styles.subtitle}>
                    Set {batch.setDate} · Hatch {batch.expectedHatch}
                  </Text>
                  <Text style={styles.meta}>{batch.eggsSet} eggs set</Text>
                </View>
                <MaterialCommunityIcons
                  name={expanded === batch.id ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={colors.textMuted}
                />
                <Tag label={stageLabel[batch.stage]} tone={stageTone[batch.stage]} />
              </View>

              {batch.stage !== 'incubating' && batch.stage !== 'failed' ? (
                <View style={styles.progressWrap}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progress}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressText}>
                      {batch.chicksHatched
                        ? `${formatCount(batch.chicksHatched)} chicks`
                        : 'Waiting to pip'}
                    </Text>
                    <Text style={styles.progressText}>{progress}%</Text>
                  </View>
                </View>
              ) : null}

              {expanded === batch.id ? (
                <View style={styles.detailBox}>
                  <Text style={styles.detailText}>
                    Hatch rate {batch.hatchRate}% · {batch.chicksHatched ?? 0} chicks ·{' '}
                    {batch.stage === 'incubating' ? 'incubating until' : 'hatched on'}{' '}
                    {batch.expectedHatch}
                  </Text>
                  {batch.notes ? <Text style={styles.detailText}>{batch.notes}</Text> : null}
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
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
  progressWrap: {
    marginTop: spacing.md,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.hatchery,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  detailBox: {
    backgroundColor: colors.hatcherySoft,
    borderRadius: radius.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});