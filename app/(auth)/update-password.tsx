import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AuthScreenLayout } from '../components/layouts';
import { PrimaryButton, StyledTextInput } from '../components/ui';
import { Colors, Fonts, FontSizes } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { AuthChangeEvent, Session, supabase } from '../services/supabase'; // Import Supabase client and types

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const { isLoading, changePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRecoverySessionActive, setIsRecoverySessionActive] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Supabase client handles the URL fragment and establishes a session.
    // We listen for the PASSWORD_RECOVERY event to confirm this happened.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'PASSWORD_RECOVERY') {
          console.log('Password recovery event detected, session established.');
          setIsRecoverySessionActive(true);
          // You could also store the session or parts of it if needed,
          // but updateUser will use the active session automatically.
        } else if (event === 'SIGNED_IN' && session?.user) {
            // This might also happen if the user was already signed in and navigated here.
            // Or if the recovery token sign-in is generic.
            setIsRecoverySessionActive(true);
        }
      }
    );
    // Check initial session, in case the event fired before listener was attached (less likely for deep link)
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
            // Check if this session is due to a recovery token (might be hard to distinguish without more context)
            // For now, assume if a session exists on this screen, it might be the recovery one.
            // A more robust way could involve checking the token type if available from session, or relying on PASSWORD_RECOVERY event primarily.
            console.log("UpdatePasswordScreen: Initial session found.");
            // setIsRecoverySessionActive(true); // Let PASSWORD_RECOVERY event handle this to be sure
        }
    });


    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async () => {
    setError(''); // Clear previous errors

    if (!isRecoverySessionActive) {
        setError("No active password recovery session. Please use the link from your email again.");
        return;
    }
    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    if (newPassword.length < 8) { // Enforce stronger password
        setError("Password must be at least 8 characters long.");
        return;
    }

    // We use the existing changePassword function from AuthContext as it calls supabase.auth.updateUser
    // which is what's needed here. The user object in AuthContext will be from the recovery session.
    const { error: supabaseError } = await changePassword(newPassword);

    if (supabaseError) {
        if (supabaseError.message.includes("feeble")) {
            setError("Password is too weak. Please choose a stronger one.");
        } else {
            setError(supabaseError.message || "An unexpected error occurred.");
        }
    } else {
      Alert.alert(
        "Password Updated", 
        "Your password has been successfully updated. Please login with your new password.",
        [{ text: "OK", onPress: () => router.replace('/(auth)/login') }]
      );
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  // If not isRecoverySessionActive yet, maybe show a loading or message?
  // For now, the form is always visible.

  return (
    <AuthScreenLayout
      topTitle="Update Your Password"
      topSubtitle="Enter and confirm your new password below."
      formTitle="Set New Password"
    >
      <StyledTextInput
        label="New Password"
        iconName="lock"
        placeholder="Enter your new password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        containerStyle={{ marginBottom: 15 }}
        error={error && !newPassword ? "This field is required" : ""}
      />
      <StyledTextInput
        label="Confirm New Password"
        iconName="lock"
        placeholder="Confirm your new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        containerStyle={{ marginBottom: 5 }}
        error={error && newPassword && newPassword !== confirmPassword ? "Passwords do not match" : ""}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <PrimaryButton
        title="Update Password"
        onPress={handleUpdatePassword}
        isLoading={isLoading}
        buttonStyle={{width: '100%', marginTop: 20}}
      />
       {!isRecoverySessionActive && !isLoading && (
            <Text style={styles.infoText}>
                Waiting for password recovery session... If you haven&#39;t clicked the link in your email, please do so.
            </Text>
        )}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
    infoText: {
        fontSize: FontSizes.sm,
        fontFamily: Fonts.Poppins.Regular,
        color: Colors.white,
        textAlign: 'center',
        marginTop: 20,
        paddingHorizontal: 10,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSizes.sm,
        fontFamily: Fonts.Poppins.Regular,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
}); 