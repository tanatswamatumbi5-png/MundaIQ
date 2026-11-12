import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { ListItem } from '@/components/ListItem';
import { MiniBarChart } from '@/components/MiniBarChart';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { SummaryItem, SummaryStrip } from '@/components/SummaryStrip';
import { useAppData } from '@/store/AppDataContext';
import { colors, fontSize, spacing } from '@/theme';
import { formatCount, formatCurrency, formatPercent } from '@/utils/format';
import { costPerEgg, dailyEggTotals, feedPerDozen, mortalityRate, sumEggs, sumFeedCost, sumFeedKg, sumMortality } from '@/utils/production';

export function PerformanceScreen() {
  const router = useRouter();
  const { flocks, dailyRecords } = useAppData();
  const weekEggs = sumEggs(dailyRecords);
  const weekFeedKg = sumFeedKg(dailyRecords);
  const weekFeedCost = sumFeedCost(dailyRecords);
  const mortality = mortalityRate(dailyRecords);
  const feedPerDz = feedPerDozen(dailyRecords);
  const costEgg = costPerEgg(dailyRecords);
  const weekChart = dailyEggTotals(dailyRecords);
  const avgRate = Math.round((weekEggs / dailyRecords.reduce((s, r) => s + r.hensAtCollection, 0)) * 100);

  const best = weekChart.reduce((a, b) => (b.value > a.value ? b : a));
  const worst = weekChart.reduce((a, b) => (b.value < a.value ? b : a));

  const summary: SummaryItem[] = [
    { label: 'Eggs · 7d', value: formatCount(weekEggs), color: colors.egg },
    { label: 'Hen-day avg', value: `${avgRate}%`, color: colors.success },
    { label: 'Mortality', value: formatPercent(mortality), color: colors.danger },
    { label: 'Feed / dozen', value: `${feedPerDz.toFixed(1)} kg`, color: colors.expense },
  ];

  const perFlock = flocks
    .filter((f) => f.stage === 'laying')
    .map((f) => {
      const rows = dailyRecords.filter((r) => r.flockId === f.id);
      const hens = rows.reduce((s, r) => s + r.hensAtCollection, 0);
      const eggs = sumEggs(rows);
      return {
        flock: f,
        hens,
        eggs,
        rate: Math.round((eggs / (hens || 1)) * 100),
        mortality: sumMortality(rows),
        feedKg: sumFeedKg(rows),
      };
    });

  return (
    <Screen>
      <SummaryStrip items={summary} />

      <SectionHeader title="Production trend" />
      <Card>
        <MiniBarChart data={weekChart} />
        <View style={styles.trendFooter}>
          <Text style={styles.trendText}>
            Best: day {best.label} ({formatCount(best.value)} eggs) · Lowest: day {worst.label} (
            {formatCount(worst.value)})
          </Text>
          <Text style={styles.trendText}>Total eggs this period: {formatCount(weekEggs)}</Text>
        </View>
      </Card>

      <SectionHeader title="Feed & cost" />
      <Card padding={0} style={styles.listCard}>
        <View>
          <ListItem
            icon="sack"
            iconColor={colors.expense}
            iconBg={colors.expenseSoft}
            title="Feed consumed"
            subtitle="Total across all records"
            right={`${weekFeedKg.toFixed(1)} kg`}
            rightColor={colors.textPrimary}
            onPress={() => router.push('/expenses')}
          />
          <View style={styles.divider} />
          <ListItem
            icon="cash"
            iconColor={colors.expense}
            iconBg={colors.expenseSoft}
            title="Feed cost"
            subtitle={`${formatCurrency(weekFeedCost)} for the week`}
            right={`${formatCurrency(costEgg)}/egg`}
            rightColor={colors.expense}
            onPress={() => router.push('/expenses')}
          />
          <View style={styles.divider} />
          <ListItem
            icon="scale-bathroom"
            iconColor={colors.expense}
            iconBg={colors.expenseSoft}
            title="Feed efficiency"
            subtitle="Reference: ~1.8 kg per dozen"
            right={`${feedPerDz.toFixed(1)} kg/dz`}
            rightColor={feedPerDz <= 2.1 ? colors.success : colors.warning}
            onPress={() => router.push('/expenses')}
          />
          <View style={styles.divider} />
          <ListItem
            icon="alert-decagram-outline"
            iconColor={colors.danger}
            iconBg={colors.expenseSoft}
            title="Layer mortality"
            subtitle={`${sumMortality(dailyRecords)} birds lost this period`}
            right={formatPercent(mortality)}
            rightColor={mortality <= 1 ? colors.success : colors.danger}
            onPress={() => router.push('/production')}
          />
        </View>
      </Card>

      <SectionHeader title="By flock" />
      <Card padding={0} style={styles.listCard}>
        {perFlock.map((row, index) => {
          const rate = row.flock.stage === 'laying' ? row.rate : 0;
          return (
            <View key={row.flock.id}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <ListItem
                icon="turkey"
                iconColor={colors.flock}
                iconBg={colors.flockSoft}
                title={row.flock.name}
                subtitle={`${row.hens} hen-days · ${formatCount(row.eggs)} eggs · ${row.mortality} lost · ${row.feedKg.toFixed(0)} kg feed`}
                right={row.flock.stage === 'laying' ? `${rate}%` : row.flock.stage}
                rightColor={rate >= 85 ? colors.success : rate >= 70 ? colors.warning : colors.danger}
                onPress={() => router.push({ pathname: '/flock/[id]', params: { id: row.flock.id } })}
              />
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  trendFooter: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  trendText: {
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
});