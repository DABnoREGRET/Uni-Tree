import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TabBarVisibilityProvider } from "./contexts/TabBarVisibilityContext";
import { UserDataProvider } from './contexts/UserDataContext';
import { STORAGE_KEYS } from './utils/asyncStorage';

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
    if (authIsLoading || (!fontsLoaded && !fontError) || onboardingCompleted === null) {
      return; // Wait for auth, fonts, and onboarding check to load
    }
    
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated) {
      // If user is not authenticated, check onboarding status
      if (!onboardingCompleted && !inOnboarding && !inAuthGroup) {
        router.replace('/onboarding');
      } else if (onboardingCompleted && !inAuthGroup && !inOnboarding) {
        router.replace('/(auth)/login');
      }
    } else { // isAuthenticated is true
      // If user is authenticated, redirect to the app group.
      if (inAuthGroup || inOnboarding) {
        router.replace('/(app)/home');
      }
    }
  }, [authIsLoading, isAuthenticated, fontsLoaded, fontError, segments, router, onboardingCompleted]);
  
  useEffect(() => {
    if (!authIsLoading && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
      // Permission requests are now handled in the dedicated onboarding screen to prevent
      // OS dialogs from popping up before the user reaches the permissions step.
    }
  }, [authIsLoading, fontsLoaded, fontError]);


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
