import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { useAppData } from '@/store/AppDataContext';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';
import { houseCages } from '@/utils/cage';
import { todayISO } from '@/utils/date';

export function AddRecordScreen() {
  const router = useRouter();
  const { flockId } = useLocalSearchParams<{ flockId?: string }>();
  const { flocks, addRecord } = useAppData();

  const [selectedFlock, setSelectedFlock] = useState(flockId ?? '');
  const [date, setDate] = useState(todayISO());
  const [intact, setIntact] = useState('');
  const [broken, setBroken] = useState('');
  const [dirty, setDirty] = useState('');
  const [mortality, setMortality] = useState('');
  const [hensAtCollection, setHensAtCollection] = useState('');
  const [feedKg, setFeedKg] = useState('');
  const [feedCost, setFeedCost] = useState('');

  const flock = flocks.find((f) => f.id === selectedFlock);
  const intactNum = Number(intact) || 0;
  const brokenNum = Number(broken) || 0;
  const dirtyNum = Number(dirty) || 0;
  const mortalityNum = Number(mortality) || 0;
  const totalEggs = intactNum + brokenNum + dirtyNum;

  const canSubmit =
    selectedFlock.length > 0 &&
    date.trim().length > 0 &&
    totalEggs > 0;

  const submit = () => {
    if (!canSubmit || !flock) return;
    addRecord({
      id: '',
      flockId: flock.id,
      // A flock total is not attributed to one cage; the row it belongs to is
      // derived from the flock's housing when results are aggregated.
      cageId: '',
      date: date.trim(),
      intact: intactNum,
      broken: brokenNum,
      dirty: dirtyNum,
      mortality: mortalityNum,
      hensAtCollection: hensAtCollection ? Number(hensAtCollection) : flock.hens,
      feedKg: feedKg ? Number(feedKg) : 0,
      feedCost: feedCost ? Number(feedCost) : 0,
    });
    router.back();
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Flock</Text>
      <View style={styles.chipWrap}>
        {flocks.map((f) => {
          const selected = selectedFlock === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setSelectedFlock(f.id)}
              style={({ pressed }) => [
                styles.chip,
                selected ? styles.chipActive : null,
                pressed ? styles.chipPressed : null,
              ]}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextActive : null]} numberOfLines={1}>
                {f.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.fields}>
        <FormField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-10-01" />
        <View style={styles.threeCol}>
          <View style={styles.third}>
            <FormField label="Whole" value={intact} onChangeText={setIntact} keyboardType="number-pad" placeholder="0" />
          </View>
          <View style={styles.third}>
            <FormField label="Broken" value={broken} onChangeText={setBroken} keyboardType="number-pad" placeholder="0" />
          </View>
          <View style={styles.third}>
            <FormField label="Dirty" value={dirty} onChangeText={setDirty} keyboardType="number-pad" placeholder="0" />
          </View>
        </View>
        <View style={styles.feedCard}>
          <Text style={styles.feedHint}>Total for this entry: {totalEggs} eggs · {flock ? `${flock.hens} hens on record` : '—'}</Text>
          <View style={styles.twoCol}>
            <View style={styles.half}>
              <FormField label="Mortality" value={mortality} onChangeText={setMortality} keyboardType="number-pad" placeholder="0" />
            </View>
            <View style={styles.half}>
              <FormField label="Hens at count" value={hensAtCollection} onChangeText={setHensAtCollection} keyboardType="number-pad" placeholder={`${flock?.hens ?? 0}`} />
            </View>
          </View>
          <View style={styles.twoCol}>
            <View style={styles.half}>
              <FormField label="Feed (kg)" value={feedKg} onChangeText={setFeedKg} keyboardType="decimal-pad" placeholder="0" />
            </View>
            <View style={styles.half}>
              <FormField label="Feed cost (USD)" value={feedCost} onChangeText={setFeedCost} keyboardType="decimal-pad" placeholder="0.00" />
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.rowHint}>
        {flock
          ? `Counted into ${flock.housing} · ${houseCages(flock.housing).length} cages · ${houseCages(flock.housing).reduce((sum, c) => sum + c.birds, 0)} birds`
          : 'Pick a flock to see which row it counts towards'}
      </Text>

      <Button label="Save record" onPress={submit} disabled={!canSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
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
    backgroundColor: colors.eggSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.eggSoft,
    maxWidth: '100%',
  },
  chipActive: {
    backgroundColor: colors.egg,
    borderColor: colors.egg,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.egg,
  },
  chipTextActive: {
    color: colors.white,
  },
  fields: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  threeCol: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  third: {
    flex: 1,
  },
  twoCol: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
  feedCard: {
    backgroundColor: colors.eggSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.lg,
  },
  feedHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  rowHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});