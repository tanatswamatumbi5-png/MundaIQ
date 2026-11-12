import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '@/theme';
import { Card } from './Card';

export interface SummaryItem {
  label: string;
  value: string;
  color?: string;
}

type Props = {
  items: SummaryItem[];
};

export function SummaryStrip({ items }: Props) {
  return (
    <Card padding={spacing.lg}>
      <View style={styles.row}>
        {items.map((item, index) => (
          <View key={item.label} style={[styles.item, index > 0 && styles.itemWithDivider]}>
            <Text style={[styles.value, item.color ? { color: item.color } : null]}>
              {item.value}
            </Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  itemWithDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
  },
  value: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
});