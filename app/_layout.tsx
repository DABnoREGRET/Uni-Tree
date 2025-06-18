import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import * as Updates from 'expo-updates';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TabBarVisibilityProvider } from "./contexts/TabBarVisibilityContext";
import { UserDataProvider } from './contexts/UserDataContext';
import { registerBackgroundWifiMonitor } from './services/backgroundWifiMonitor';
import { STORAGE_KEYS } from './utils/asyncStorage';
import { ensureDailyReminder } from './utils/notifications';

// Font assets to load
const customFontsToLoad = {
  'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
  'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
  'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
  'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  'Grandstander-Regular': require('../assets/fonts/Grandstander-Regular.ttf'),
  'Grandstander-Medium': require('../assets/fonts/Grandstander-Medium.ttf'),
  'Grandstander-SemiBold': require('../assets/fonts/Grandstander-SemiBold.ttf'),
  'Grandstander-Bold': require('../assets/fonts/Grandstander-Bold.ttf'),
  // Add other Grandstander weights if you have them, e.g.:
  // 'Grandstander-Black': require('../assets/fonts/Grandstander-Black.ttf'),
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, isLoading: authIsLoading } = useAuth();
  const isAuthenticated = !!session;
  const router = useRouter();
  const segments = useSegments();
  const [onboardingCompleted, setOnboardingCompleted] = React.useState<boolean | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Grandstander-Regular': require('../assets/fonts/Grandstander-Regular.ttf'),
    'Grandstander-SemiBold': require('../assets/fonts/Grandstander-SemiBold.ttf'),
    'Grandstander-Bold': require('../assets/fonts/Grandstander-Bold.ttf'),
  });

  // Fallback flag: if fonts fail or take too long, proceed anyway after delay
  const [fontsReady, setFontsReady] = React.useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
        setOnboardingCompleted(value === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // If there's an error reading the value, treat onboarding as NOT completed so the user will still see the onboarding flow.
        setOnboardingCompleted(false);
      }
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setFontsReady(true);
    }
  }, [fontsLoaded, fontError]);

  // Timeout to prevent indefinite wait
  useEffect(() => {
    const timeout = setTimeout(() => setFontsReady(true), 6000);
    return () => clearTimeout(timeout);
  }, []);

  // Check for OTA updates on app launch (only in production builds)
  useEffect(() => {
    const checkForOTAUpdate = async () => {
      if (__DEV__) return; // Skip updates in development

      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          // Download the update in the background
          await Updates.fetchUpdateAsync();
          // Reload with the new update applied
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.warn('Error checking for OTA update:', error);
      }
    };

    checkForOTAUpdate();
  }, []);

  useEffect(() => {
    if (authIsLoading || !fontsReady || onboardingCompleted === null) {
      return; // Wait for auth, fonts, and onboarding check to load
    }
    
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated) {
      // User not logged in
      if (!onboardingCompleted && !inOnboarding && !inAuthGroup) {
        router.replace('/onboarding');
      } else if (onboardingCompleted && !inAuthGroup && !inOnboarding) {
        router.replace('/(auth)/login');
      }
    } else {
      // User logged in
      const inAppGroup = segments[0] === '(app)';
      if (!inAppGroup) {
        // Always land on Home when authenticated and outside app group
        router.replace('/(app)/home');
      }
    }
  }, [authIsLoading, isAuthenticated, fontsReady, segments, router, onboardingCompleted]);
  
  useEffect(() => {
    if (!authIsLoading && fontsReady) {
      SplashScreen.hideAsync();
      // Ensure background monitor is registered after app is ready
      registerBackgroundWifiMonitor().catch(() => {});
      ensureDailyReminder();
      // Permission requests are now handled in the dedicated onboarding screen to prevent
      // OS dialogs from popping up before the user reaches the permissions step.
    }
  }, [authIsLoading, fontsReady]);

  // Safety timeout: ensure splash screen hides even if fonts/auth promise hang.
  useEffect(() => {
    const timeout = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 8000); // 8-second fallback
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(app)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <UserDataProvider>
        <AppProvider>
          <TabBarVisibilityProvider>
            {/* InitialLayout is rendered here to run its useEffect hooks for redirection logic */}
            <RootLayoutNav />
          </TabBarVisibilityProvider>
        </AppProvider>
      </UserDataProvider>
    </AuthProvider>
  );
}
