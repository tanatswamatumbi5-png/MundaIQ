export const colors = {
  primary: '#2F6B3A',
  primaryLight: '#4C8C4F',
  primaryDark: '#1F4F2A',
  primarySoft: '#E9F3EA',

  flock: '#B8860B',
  flockSoft: '#FBF3E0',
  egg: '#E07B00',
  eggSoft: '#FDF2E3',
  hatchery: '#D98E04',
  hatcherySoft: '#FCF1DC',
  expense: '#C0474F',
  expenseSoft: '#FBE9EA',
  cage: '#2D6BA6',
  cageSoft: '#E7F0F8',
  assistant: '#6A5ACD',
  assistantSoft: '#EFEDFB',

  background: '#F4F7F4',
  card: '#FFFFFF',
  border: '#E3EAE3',
  divider: '#EDF1ED',

  textPrimary: '#1C241D',
  textSecondary: '#5F6B60',
  textMuted: '#97A297',

  success: '#2E7D32',
  warning: '#C47F17',
  danger: '#C0392B',
  info: '#2D6BA6',

  white: '#FFFFFF',
  black: '#000000',
  shadow: '#0B1F0D',
} as const;

export type Color = keyof typeof colors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  lg: 15,
  xl: 17,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const shadow = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export const theme = { colors, spacing, radius, fontSize, fontWeight, shadow } as const;

export type Theme = typeof theme;