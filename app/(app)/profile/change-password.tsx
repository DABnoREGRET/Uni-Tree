import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '../../components/layouts';
import { CustomHeader } from '../../components/navigation';
import { PrimaryButton, StyledTextInput } from '../../components/ui';
import { Colors, Fonts, FontSizes } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { changePassword, verifyPassword, isLoading: authIsLoading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [componentIsLoading, setComponentIsLoading] = useState(false);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();

  const handlePasswordChange = async () => {
    setError('');
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setComponentIsLoading(true);
    
    // First verify the current password
    const { verified, error: verifyError } = await verifyPassword(currentPassword);
    
    if (!verified) {
      setComponentIsLoading(false);
      if (verifyError?.message.includes('Invalid login credentials')) {
          setError('Current password is incorrect.');
      } else {
        setError(verifyError?.message || 'Failed to verify password. Please try again.');
      }
      return;
    }

    const { error: supabaseError } = await changePassword(newPassword);
    setComponentIsLoading(false);

    if (supabaseError) {
      setError(supabaseError.message || 'Failed to change password. Please try again.');
    } else {
      Alert.alert("Success", "Your password has been updated successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  return (
    <ScreenWrapper 
      applyTopInset={false}
      contentContainerStyle={styles.container}
    >
      <StatusBar style="dark" />
      <CustomHeader title="Change Password" />
      <View style={styles.formContainer}>
        <StyledTextInput
          label="Current Password"
          iconName="lock"
          placeholder="Enter your current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          containerStyle={styles.inputField}
        />
        <StyledTextInput
          label="New Password"
          iconName="lock"
          placeholder="Enter your new password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          containerStyle={styles.inputField}
        />
        <StyledTextInput
          label="Confirm New Password"
          iconName="lock"
          placeholder="Confirm your new password"
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          secureTextEntry
          containerStyle={styles.inputField}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          title="Update Password"
          onPress={handlePasswordChange}
          isLoading={componentIsLoading || authIsLoading}
          buttonStyle={styles.updateButton}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputField: {
    marginBottom: 15,
  },
  updateButton: {
    marginTop: 20,
    width: '100%',
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    textAlign: 'center',
    marginBottom: 10,
  },
}); 