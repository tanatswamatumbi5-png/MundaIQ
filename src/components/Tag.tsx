import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';

export type TagTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const toneColors: Record<TagTone, { bg: string; fg: string }> = {
  success: { bg: colors.primarySoft, fg: colors.success },
  warning: { bg: colors.hatcherySoft, fg: colors.warning },
  danger: { bg: colors.expenseSoft, fg: colors.danger },
  info: { bg: colors.primarySoft, fg: colors.info },
  neutral: { bg: colors.border, fg: colors.textSecondary },
};

type Props = {
  label: string;
  tone?: TagTone;
};

export function Tag({ label, tone = 'neutral' }: Props) {
  const palette = toneColors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});