import { Link, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react'; // Removed useEffect as rememberMe logic is gone
import { Alert, TextInput as RNTextInput, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthScreenLayout } from '../components/layouts';
import { PrimaryButton, StyledTextInput } from '../components/ui';
import { Colors, Fonts, FontSizes } from '../constants';
import { useAuth } from '../contexts/AuthContext'; // Adjusted path

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithEmail, isLoading: authIsLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const passwordInputRef = useRef<RNTextInput>(null);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Login Failed", "Please enter both email and password.");
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        // Error is already alerted in AuthContext, but you can add more specific handling if needed
        // Alert.alert("Login Failed", error.message || "Invalid email or password. Please try again.");
      } else {
        // Navigation is handled by RootLayout's useEffect based on isAuthenticated
      // router.replace('/(app)/home'); 
      }
    } catch (error: any) {
      console.error("Login process error:", error);
      Alert.alert("Login Error", error.message || "An unexpected error occurred during login.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AuthScreenLayout
      topTitle="Hello!"
      topSubtitle="Welcome to UNITREE!"
      formTitle="Login"
      mascotImageSource={require('../../assets/images/hello_mascot.png')}
    >
      <StyledTextInput
        label="Email"
        iconName="envelope-o"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => {
          passwordInputRef.current?.focus();
        }}
        blurOnSubmit={false}
        containerStyle={styles.inputField}
      />

      <StyledTextInput
        ref={passwordInputRef}
        label="Password"
        iconName="lock"
        placeholder="Your password"
        value={password}
        onChangeText={setPassword}
        showPasswordToggle={true}
        passwordVisible={showPassword}
        onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
        returnKeyType="go"
        onSubmitEditing={handleEmailLogin}
        containerStyle={styles.inputField}
      />

      <View style={styles.optionsContainer}>
        <View style={{flex: 1}} />
        <Link href="/(auth)/forgot-password" asChild>
          <TouchableOpacity>
            <Text style={[styles.optionText, styles.forgotPasswordText]}>Forgot Password?</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <PrimaryButton 
        title="Login with Email"
        onPress={handleEmailLogin}
        isLoading={isProcessing && !authIsLoading}
        disabled={authIsLoading}
        buttonStyle={styles.loginButton}
        textStyle={styles.loginButtonText}
      />

      <View style={styles.signUpContainer}>
        <Text style={styles.noAccountText}>Don&#39;t have an account? </Text>
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity>
            <Text style={styles.signUpLink}>Sign up</Text>
          </TouchableOpacity>
        </Link>
      </View>
      
      {/* Back to Onboarding link - might be useful for testing, optional for final design */}
      {/* <Link href="/onboarding" asChild>
        <TouchableOpacity style={{marginTop: 20}}>
          <Text style={styles.linkText}>Back to Onboarding</Text>
        </TouchableOpacity>
      </Link> */}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  inputField: {
    marginBottom: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 5, 
  },
  optionText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.white,
  },
  forgotPasswordText: {
    textDecorationLine: 'underline', 
  },
  loginButton: {
    width: '100%',
    marginBottom: 15,
    backgroundColor: Colors.primaryDark,
    paddingVertical: 12,
    borderRadius: 10,
  },
  loginButtonText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Poppins.SemiBold,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  noAccountText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.white,
  },
  signUpLink: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.SemiBold,
    color: Colors.white,
    marginLeft: 5,
    textDecorationLine: 'underline',
  },
}); 