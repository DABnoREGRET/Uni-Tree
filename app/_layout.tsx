import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useLocalSearchParams, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from 'react';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TabBarVisibilityProvider } from "./contexts/TabBarVisibilityContext";
import { UserDataProvider } from './contexts/UserDataContext';
import { unregisterBackgroundWifiMonitor } from './services/backgroundWifiMonitor';

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

const InitialLayout = () => {
  const { isLoading: authIsLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const params = useLocalSearchParams();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [fontsLoaded, fontError] = useFonts(customFontsToLoad);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('hasCompletedOnboarding');
        setHasCompletedOnboarding(value === 'true');
      } catch (e) {
        console.error("Failed to load onboarding status", e);
        setHasCompletedOnboarding(false); // Default to showing onboarding on error
      } finally {
        setIsCheckingOnboarding(false);
      }
    };
    checkOnboardingStatus();

  }, []);

  useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
    }

    if (authIsLoading || isCheckingOnboarding || (!fontsLoaded && !fontError)) {
      return; // Still loading auth, onboarding status, or fonts
    }

    SplashScreen.hideAsync(); // All checks complete, hide splash screen

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (hasCompletedOnboarding === false) {
      if (segments[0] !== 'onboarding') {
        router.replace('/onboarding');
      }
    } else if (!isAuthenticated) {
      if (!inAuthGroup && segments[0] !== 'onboarding') {
        router.replace('/(auth)/login');
      }
    } else { // isAuthenticated is true and onboarding is complete
      if (!inAppGroup) {
        router.replace('/(app)/home');
      }
    }
  }, [authIsLoading, isAuthenticated, router, hasCompletedOnboarding, isCheckingOnboarding, fontsLoaded, fontError, segments]);

  // Unregister background task on logout or app unmount if necessary
  useEffect(() => {
    if (!isAuthenticated && !authIsLoading) {
      // User logged out
      unregisterBackgroundWifiMonitor();
    }
  }, [isAuthenticated, authIsLoading]);

  // InitialLayout's job is to handle side effects (routing, splash screen)
  // It doesn't render UI itself into the component tree directly here.
  return null;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <UserDataProvider>
        <AppProvider>
          <TabBarVisibilityProvider>
            {/* InitialLayout is rendered here to run its useEffect hooks for redirection logic */}
            <InitialLayout />
            {/* The Stack navigator defines the actual screens that can be navigated to */}
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(app)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="index" />
            </Stack>
          </TabBarVisibilityProvider>
        </AppProvider>
      </UserDataProvider>
    </AuthProvider>
  );
}
