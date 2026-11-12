import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { useAppData } from '@/store/AppDataContext';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';
import { ExpenseCategory } from '@/types';
import { todayISO } from '@/utils/date';

const categories = [
  'Feed',
  'Veterinary',
  'Labour',
  'Equipment',
  'Transport',
  'Utilities',
  'Other',
] as const;

export function AddExpenseScreen() {
  const router = useRouter();
  const { addExpense } = useAppData();

  const [category, setCategory] = useState<ExpenseCategory>('Feed');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [date, setDate] = useState(todayISO());

  const amountNum = Number(amount);
  const canSubmit = description.trim().length > 0 && amountNum > 0 && date.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    addExpense({
      id: '',
      category,
      description: description.trim(),
      amount: Math.round(amountNum),
      paidTo: paidTo.trim() || '—',
      date: date.trim(),
    });
    router.back();
  };

  return (
    <Screen>
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
        <FormField label="Description" value={description} onChangeText={setDescription} placeholder="e.g. Layers mash – 4 bags" />
        <FormField label="Amount (USD)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
        <FormField label="Paid to" value={paidTo} onChangeText={setPaidTo} placeholder="e.g. Agrovet Supplies" />
        <FormField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-10-01" />
      </View>

      <Button label="Save expense" onPress={submit} disabled={!canSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
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
})