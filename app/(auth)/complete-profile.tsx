import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AuthScreenLayout } from '../components/layouts';
import { PrimaryButton, StyledTextInput } from '../components/ui';
import { Colors, Fonts, FontSizes } from '../constants';
import { useAuth } from '../contexts/AuthContext';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { user, updateUserMetadata, isLoading: authIsLoading } = useAuth();
  
  const [username, setUsername] = useState('');
  const [studentId, setStudentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setUsername(user.user_metadata.full_name);
    }
  }, [user]);

  const handleCompleteProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Username required', 'Please enter a username.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await updateUserMetadata({
      username: username.trim(),
      student_id: studentId.trim() || null,
    });
    setIsSubmitting(false);

    if (!error) {
      // Success alert is shown in context
      router.replace('/(app)/home');
    }
    // Error is also alerted in context
  };

  return (
    <AuthScreenLayout
      topTitle="One Last Step!"
      topSubtitle="Complete your profile to join the community."
      formTitle="Your Information"
      showMascot={false}
    >
      <Text style={styles.instructionText}>
        Your username and student ID is public on the leaderboard.
      </Text>

      <StyledTextInput
        label="Username (Public)"
        iconName="user-o"
        placeholder="Enter your desired username"
        value={username}
        onChangeText={setUsername}
        containerStyle={styles.inputField}
      />

      <StyledTextInput
        label="Student ID (Optional, Private)"
        iconName="id-card-o"
        placeholder="Enter your student ID"
        value={studentId}
        onChangeText={setStudentId}
        containerStyle={styles.inputField}
      />

      <PrimaryButton
        title="Save and Continue"
        onPress={handleCompleteProfile}
        isLoading={isSubmitting || authIsLoading}
        buttonStyle={styles.submitButton}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  instructionText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: FontSizes.base + 4,
    paddingHorizontal: 10,
  },
  inputField: {
    marginBottom: 20,
  },
  submitButton: {
    width: '100%',
    marginTop: 15,
  },
}); 