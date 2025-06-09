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
          {/* App Logo/Name at the top */} 
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
              source={mascotImageSource || require('../../../assets/images/greet_mascot.png')} // Use prop or default
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={[styles.formContainer, { backgroundColor: formBackgroundColor }]}>
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
  },
  topContentContainer: {
    alignItems: 'flex-start',
    paddingBottom: 20,
    width: '100%',
    paddingLeft: 25,
    // backgroundColor: 'rgba(255,0,0,0.1)', // Debug
  },
  appLogoImage: {
    width: 150, 
    height: 60, 
    marginTop: 10, 
    marginBottom: 20, 
    alignSelf: 'flex-start',
  },
  helloTitle: {
    fontSize: FontSizes.xxxl + 4, 
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
  },
  mascotContainer: {
    position: 'absolute',
    top: '22%',
    right: '5%',
    zIndex: 1, 
    alignItems: 'center',
    // backgroundColor: 'rgba(0,255,0,0.1)', // Debug
  },
  mascotImage: {
    width: 180, 
    height: 180, 
  },
  formContainer: {
    width: '100%',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 25, 
    paddingTop: 40,
    paddingBottom: Platform.OS === 'ios' ? 30 : 40, 
    alignItems: 'center',
    flexGrow: 1,
    position: 'relative',
    // backgroundColor: 'rgba(0,0,255,0.1)', // Debug
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