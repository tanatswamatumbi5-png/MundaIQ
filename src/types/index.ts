export type ModuleId =
  | 'dashboard'
  | 'flocks'
  | 'eggs'
  | 'expenses'
  | 'cages'
  | 'hatchery'
  | 'assistant';

export type FlockStage = 'growing' | 'laying' | 'molting' | 'culled';

export interface LayerFlock {
  id: string;
  name: string;
  breed: string;
  stage: FlockStage;
  hens: number;
  ageWeeks: number;
  housing: string;
  houseId?: string;
  notes?: string;
}

export interface House {
  id: string;
  name: string;
  lengthM: number;
  depthM: number;
  rowPitchM: number;
  cageWidthM: number;
  birdsPerCage: number;
}

export interface Cage {
  id: string;
  flockId: string;
  house: string;
  row: number;
  column: number;
  label: string;
  birds: number;
  capacity: number;
}

export interface DailyRecord {
  id: string;
  flockId: string;
  cageId: string;
  date: string;
  intact: number;
  broken: number;
  dirty: number;
  mortality: number;
  hensAtCollection: number;
  feedKg: number;
  feedCost: number;
  notes?: string;
}

export type ExpenseCategory =
  | 'Feed'
  | 'Veterinary'
  | 'Labour'
  | 'Equipment'
  | 'Transport'
  | 'Utilities'
  | 'Other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  paidTo: string;
}

export type HatcheryStage = 'incubating' | 'hatching' | 'hatched' | 'failed';

export interface HatcheryBatch {
  id: string;
  batchCode: string;
  breed: string;
  eggsSet: number;
  setDate: string;
  expectedHatch: string;
  stage: HatcheryStage;
  hatchRate: number;
  chicksHatched?: number;
  notes?: string;
}

export interface FarmActivity {
  id: string;
  module: ModuleId;
  title: string;
  detail: string;
  time: string;
}

export type AlertSeverity = 'low' | 'medium' | 'high';

export interface AlertItem {
  id: string;
  module: ModuleId;
  severity: AlertSeverity;
  message: string;
}

export interface DashboardStats {
  todayEggs: number;
  weekEggs: number;
  avgRatePct: number;
  liveHens: number;
  weekFeedKg: number;
  weekFeedCost: number;
  weekMortality: number;
  monthSpend: number;
}