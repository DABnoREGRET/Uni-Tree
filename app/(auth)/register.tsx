import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, TextInput as RNTextInput, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthScreenLayout } from '../components/layouts';
import { PrimaryButton, StyledTextInput } from '../components/ui';
import { Colors, Fonts, FontSizes } from '../constants';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUpWithEmail, isLoading: authIsLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: '',
  });

  const emailInputRef = useRef<RNTextInput>(null);
  const studentIdInputRef = useRef<RNTextInput>(null);
  const passwordInputRef = useRef<RNTextInput>(null);
  const confirmPasswordInputRef = useRef<RNTextInput>(null);

  const validateEmail = (email: string) => {
    // Basic email validation regex
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string) => {
    // Alphanumeric, min 3 chars, max 18
    const usernameRegex = /^[a-zA-Z0-9]{3,18}$/;
    return usernameRegex.test(username);
  };

  const validatePassword = (password: string) => {
    // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSignUp = async () => {
    const newErrors = { username: '', email: '', studentId: '', password: '', confirmPassword: '' };
    let validationFailed = false;

    if (!username || !email || !password || !confirmPassword) {
      Alert.alert("Registration Failed", "Please fill in all non-optional fields.");
      return;
    }

    if (studentId && !/^[a-zA-Z0-9]+$/.test(studentId)) {
        newErrors.studentId = "Student ID should only contain letters and numbers.";
        validationFailed = true;
    }

    if (!validateUsername(username)) {
      newErrors.username = "Username must be 3-18 characters, letters & numbers only.";
      validationFailed = true;
    }

    if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
      validationFailed = true;
    }

    if (!validatePassword(password)) {
      newErrors.password = "Password must be at least 8 characters and include uppercase, lowercase, number, and special characters.";
      validationFailed = true;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
      validationFailed = true;
    }

    if (validationFailed) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({ username: '', email: '', studentId: '', password: '', confirmPassword: '' });
    setIsSigningUp(true);
    try {
      const { error } = await signUpWithEmail(email, password, username, studentId);
      
      if (error) {
        const newApiErrors = { ...newErrors };
        const errorMessage = error.message;

        if (errorMessage.includes('profiles_username_key')) {
            newApiErrors.username = 'This username is already taken.';
        } else if (errorMessage.includes('profiles_email_key') || errorMessage.toLowerCase().includes('email rate limit')) {
            newApiErrors.email = 'This email is already registered.';
        } else if (errorMessage.includes('profiles_student_id_key')) {
            newApiErrors.studentId = 'This Student ID is already registered.';
        } else {
            Alert.alert("Registration Failed", errorMessage);
        }
        setErrors(newApiErrors);
      }
    } catch (error: any) {
      console.error("Sign up process error:", error);
      Alert.alert("Registration Error", error.message || "An unexpected error occurred during sign up.");
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <AuthScreenLayout
      topTitle=""
      topSubtitle=""
      formTitle="Sign Up"
      showMascot={false}
    >
      <View style={styles.formHeaderContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonContainer}>
          <FontAwesome name="arrow-left" size={18} color={Colors.white} />
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>

      <StyledTextInput
        label="What should we call you?"
        iconName="user-o"
        placeholder="e.g., Jane Doe"
        value={username}
        onChangeText={setUsername}
        containerStyle={styles.inputField}
        returnKeyType="next"
        onSubmitEditing={() => emailInputRef.current?.focus()}
        blurOnSubmit={false}
        maxLength={18}
        error={errors.username}
      />

      <StyledTextInput
        ref={emailInputRef}
        label="Your School Email"
        iconName="envelope-o"
        placeholder="e.g., nameid@fpt.edu.vn"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        containerStyle={styles.inputField}
        returnKeyType="next"
        onSubmitEditing={() => studentIdInputRef.current?.focus()}
        blurOnSubmit={false}
        error={errors.email}
      />

      <StyledTextInput
        ref={studentIdInputRef}
        label="Student ID"
        iconName="id-card-o"
        placeholder="e.g., GCH123456"
        value={studentId}
        onChangeText={setStudentId}
        containerStyle={styles.inputField}
        returnKeyType="next"
        onSubmitEditing={() => passwordInputRef.current?.focus()}
        blurOnSubmit={false}
        error={errors.studentId}
      />

      <StyledTextInput
        ref={passwordInputRef}
        label="Password"
        iconName="lock"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        showPasswordToggle={true}
        passwordVisible={showPassword}
        onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
        containerStyle={styles.inputField}
        returnKeyType="next"
        onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
        blurOnSubmit={false}
        error={errors.password}
      />

      <StyledTextInput
        ref={confirmPasswordInputRef}
        label="Confirm Password"
        iconName="lock"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        showPasswordToggle={true}
        passwordVisible={showConfirmPassword}
        onTogglePasswordVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
        containerStyle={styles.inputField}
        returnKeyType="go"
        onSubmitEditing={handleSignUp}
        error={errors.confirmPassword}
      />

      <PrimaryButton
        title="Sign Up"
        onPress={handleSignUp}
        isLoading={isSigningUp || authIsLoading}
        buttonStyle={styles.signUpButton}
        textStyle={styles.signUpButtonText}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  formHeaderContainer: {
    width: '100%',
    position: 'relative',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    marginBottom: 15,
  },
  backButtonText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    marginLeft: 6,
  },
  inputField: {
    marginBottom: 15,
  },
  signUpButton: {
    width: '100%',
    marginTop: 25,
    marginBottom: 30,
    backgroundColor: Colors.primaryDark,
    paddingVertical: 12,
    borderRadius: 10,
  },
  signUpButtonText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Poppins.SemiBold,
  },
}); 