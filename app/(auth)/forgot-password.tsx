import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthScreenLayout } from '../components/layouts';
import { PrimaryButton, StyledTextInput } from '../components/ui';
import { Colors, Fonts, FontSizes } from '../constants';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPasswordForEmail, isLoading } = useAuth();
  const [email, setEmail] = useState('');

  const handleSendResetLink = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    
    const { error } = await resetPasswordForEmail(email.trim());
    
    if (!error) {
      // Alert for success is shown by the context function itself.
      // Optionally, navigate back or to login after a short delay, 
      // or let the user decide.
      // router.push('/(auth)/login'); 
    }
    // Error alert is also handled by the context function.
  };

  return (
    <AuthScreenLayout
      topTitle="Forgot Password?"
      topSubtitle="No worries, we'll help you reset it!"
      formTitle="Reset Password"
      showMascot={false}
    >
      <Text style={styles.instructionText}>
        Enter the email address associated with your account and we&#39;ll send you a link to reset your password.
      </Text>

      <StyledTextInput
        iconName="envelope-o"
        placeholder="Your School Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        containerStyle={{ marginBottom: 25 }}
      />

      <PrimaryButton
        title="Send Reset Link"
        onPress={handleSendResetLink}
        isLoading={isLoading}
        buttonStyle={{width: '100%', marginBottom: 25}}
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
  );
}

const styles = StyleSheet.create({
  instructionText: {
    fontSize: FontSizes.sm + 1,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: FontSizes.base + 4,
    paddingHorizontal: 10,
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
}); 