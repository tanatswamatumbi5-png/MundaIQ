import { z } from 'zod';

const finiteNumber = z.number().refine((value) => Number.isFinite(value), {
  message: 'Expected a finite number',
});

export const layerFlockSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  breed: z.string(),
  stage: z.enum(['growing', 'laying', 'molting', 'culled']),
  hens: finiteNumber.nonnegative(),
  ageWeeks: finiteNumber.nonnegative(),
  housing: z.string(),
  houseId: z.string().optional(),
  notes: z.string().optional(),
});

export const cageSchema = z.object({
  id: z.string().min(1),
  flockId: z.string(),
  house: z.string(),
  row: finiteNumber.nonnegative(),
  column: finiteNumber.nonnegative(),
  label: z.string(),
  birds: finiteNumber.nonnegative(),
  capacity: finiteNumber.nonnegative(),
});

export const dailyRecordSchema = z.object({
  id: z.string().min(1),
  flockId: z.string(),
  cageId: z.string(),
  date: z.string(),
  intact: finiteNumber.nonnegative(),
  broken: finiteNumber.nonnegative(),
  dirty: finiteNumber.nonnegative(),
  mortality: finiteNumber.nonnegative(),
  hensAtCollection: finiteNumber.nonnegative(),
  feedKg: finiteNumber.nonnegative(),
  feedCost: finiteNumber.nonnegative(),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  id: z.string().min(1),
  category: z.enum([
    'Feed',
    'Veterinary',
    'Labour',
    'Equipment',
    'Transport',
    'Utilities',
    'Other',
  ]),
  description: z.string(),
  amount: finiteNumber.nonnegative(),
  date: z.string(),
  paidTo: z.string(),
});

export const appDataSchema = z.object({
  flocks: z.array(layerFlockSchema),
  cages: z.array(cageSchema),
  dailyRecords: z.array(dailyRecordSchema),
  expenses: z.array(expenseSchema),
});

export type ValidatedAppData = z.infer<typeof appDataSchema>;
