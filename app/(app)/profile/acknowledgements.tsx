import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenWrapper } from '../../components/layouts';
import { UniversalHeader } from '../../components/navigation';
import { Colors, Fonts, FontSizes, LineHeights } from '../../constants';

export default function AcknowledgementsScreen() {
  return (
    <ScreenWrapper 
      applyTopInset={false} 
      style={{backgroundColor: Colors.white}} 
      contentContainerStyle={styles.container} 
      withScrollView={false}
    >
      <StatusBar style="light" />
      <UniversalHeader title="Acknowledgements" showBackButton={true} />
      
      <ScrollView style={styles.contentScrollView}>
        <View style={styles.content}>
          <Text style={styles.introText}>
            UniTree is built with the help of many amazing open-source projects, tools, and resources. We extend our heartfelt gratitude to the developers and communities behind them.
          </Text>

          <Text style={styles.heading}>Key Technologies & Libraries</Text>
          <Text style={styles.listItem}>- React Native & Expo: For cross-platform mobile development.</Text>
          <Text style={styles.listItem}>- Supabase: For backend services including database, authentication, and storage.</Text>
          <Text style={styles.listItem}>- TypeScript: For robust and maintainable code.</Text>
          <Text style={styles.listItem}>- Expo Router: For file-system based routing.</Text>
          {/* Add more specific libraries or tools used if known */}

          <Text style={styles.heading}>Design & Assets</Text>
          <Text style={styles.listItem}>- Icons: FontAwesome via @expo/vector-icons.</Text>
          <Text style={styles.listItem}>- Mascot & Illustrations: Greenity Club</Text>
          <Text style={styles.listItem}>- Fonts: Poppins & Grandstander from Google Fonts.</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  contentScrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 40, // Extra padding for scrollable content
  },
  introText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLight,
    lineHeight: LineHeights.base,
    marginBottom: 20,
    textAlign: 'center',
  },
  heading: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Poppins.Bold,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLight,
    lineHeight: LineHeights.base,
    marginBottom: 15,
  },
  listItem: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLight,
    lineHeight: LineHeights.base,
    marginBottom: 8,
    marginLeft: 10,
  },
}); 