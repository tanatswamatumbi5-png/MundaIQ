import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import type { ModuleId } from '@/types';
import { colors } from '@/theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface ModuleMeta {
  id: ModuleId;
  label: string;
  icon: IconName;
  color: string;
  softColor: string;
  description: string;
  href: Href;
}

export const modules: Record<Exclude<ModuleId, 'dashboard'>, ModuleMeta> = {
  flocks: {
    id: 'flocks',
    label: 'Flocks / Layers',
    icon: 'turkey',
    color: colors.flock,
    softColor: colors.flockSoft,
    description: 'Layer flocks, age and production bands.',
    href: '/production',
  },
  eggs: {
    id: 'eggs',
    label: 'Egg Production',
    icon: 'egg-easter',
    color: colors.egg,
    softColor: colors.eggSoft,
    description: 'Daily collections, mortality and feed use.',
    href: '/production',
  },
  expenses: {
    id: 'expenses',
    label: 'Expenses',
    icon: 'cash-multiple',
    color: colors.expense,
    softColor: colors.expenseSoft,
    description: 'Feed, veterinary and labour costs.',
    href: '/expenses',
  },
  cages: {
    id: 'cages',
    label: 'Cage Map',
    icon: 'grid',
    color: colors.cage,
    softColor: colors.cageSoft,
    description: '2D cage layout with eggs, mortality and birds.',
    href: '/cages',
  },
  hatchery: {
    id: 'hatchery',
    label: 'Hatchery',
    icon: 'egg-outline',
    color: colors.hatchery,
    softColor: colors.hatcherySoft,
    description: 'Incubation batches and chick output.',
    href: '/hatchery',
  },
  assistant: {
    id: 'assistant',
    label: 'Farm Assistant',
    icon: 'robot-outline',
    color: colors.assistant,
    softColor: colors.assistantSoft,
    description: 'Advice on layers, feeding and health.',
    href: '/farm-assistant',
  },
};

export const moduleList: ModuleMeta[] = Object.values(modules);