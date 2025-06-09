import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'; // Import types directly
import { deleteItemAsync, setItemAsync } from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { supabase } from '../services/supabase'; // Import only supabase client

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string, username: string, studentId?: string | null, avatarUrl?: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  changePassword: (newPassword: string) => Promise<{ error: any }>;
  verifyPassword: (currentPassword: string) => Promise<{ verified: boolean; error: any }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>;
  signInWithPassword: (email?: string, password?: string) => Promise<{ error: any } | { error: null; session: Session | null}>;
  updateUserMetadata: (metadata: object) => Promise<{ data: any, error: any }>;
  // TODO: Add other necessary auth methods (e.g., password recovery)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    }).catch((error: any) => {
      console.error("Error getting initial session:", error);
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth event:', event, 'Session:', session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Handle specific auth events if needed
        if (event === 'PASSWORD_RECOVERY') {
          // Handle password recovery UI if necessary
        }
        if (event === 'USER_UPDATED') {
            // Potentially refresh user data context here if profile info changed
        }

        // Store or remove the session based on its presence
        if (session) {
            await setItemAsync('userSession', JSON.stringify(session));
            await AsyncStorage.setItem('currentUserId', session.user.id);
        } else {
            await deleteItemAsync('userSession');
            await AsyncStorage.removeItem('currentUserId');
        }
      }
    );

    // Listen for app state changes to refresh session if app comes to foreground
    // This helps ensure the session is up-to-date after backgrounding
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
            supabase.auth.getSession(); // Re-fetch session on app active
        }
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
      appStateSubscription.remove();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Sign in error:", error.message);
      Alert.alert("Sign In Failed", error.message);
    }
    // Session and user state will be updated by onAuthStateChange
    setIsLoading(false);
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, username: string, studentId?: string | null, avatarUrl?: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { // This data is stored in auth.users.raw_user_meta_data
          user_name: username, // Will be picked up by handle_new_user trigger
          student_id: studentId,
          avatar_url: avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(username)}` // Default avatar
        },
      },
    });
    if (error) {
      console.error("Sign up error:", error.message);
    } else if (data.session) {
        // Sign up successful, user is logged in
        console.log('Sign up successful, session created.');
    } else if (data.user && !data.session) {
        // Sign up successful but requires email confirmation
        Alert.alert("Sign Up Successful", "Please check your email to confirm your account.");
    }
    // Session and user state will be updated by onAuthStateChange if signup is auto-confirmed or after confirmation
    setIsLoading(false);
    return { error };
  };

  const signOut = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error.message);
      Alert.alert("Sign Out Failed", error.message);
    }
    // Session and user state will be cleared by onAuthStateChange
    setIsLoading(false);
    return { error };
  };

  const verifyPassword = async (currentPassword: string) => {
    if (!user?.email) {
      return { verified: false, error: { message: "User not authenticated." } };
    }
    
    try {
      // Try to sign in with current credentials to verify password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      
      if (error) {
        return { verified: false, error };
      }

      // Explicitly set the new session to ensure the client is using the latest token
      // for the subsequent updateUser call. onAuthStateChange will also fire,
      // but this avoids potential race conditions.
      if (data.session) {
        // This is the critical part: update the app's main session state
        setSession(data.session); 

        const { error: setError } = await supabase.auth.setSession(data.session);
        if (setError) {
          console.error('Failed to set session after verification:', setError);
          return { verified: false, error: setError };
        }
      }
      
      return { verified: true, error: null };
    } catch (error: any) {
      return { verified: false, error };
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!user) {
      // This case is for an authenticated user trying to change their own password
      // For recovery flow, a session exists, so a user object should also exist.
      return { error: { message: "User not authenticated." } };
    }
    setIsLoading(true);
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      console.error("Change password error:", error.message);
      // We are now returning the error to be handled by the calling component.
      // No Alert here.
    }

    setIsLoading(false);
    return { error };
  };

  const resetPasswordForEmail = async (email: string) => {
    setIsLoading(true);
    // IMPORTANT: Replace with your app's deep link for the password update screen.
    // For Expo Go development, this might be like: 'exp://127.0.0.1:8081/--/update-password'
    // For production, use your custom scheme: 'yourappscheme://update-password'
    // This URL must be added to your Supabase project's "Redirect URLs" in Auth > URL Configuration.
    const redirectTo = 'exp://127.0.0.1:8081/--/update-password'; // Placeholder - CONFIGURE THIS!
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      console.error("Password reset request error:", error.message);
      Alert.alert("Password Reset Failed", error.message);
    } else {
      Alert.alert("Password Reset Email Sent", "If an account exists for this email, a password reset link has been sent.");
    }
    setIsLoading(false);
    return { error };
  };

  const signInWithPassword = async (email?: string, password?: string) => {
    setIsLoading(true);
    if (!email || !password) {
        setIsLoading(false);
        Alert.alert("Login Error", "Email and password are required.");
        return { error: { message: 'Email and password are required.'}, session: null };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) throw error;
      // Session will be set by onAuthStateChange listener
      console.log("signInWithPassword successful, session:", data.session)
      return { error: null, session: data.session }; 
    } catch (error: any) {
      console.error('Error signing in:', error);
      Alert.alert("Login Failed", error.message || "Invalid email or password.");
      return { error, session: null };
    } finally {
        setIsLoading(false);
    }
  };

  const updateUserMetadata = async (metadata: object) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({ data: metadata });
      if (error) throw error;
      // Update local user state if necessary, or rely on onAuthStateChange if it triggers an update
      if (data.user) setUser(data.user);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating user metadata:', error);
      return { data: null, error };
    } finally {
        setIsLoading(false);
    }
  };

  const contextValue = React.useMemo(() => ({
    session,
    user,
    isAuthenticated: !!session,
    isLoading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    changePassword,
    verifyPassword,
    resetPasswordForEmail,
    signInWithPassword,
    updateUserMetadata,
  }), [
    session, user, isLoading, // signInWithEmail, signUpWithEmail, etc., are stable due to useCallback or being top-level
    // If any of these functions were not wrapped in useCallback and were redefined on render, they would need to be in the dep array.
    // However, as they are defined once in the provider scope, they are stable.
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 