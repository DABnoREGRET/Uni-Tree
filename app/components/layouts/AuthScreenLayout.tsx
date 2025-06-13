import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  showBackButton?: boolean; // To show the back button
  onBackPress?: () => void; // Action for the back button
  isSignup?: boolean;
  topContentSize?: 'large' | 'small';
}

const AuthScreenLayout: React.FC<AuthScreenLayoutProps> = ({
  topTitle,
  topSubtitle,
  formTitle,
  children,
  backgroundColor = '#FFCED3', // Default to the pinkish color
  formBackgroundColor = Colors.authFormBackground, // Default to the new green
  showMascot = true,
  mascotImageSource, // Use the new prop
  showBackButton = false,
  onBackPress,
  isSignup = false,
  topContentSize = 'large',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.screenContainer, { backgroundColor }]}
    >
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topContentContainer, {paddingTop: insets.top + 20}]}>
          {/* Top Section */}
          <View style={[styles.headerSection, topContentSize === 'small' && styles.headerSectionSmall]}>
            <View style={styles.headerTextContainer}>
              <Image 
                source={require('../../../assets/images/appname.png')} 
                style={styles.appLogoImage}
                resizeMode="contain"
              />
              {topTitle && <Text style={styles.helloTitle}>{topTitle}</Text>}
              {topSubtitle && <Text style={styles.loginSubtitle}>{topSubtitle}</Text>}
            </View>
          </View>
        </View>

        {/* Spacer View */}
        {!isSignup && <View style={{ flex: 1 }} />}

        {/* Form Section */}
        <View style={[styles.formContainer, { backgroundColor: formBackgroundColor, paddingBottom: insets.bottom + 20, paddingTop: showBackButton ? 25 : 40 }]}>
          {showMascot && (
            <View style={styles.mascotContainer}>
              <Image 
                source={mascotImageSource || require('../../../assets/images/greet_mascot.png')}
                style={styles.mascotImage}
                resizeMode="contain"
              />
            </View>
          )}
          {showBackButton && onBackPress && (
            <TouchableOpacity onPress={onBackPress} style={styles.backButtonContainer}>
              <FontAwesome name="arrow-left" size={18} color={Colors.white} />
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          )}
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
    justifyContent: 'flex-end',
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
  headerSectionSmall: {
    minHeight: 100,
  },
  headerTextContainer: {
    flex: 1, // Allows text to take available space
    paddingTop: 20, // Adjust as needed
    alignItems: 'center',
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
    width: '100%',
  },
  loginSubtitle: {
    fontSize: FontSizes.md, 
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.white,
    textAlign: 'left',
    marginBottom: 10,
    flexWrap: 'wrap',
    width: '100%',
  },
  mascotContainer: {
    position: 'absolute',
    top: -100,
    right: 4,
    width: 180, 
    height: 180, 
    zIndex: 10,
  },
  mascotImage: {
    width: '100%', 
    height: '100%', 
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
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    marginLeft: 6,
  },
  mainFormTitle: {
    fontSize: FontSizes.xxxl,
    fontFamily: Fonts.Grandstander.Bold,
    color: Colors.white,
    marginBottom: 15,
    textAlign: 'left',
    alignSelf: 'flex-start',
    width: '100%',
  },
});

export default AuthScreenLayout; 