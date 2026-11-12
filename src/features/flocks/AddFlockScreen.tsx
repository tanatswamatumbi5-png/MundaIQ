import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { useAppData } from '@/store/AppDataContext';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';
import { FlockStage } from '@/types';

const stages: FlockStage[] = ['growing', 'laying', 'molting', 'culled'];

const stageLabel: Record<FlockStage, string> = {
  growing: 'Growing',
  laying: 'Laying',
  molting: 'Molting',
  culled: 'Culled',
};

export function AddFlockScreen() {
  const router = useRouter();
  const { addFlock } = useAppData();

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [stage, setStage] = useState<FlockStage>('laying');
  const [hens, setHens] = useState('');
  const [ageWeeks, setAgeWeeks] = useState('');
  const [housing, setHousing] = useState('');
  const [notes, setNotes] = useState('');

  const hensNum = Number(hens);
  const ageNum = Number(ageWeeks);
  const canSubmit = name.trim().length > 0 && breed.trim().length > 0 && hensNum > 0;

  const submit = () => {
    if (!canSubmit) return;
    addFlock({
      id: '',
      name: name.trim(),
      breed: breed.trim(),
      stage,
      hens: hensNum,
      ageWeeks: ageNum || 0,
      housing: housing.trim() || '—',
      notes: notes.trim() || undefined,
    });
    router.back();
  };

  return (
    <Screen>
      <Text style={styles.sectionTitle}>Stage</Text>
      <View style={styles.chipWrap}>
        {stages.map((s) => {
          const selected = stage === s;
          return (
            <Pressable
              key={s}
              onPress={() => setStage(s)}
              style={({ pressed }) => [
                styles.chip,
                selected ? styles.chipActive : null,
                pressed ? styles.chipPressed : null,
              ]}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextActive : null]}>
                {stageLabel[s]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.fields}>
        <FormField label="Flock name" value={name} onChangeText={setName} placeholder="e.g. Layers Batch 08" />
        <FormField label="Breed" value={breed} onChangeText={setBreed} placeholder="e.g. Hy-Line Brown" />
        <View style={styles.twoCol}>
          <View style={styles.half}>
            <FormField label="Hens" value={hens} onChangeText={setHens} keyboardType="number-pad" placeholder="0" />
          </View>
          <View style={styles.half}>
            <FormField label="Age (weeks)" value={ageWeeks} onChangeText={setAgeWeeks} keyboardType="number-pad" placeholder="0" />
          </View>
        </View>
        <FormField label="Housing" value={housing} onChangeText={setHousing} placeholder="e.g. House D" />
        <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="e.g. Ramping up to peak" />
      </View>

      <Button label="Save flock" onPress={submit} disabled={!canSubmit} />
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
    backgroundColor: colors.flockSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.flockSoft,
  },
  chipActive: {
    backgroundColor: colors.flock,
    borderColor: colors.flock,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.flock,
  },
  chipTextActive: {
    color: colors.white,
  },
  fields: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  twoCol: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
});