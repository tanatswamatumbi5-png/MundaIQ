import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { IconName } from '@/constants/modules';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';

type Props = {
  icon?: IconName;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  right?: string;
  rightColor?: string;
  onPress?: () => void;
  onDelete?: () => void;
  showChevron?: boolean;
};

export function ListItem({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  right,
  rightColor,
  onPress,
  onDelete,
  showChevron = true,
}: Props) {
  const content = (
    <>
      {icon ? (
        <View style={[styles.iconTile, { backgroundColor: iconBg ?? colors.primarySoft }]}>
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={iconColor ?? colors.primary}
          />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? (
        <Text
          style={[styles.right, rightColor ? { color: rightColor } : null]}
          numberOfLines={1}
        >
          {right}
        </Text>
      ) : null}
      {onDelete ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          hitSlop={8}
          style={({ pressed }) => [styles.deleteBtn, pressed && styles.deletePressed]}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
        </Pressable>
      ) : null}
      {showChevron && onPress ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={colors.textMuted}
        />
      ) : null}
    </>
  );

  const rowStyle = [styles.row, onPress ? styles.rowPressable : null];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [rowStyle, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return <View style={rowStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowPressable: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  pressed: {
    backgroundColor: colors.primarySoft,
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  right: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    maxWidth: 92,
  },
  deleteBtn: {
    padding: spacing.xs,
    marginHorizontal: -spacing.xs,
  },
  deletePressed: {
    opacity: 0.5,
  },
});