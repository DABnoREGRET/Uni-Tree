import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { ScreenWrapper } from '../../components/layouts';
import { UniversalHeader } from '../../components/navigation';
import { Colors, Fonts, FontSizes, LineHeights } from '../../constants';
// It's good practice to get version from a central place, e.g., package.json or a config file
// For now, we'll hardcode it as in settings, but ideally, this would be dynamic.
const APP_VERSION = '1.0.0'; 

export default function AboutScreen() {
  return (
    <ScreenWrapper 
      applyTopInset={false} 
      style={{ backgroundColor: Colors.white }} 
      contentContainerStyle={styles.container} 
      withScrollView={false}
    >
      <StatusBar style="light" />
      <UniversalHeader title="About UniTree" showBackButton={true} />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/images/appname.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.heading}>Collaboration</Text>
        <Text style={styles.paragraph}>
          This app is a collaboration between the <Text style={styles.boldText}>Greenwich IT Club</Text> and the <Text style={styles.boldText}>Greenity Club</Text>, both student clubs at Greenwich Vietnam, Hanoi Campus.
        </Text>

        <Text style={styles.heading}>Our Mission</Text>
        <Text style={styles.paragraph}>
          UniTree aims to foster environmental awareness and community engagement by gamifying eco-friendly actions on campus. We believe small positive habits can lead to a big impact!
        </Text>
        
        <Text style={styles.heading}>Version</Text>
        <Text style={styles.paragraph}>{APP_VERSION}</Text>

        <Text style={styles.footerText}>
          © {new Date().getFullYear()} UniTree Team
        </Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20, // Add some padding at the bottom
  },
  content: {
    paddingHorizontal: 25,
    paddingTop: 20,
    alignItems: 'center', // Center content like logo
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 200, 
    height: 80, 
  },
  heading: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Poppins.Bold,
    color: Colors.text,
    marginTop: 25,
    marginBottom: 10,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLight,
    lineHeight: LineHeights.base,
    marginBottom: 15,
    textAlign: 'center',
  },
  boldText: {
    fontFamily: Fonts.Poppins.SemiBold,
    color: Colors.primaryDark,
  },
  footerText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.grayDark,
    textAlign: 'center',
    marginTop: 40,
  }
}); 