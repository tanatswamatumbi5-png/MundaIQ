import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { ListItem } from '@/components/ListItem';
import { MiniBarChart } from '@/components/MiniBarChart';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { getDashboardStats, latestRecord } from '@/data/mock';
import { useAppData } from '@/store/AppDataContext';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';
import { formatCount, formatCurrency, formatPercent } from '@/utils/format';
import { costPerEgg, dailyEggTotals, feedPerDozen, henDayRate, mortalityRate } from '@/utils/production';

export function DashboardScreen() {
  const router = useRouter();
  const { flocks, dailyRecords, expenses } = useAppData();
  const stats = getDashboardStats(flocks, dailyRecords, expenses);

  const weekChart = dailyEggTotals(dailyRecords);
  const mortality = mortalityRate(dailyRecords);
  const feedPerDz = feedPerDozen(dailyRecords);
  const costEgg = costPerEgg(dailyRecords);

  const layingFlocks = flocks
    .filter((f) => f.stage === 'laying')
    .map((f) => {
      const latest = latestRecord(dailyRecords, f.id);
      return { flock: f, rate: latest ? Math.round(henDayRate(latest)) : 0 };
    });

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="egg-easter" size={24} color={colors.white} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.greeting}>MundaIQ</Text>
          <Text style={styles.subtitle}>Layer production · encrypted on this device</Text>
        </View>
      </View>

      <View style={styles.statGrid}>
        <StatCard
          icon="egg-outline"
          label="Eggs today"
          value={formatCount(stats.todayEggs)}
          tint={colors.egg}
          softColor={colors.eggSoft}
          style={styles.statTile}
          onPress={() => router.push('/production')}
        />
        <StatCard
          icon="chart-line"
          label="Avg hen-day rate"
          value={`${stats.avgRatePct}%`}
          tint={colors.success}
          softColor={colors.primarySoft}
          style={styles.statTile}
          onPress={() => router.push('/performance')}
        />
        <StatCard
          icon="turkey"
          label="Hens in production"
          value={formatCount(stats.liveHens)}
          tint={colors.flock}
          softColor={colors.flockSoft}
          style={styles.statTile}
          onPress={() => router.push('/production')}
        />
        <StatCard
          icon="sack"
          label="Feed this week"
          value={`${stats.weekFeedKg} kg`}
          tint={colors.expense}
          softColor={colors.expenseSoft}
          style={styles.statTile}
          onPress={() => router.push('/expenses')}
        />
      </View>

      <Card onPress={() => router.push('/performance')} style={styles.performanceCard}>
        <View style={styles.perfHeader}>
          <View style={[styles.perfIcon, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="chart-box-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.perfText}>
            <Text style={styles.perfTitle}>Overall performance</Text>
            <Text style={styles.perfSub}>7-day average · tap for full report</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
        </View>
        <View style={styles.perfMetrics}>
          <View style={styles.perfMetric}>
            <Text style={styles.perfValue}>{formatPercent(mortality)}</Text>
            <Text style={styles.perfLabel}>Mortality</Text>
          </View>
          <View style={styles.perfMetric}>
            <Text style={styles.perfValue}>{feedPerDz.toFixed(1)} kg</Text>
            <Text style={styles.perfLabel}>Feed / dozen</Text>
          </View>
          <View style={styles.perfMetric}>
            <Text style={styles.perfValue}>{formatCurrency(costEgg)}</Text>
            <Text style={styles.perfLabel}>Feed cost / egg</Text>
          </View>
        </View>
        <View style={styles.perfDivider} />
        <Text style={styles.perfNote}>
          Peak productivity sits around 90%+ hen-day rate · feed near 1.8 kg per dozen.
        </Text>
      </Card>

      <SectionHeader title="Production · last 7 days" />
      <Card onPress={() => router.push('/performance')}>
        <MiniBarChart data={weekChart} />
        <View style={styles.chartFooter}>
          <Text style={styles.chartRow}>
            {formatCount(stats.weekEggs)} eggs this week · avg {stats.avgRatePct}% hen-day rate
          </Text>
          <Text style={styles.chartRow}>Today: {formatCount(stats.todayEggs)} eggs</Text>
        </View>
      </Card>

      {flocks.length === 0 ? (
        <Card style={styles.startCard}>
          <Text style={styles.startTitle}>Start with your first flock</Text>
          <Text style={styles.startBody}>
            Add a layer flock, then log daily collections to see hen-day rate, feed use and costs
            here.
          </Text>
          <Pressable
            onPress={() => router.push('/flock/new')}
            style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
          >
            <Text style={styles.startButtonText}>Add a flock</Text>
          </Pressable>
        </Card>
      ) : (
        <>
          <SectionHeader
            title="Flocks at a glance"
            actionLabel="Details"
            onAction={() => router.push('/production')}
          />
          <Card padding={0} style={styles.listCard}>
            {layingFlocks.length === 0 ? (
              <Text style={styles.emptyText}>No flocks are in lay yet.</Text>
            ) : (
              layingFlocks.map(({ flock, rate }, index) => (
                <View key={flock.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <ListItem
                    icon="turkey"
                    iconColor={colors.flock}
                    iconBg={colors.flockSoft}
                    title={flock.name}
                    subtitle={`${flock.hens} hens · ${flock.ageWeeks} wks · ${flock.housing}`}
                    right={`${rate}%`}
                    rightColor={
                      rate >= 85 ? colors.success : rate >= 70 ? colors.warning : colors.danger
                    }
                    onPress={() =>
                      router.push({ pathname: '/flock/[id]', params: { id: flock.id } })
                    }
                  />
                </View>
              ))
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
  },
  greeting: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statTile: {
    flexBasis: '46%',
    flexGrow: 1,
  },
  performanceCard: {
    marginTop: spacing.md,
  },
  perfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  perfIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfText: {
    flex: 1,
  },
  perfTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  perfSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  perfMetrics: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  perfMetric: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  perfValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  perfLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  perfDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.lg,
  },
  perfNote: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  listCard: {
    paddingHorizontal: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  chartRow: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  startCard: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  startTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  startBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  startButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  startButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  emptyText: {
    paddingVertical: spacing.lg,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});