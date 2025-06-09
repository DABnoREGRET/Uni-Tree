import React from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // For notch handling
import { Colors, Fonts, FontSizes } from '../../constants';

interface AuthScreenLayoutProps {
  topTitle?: string; // Optional now
  topSubtitle?: string; // Optional now
  formTitle: string;
  children: React.ReactNode;
  backgroundColor?: string; // Main screen background (pinkish)
  formBackgroundColor?: string; // Form area background (greenish)
  showMascot?: boolean; // To control mascot visibility if needed on some screens
  mascotImageSource?: any; // New prop for mascot image source
}

const AuthScreenLayout: React.FC<AuthScreenLayoutProps> = ({
  topTitle,
  topSubtitle,
  formTitle,
  children,
  backgroundColor = Colors.secondary, // Default to the pinkish color
  formBackgroundColor = Colors.authFormBackground, // Default to the new green
  showMascot = true,
  mascotImageSource, // Use the new prop
}) => {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screenContainer, { backgroundColor }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} 
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topContentContainer, {paddingTop: insets.top + 20}]}>
          {/* Top Section */}
          <View style={styles.headerSection}>
            <View style={styles.headerTextContainer}>
              <Image 
                source={require('../../../assets/images/appname.png')} 
                style={styles.appLogoImage}
                resizeMode="contain"
              />
              {topTitle && <Text style={styles.helloTitle}>{topTitle}</Text>}
              {topSubtitle && <Text style={styles.loginSubtitle}>{topSubtitle}</Text>}
            </View>
            {showMascot && (
              <View style={styles.mascotContainer}>
                <Image 
                  source={mascotImageSource || require('../../../assets/images/greet_mascot.png')}
                  style={styles.mascotImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        </View>

        {/* Spacer View */}
        <View style={{flex: 1}} />

        {/* Form Section */}
        <View style={[styles.formContainer, { backgroundColor: formBackgroundColor, paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.mainFormTitle}>{formTitle}</Text>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topContentContainer: {
    width: '100%',
    paddingHorizontal: 25,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    minHeight: 220, // Ensures enough space on smaller screens
  },
  headerTextContainer: {
    flex: 1, // Allows text to take available space
    paddingTop: 20, // Adjust as needed
  },
  appLogoImage: {
    width: 150, 
    height: 60, 
    marginBottom: 20, 
  },
  helloTitle: {
    fontSize: FontSizes.xxxl + 2, 
    fontFamily: Fonts.Grandstander.Bold,
    color: Colors.white,
    textAlign: 'left',
    marginBottom: 3,
  },
  loginSubtitle: {
    fontSize: FontSizes.md, 
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.white,
    textAlign: 'left',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  mascotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10, // Adjust to position it vertically relative to the text
  },
  mascotImage: {
    width: 160, 
    height: 160, 
  },
  formContainer: {
    width: '100%',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 25, 
    paddingTop: 40,
    alignItems: 'center',
    // No flexGrow or position relative needed anymore
  },
  mainFormTitle: {
    fontSize: FontSizes.xxxl,
    fontFamily: Fonts.Grandstander.Bold,
    color: Colors.white,
    marginBottom: 25,
    textAlign: 'left',
    alignSelf: 'flex-start',
    width: '100%',
  },
});

export default AuthScreenLayout; 