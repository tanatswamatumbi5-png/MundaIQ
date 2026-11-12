import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { useAppLock } from '@/store/AppLockContext';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';

export function LockScreen() {
  const {
    biometricsAvailable,
    biometricsEnabled,
    error,
    unlockWithPin,
    unlockWithBiometrics,
  } = useAppLock();

  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);

  const canSubmit = pin.length >= 4 && !busy;

  const submitPin = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const ok = await unlockWithPin(pin);
      if (!ok) setPin('');
    } finally {
      setBusy(false);
    }
  };

  const submitBiometrics = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await unlockWithBiometrics();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll={false} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.iconTile}>
          <MaterialCommunityIcons name="shield-lock-outline" size={42} color={colors.primary} />
        </View>
        <Text style={styles.title}>MundaIQ is locked</Text>
        <Text style={styles.subtitle}>
          Enter your PIN to open your farm records. Nothing leaves this device.
        </Text>
      </View>

      <View style={styles.form}>
        <FormField
          label="PIN"
          value={pin}
          onChangeText={(value) => setPin(value.replace(/\D/g, '').slice(0, 6))}
          placeholder="4 to 6 digits"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submitPin}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label={busy ? 'Unlocking…' : 'Unlock'} onPress={submitPin} disabled={!canSubmit} />

        {biometricsAvailable && biometricsEnabled ? (
          <Pressable
            onPress={submitBiometrics}
            disabled={busy}
            style={({ pressed }) => [styles.biometric, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="fingerprint" size={26} color={colors.primary} />
            <Text style={styles.biometricLabel}>Use fingerprint or face</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.footer}>
        Forgetting your PIN means the only way back in is to clear the app data. Keep your export
        file somewhere safe.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    gap: spacing['2xl'],
    paddingVertical: spacing['3xl'],
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
  },
  iconTile: {
    width: 84,
    height: 84,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.danger,
    fontWeight: fontWeight.medium,
  },
  biometric: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  biometricLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  footer: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },
});
