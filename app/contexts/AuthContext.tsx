import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'; // Import types directly
import * as Linking from 'expo-linking';
import { deleteItemAsync } from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { supabase } from '../services/supabase'; // Import only supabase client

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string, username: string, studentId?: string | null, avatarUrl?: string) => Promise<{ data: { user: User | null; session: Session | null; }; error: any; }>;
  signOut: () => Promise<{ error: any }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>;
  signInWithPassword: (email?: string, password?: string) => Promise<{ error: any } | { error: null; session: Session | null}>;
  updateUserMetadata: (metadata: object) => Promise<{ data: any, error: any }>;
  changePassword: (password: string) => Promise<{ error: any }>;
  deleteAccount: () => Promise<{ error: any }>;
  // TODO: Add other necessary auth methods (e.g., password recovery)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback: ensure loading state clears in case of unexpected hangs (e.g., SecureStore failure)
  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 6000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Remove legacy oversized session entry to avoid SecureStore warnings
    deleteItemAsync('userSession').catch(() => {});

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

        // Supabase client already persists the session via its SecureStore adapter.
        // Storing the full session JSON (often >2 KB) triggers iOS SecureStore size warnings.
        // We only keep a lightweight reference to the user ID for quick look-ups.
        if (session?.user?.id) {
          await AsyncStorage.setItem('currentUserId', session.user.id);
        } else {
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
          avatar_url: avatarUrl || `https://api.dicebear.com/8.x/initials/png?seed=${encodeURIComponent(username)}` // Default avatar (PNG for mobile compatibility)
        },
      },
    });
    
    setIsLoading(false);
    return { data, error };
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

  const resetPasswordForEmail = async (email: string) => {
    setIsLoading(true);
    // IMPORTANT: Replace with your app's deep link for the password update screen.
    // For Expo Go development, this might be like: 'exp://127.0.0.1:8081/--/update-password'
    // For production, use your custom scheme: 'yourappscheme://update-password'
    // This URL must be added to your Supabase project's "Redirect URLs" in Auth > URL Configuration.
    const redirectTo = Linking.createURL('/(auth)/update-password');
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

  const changePassword = async (password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.updateUser({ password: password });
    setIsLoading(false);
    return { error };
  }

  const deleteAccount = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      await signOut(); // Clear any cached session
      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting account:', error);
      Alert.alert('Deletion Failed', error.message || 'Unable to delete your account.');
      return { error };
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
    resetPasswordForEmail,
    signInWithPassword,
    updateUserMetadata,
    changePassword,
    deleteAccount,
  }), [
    session, user, isLoading, // signInWithEmail, signUpWithEmail, etc., are stable due to useCallback or being top-level
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