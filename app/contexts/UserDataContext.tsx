import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native'; // Added Alert for error messages
import { supabase } from '../services/supabase'; // Import Supabase client
// User type from supabase is available via session.user, explicitly importing User might not be needed unless for specific type hints elsewhere
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { SCHOOL_WIFI_BSSIDS, SCHOOL_WIFI_SSIDS } from '../constants/Config';
import { SafeAsyncStorage, STORAGE_KEYS } from '../utils/asyncStorage';
import { showOrUpdateWifiNotification } from '../utils/notifications';
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
  totalPoints: number; // Current usable points
  allTimePoints: number; // Lifetime accumulated points
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
  all_time_points: number;
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
  endWifiSession: (shouldSync?: boolean) => Promise<void>;
  updateBackgroundMonitoring: (enabled: boolean) => Promise<void>;
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
  const [backgroundMonitoringEnabled, setBackgroundMonitoringEnabled] = useState<boolean>(false);
  const [treeCostPoints, setTreeCostPoints] = useState<number>(2000); // Added treeCostPoints state

  // Load background monitor preference
  useEffect(() => {
    const loadPreference = async () => {
      const pref = await SafeAsyncStorage.getItem<boolean>(STORAGE_KEYS.BACKGROUND_MONITORING_ENABLED);
      setBackgroundMonitoringEnabled(pref === true);
    };
    loadPreference();
  }, []);

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

      const { data: profileData, error: profileError, status } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          email,
          avatar_url,
          total_points,
          all_time_points,
          real_tree_redemption_pending
        `)
        .eq('id', user.id)
        .single();

      if (profileError && status !== 406) {
        throw profileError;
      }

      // Fetch cost of a real tree from rewards table (category = 'real_tree')
      let pointsPerTreeLevel = 2000; // sensible default
      try {
        const { data: rewardRow, error: rewardError } = await supabase
          .from('rewards')
          .select('points_cost')
          .eq('category', 'real_tree')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (rewardError) {
          console.error('Failed to fetch real tree cost:', rewardError.message);
        }

        if (rewardRow?.points_cost && rewardRow.points_cost > 0) {
          pointsPerTreeLevel = rewardRow.points_cost;
        }
      } catch (e: any) {
        console.error('Unexpected error fetching real tree cost:', e.message);
      }

      // Cache the cost for other calculations
      setTreeCostPoints(pointsPerTreeLevel);

      // Helper to compute level based on 10-level system
      const getLevel = (pts: number) => {
        const perLevel = pointsPerTreeLevel / 10;
        if (perLevel <= 0) return 1;
        return Math.floor(pts / perLevel) + 1;
      };

      if (profileData) {
        setUserProfile({
          id: profileData.id,
          name: profileData.username || (user.user_metadata?.user_name || user.user_metadata?.full_name || 'Anonymous User'),
          email: profileData.email || user.email || 'No email',
          studentId: user.user_metadata?.student_id || null,
          avatarUrl: profileData.avatar_url || user.user_metadata?.avatar_url,
        });
        setUserStats({
          totalPoints: profileData.total_points ?? 0,
          allTimePoints: profileData.all_time_points ?? (profileData.total_points ?? 0),
          treeLevel: getLevel(profileData.total_points ?? 0),
          treeProgress: ((profileData.total_points ?? 0) % (pointsPerTreeLevel/10)) / (pointsPerTreeLevel/10) * 100,
          treeName: 'My UniTree',
          totalSchoolWifiTimeMs: 0,
          pointsFromWifi: 0,
          realTreeRedemptionPending: profileData.real_tree_redemption_pending ?? false,
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
            totalPoints: 0, allTimePoints: 0, treeLevel: 1, treeProgress: 0, treeName: 'My First UniTree',
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
      let currentTime: number;
      try {
        currentTime = await getCurrentInternetTime();
      } catch (e) {
        console.warn('[syncAccumulated] Using device time fallback');
        currentTime = Date.now();
      }
      
      // The last update time is either the one from the last sync, or the session start time if this is the first sync.
      const lastUpdateTime = lastUpdateTimeStr ? Number(lastUpdateTimeStr) : Number(sessionStartTimeStr);
      
      let durationToSync = currentTime - lastUpdateTime;
      if (durationToSync <= 0) {
        // Clock skew or fallback mismatch, skip this round
        return;
      }

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

      const wholeMinutesCredited = Math.floor(durationToSync / 60000);

      // Optimistically update the total points locally for a snappier UI response.
      const pointsEarned = wholeMinutesCredited;

      // 1. Only advance lastUpdateTime by the credited whole-minutes amount so we keep
      //    any leftover milliseconds for the next sync instead of losing them.
      const creditedMs = wholeMinutesCredited * 60000;
      const newLastUpdateTime = lastUpdateTime + creditedMs;
      await AsyncStorage.setItem(updateKey, String(newLastUpdateTime));
      setLastLogUpdateTime(newLastUpdateTime);

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

      // Optimistically update user stats instead of refetching whole profile.
      if (pointsEarned > 0) {
        setUserStats(prev => {
          if (!prev) return null;
          const newTotalPoints = prev.totalPoints + pointsEarned;
          const newAllTimePoints = prev.allTimePoints + pointsEarned;
          const perLevel = treeCostPoints / 10;
          return {
            ...prev,
            totalPoints: newTotalPoints,
            allTimePoints: newAllTimePoints,
            treeLevel: Math.floor(newTotalPoints / perLevel) + 1,
            treeProgress: (newTotalPoints % perLevel) / perLevel * 100,
          };
        });
      }

    } catch (e: any) {
      console.error('[Sync] Sync process failed, will retry on next interval. Error:', e.message);
      // We don't update LAST_LOG_UPDATE_TIME_KEY on failure, so the duration will be included in the next sync attempt.
    }
  }, [session, fetchUserData, treeCostPoints]);

  // --- WiFi Session Management Functions ---

  const startWifiSession = useCallback(async () => {
    if (!session?.user) return;
    const sessionKey = getSessionStartTimeStorageKey(session.user.id);
    const updateKey = getLastLogUpdateTimeKey(session.user.id);
    try {
      let nowNum: number;
      try {
        nowNum = await getCurrentInternetTime();
      } catch (e) {
        console.warn('[startWifiSession] Falling back to device time due to network error');
        nowNum = Date.now();
      }
      const now = String(nowNum);
      await AsyncStorage.setItem(sessionKey, now);
      await AsyncStorage.setItem(updateKey, now);
      setSessionStartTime(Number(now));
      setLastLogUpdateTime(Number(now));
    } catch (e) {
      console.error("Failed to start wifi session in storage", e);
    }
  }, [session]);

  async function endWifiSession(shouldSync?: boolean) {
    if (!session?.user) return;
    const sessionKey = getSessionStartTimeStorageKey(session.user.id);
    const updateKey = getLastLogUpdateTimeKey(session.user.id);
    try {
      if (shouldSync) {
        await syncAccumulatedTimeToBackend();
      }
      await AsyncStorage.removeItem(sessionKey);
      await AsyncStorage.removeItem(updateKey);
      setSessionStartTime(null);
      setLastLogUpdateTime(null);
    } catch (e) {
      console.error("Failed to end wifi session in storage", e);
    }
  }

  // --- AppState listener ---

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App is active, syncing data...');
        fetchUserData();
        loadDailyTime();
        loadSessionStateFromStorage();
        syncAccumulatedTimeToBackend();
        // Reload preference in case toggled in settings while inactive
        const pref = await SafeAsyncStorage.getItem<boolean>(STORAGE_KEYS.BACKGROUND_MONITORING_ENABLED);
        setBackgroundMonitoringEnabled(pref === true);

        if (sessionStartTime) {
          const minutes = Math.floor((Date.now() - sessionStartTime) / 60000);
          showOrUpdateWifiNotification(minutes);
        }
      }

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Show latest sticky notification before moving to background
        if (sessionStartTime) {
          const minutes = Math.floor((Date.now() - sessionStartTime) / 60000);
          showOrUpdateWifiNotification(minutes);
        }

        if (!backgroundMonitoringEnabled) {
          if (sessionStartTime) {
            console.log('App moved to background and background monitoring OFF. Ending wifi session without sync.');
            await endWifiSession(false);
          }
        }
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
  }, [syncAccumulatedTimeToBackend, backgroundMonitoringEnabled, sessionStartTime, endWifiSession]);

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
          .select('id, username, email, avatar_url, total_points, all_time_points, real_tree_redemption_pending')
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
            allTimePoints: updatedProfileData.all_time_points ?? (prevStats?.allTimePoints ?? 0),
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
    const newAllTimePoints = userStats.allTimePoints + Math.floor(durationMs / 60000);
    const hoursConnected = Math.floor(newTotalTime / 3600000); // Convert ms to hours
    const newTreeProgress = Math.min(hoursConnected, 100); // Cap progress at 100%
    const newLevel = Math.floor(hoursConnected / 100) + 1; // Level up every 100 hours
    setUserStats(prev => prev ? ({ 
      ...prev, 
      totalSchoolWifiTimeMs: newTotalTime, 
      pointsFromWifi: newPointsFromWifi,
      allTimePoints: newAllTimePoints,
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
    if (!session?.user) {
      const message = "You must be logged in to redeem a tree.";
      Alert.alert("Authentication Error", message);
      return { success: false, message };
    }

    try {
      console.log('Invoking request-real-tree function...');
      const { data, error } = await supabase.functions.invoke('request-real-tree');
      if (error) {
        throw error;
      }
      if (data?.error) {
        console.error('request-real-tree responded with logical error:', data.error);
        Alert.alert('Redemption Failed', data.error);
        return { success: false, message: data.error };
      }
      console.log('request-real-tree function successful:', data.message);
      Alert.alert('Success!', 'Your request to plant a real tree has been received. The change will be reflected shortly.');

      await fetchUserData();

      return { success: true, message: data.message };
    } catch (error: any) {
      // Handle HTTP status errors for Functions
      if (error?.name === 'FunctionsHttpError' && error?.context?.response) {
        try {
          const errJson = await error.context.response.json();
          const errMsg = errJson?.error || 'An error occurred.';
          console.error('Function HTTP error:', errMsg);
          Alert.alert('Redemption Failed', errMsg);
          return { success: false, message: errMsg };
        } catch {
          // fallback
        }
      }
      console.error('Error redeeming real tree:', error.message || error);
      Alert.alert('Error', `An unexpected error occurred: ${error.message || error}`);
      return { success: false, message: error.message || 'Unknown error' };
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
        const transformed = (data as any[]).map(row => ({
          ...row,
          total_points: row.all_time_points ?? row.total_points, // for backward compatibility
        })) as LeaderboardEntry[];
        setLeaderboardData(transformed);
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
      
      const perLevel = treeCostPoints / 10;
      const newLevel = Math.floor(newTotalPoints / perLevel) + 1;
      const newProgress = (newTotalPoints % perLevel) / perLevel * 100;
      
      return {
        ...prevStats,
        totalPoints: newTotalPoints,
        treeLevel: newLevel,
        treeProgress: newProgress,
      };
    });
  };

  const updateBackgroundMonitoring = useCallback(async (enabled: boolean) => {
    setBackgroundMonitoringEnabled(enabled);
    await SafeAsyncStorage.setItem(STORAGE_KEYS.BACKGROUND_MONITORING_ENABLED, enabled);
  }, []);

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
    updateBackgroundMonitoring,
  }), [
    userProfile, userStats, leaderboardData, collectedRealTrees,
    isLoading, isLoadingLeaderboard, isLoadingCollectedTrees,
    fetchUserData, updateUserProfile, updateUserPoints, recordConnectionTime,
    getConnectedTimeToSchoolWiFi, redeemRealTree, sessionStartTime,
    lastLogUpdateTime, fetchLeaderboard, fetchCollectedRealTrees,
    dailyConnectionTimeLog,
    startWifiSession, endWifiSession,
    updateBackgroundMonitoring
  ]);

  // --- Initial load of daily time & session state ---
  useEffect(() => {
    if (session?.user) {
      fetchUserData();
      loadDailyTime();
      loadSessionStateFromStorage();
    }
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) return;

    // Monitor Wi-Fi connectivity to auto start / stop sessions while app is foregrounded.
    const unsubscribeNet = NetInfo.addEventListener(state => {
      let currentSsid: string | null = null;
      let currentBssid: string | null = null;
      if (state.isConnected && state.type === 'wifi' && state.details) {
        // @ts-ignore netinfo typed as any
        currentSsid = state.details.ssid || null;
        // @ts-ignore
        currentBssid = state.details.bssid || null;
      }
      const isSchoolSsid = currentSsid ? SCHOOL_WIFI_SSIDS.map(s=>s.toLowerCase()).includes(currentSsid.toLowerCase()) : false;
      const isSchoolBssid = currentBssid ? SCHOOL_WIFI_BSSIDS.includes(currentBssid.toLowerCase()) : false;
      const connectedToSchoolWifi = isSchoolSsid || isSchoolBssid;

      if (connectedToSchoolWifi && sessionStartTime === null) {
        // Start a new session locally; backend credit occurs via periodic sync.
        startWifiSession();
      }

      if (!connectedToSchoolWifi && sessionStartTime !== null) {
        endWifiSession(true); // Sync remaining time
      }
    });

    return () => unsubscribeNet();
  }, [session?.user, sessionStartTime, startWifiSession, endWifiSession]);

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