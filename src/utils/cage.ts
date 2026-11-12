import type { Cage, DailyRecord, House, LayerFlock } from '@/types';
import { cages, cageColumns, cageRows, flocks, houses } from '@/data/mock';

export interface CageStat {
  cage: Cage;
  eggs: number;
  broken: number;
  dirty: number;
  mortality: number;
  birds: number;
  rate: number;
  feedKg: number;
  feedCost: number;
  daysLogged: number;
}

export const houseCages = (houseName: string): Cage[] =>
  cages.filter((c) => c.house === houseName);

export const houseNames = (): string[] => houses.map((h) => h.name);

/** Flocks housed in a row, used to attribute flock-level collection records. */
export const houseFlocks = (houseName: string): LayerFlock[] =>
  flocks.filter((f) => f.housing === houseName);

export const houseFor = (name: string): House | undefined =>
  houses.find((h) => h.name === name);

export const gridShape = (houseName: string): { rows: number; columns: number } => {
  const house = houseFor(houseName);
  if (!house) return { rows: 0, columns: 0 };
  return { rows: cageRows(), columns: cageColumns(house) };
};

export const cageById = (id: string): Cage | undefined => cages.find((c) => c.id === id);

/** Rolls up one day of per-cage records into a single cage statistic. */
export function cageStat(cage: Cage, dayRecords: DailyRecord[]): CageStat {
  const sum = (pick: (r: DailyRecord) => number) =>
    dayRecords.reduce((acc, r) => acc + pick(r), 0);

  const eggs = sum((r) => r.intact);
  const broken = sum((r) => r.broken);
  const dirty = sum((r) => r.dirty);
  const mortality = sum((r) => r.mortality);
  const birds = Math.max(cage.birds - mortality, 0);

  return {
    cage,
    eggs,
    broken,
    dirty,
    mortality,
    birds,
    rate: birds > 0 ? (eggs / birds) * 100 : 0,
    feedKg: sum((r) => r.feedKg),
    feedCost: sum((r) => r.feedCost),
    daysLogged: dayRecords.length,
  };
}

/** Every cage in a house for one day, including cages with no collection. */
export function houseStatsForDate(
  houseName: string,
  date: string | undefined,
  records: DailyRecord[],
): CageStat[] {
  const houseCageIds = new Set(houseCages(houseName).map((c) => c.id));
  const forHouse = records.filter((r) => r.date === date && houseCageIds.has(r.cageId));

  return houseCages(houseName).map((cage) =>
    cageStat(
      cage,
      forHouse.filter((r) => r.cageId === cage.id),
    ),
  );
}

export function cageHistory(cageId: string, records: DailyRecord[]): DailyRecord[] {
  return records
    .filter((r) => r.cageId === cageId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function latestDate(records: DailyRecord[]): string | undefined {
  return records.reduce<string | undefined>(
    (max, r) => (max === undefined || r.date > max ? r.date : max),
    undefined,
  );
}

/** One crate carries this many eggs. */
export const EGGS_PER_CRATE = 30;

/** Whole crates an egg count fills, rounded down. */
export const cratesFor = (eggs: number): number =>
  eggs > 0 ? Math.floor(eggs / EGGS_PER_CRATE) : 0;

/**
 * Share of birds in a row that are expected to lay on a good day. The crates a
 * row is expected to fill are derived from this and its own bird count, so rows
 * of different sizes are each measured against their own capacity.
 */
export const LAY_RATE_TARGET = 0.95;

/** Crates a row of `birds` birds can fill over `days` days. */
export function maxCratesFor(birds: number, days: number): number {
  if (birds <= 0 || days <= 0) return 0;
  return Math.floor((birds * LAY_RATE_TARGET * days) / EGGS_PER_CRATE);
}

/**
 * Splits a row's eggs into per-crate parts so every cage holds a whole number
 * of crates and the parts still sum back to the row's crate total.
 */
export function crateSplit(
  eggs: number,
  weights: number[],
): { crates: number; partEggs: number }[] {
  const totalCrates = cratesFor(eggs);
  if (totalCrates === 0) return weights.map(() => ({ crates: 0, partEggs: 0 }));

  const sum = weights.reduce((acc, w) => acc + w, 0);
  if (sum <= 0) return weights.map(() => ({ crates: 0, partEggs: 0 }));

  // Largest-remainder: same split rule as the seeded egg parts, so a row's
  // crates are distributed by actual productivity rather than evenly.
  const exact = weights.map((w) => (totalCrates * w) / sum);
  const crates = exact.map(Math.floor);
  let remainder = totalCrates - crates.reduce((acc, c) => acc + c, 0);

  const byFraction = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < byFraction.length && remainder > 0; i += 1) {
    crates[byFraction[i].index] += 1;
    remainder -= 1;
  }

  return crates.map((count) => ({ crates: count, partEggs: count * EGGS_PER_CRATE }));
}

export type Grade = 'none' | 'low' | 'fair' | 'moderate' | 'good' | 'excellent';

export interface GradeBand {
  id: Grade;
  label: string;
  detail: string;
  color: string;
}

/**
 * The house grading scale. A house is graded once, from its whole-row
 * hen-day rate, so a single band covers the entire row of cages.
 */
const gradeBands: (GradeBand & { min: number })[] = [
  { id: 'low', label: 'Low', detail: '(<40%)', color: '#C0392B', min: 0 },
  { id: 'fair', label: 'Fair', detail: '(40–60%)', color: '#E08A2D', min: 40 },
  { id: 'moderate', label: 'Moderate', detail: '(60–75%)', color: '#D4B23F', min: 60 },
  { id: 'good', label: 'Good', detail: '(75–85%)', color: '#8CBF5A', min: 75 },
  { id: 'excellent', label: 'Excellent', detail: '(85%+)', color: '#2E7D32', min: 85 },
];

const noDataBand: GradeBand = {
  id: 'none',
  label: 'No data',
  detail: '',
  color: '#E3EAE3',
};

/** Ordered for the legend: no data first, then each band. */
export const gradeScale: GradeBand[] = [noDataBand, ...gradeBands];

export function gradeFor(rate: number): Grade {
  let match = gradeBands[0];
  for (const band of gradeBands) {
    if (rate >= band.min) match = band;
  }
  return match.id;
}

export const gradeBand = (grade: Grade): GradeBand =>
  gradeScale.find((band) => band.id === grade) ?? noDataBand;

export const gradeColor = (grade: Grade): string => gradeBand(grade).color;

/** Lightens a hex colour so a whole row of tiles can carry one grade tint. */
export function tint(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface HouseResult {
  house: string;
  date: string | undefined;
  cageCount: number;
  cagesLogged: number;
  /** Birds standing in the row. */
  birds: number;
  /** Maximum the row can carry. */
  capacity: number;
  /** birds / capacity as a percentage. */
  occupancy: number;
  eggs: number;
  broken: number;
  dirty: number;
  mortality: number;
  feedKg: number;
  feedCost: number;
  /** Hen-day percentage across the whole row. */
  rate: number;
  /** Whole crates the row filled on the selected day. */
  crates: number;
  /** Eggs that did not fill a whole crate. */
  looseEggs: number;
  /** Crates the row could fill on the selected day. */
  maxCrates: number;
  /** crates / maxCrates as a percentage, for the selected day. */
  crateRate: number;
  /** Whole crates filled across every recorded day. */
  weekCrates: number;
  /** Crates the row could fill across those days. */
  weekMaxCrates: number;
  /** Week crate rate as a percentage; drives the grade. */
  weekRate: number;
  grade: Grade;
  /** Per-cage records behind the strip. */
  cages: CageStat[];
}

export interface HouseWeek {
  house: string;
  daysLogged: number;
  eggs: number;
  crates: number;
  maxCrates: number;
  rate: number;
  grade: Grade;
}

/** Days on which a row has at least one collection recorded. */
export function houseDates(houseName: string, records: DailyRecord[]): string[] {
  const rows = houseRowRecords(houseName, records);
  return Array.from(new Set(rows.map((r) => r.date))).sort();
}

/**
 * Records that belong to a row.
 *
 * A record is attributed to a row either by the cage it names, or by the house
 * its flock is housed in. Flock-level entries saved from the record form have no
 * cage, so falling back to the flock's housing keeps those collections in the
 * row total instead of dropping them from the map.
 */
export function houseRowRecords(houseName: string, records: DailyRecord[]): DailyRecord[] {
  const ids = new Set(houseCages(houseName).map((c) => c.id));
  const flockIds = new Set(houseFlocks(houseName).map((f) => f.id));

  return records.filter(
    (r) => (r.cageId.length > 0 && ids.has(r.cageId)) || (r.cageId.length === 0 && flockIds.has(r.flockId)),
  );
}

export interface FlockWeek {
  flockId: string;
  daysLogged: number;
  eggs: number;
  broken: number;
  dirty: number;
  mortality: number;
  feedKg: number;
  feedCost: number;
  crates: number;
  looseEggs: number;
  birds: number;
  maxCrates: number;
  rate: number;
  grade: Grade;
}

/**
 * Week figures for a single flock, measured against its own birds.
 *
 * This is the same arithmetic as `houseWeek`, restricted to one flock's records,
 * so a flock sitting in a row reports figures that add up to that row rather
 * than a separate set of numbers.
 */
export function flockWeek(flockId: string, flock: LayerFlock, records: DailyRecord[]): FlockWeek {
  const rows = records.filter((r) => r.flockId === flockId);
  const dates = Array.from(new Set(rows.map((r) => r.date))).sort();

  const eggs = rows.reduce((acc, r) => acc + r.intact, 0);
  const crates = cratesFor(eggs);
  const birds = flock.hens;
  const maxCrates = maxCratesFor(birds, dates.length);
  const rate = maxCrates > 0 ? (crates / maxCrates) * 100 : 0;

  return {
    flockId,
    daysLogged: dates.length,
    eggs,
    broken: rows.reduce((acc, r) => acc + r.broken, 0),
    dirty: rows.reduce((acc, r) => acc + r.dirty, 0),
    mortality: rows.reduce((acc, r) => acc + r.mortality, 0),
    feedKg: rows.reduce((acc, r) => acc + r.feedKg, 0),
    feedCost: rows.reduce((acc, r) => acc + r.feedCost, 0),
    crates,
    looseEggs: eggs - crates * EGGS_PER_CRATE,
    birds,
    maxCrates,
    rate,
    grade: maxCrates > 0 ? gradeFor(rate) : 'none',
  };
}

/**
 * Week figures for a row. Eggs pool across the days and then fill crates, so
 * the figure reflects the run rather than one day's rounding.
 */
export function houseWeek(houseName: string, records: DailyRecord[]): HouseWeek {
  const dates = houseDates(houseName, records);
  const row = houseRowRecords(houseName, records).filter((r) => dates.includes(r.date));
  const eggs = row.reduce((acc, r) => acc + r.intact, 0);

  const crates = cratesFor(eggs);
  const birds = houseCages(houseName).reduce((acc, c) => acc + c.birds, 0);
  const maxCrates = maxCratesFor(birds, dates.length);
  const rate = maxCrates > 0 ? (crates / maxCrates) * 100 : 0;

  return {
    house: houseName,
    daysLogged: dates.length,
    eggs,
    crates,
    maxCrates,
    rate,
    grade: maxCrates > 0 ? gradeFor(rate) : 'none',
  };
}

/**
 * Grades a house once for the whole row: the crates its birds produced against
 * the crates that many birds could fill at a 95% lay rate. Nothing is graded
 * cage by cage.
 */
export function houseResult(
  houseName: string,
  date: string | undefined,
  records: DailyRecord[],
): HouseResult {
  const stats = houseStatsForDate(houseName, date, records);
  const logged = stats.filter((s) => s.daysLogged > 0);
  const sum = (pick: (s: CageStat) => number) => logged.reduce((acc, s) => acc + pick(s), 0);

  // Collections saved against a flock rather than a cage still belong to the
  // row, so they count toward the day's totals without belonging to any one
  // cage marker.
  const loose = houseRowRecords(houseName, records).filter(
    (r) => r.date === date && r.cageId.length === 0,
  );
  const looseSum = (pick: (r: DailyRecord) => number) => loose.reduce((acc, r) => acc + pick(r), 0);

  // Headcount is what is physically in the row today, so it comes off the
  // cage record rather than the mortality-adjusted figure used for rates.
  const birds = stats.reduce((acc, s) => acc + s.cage.birds, 0);
  const capacity = stats.reduce((acc, s) => acc + s.cage.capacity, 0);
  const occupancy = capacity > 0 ? (birds / capacity) * 100 : 0;

  const eggs = sum((s) => s.eggs) + looseSum((r) => r.intact);
  const crates = cratesFor(eggs);
  const looseEggs = eggs - crates * EGGS_PER_CRATE;

  // The day's crates are a count for display; the grade comes from the week,
  // because one day of 30-egg rounding is far too coarse to grade on.
  const maxCrates = logged.length > 0 || loose.length > 0 ? maxCratesFor(birds, 1) : 0;
  const crateRate = maxCrates > 0 ? (crates / maxCrates) * 100 : 0;

  const week = houseWeek(houseName, records);

  return {
    house: houseName,
    date,
    cageCount: stats.length,
    cagesLogged: logged.length,
    birds,
    capacity,
    occupancy,
    eggs,
    broken: sum((s) => s.broken) + looseSum((r) => r.broken),
    dirty: sum((s) => s.dirty) + looseSum((r) => r.dirty),
    mortality: sum((s) => s.mortality) + looseSum((r) => r.mortality),
    feedKg: sum((s) => s.feedKg) + looseSum((r) => r.feedKg),
    feedCost: sum((s) => s.feedCost) + looseSum((r) => r.feedCost),
    rate:
      sum((s) => s.birds) + looseSum((r) => r.hensAtCollection) > 0
        ? (eggs / (sum((s) => s.birds) + looseSum((r) => r.hensAtCollection))) * 100
        : 0,
    crates,
    looseEggs,
    maxCrates,
    crateRate,
    weekCrates: week.crates,
    weekMaxCrates: week.maxCrates,
    weekRate: week.rate,
    grade: week.grade,
    cages: stats,
  };
}