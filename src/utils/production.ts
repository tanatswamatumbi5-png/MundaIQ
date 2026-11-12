import { DailyRecord } from '@/types';
import { dayOfMonth } from './date';

export type DayTotal = { label: string; value: number };

export function totalEggs(record: DailyRecord): number {
  return record.intact + record.broken + record.dirty;
}

export function salableEggs(record: DailyRecord): number {
  return record.intact;
}

export function henDayRate(record: DailyRecord): number {
  if (record.hensAtCollection <= 0) return 0;
  return (totalEggs(record) / record.hensAtCollection) * 100;
}

/** Weighted flock-wide rate across a set of records. */
export function averageRate(records: DailyRecord[]): number {
  const hens = records.reduce((sum, r) => sum + r.hensAtCollection, 0);
  const eggs = records.reduce((sum, r) => sum + totalEggs(r), 0);
  if (hens <= 0) return 0;
  return (eggs / hens) * 100;
}

export function sumEggs(records: DailyRecord[]): number {
  return records.reduce((sum, r) => sum + totalEggs(r), 0);
}

export function sumMortality(records: DailyRecord[]): number {
  return records.reduce((sum, r) => sum + r.mortality, 0);
}

export function sumFeedKg(records: DailyRecord[]): number {
  return records.reduce((sum, r) => sum + r.feedKg, 0);
}

export function sumFeedCost(records: DailyRecord[]): number {
  return records.reduce((sum, r) => sum + r.feedCost, 0);
}

/** Birds lost as a percentage of hen-days. */
export function mortalityRate(records: DailyRecord[]): number {
  const henDays = records.reduce((sum, r) => sum + r.hensAtCollection + r.mortality, 0);
  const lost = sumMortality(records);
  if (henDays <= 0) return 0;
  return (lost / henDays) * 100;
}

/** Kilograms of feed consumed per dozen eggs produced. */
export function feedPerDozen(records: DailyRecord[]): number {
  const dozens = sumEggs(records) / 12;
  if (dozens <= 0) return 0;
  return sumFeedKg(records) / dozens;
}

/** Feed cost attributed to a single egg (includes non-feed costs implicitly excluded). */
export function costPerEgg(records: DailyRecord[]): number {
  const eggs = sumEggs(records);
  if (eggs <= 0) return 0;
  return sumFeedCost(records) / eggs;
}

/** Aggregated daily egg totals keyed by day-of-month label, oldest → newest. */
export function dailyEggTotals(records: DailyRecord[]): DayTotal[] {
  return [...records]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .reduce<DayTotal[]>((acc, record) => {
      const label = String(dayOfMonth(record.date));
      const existing = acc.find((e) => e.label === label);
      if (existing) {
        existing.value += totalEggs(record);
      } else {
        acc.push({ label, value: totalEggs(record) });
      }
      return acc;
    }, []);
}