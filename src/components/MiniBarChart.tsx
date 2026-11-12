import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/theme';

export interface ChartBar {
  label: string;
  value: number;
}

type Props = {
  data: ChartBar[];
  color?: string;
  highlight?: string;
};

export function MiniBarChart({ data, color = colors.egg, highlight = colors.egg }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.row}>
      {data.map((bar) => {
        const active = bar.label === data[data.length - 1].label;
        return (
          <View key={bar.label} style={styles.column}>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    height: `${Math.max((bar.value / max) * 100, 4)}%`,
                    backgroundColor: active ? highlight : color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.label, active && styles.activeLabel]}>{bar.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  track: {
    height: 96,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
  },
  activeLabel: {
    color: colors.egg,
    fontWeight: '700',
  },
});