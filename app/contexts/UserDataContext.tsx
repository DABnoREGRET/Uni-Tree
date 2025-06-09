import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native'; // Added Alert for error messages
import { supabase } from '../services/supabase'; // Import Supabase client
// User type from supabase is available via session.user, explicitly importing User might not be needed unless for specific type hints elsewhere
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TREE_COST_POINTS } from '../constants/Config';
import { useAuth } from './AuthContext';

// Define the structure of user data
export interface UserProfile {
  id: string; // UUID from Supabase
  name: string; // Corresponds to 'username' in Supabase
  email: string;
  studentId?: string | null; // Corresponds to 'student_id'
  avatarUrl?: string | null;
}

// Add this new interface for CollectedTree
export interface CollectedTree {
  id: string;
  user_id: string;
  name: string;
  species?: string | null;
  date_redeemed: string; // Assuming TIMESTAMPTZ comes as string
  image_url?: string | null;
  created_at: string;
}

interface UserStats {
  totalPoints: number;
  treeLevel: number;
  treeProgress: number; // Percentage to next level
  treeName?: string | null;
  totalSchoolWifiTimeMs: number;
  pointsFromWifi: number;
  realTreeRedemptionPending?: boolean;
}

export interface DailyConnection {
  date: string; // YYYY-MM-DD from points_date_out
  points: number; // from total_points_for_day
}

// Define structure for Leaderboard Entry
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_points: number;
  student_id: string | null;
  // tree_level: number; // REMOVED - As tree_level is not reliably on profiles table for leaderboard
}

interface UserDataContextType {
  userProfile: UserProfile | null;
  userStats: UserStats | null;
  leaderboardData: LeaderboardEntry[];
  collectedRealTrees: CollectedTree[];
  isLoading: boolean;
  isLoadingLeaderboard: boolean;
  isLoadingCollectedTrees: boolean;
  fetchUserData: () => Promise<void>; 
  updateUserProfile: (profileData: Partial<UserProfile & { tree_name?: string }>) => Promise<void>; 
  updateUserPoints: (newTotalPoints: number) => void;
  redeemRealTree: () => Promise<{ success: boolean; message: string }>; 
  fetchLeaderboard: () => Promise<void>;
  fetchCollectedRealTrees: () => Promise<void>;
  
  // New/updated properties for live stopwatch and daily time
  dailyConnectionTimeLog: { date: string; totalTimeMs: number } | null;
  sessionStartTime: number | null;
  lastLogUpdateTime: number | null;
  startWifiSession: () => Promise<void>;
  endWifiSession: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const getDailyConnectionTimeStorageKey = (userId: string) => `@DailyConnectionTimeLog_${userId}`;
const getSessionStartTimeStorageKey = (userId: string) => `@SchoolWifiSessionStartTime_${userId}`;
const getLastLogUpdateTimeKey = (userId: string) => `@LastBackgroundUpdateTime_${userId}`;

// Helper to get today's date as YYYY-MM-DD in UTC+7 timezone
const getTodayDateString = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('get-time');
  if (error) {
    // Throw the error to be caught by the calling function.
    // This prevents falling back to an insecure time source.
    throw new Error(`Failed to fetch secure time from server: ${error.message}`);
  }
    const nowUtc = new Date(data.now);
    
    // Add 7 hours to UTC time
    nowUtc.setUTCHours(nowUtc.getUTCHours() + 7);
    
    // Return the date part of the ISO string.
    return nowUtc.toISOString().split('T')[0];
};

// Helper to get current timestamp from Supabase
const getCurrentInternetTime = async () => {
    const { data, error } = await supabase.functions.invoke('get-time');
  if (error) {
    // Throw the error to be caught by the calling function.
    // This prevents falling back to an insecure time source.
    throw new Error(`Failed to fetch secure time from server: ${error.message}`);
  }
    return new Date(data.now).getTime();
};

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const { session, isAuthenticated } = useAuth(); 
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [collectedRealTrees, setCollectedRealTrees] = useState<CollectedTree[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isLoadingCollectedTrees, setIsLoadingCollectedTrees] = useState(false);
  const intervalIdRef = useRef<NodeJS.Timeout | number | null>(null); 
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [lastLogUpdateTime, setLastLogUpdateTime] = useState<number | null>(null);
  const [dailyConnectionTimeLog, setDailyConnectionTimeLog] = useState<{ date: string; totalTimeMs: number } | null>(null);

  const fetchCollectedRealTrees = useCallback(async () => {
    if (!session?.user) {
      setCollectedRealTrees([]);
      return;
    }
    setIsLoadingCollectedTrees(true);
    try {
      console.log(`Fetching collected real trees for user: ${session.user.id}`);
      const { data, error } = await supabase
        .from('collected_real_trees')
        .select('id, user_id, name, species, date_redeemed, image_url, created_at')
        .eq('user_id', session.user.id)
        .order('date_redeemed', { ascending: false });

      if (error) {
        console.error("Error fetching collected real trees:", error.message);
        throw error;
      }
      setCollectedRealTrees(data || []);
      console.log("Collected real trees fetched:", data);
    } catch (error: any) {
      Alert.alert("Error", "Could not fetch your collected real trees. " + error.message);
      setCollectedRealTrees([]);
    } finally {
      setIsLoadingCollectedTrees(false);
    }
  }, [session]);

  const fetchUserData = useCallback(async () => {
    if (!isAuthenticated || !session?.user) {
      setUserProfile(null);
      setUserStats(null);
      return;
    }
    
    setIsLoading(true);
    try {
      const { user } = session;
      console.log("fetchUserData: Fetching data for user:", user.id);

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          email,
          avatar_url,
          total_points,
          real_tree_redemption_pending
        `)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUserProfile({
          id: data.id,
          name: data.username || (user.user_metadata?.user_name || user.user_metadata?.full_name || 'Anonymous User'),
          email: data.email || user.email || 'No email',
          studentId: user.user_metadata?.student_id || null,
          avatarUrl: data.avatar_url || user.user_metadata?.avatar_url,
        });
        setUserStats({
          totalPoints: data.total_points ?? 0,
          treeLevel: Math.floor((data.total_points ?? 0) / 200) + 1,
          treeProgress: ((data.total_points ?? 0) % 200) / 200 * 100,
          treeName: 'My UniTree',
          totalSchoolWifiTimeMs: 0,
          pointsFromWifi: 0,
          realTreeRedemptionPending: data.real_tree_redemption_pending ?? false,
        });
      } else {
        console.warn("fetchUserData: No profile data found for user", user.id, ". Using auth data as fallback.");
        setUserProfile({
            id: user.id,
            name: user.user_metadata?.user_name || user.user_metadata?.full_name || 'New User',
            email: user.email || 'No Email Provided',
            studentId: user.user_metadata?.student_id || null,
            avatarUrl: user.user_metadata?.avatar_url || null,
        });
        setUserStats({ 
            totalPoints: 0, treeLevel: 1, treeProgress: 0, treeName: 'My First UniTree',
            totalSchoolWifiTimeMs: 0, pointsFromWifi: 0, realTreeRedemptionPending: false,
        });
      }
      await fetchCollectedRealTrees();
    } catch (error: any) {
      console.error("Error fetching user data from Supabase:", error.message);
      Alert.alert("Error", "Could not fetch your profile data. " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, session, fetchCollectedRealTrees]); 

  const loadDailyTime = async () => {
    if (!session?.user) return;
    try {
      const dailyTimeKey = getDailyConnectionTimeStorageKey(session.user.id);
      const storedDailyTime = await AsyncStorage.getItem(dailyTimeKey);
      const todayStr = await getTodayDateString(); // This can throw
      let logNeedsUpdate = false;
      
      let currentLog: { date: string; totalTimeMs: number };

      if (storedDailyTime) {
        const parsedTime = JSON.parse(storedDailyTime);
        if (parsedTime.date === todayStr) {
          currentLog = parsedTime;
        } else {
          // Date has changed, reset the log.
          currentLog = { date: todayStr, totalTimeMs: 0 };
          logNeedsUpdate = true;
        }
      } else {
        // No stored time, initialize for today.
        currentLog = { date: todayStr, totalTimeMs: 0 };
        logNeedsUpdate = true;
      }

      // Update state only if it's different
      if (JSON.stringify(currentLog) !== JSON.stringify(dailyConnectionTimeLog)) {
        setDailyConnectionTimeLog(currentLog);
      }

      if (logNeedsUpdate) {
        await AsyncStorage.setItem(dailyTimeKey, JSON.stringify(currentLog));
      }

    } catch (error) {
      console.error('Failed to load or initialize daily time due to server time fetch error:', error);
      // If we can't get a secure date, we can't safely initialize or check the daily log.
      // Setting to null will disable the timer display.
      setDailyConnectionTimeLog(null);
    }
  };

  const loadSessionStateFromStorage = async () => {
    if (!session?.user) return;
    try {
      const sessionKey = getSessionStartTimeStorageKey(session.user.id);
      const updateKey = getLastLogUpdateTimeKey(session.user.id);
      const storedStartTime = await AsyncStorage.getItem(sessionKey);
      const storedUpdateTime = await AsyncStorage.getItem(updateKey);
      
      const newStartTime = storedStartTime ? parseInt(storedStartTime, 10) : null;
      const newUpdateTime = storedUpdateTime ? parseInt(storedUpdateTime, 10) : null;

      // Update state only if values have changed to prevent unnecessary re-renders
      if (newStartTime !== sessionStartTime) {
        setSessionStartTime(newStartTime);
      }
      if (newUpdateTime !== lastLogUpdateTime) {
        setLastLogUpdateTime(newUpdateTime);
      }
      
    } catch (error) {
      console.error('Failed to load session state from storage:', error);
      // On error, reset the state to be safe.
      setSessionStartTime(null);
      setLastLogUpdateTime(null);
    }
  };

  const syncAccumulatedTimeToBackend = useCallback(async () => {
    if (!session?.user) return; // Must be logged in

    const sessionKey = getSessionStartTimeStorageKey(session.user.id);
    const updateKey = getLastLogUpdateTimeKey(session.user.id);
    const dailyLogKey = getDailyConnectionTimeStorageKey(session.user.id);
    // Get the current WiFi session start time from storage. If it doesn't exist, we're not connected.
    const sessionStartTimeStr = await AsyncStorage.getItem(sessionKey);
    if (!sessionStartTimeStr) return;

    try {
      const lastUpdateTimeStr = await AsyncStorage.getItem(updateKey);
      const currentTime = await getCurrentInternetTime(); // Can throw
      // The last update time is either the one from the last sync, or the session start time if this is the first sync.
      const lastUpdateTime = lastUpdateTimeStr ? Number(lastUpdateTimeStr) : Number(sessionStartTimeStr);
      
      const durationToSync = currentTime - lastUpdateTime;

      // Only sync to the backend if at least a minute has passed.
      if (durationToSync < 60000) {
        return;
      }

      console.log(`[Sync] Attempting to credit ${durationToSync}ms to backend.`);
      
      const { data, error } = await supabase.rpc('credit_wifi_time', {
        duration_ms_input: durationToSync,
      });

      if (error) {
        // Throw to be caught by the outer catch block
        throw new Error(`RPC 'credit_wifi_time' failed: ${error.message}`);
      }

      // --- If RPC call is successful ---

      // Optimistically update the total points locally for a snappier UI response.
      const pointsEarned = Math.floor(durationToSync / 60000);
      if (pointsEarned > 0) {
        setUserStats(prev => {
          if (!prev) return null;
          const newTotalPoints = prev.totalPoints + pointsEarned;
          return {
            ...prev,
            totalPoints: newTotalPoints,
            treeLevel: Math.floor(newTotalPoints / 200) + 1,
            treeProgress: (newTotalPoints % 200) / 200 * 100,
          };
        });
      }

      // 1. Update our local "last update time" marker to now, so we don't credit this time again.
      await AsyncStorage.setItem(updateKey, String(currentTime));
      console.log(`[Sync] Successfully credited ${durationToSync}ms.`);
      
      // 2. Update the local daily time log, which is used for the stopwatch display.
      const todayStr = await getTodayDateString(); // Can throw
      const storedDailyTime = await AsyncStorage.getItem(dailyLogKey);
      let currentDailyTime: { date: string; totalTimeMs: number } = storedDailyTime ? JSON.parse(storedDailyTime) : { date: todayStr, totalTimeMs: 0 };
  
      // Reset the daily time if the date has changed.
      if (currentDailyTime.date !== todayStr) {
          currentDailyTime = { date: todayStr, totalTimeMs: 0 };
      }
      currentDailyTime.totalTimeMs += durationToSync;
      await AsyncStorage.setItem(dailyLogKey, JSON.stringify(currentDailyTime));
      
      // Also update the React state for immediate UI reflection for the stopwatch.
      setDailyConnectionTimeLog(currentDailyTime);
      setLastLogUpdateTime(currentTime);

      // 3. Re-fetch all user data from the backend to get the new total_points.
      await fetchUserData();

    } catch (e: any) {
      console.error('[Sync] Sync process failed, will retry on next interval. Error:', e.message);
      // We don't update LAST_LOG_UPDATE_TIME_KEY on failure, so the duration will be included in the next sync attempt.
    }
  }, [session, fetchUserData]);

  useEffect(() => {
    if (isAuthenticated && session?.user.id) {
      fetchUserData();
      fetchCollectedRealTrees();
      loadDailyTime();
      loadSessionStateFromStorage();
      fetchLeaderboard();
    } else {
      setUserProfile(null);
      setUserStats(null);
      setLeaderboardData([]);
      setCollectedRealTrees([]);
      setDailyConnectionTimeLog(null);
      setSessionStartTime(null);
      setLastLogUpdateTime(null);
    }
  }, [isAuthenticated, session]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App is active, syncing data...');
        loadDailyTime();
        loadSessionStateFromStorage();
        syncAccumulatedTimeToBackend();
      }
    });

    const intervalId = setInterval(() => {
        if (AppState.currentState === 'active') {
            syncAccumulatedTimeToBackend();
            loadSessionStateFromStorage(); // Keep session state fresh
            loadDailyTime(); // Keep daily time fresh
        }
    }, 30000); // every 30 seconds - reduced from 1 second to improve performance

    return () => {
      appStateSubscription.remove();
      clearInterval(intervalId);
    };
  }, [syncAccumulatedTimeToBackend]); // Add dependency

  const startWifiSession = useCallback(async () => {
    if (!session?.user) return;
    const sessionKey = getSessionStartTimeStorageKey(session.user.id);
    const updateKey = getLastLogUpdateTimeKey(session.user.id);
    try {
      const now = String(await getCurrentInternetTime());
      await AsyncStorage.setItem(sessionKey, now);
      await AsyncStorage.setItem(updateKey, now);
      setSessionStartTime(Number(now));
      setLastLogUpdateTime(Number(now));
    } catch (e) {
      console.error("Failed to start wifi session in storage", e);
    }
  }, [session]);

  const endWifiSession = useCallback(async () => {
    if (!session?.user) return;
    const sessionKey = getSessionStartTimeStorageKey(session.user.id);
    const updateKey = getLastLogUpdateTimeKey(session.user.id);
    try {
      await syncAccumulatedTimeToBackend();
      await AsyncStorage.removeItem(sessionKey);
      await AsyncStorage.removeItem(updateKey);
      setSessionStartTime(null);
      setLastLogUpdateTime(null);
    } catch (e) {
      console.error("Failed to end wifi session in storage", e);
    }
  }, [session, syncAccumulatedTimeToBackend]);

  const updateUserProfile = useCallback(async (profileUpdateData: Partial<UserProfile & { tree_name?: string }>) => {
    if (!session?.user) {
      Alert.alert("Error", "You must be logged in to update your profile.");
      return;
    }
    setIsLoading(true);
    try {
      const { name, studentId, avatarUrl /* tree_name is not used from profileUpdateData for profiles table */ } = profileUpdateData;
      const updatePayload: { [key: string]: any } = {};
      if (name !== undefined) updatePayload.username = name;
      // We don't update studentId to 'profiles' table as it might not exist or is managed via auth metadata
      // if (studentId !== undefined && studentId !== null) updatePayload.student_id = studentId;
      if (avatarUrl !== undefined) updatePayload.avatar_url = avatarUrl;

      if (Object.keys(updatePayload).length > 0) {
        const { data: updatedProfileData, error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', session.user.id)
          .select('id, username, email, avatar_url, total_points, real_tree_redemption_pending')
          .single();

        if (error) throw error;

        if (updatedProfileData) {
          setUserProfile(prevProfile => ({
            ...(prevProfile || {} as UserProfile),
            id: updatedProfileData.id || prevProfile?.id || session.user.id,
            name: updatedProfileData.username || (session.user.user_metadata?.user_name || session.user.user_metadata?.full_name || 'Anonymous User'),
            email: updatedProfileData.email || session.user.email || 'No email',
            studentId: session.user.user_metadata?.student_id || prevProfile?.studentId || null,
            avatarUrl: updatedProfileData.avatar_url || session.user.user_metadata?.avatar_url || prevProfile?.avatarUrl,
          }));
          setUserStats(prevStats => ({
            ...(prevStats || {} as UserStats),
            totalPoints: updatedProfileData.total_points ?? (prevStats?.totalPoints ?? 0),
            treeLevel: prevStats?.treeLevel ?? 1,
            treeProgress: prevStats?.treeProgress ?? 0,
            treeName: prevStats?.treeName ?? 'My UniTree',
            totalSchoolWifiTimeMs: 0,
            pointsFromWifi: 0,
            realTreeRedemptionPending: updatedProfileData.real_tree_redemption_pending ?? (prevStats?.realTreeRedemptionPending ?? false),
          }));
          Alert.alert("Success", "Profile updated!");
        } else {
          await fetchUserData();
        }
      } else {
         Alert.alert("Info", "No changes to update.");
      }
    } catch (error: any) {
      console.error("Error updating user profile:", error.message);
      Alert.alert("Update Failed", error.message || "Could not update profile.");
    } finally {
      setIsLoading(false);
    }
  }, [session, fetchUserData]);

  const recordConnectionTime = async (durationMs: number) => {
    if (!userStats || !session?.user) return;
    const newTotalTime = userStats.totalSchoolWifiTimeMs + durationMs;
    const newPointsFromWifi = userStats.pointsFromWifi + Math.floor(durationMs / 60000); // 1 point per minute
    const hoursConnected = Math.floor(newTotalTime / 3600000); // Convert ms to hours
    const newTreeProgress = Math.min(hoursConnected, 100); // Cap progress at 100%
    const newLevel = Math.floor(hoursConnected / 100) + 1; // Level up every 100 hours
    setUserStats(prev => prev ? ({ 
      ...prev, 
      totalSchoolWifiTimeMs: newTotalTime, 
      pointsFromWifi: newPointsFromWifi,
      treeProgress: newTreeProgress,
      treeLevel: newLevel
    }) : prev);
    // Update daily log
    const today = await getTodayDateString();
    const dailyLogKey = getDailyConnectionTimeStorageKey(session.user.id);
    setDailyConnectionTimeLog(prev => {
      if (prev && prev.date === today) {
        return { date: today, totalTimeMs: prev.totalTimeMs + durationMs };
      }
      return { date: today, totalTimeMs: durationMs };
    });
    try {
      const existingLogJSON = await AsyncStorage.getItem(dailyLogKey);
      let log = { date: today, totalTimeMs: 0 };
      if (existingLogJSON) {
          const existingLog = JSON.parse(existingLogJSON);
          if (existingLog.date === today) {
              log = existingLog;
          }
      }
      log.totalTimeMs += durationMs;
      await AsyncStorage.setItem(dailyLogKey, JSON.stringify(log));
    } catch (e) {
      console.error('Failed to save daily time to AsyncStorage:', e);
    }
  };

  const getConnectedTimeToSchoolWiFi = useCallback(() => {
    const totalMs = userStats?.totalSchoolWifiTimeMs || 0;
    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }, [userStats?.totalSchoolWifiTimeMs]);

  const redeemRealTree = async (): Promise<{ success: boolean; message: string }> => {
    if (!session?.user || !userProfile || !userStats) {
      return { success: false, message: "User data not loaded or not authenticated." };
    }
    if (userStats.totalPoints < TREE_COST_POINTS) {
      return { success: false, message: `Not enough points! You need ${TREE_COST_POINTS} points.` };
    }
    if (userStats.realTreeRedemptionPending) {
        return { success: false, message: "Redemption request already pending." };
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-real-tree', {});

      if (error) {
        console.error("Error invoking request-real-tree function:", error.message);
        throw new Error(error.message || "Failed to invoke real tree redemption function.");
      }
      
      if (data && data.error) {
        console.error("request-real-tree function returned an error:", data.error);
        throw new Error(data.error);
    }

      if (data && data.success) {
        await fetchUserData(); 
        Alert.alert("Success!", data.message || "Your real tree redemption request has been submitted.");
        return { success: true, message: data.message || "Redemption successful!" };
      } else {
        throw new Error("An unexpected response was received from the server.");
      }

    } catch (error: any) {
      console.error("Error redeeming real tree:", error.message);
      Alert.alert("Redemption Failed", error.message || "Could not process your request.");
      return { success: false, message: error.message || "An error occurred." };
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaderboard = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingLeaderboard(true);
    try {
      console.log("Fetching leaderboard data...");
      const { data, error } = await supabase.rpc('get_leaderboard');

      if (error) {
        console.error("Error fetching leaderboard:", error.message);
        throw error;
      }
      if (data) {
        setLeaderboardData(data as LeaderboardEntry[]);
      }
    } catch (error: any) {
      Alert.alert("Error", "Could not fetch leaderboard data. " + error.message);
      setLeaderboardData([]); 
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, [isAuthenticated]);

  const updateUserPoints = (newTotalPoints: number) => {
    setUserStats(prevStats => {
      if (!prevStats) return null;
      return {
        ...prevStats,
        totalPoints: newTotalPoints,
        treeLevel: Math.floor(newTotalPoints / 200) + 1,
        treeProgress: (newTotalPoints % 200) / 200 * 100,
      };
    });
  };

  const contextValue = React.useMemo(() => ({
    userProfile, 
    userStats, 
    leaderboardData,
    collectedRealTrees,
    isLoading, 
    isLoadingLeaderboard,
    isLoadingCollectedTrees,
    fetchUserData, 
    updateUserProfile,
    updateUserPoints,
    recordConnectionTime,
    getConnectedTimeToSchoolWiFi,
    redeemRealTree,
    sessionStartTime,
    lastLogUpdateTime,
    fetchLeaderboard,
    fetchCollectedRealTrees,
    dailyConnectionTimeLog,
    startWifiSession,
    endWifiSession,
  }), [
    userProfile, userStats, leaderboardData, collectedRealTrees,
    isLoading, isLoadingLeaderboard, isLoadingCollectedTrees,
    fetchUserData, updateUserProfile, updateUserPoints, recordConnectionTime,
    getConnectedTimeToSchoolWiFi, redeemRealTree, sessionStartTime,
    lastLogUpdateTime, fetchLeaderboard, fetchCollectedRealTrees,
    dailyConnectionTimeLog,
    startWifiSession, endWifiSession
  ]);

  return (
    <UserDataContext.Provider value={contextValue}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within an UserDataProvider');
  }
  return context;
}; 