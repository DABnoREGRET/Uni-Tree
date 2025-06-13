import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthScreenLayout } from '../components/layouts';
import { PrimaryButton, StyledTextInput } from '../components/ui';
import { Colors, Fonts, FontSizes } from '../constants';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPasswordForEmail, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setIsProcessing(true);

    try {
      const { error } = await resetPasswordForEmail(email);
      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage('An email has been sent with a password reset link.');
        // router.back(); // Keep the user on the page to see the message
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <AuthScreenLayout
        topTitle="Forgot Your"
        topSubtitle="Password?"
        formTitle="Reset Password"
        showMascot={true}
        mascotImageSource={require('../../assets/images/error_mascot.png')}
        showBackButton={true}
        onBackPress={() => router.back()}
      >
        <Text style={styles.infoText}>
          Enter the email address associated with your account, and we&#39;ll send you a link to reset your password.
        </Text>

        <StyledTextInput
          label="Email"
          iconName="envelope-o"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          containerStyle={styles.inputField}
          returnKeyType="go"
          onSubmitEditing={handlePasswordReset}
          error={error}
        />

        <PrimaryButton
          title="Send Reset Link"
          onPress={handlePasswordReset}
          isLoading={isProcessing || isLoading}
          buttonStyle={styles.resetButton}
          textStyle={styles.resetButtonText}
        />

        <View style={styles.loginLinkContainer}>
          <Text style={styles.rememberedPasswordText}>Remembered your password? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </AuthScreenLayout>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  infoText: {
    fontFamily: Fonts.Poppins.Regular,
    fontSize: FontSizes.sm,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputField: {
    marginBottom: 30,
  },
  resetButton: {
    width: '100%',
    paddingVertical: 12,
  },
  resetButtonText: {
    fontFamily: Fonts.Poppins.SemiBold,
    fontSize: FontSizes.lg,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  rememberedPasswordText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.white,
  },
  loginLink: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Grandstander.SemiBold,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 5,
    textDecorationLine: 'underline',
  },
  messageContainer: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  successText: {
    color: 'green',
    textAlign: 'center',
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
  },
}); 