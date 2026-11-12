import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { IconName } from '@/constants/modules';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';
import { Card } from './Card';

type Props = {
  icon: IconName;
  label: string;
  value: string;
  tint?: string;
  softColor?: string;
  style?: ViewStyle;
  onPress?: () => void;
};

export function StatCard({ icon, label, value, tint, softColor, style, onPress }: Props) {
  return (
    <Card
      onPress={onPress}
      padding={spacing.md}
      style={{ ...style, borderRadius: radius.lg, paddingVertical: spacing.sm }}
    >
      <View style={styles.row}>
        <View style={[styles.iconTile, { backgroundColor: softColor ?? colors.primarySoft }]}>
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={tint ?? colors.primary}
          />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.value} numberOfLines={1}>
            {value}
          </Text>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 1,
  },
  value: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});