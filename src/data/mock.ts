import {
  AlertItem,
  Cage,
  DailyRecord,
  DashboardStats,
  Expense,
  FarmActivity,
  HatcheryBatch,
  House,
  LayerFlock,
} from '@/types';
import { addDays } from '@/utils/date';
import { averageRate, sumEggs, sumFeedCost, sumFeedKg, sumMortality, totalEggs } from '@/utils/production';

export const farmProfile = {
  name: 'Green Valley Farm',
  location: 'Bindura, Mashonaland West',
};

const today = '2026-10-01';
const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

export const houses: House[] = [
  {
    id: 'h1',
    name: 'House A',
    lengthM: 12,
    depthM: 6,
    rowPitchM: 1.5,
    cageWidthM: 0.5,
    birdsPerCage: 3,
  },
  {
    id: 'h2',
    name: 'House B',
    lengthM: 12,
    depthM: 4.5,
    rowPitchM: 1.5,
    cageWidthM: 0.5,
    birdsPerCage: 3,
  },
  {
    id: 'h3',
    name: 'House C',
    lengthM: 9,
    depthM: 4.5,
    rowPitchM: 1.5,
    cageWidthM: 0.5,
    birdsPerCage: 3,
  },
  {
    id: 'h4',
    name: 'Rearing House',
    lengthM: 12,
    depthM: 3,
    rowPitchM: 1.5,
    cageWidthM: 1,
    birdsPerCage: 8,
  },
];



export const cageColumns = (house: House): number => Math.floor(house.lengthM / house.cageWidthM);
// A house is one continuous line of cages, so depth does not split it into sections.
export const cageRows = (): number => 1;
export const houseCageCount = (house: House): number => cageColumns(house) * cageRows();
export const houseBirdTotal = (house: House): number => houseCageCount(house) * house.birdsPerCage;

function houseLetter(name: string): string {
  if (name.startsWith('House ')) return name.slice('House '.length).charAt(0);
  return name.replace(/[^A-Za-z]/g, '').charAt(0) || 'X';
}

/**
 * Target fill for each house, so the demo shows a spread of grades instead of
 * four identical full rows. Kept deterministic so the app looks the same on
 * every launch.
 */
interface HouseFill {
  /** How full the row sits overall, 0 to 1. */
  target: number;
  /** One cage in this many is left empty. 0 disables the gaps. */
  gapEvery: number;
  /** Shifts which columns come up empty, so houses differ. */
  phase: number;
}

const houseFill: Record<string, HouseFill> = {
  'House A': { target: 0.93, gapEvery: 8, phase: 0 },
  'House B': { target: 1.0, gapEvery: 13, phase: 5 },
  'House C': { target: 0.7, gapEvery: 6, phase: 2 },
  'Rearing House': { target: 0.45, gapEvery: 3, phase: 1 },
};

/**
 * Per-cage stock around the house target: whole birds, plus the occasional
 * empty cage as if a batch has not been placed in yet. Deterministic, so the
 * demo looks the same on every launch.
 */
function stockedBirds(houseName: string, column: number, capacity: number): number {
  const plan = houseFill[houseName];
  if (!plan) return capacity;

  if (plan.gapEvery > 0 && (column + plan.phase) % plan.gapEvery === 0) return 0;

  const offset = houseName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const roll = ((column * 37 + offset * 11) % 100) / 100;

  // Cages at or above the target are filled to capacity; the rest are part
  // stocked, so a row shows a mix rather than one uniform number.
  if (roll < plan.target) return capacity;

  const part = capacity * (0.35 + roll * 0.4);
  return Math.min(capacity, Math.max(1, Math.round(part)));
}

function buildCages(): Cage[] {
  const list: Cage[] = [];

  houses.forEach((house) => {
    const rows = cageRows();
    const columns = cageColumns(house);

    for (let row = 1; row <= rows; row += 1) {
      for (let column = 1; column <= columns; column += 1) {
        list.push({
          id: `${house.id}-c${row}-${column}`,
          flockId: '',
          house: house.name,
          row,
          column,
          label: `${houseLetter(house.name)}-${String(column).padStart(2, '0')}`,
          birds: stockedBirds(house.name, column, house.birdsPerCage),
          capacity: house.birdsPerCage,
        });
      }
    }
  });

  return list;
}

export const cages: Cage[] = buildCages();

export const cagesForHouse = (houseName: string): Cage[] => cages.filter((c) => c.house === houseName);
export const birdsInHouse = (houseName: string): number =>
  cagesForHouse(houseName).reduce((sum, c) => sum + c.birds, 0);

export const flocks: LayerFlock[] = [
  {
    id: 'fr1',
    name: 'Layers Batch 04',
    breed: 'Hy-Line Brown',
    stage: 'laying',
    hens: birdsInHouse('House B'),
    ageWeeks: 34,
    housing: 'House B',
    houseId: 'h2',
    notes: 'Peak production band.',
  },
  {
    id: 'fr2',
    name: 'Layers Batch 06',
    breed: 'Hy-Line Brown',
    stage: 'laying',
    hens: birdsInHouse('House A'),
    ageWeeks: 22,
    housing: 'House A',
    houseId: 'h1',
    notes: 'Ramping up to peak.',
  },
  {
    id: 'fr3',
    name: 'Layers Batch 03',
    breed: 'ISA Brown',
    stage: 'laying',
    hens: birdsInHouse('House C'),
    ageWeeks: 60,
    housing: 'House C',
    houseId: 'h3',
    notes: 'Second cycle – monitor decline.',
  },
  {
    id: 'fr4',
    name: 'Pullets Batch 07',
    breed: 'ISA Brown',
    stage: 'growing',
    hens: birdsInHouse('Rearing House'),
    ageWeeks: 15,
    housing: 'Rearing House',
    houseId: 'h4',
    notes: 'Start laying around week 18.',
  },
];

const flockById = (id: string): LayerFlock => flocks.find((f) => f.id === id) as LayerFlock;

flocks.forEach((flock) => {
  cagesForHouse(flock.housing).forEach((cage) => {
    cage.flockId = flock.id;
  });
});

const flockProduction: Record<string, { baseRate: number; jitter: number[] }> = {
  fr1: { baseRate: 0.92, jitter: [1, 0, 1, 1, 0, -1, 0] },
  fr2: { baseRate: 0.78, jitter: [1, 1, 0, 1, 0, 1, 1] },
  fr3: { baseRate: 0.62, jitter: [-1, 0, -1, -2, 0, -1, 0] },
};

// Largest-remainder split so per-cage parts always sum back to the flock total.
function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((acc, w) => acc + w, 0);
  if (sum <= 0) return weights.map(() => 0);

  const exact = weights.map((w) => (total * w) / sum);
  const parts = exact.map(Math.floor);
  let remainder = total - parts.reduce((acc, w) => acc + w, 0);

  const byFraction = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < byFraction.length && remainder > 0; i += 1) {
    parts[byFraction[i].index] += 1;
    remainder -= 1;
  }

  return parts;
}

// Deterministic per-cage productivity so the map shows real variation
// instead of one flat colour across the whole house.
function cagePerformance(cage: Cage, dayIndex: number): number {
  const seed = (cage.row * 31 + cage.column * 17 + dayIndex * 13) % 100;
  return 0.68 + (seed / 100) * 0.5;
}

function buildRecords(): DailyRecord[] {
  const records: DailyRecord[] = [];

  weekDays.forEach((date, dayIndex) => {
    Object.entries(flockProduction).forEach(([flockId, profile]) => {
      const flock = flockById(flockId);
      const flockCages = cages.filter((c) => c.flockId === flockId);
      const weights = flockCages.map((c) => cagePerformance(c, dayIndex));

      const rate = profile.baseRate + profile.jitter[dayIndex] / 100;
      const total = Math.round(flock.hens * rate);
      const broken = Math.round(total * 0.02) + (dayIndex === 1 ? 2 : 0);
      const dirty = Math.round(total * 0.03);
      const mortality = dayIndex % 4 === 0 ? 1 : 0;

      const intactParts = allocate(total - broken - dirty, weights);
      const brokenParts = allocate(broken, weights);
      const dirtyParts = allocate(dirty, weights);
      const feedParts = allocate(Math.round(flock.hens * 0.115 * 10), flockCages.map((c) => c.birds));
      const mortalityCage = mortality ? flockCages[(dayIndex * 7) % flockCages.length] : undefined;

      flockCages.forEach((cage, index) => {
        const cageMortality = mortalityCage?.id === cage.id ? mortality : 0;

        records.push({
          id: `${cage.id}-${date}`,
          flockId,
          cageId: cage.id,
          date,
          intact: intactParts[index],
          broken: brokenParts[index],
          dirty: dirtyParts[index],
          mortality: cageMortality,
          hensAtCollection: cage.birds - cageMortality,
          feedKg: feedParts[index],
          feedCost: Math.round((feedParts[index] * 0.34) * 100) / 100,
        });
      });
    });
  });

  return records;
}

export const dailyRecords: DailyRecord[] = buildRecords();

export const expenses: Expense[] = [
  {
    id: 'e1',
    category: 'Feed',
    description: 'Layers mash – 4 bags',
    amount: 52,
    date: '2026-09-30',
    paidTo: 'Grain Corporate',
  },
  {
    id: 'e2',
    category: 'Feed',
    description: 'Layer concentrate – 2 bags',
    amount: 39,
    date: '2026-09-28',
    paidTo: 'Greenlife Agro',
  },
  {
    id: 'e3',
    category: 'Veterinary',
    description: 'Coccidiosis vaccine – Batch 06',
    amount: 25,
    date: '2026-09-27',
    paidTo: "Dr. Moyo's Clinic",
  },
  {
    id: 'e4',
    category: 'Labour',
    description: 'House cleaning & egg collection',
    amount: 29,
    date: '2026-09-26',
    paidTo: 'Casual labour',
  },
  {
    id: 'e5',
    category: 'Equipment',
    description: 'Nipple drinkers (50 pcs)',
    amount: 20,
    date: '2026-09-25',
    paidTo: 'Agrovet Supplies',
  },
  {
    id: 'e6',
    category: 'Transport',
    description: 'Eggs to Bindura market',
    amount: 12,
    date: '2026-09-24',
    paidTo: 'Transport – Kamau',
  },
  {
    id: 'e7',
    category: 'Utilities',
    description: 'House A & B power',
    amount: 7,
    date: '2026-09-23',
    paidTo: 'ZESA prepaid',
  },
  {
    id: 'e8',
    category: 'Other',
    description: 'Disinfectant & footbath chemical',
    amount: 6,
    date: '2026-09-22',
    paidTo: 'Agrovet Supplies',
  },
];

export const hatcheryBatches: HatcheryBatch[] = [
  {
    id: 'h1',
    batchCode: 'HB-071',
    breed: 'Kienyeji',
    eggsSet: 240,
    setDate: '2026-09-11',
    expectedHatch: '2026-10-02',
    stage: 'incubating',
    hatchRate: 0,
    notes: 'Temperature stable at 37.7°C.',
  },
  {
    id: 'h2',
    batchCode: 'HB-068',
    breed: 'Hy-Line Brown',
    eggsSet: 180,
    setDate: '2026-08-25',
    expectedHatch: '2026-09-16',
    stage: 'hatching',
    hatchRate: 54,
    chicksHatched: 98,
    notes: 'Hatching in progress – pull chicks every 6 hours.',
  },
  {
    id: 'h3',
    batchCode: 'HB-065',
    breed: 'Kienyeji',
    eggsSet: 200,
    setDate: '2026-07-30',
    expectedHatch: '2026-08-20',
    stage: 'hatched',
    hatchRate: 82,
    chicksHatched: 164,
  },
];

export const activities: FarmActivity[] = [
  {
    id: 'a1',
    module: 'eggs',
    title: 'Collected 401 eggs – Batch 04',
    detail: '388 whole · 7 broken · 6 dirty',
    time: '06:40',
  },
  {
    id: 'a2',
    module: 'flocks',
    title: 'Fed layers – 112 kg mash',
    detail: 'House A & B',
    time: '07:00',
  },
  {
    id: 'a3',
    module: 'eggs',
    title: 'Boxed 340 eggs for market',
    detail: 'Delivered to Bindura market',
    time: '08:15',
  },
  {
    id: 'a4',
    module: 'expenses',
    title: 'Bought nipple drinkers (50)',
    detail: '$20',
    time: '10:30',
  },
  {
    id: 'a5',
    module: 'hatchery',
    title: 'Checked batch HB-068',
    detail: '98 chicks hatched so far',
    time: '11:05',
  },
];

export const alerts: AlertItem[] = [
  {
    id: 'al1',
    module: 'flocks',
    severity: 'high',
    message: 'Batch 03 production dropping – check feed quality & lighting.',
  },
  {
    id: 'al2',
    module: 'eggs',
    severity: 'medium',
    message: 'Broken eggs up this week – inspect collection trays.',
  },
  {
    id: 'al3',
    module: 'hatchery',
    severity: 'medium',
    message: 'Batch HB-068 needs chick pull at 15:00.',
  },
  {
    id: 'al4',
    module: 'expenses',
    severity: 'low',
    message: 'Feed stock low – order layers mash.',
  },
];

export function getDashboardStats(
  flocks: LayerFlock[],
  records: DailyRecord[],
  expenses: Expense[],
): DashboardStats {
  const layingFlocks = flocks.filter((f) => f.stage === 'laying');
  const allRecords = [...records];
  const lastDateRecords = allRecords.filter((r) => r.date === today);

  return {
    todayEggs: sumEggs(lastDateRecords),
    weekEggs: sumEggs(allRecords),
    avgRatePct: Math.round(averageRate(allRecords)),
    liveHens: layingFlocks.reduce((sum, f) => sum + f.hens, 0),
    weekFeedKg: Math.round(sumFeedKg(allRecords) * 10) / 10,
    weekFeedCost: sumFeedCost(allRecords),
    weekMortality: sumMortality(allRecords),
    monthSpend: expenses.reduce((sum, e) => sum + e.amount, 0),
  };
}

export function flockDailyTotal(records: DailyRecord[], flockId: string, date: string): number {
  const record = records.find((r) => r.flockId === flockId && r.date === date);
  return record ? totalEggs(record) : 0;
}

export function latestRecord(records: DailyRecord[], flockId: string): DailyRecord | undefined {
  return [...records]
    .filter((r) => r.flockId === flockId)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}