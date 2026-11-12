import { PropsWithChildren, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { LockScreen } from '@/features/lock/LockScreen';
import { AppDataProvider } from '@/store/AppDataContext';
import { AppLockProvider, useAppLock } from '@/store/AppLockContext';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

function LockGate({ children }: PropsWithChildren) {
  const { ready, enabled, locked } = useAppLock();

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;
  if (enabled && locked) return <LockScreen />;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AppLockProvider>
      <StatusBar style="dark" />
      <LockGate>
        <AppDataProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
              headerTintColor: colors.textPrimary,
              headerTitleStyle: { fontWeight: '600', color: colors.textPrimary },
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="hatchery" options={{ title: 'Hatchery' }} />
            <Stack.Screen name="cages" options={{ title: 'Cage Map' }} />
            <Stack.Screen name="farm-assistant" options={{ title: 'Farm Assistant' }} />
            <Stack.Screen name="performance" options={{ title: 'Overall Performance' }} />
            <Stack.Screen name="flock/[id]" options={{ title: 'Flock Details' }} />
            <Stack.Screen name="flock/new" options={{ title: 'Add Flock' }} />
            <Stack.Screen name="expense/new" options={{ title: 'Add Expense' }} />
            <Stack.Screen name="expense/[id]" options={{ title: 'Expense Details' }} />
            <Stack.Screen name="record/new" options={{ title: 'Add Egg Record' }} />
            <Stack.Screen name="security" options={{ title: 'Security & Privacy' }} />
          </Stack>
        </AppDataProvider>
      </LockGate>
    </AppLockProvider>
  );
}
