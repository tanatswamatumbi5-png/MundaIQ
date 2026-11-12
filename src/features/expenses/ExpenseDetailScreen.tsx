import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
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

const categories = Object.keys(categoryIcon) as ExpenseCategory[];

export function ExpenseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { expenses, updateExpense, deleteExpense } = useAppData();

  const existing = expenses.find((e) => e.id === id);

  const [category, setCategory] = useState<ExpenseCategory>(existing?.category ?? 'Feed');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [paidTo, setPaidTo] = useState(existing?.paidTo ?? '');
  const [date, setDate] = useState(existing?.date ?? '2026-10-01');

  if (!existing) {
    return (
      <Screen>
        <Text style={styles.missing}>Expense not found.</Text>
      </Screen>
    );
  }

  const amountNum = Number(amount);
  const canSave = description.trim().length > 0 && amountNum > 0 && date.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    updateExpense({
      id: existing.id,
      category,
      description: description.trim(),
      amount: Math.round(amountNum),
      paidTo: paidTo.trim() || '—',
      date: date.trim(),
    });
    router.back();
  };

  const remove = () => {
    Alert.alert('Delete expense', `Remove "${existing.description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteExpense(existing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <CardSummary
        icon={categoryIcon[existing.category]}
        amount={formatCurrency(existing.amount)}
        category={existing.category}
      />

      <Text style={styles.sectionTitle}>Category</Text>
      <View style={styles.chipWrap}>
        {categories.map((c) => {
          const selected = category === c;
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={({ pressed }) => [
                styles.chip,
                selected ? styles.chipActive : null,
                pressed ? styles.chipPressed : null,
              ]}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextActive : null]}>{c}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.fields}>
        <FormField
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Layers mash – 4 bags"
        />
        <FormField
          label="Amount (USD)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <FormField
          label="Paid to"
          value={paidTo}
          onChangeText={setPaidTo}
          placeholder="e.g. Agrovet Supplies"
        />
        <FormField
          label="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          placeholder="2026-10-01"
        />
      </View>

      <Button label="Save changes" onPress={save} disabled={!canSave} />

      <Pressable onPress={remove} style={({ pressed }) => [styles.deleteBtn, pressed && styles.deletePressed]}>
        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
        <Text style={styles.deleteText}>Delete this expense</Text>
      </Pressable>
    </Screen>
  );
}

function CardSummary({
  icon,
  amount,
  category,
}: {
  icon: IconName;
  amount: string;
  category: string;
}) {
  return (
    <View style={styles.summary}>
      <View style={[styles.summaryIcon, { backgroundColor: colors.expenseSoft }]}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.expense} />
      </View>
      <View style={styles.summaryText}>
        <Text style={styles.summaryAmount}>{amount}</Text>
        <Text style={styles.summaryCategory}>{category} expense</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  missing: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    padding: spacing.lg,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
    gap: 1,
  },
  summaryAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  summaryCategory: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.expenseSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
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
  chipText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.expense,
  },
  chipTextActive: {
    color: colors.white,
  },
  fields: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  deletePressed: {
    opacity: 0.6,
  },
  deleteText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.danger,
  },
});