import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { ListItem } from '@/components/ListItem';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { SummaryItem, SummaryStrip } from '@/components/SummaryStrip';
import { IconName } from '@/constants/modules';
import { useAppData } from '@/store/AppDataContext';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';
import { ExpenseCategory } from '@/types';
import { formatCurrency } from '@/utils/format';

const categoryIcon: Record<ExpenseCategory, IconName> = {
  Feed: 'sack',
  Veterinary: 'medical-bag',
  Labour: 'account-group',
  Equipment: 'tools',
  Transport: 'truck',
  Utilities: 'flash',
  Other: 'cash',
};

const categoryColor: Record<ExpenseCategory, string> = {
  Feed: colors.expense,
  Veterinary: colors.danger,
  Labour: colors.info,
  Equipment: colors.flock,
  Transport: colors.hatchery,
  Utilities: colors.warning,
  Other: colors.textSecondary,
};

const allLabel = 'All';

export function ExpensesScreen() {
  const router = useRouter();
  const { expenses, deleteExpense } = useAppData();
  const [active, setActive] = useState<ExpenseCategory | 'All'>(allLabel);

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  const visible =
    active === allLabel ? expenses : expenses.filter((e) => e.category === active);
  const activeTotal = visible.reduce((sum, e) => sum + e.amount, 0);

  const summary: SummaryItem[] = [
    { label: active === allLabel ? 'This month' : active, value: formatCurrency(activeTotal), color: colors.expense },
    {
      label: 'Top category',
      value: topCategory ? topCategory[0] : '—',
    },
    { label: 'Entries', value: String(visible.length) },
  ];

  const confirmDelete = (id: string, description: string) => {
    Alert.alert('Delete expense', `Remove "${description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) },
    ]);
  };

  return (
    <Screen>
      <SummaryStrip items={summary} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {[allLabel, ...Object.keys(byCategory).sort((a, b) => (byCategory[b] ?? 0) - (byCategory[a] ?? 0))].map(
          (category) => {
            const selected = active === category;
            return (
              <Pressable
                key={category}
                onPress={() => setActive(category as ExpenseCategory | 'All')}
                style={({ pressed }) => [
                  styles.chip,
                  selected ? styles.chipActive : undefined,
                  pressed && !selected ? styles.chipPressed : undefined,
                ]}
              >
                <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>{category}</Text>
                <Text style={[styles.chipValue, selected && styles.chipValueActive]}>
                  {category === allLabel ? '' : formatCurrency(byCategory[category] ?? 0)}
                </Text>
              </Pressable>
            );
          },
        )}
      </ScrollView>

      <SectionHeader
        title={active === allLabel ? 'Recent expenses' : `${active} expenses`}
        actionLabel="Add"
        onAction={() => router.push('/expense/new')}
      />
      <Card padding={0} style={styles.listCard}>
        {visible.length === 0 ? (
          <Text style={styles.empty}>No entries for this category.</Text>
        ) : (
          visible.map((expense, index) => (
            <View key={expense.id}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <ListItem
                icon={categoryIcon[expense.category]}
                iconColor={categoryColor[expense.category]}
                iconBg={colors.expenseSoft}
                title={expense.description}
                subtitle={`${expense.category} · ${expense.date} · ${expense.paidTo}`}
                right={formatCurrency(expense.amount)}
                rightColor={colors.expense}
                onPress={() => router.push({ pathname: '/expense/[id]', params: { id: expense.id } })}
                onDelete={() => confirmDelete(expense.id, expense.description)}
              />
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingRight: spacing.lg,
  },
  chip: {
    backgroundColor: colors.expenseSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 1,
    borderWidth: 1,
    borderColor: colors.expenseSoft,
  },
  chipActive: {
    backgroundColor: colors.expense,
    borderColor: colors.expense,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  chipLabelActive: {
    color: colors.white,
  },
  chipValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.expense,
  },
  chipValueActive: {
    color: colors.white,
  },
  listCard: {
    paddingHorizontal: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  empty: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    paddingVertical: spacing.lg,
  },
});