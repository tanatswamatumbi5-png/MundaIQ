import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { PIN_PATTERN, useAppLock } from '@/store/AppLockContext';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';

type Panel = 'none' | 'setup' | 'change' | 'disable';

const pinProps = {
  keyboardType: 'number-pad',
  secureTextEntry: true,
  maxLength: 6,
  placeholder: '4 to 6 digits',
} as const;

export function SecurityScreen() {
  const {
    enabled,
    biometricsAvailable,
    biometricsEnabled,
    error: lockError,
    enableLock,
    disableLock,
    changePin,
    setBiometricsEnabled,
    lockNow,
  } = useAppLock();

  const [panel, setPanel] = useState<Panel>('none');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [nextPin, setNextPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = (nextPanel: Panel = 'none') => {
    setPanel(nextPanel);
    setPin('');
    setConfirmPin('');
    setCurrentPin('');
    setNextPin('');
    setFormError(null);
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setFormError(null);
    setMessage(null);
    try {
      await action();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const submitSetup = () =>
    run(async () => {
      if (!PIN_PATTERN.test(pin)) {
        setFormError('Choose a PIN of 4 to 6 digits.');
        return;
      }
      if (pin !== confirmPin) {
        setFormError('The two PINs do not match.');
        return;
      }
      await enableLock(pin);
      resetForm('none');
      setMessage('App lock is on. You will need your PIN next time MundaIQ starts.');
    });

  const submitChange = () =>
    run(async () => {
      if (!PIN_PATTERN.test(nextPin)) {
        setFormError('The new PIN must be 4 to 6 digits.');
        return;
      }
      if (nextPin !== confirmPin) {
        setFormError('The two new PINs do not match.');
        return;
      }
      const ok = await changePin(currentPin, nextPin);
      if (!ok) {
        setFormError('The current PIN is incorrect.');
        return;
      }
      resetForm('none');
      setMessage('PIN updated.');
    });

  const submitDisable = () =>
    run(async () => {
      const ok = await disableLock(currentPin);
      if (!ok) {
        setFormError('The PIN is incorrect.');
        return;
      }
      resetForm('none');
      setMessage('App lock is off.');
    });

  const shownError = formError ?? lockError;

  return (
    <Screen>
      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={[styles.iconTile, enabled ? styles.iconOn : styles.iconOff]}>
            <MaterialCommunityIcons
              name={enabled ? 'shield-check-outline' : 'shield-off-outline'}
              size={26}
              color={enabled ? colors.primary : colors.textMuted}
            />
          </View>
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>{enabled ? 'App lock is on' : 'App lock is off'}</Text>
            <Text style={styles.statusSubtitle}>
              {enabled
                ? 'MundaIQ asks for your PIN when it starts and after 15 seconds in the background.'
                : 'Anyone holding this phone can open your farm records.'}
            </Text>
          </View>
        </View>
      </Card>

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {shownError ? <Text style={styles.error}>{shownError}</Text> : null}

      {!enabled ? (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Set a PIN</Text>
          <Text style={styles.cardBody}>
            Your PIN is stored as a salted, slow hash in the device keystore. It is never sent
            anywhere. Turning on app lock also blocks screenshots and hides the app in the recent
            apps switcher.
          </Text>

          {panel === 'setup' ? (
            <View style={styles.form}>
              <FormField
                label="New PIN"
                value={pin}
                onChangeText={(value) => setPin(value.replace(/\D/g, '').slice(0, 6))}
                {...pinProps}
              />
              <FormField
                label="Confirm PIN"
                value={confirmPin}
                onChangeText={(value) => setConfirmPin(value.replace(/\D/g, '').slice(0, 6))}
                {...pinProps}
              />
              <Button
                label={busy ? 'Turning on…' : 'Turn on app lock'}
                onPress={submitSetup}
                disabled={busy || pin.length < 4 || confirmPin.length < 4}
              />
              <Pressable onPress={() => resetForm('none')} style={styles.linkButton}>
                <Text style={styles.linkText}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <Button label="Turn on app lock" onPress={() => resetForm('setup')} />
          )}
        </Card>
      ) : (
        <>
          <Card style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.statusText}>
                <Text style={styles.cardTitle}>Biometric unlock</Text>
                <Text style={styles.cardBody}>
                  {biometricsAvailable
                    ? 'Use your fingerprint or face instead of typing the PIN.'
                    : 'This phone has no enrolled fingerprint or face unlock.'}
                </Text>
              </View>
              <Switch
                value={biometricsEnabled && biometricsAvailable}
                onValueChange={(value) => run(() => setBiometricsEnabled(value))}
                disabled={!biometricsAvailable || busy}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={colors.white}
              />
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>PIN</Text>
            <Text style={styles.cardBody}>Change the PIN used to unlock MundaIQ.</Text>

            {panel === 'change' ? (
              <View style={styles.form}>
                <FormField
                  label="Current PIN"
                  value={currentPin}
                  onChangeText={(value) => setCurrentPin(value.replace(/\D/g, '').slice(0, 6))}
                  {...pinProps}
                />
                <FormField
                  label="New PIN"
                  value={nextPin}
                  onChangeText={(value) => setNextPin(value.replace(/\D/g, '').slice(0, 6))}
                  {...pinProps}
                />
                <FormField
                  label="Confirm new PIN"
                  value={confirmPin}
                  onChangeText={(value) => setConfirmPin(value.replace(/\D/g, '').slice(0, 6))}
                  {...pinProps}
                />
                <Button
                  label={busy ? 'Saving…' : 'Update PIN'}
                  onPress={submitChange}
                  disabled={busy || currentPin.length < 4 || nextPin.length < 4}
                />
                <Pressable onPress={() => resetForm('none')} style={styles.linkButton}>
                  <Text style={styles.linkText}>Cancel</Text>
                </Pressable>
              </View>
            ) : (
              <Button label="Change PIN" onPress={() => resetForm('change')} />
            )}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Lock now</Text>
            <Text style={styles.cardBody}>Lock the app without closing it.</Text>
            <Button label="Lock now" onPress={lockNow} />
          </Card>

          <Card style={styles.dangerCard}>
            <Text style={[styles.cardTitle, styles.dangerTitle]}>Turn off app lock</Text>
            <Text style={styles.cardBody}>
              The data stays encrypted, but anyone with this phone can open the app.
            </Text>

            {panel === 'disable' ? (
              <View style={styles.form}>
                <FormField
                  label="Current PIN"
                  value={currentPin}
                  onChangeText={(value) => setCurrentPin(value.replace(/\D/g, '').slice(0, 6))}
                  {...pinProps}
                />
                <Pressable
                  onPress={submitDisable}
                  disabled={busy || currentPin.length < 4}
                  style={({ pressed }) => [
                    styles.dangerButton,
                    (busy || currentPin.length < 4) && styles.dangerButtonDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.dangerButtonText}>
                    {busy ? 'Turning off…' : 'Turn off app lock'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => resetForm('none')} style={styles.linkButton}>
                  <Text style={styles.linkText}>Cancel</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => resetForm('disable')}
                style={({ pressed }) => [styles.outlineDanger, pressed && styles.pressed]}
              >
                <Text style={styles.outlineDangerText}>Turn off app lock</Text>
              </Pressable>
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    marginTop: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOn: {
    backgroundColor: colors.primarySoft,
  },
  iconOff: {
    backgroundColor: colors.border,
  },
  statusText: {
    flex: 1,
    gap: spacing.xs,
  },
  statusTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  statusSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  success: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: fontWeight.medium,
  },
  error: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    color: colors.danger,
    fontWeight: fontWeight.medium,
  },
  card: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  cardBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  linkText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  dangerCard: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.expenseSoft,
  },
  dangerTitle: {
    color: colors.danger,
  },
  dangerButton: {
    backgroundColor: colors.danger,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dangerButtonDisabled: {
    opacity: 0.5,
  },
  dangerButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  outlineDanger: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  outlineDangerText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
  },
  pressed: {
    opacity: 0.8,
  },
});
