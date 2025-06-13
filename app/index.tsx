import React from 'react';
import { ActivityIndicator, View } from 'react-native';

// The initial route simply shows a small loading spinner while
// RootLayoutNav (in _layout.tsx) decides where the user should go.
// This prevents forcing the user back to the onboarding flow on every launch.

export default function AppEntry() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
