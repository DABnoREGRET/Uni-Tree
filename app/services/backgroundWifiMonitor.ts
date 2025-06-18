import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as BackgroundTask from 'expo-background-task';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { SCHOOL_WIFI_BSSIDS, SCHOOL_WIFI_SSIDS } from '../constants/Config';
import { SafeAsyncStorage, STORAGE_KEYS } from '../utils/asyncStorage';
import { supabase } from './supabase';

const WIFI_MONITOR_TASK_NAME = 'wifi-monitor-task';

// Helper to get today's date as YYYY-MM-DD
const getTodayDateString = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('get-time');
    if (error) {
      throw new Error(`Failed to fetch secure time from server: ${error.message}`);
    }
    const nowUtc = new Date(data.now);
    nowUtc.setUTCHours(nowUtc.getUTCHours() + 7);
    return nowUtc.toISOString().split('T')[0];
  } catch (e) {
    console.error("[Background] Failed to fetch server time, falling back to device time UTC. Error:", e);
    return new Date().toISOString().split('T')[0];
  }
};

// Helper to log points (similar to recordConnectionTime in UserDataContext)
const logConnectionTime = async (durationMs: number, dailyLogKey: string) => {
  if (durationMs <= 0) return;

  const todayStr = await getTodayDateString();
  
  // Update daily accumulated time
  try {
    const storedDailyTime = await AsyncStorage.getItem(dailyLogKey);
    let currentDailyTime: { date: string; totalTimeMs: number } = storedDailyTime ? JSON.parse(storedDailyTime) : { date: todayStr, totalTimeMs: 0 };

    if (currentDailyTime.date !== todayStr) {
        currentDailyTime = { date: todayStr, totalTimeMs: 0 };
    }
    currentDailyTime.totalTimeMs += durationMs;
    await AsyncStorage.setItem(dailyLogKey, JSON.stringify(currentDailyTime));
    console.log(`[Background] Logged ${durationMs}ms. New daily total: ${currentDailyTime.totalTimeMs}`);
  } catch (e) {
    console.error('[Background] Failed to update daily connection time in AsyncStorage:', e);
  }

  // NOTE: This background task only persists the *duration* of the session locally.
  // The points will be calculated and updated to Supabase when the app is foregrounded
  // and the data context syncs with the backend.
};

const formatDuration = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
};

const BACKGROUND_NOTIFICATION_ID = 'wifi-session-notification';
const BACKGROUND_NOTIFICATION_CHANNEL = 'timer-updates';

async function ensureNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(BACKGROUND_NOTIFICATION_CHANNEL, {
    name: 'UniTree Timer',
    importance: Notifications.AndroidImportance.LOW,
    showBadge: false,
    sound: undefined,
  });
}

// Define the background task
TaskManager.defineTask(WIFI_MONITOR_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[Background Task] Error:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }

  console.log('[Background Task] Running WiFi monitor...');
  
  const currentUserId = await AsyncStorage.getItem('currentUserId');
  if (!currentUserId) {
    console.log('[Background Task] No user logged in, stopping task.');
    // Clean up any old non-user-specific keys if they exist
    const oldSessionKey = '@SchoolWifiSessionStartTime';
    const oldKeyExists = await AsyncStorage.getItem(oldSessionKey);
    if (oldKeyExists) {
        await AsyncStorage.removeItem(oldSessionKey);
        await AsyncStorage.removeItem('@LastBackgroundUpdateTime');
    }
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
  
  const SESSION_START_TIME_STORAGE_KEY = `@SchoolWifiSessionStartTime_${currentUserId}`;
  const DAILY_CONNECTION_TIME_STORAGE_KEY = `@DailyConnectionTimeLog_${currentUserId}`;
  const LAST_LOG_UPDATE_TIME_KEY = `@LastBackgroundUpdateTime_${currentUserId}`;

  try {
    // 1. Fetch current WiFi status
    let currentSsid: string | null = null;
    let currentBssid: string | null = null;
    const netInfoState = await NetInfo.fetch();

    if (netInfoState.isConnected && netInfoState.type === 'wifi' && netInfoState.details) {
      // On iOS, ssid/bssid are only available if the app has the right entitlements
      // and location services are enabled and authorized.
      currentSsid = netInfoState.details.ssid || null;
      currentBssid = netInfoState.details.bssid || null;
    }
    
    const isSchoolSsidMatch = currentSsid ? SCHOOL_WIFI_SSIDS.map(s=>s.toLowerCase()).includes(currentSsid.toLowerCase()) : false;
    const isSchoolBssidMatch = currentBssid ? SCHOOL_WIFI_BSSIDS.includes(currentBssid.toLowerCase()) : false;
    const isConnectedToSchoolWifi = isSchoolSsidMatch || isSchoolBssidMatch;

    // 2. Get persisted session state from storage
    const storedStartTime = await AsyncStorage.getItem(SESSION_START_TIME_STORAGE_KEY);
    const sessionStartTime = storedStartTime ? Number(storedStartTime) : null;
    const storedLastUpdateTime = await AsyncStorage.getItem(LAST_LOG_UPDATE_TIME_KEY);
    const lastUpdateTime = storedLastUpdateTime ? Number(storedLastUpdateTime) : null;

    console.log(`[Background] School WiFi: ${isConnectedToSchoolWifi}, Session Active: ${!!sessionStartTime}`);

    const now = Date.now();

    if (isConnectedToSchoolWifi) {
      if (sessionStartTime === null) {
        // Just connected. Start a new session.
        await AsyncStorage.setItem(SESSION_START_TIME_STORAGE_KEY, String(now));
        await AsyncStorage.setItem(LAST_LOG_UPDATE_TIME_KEY, String(now));
        console.log('[Background] New session started.');
        // Optionally notify user session started.
      } else {
        // Session is ongoing. Log the delta since the last update.
        const lastUpdate = lastUpdateTime || sessionStartTime;
        const durationDelta = now - lastUpdate;
        if (durationDelta > 5000) { // Only log if some time has passed
            await logConnectionTime(durationDelta, DAILY_CONNECTION_TIME_STORAGE_KEY);
            await AsyncStorage.setItem(LAST_LOG_UPDATE_TIME_KEY, String(now)); // Update the last update time
            console.log(`[Background] Session ongoing. Logged delta of ${durationDelta}ms.`);
        }
        
        // Update the persistent notification
        await ensureNotificationChannel();
        // Dismiss previous notification to avoid stacking
        await Notifications.dismissNotificationAsync(BACKGROUND_NOTIFICATION_ID).catch(() => {});
        const totalSessionTime = now - sessionStartTime;
        await Notifications.scheduleNotificationAsync({
          identifier: BACKGROUND_NOTIFICATION_ID,
          content: {
            title: 'UniTree Session Active',
            body: `Connected for: ${formatDuration(totalSessionTime)}`,
            sticky: true,
            vibrate: [],
            data: { type: 'wifi' },
          },
          trigger: null,
        });
      }
    } else { // Not connected to school wifi
      if (sessionStartTime !== null) {
        // Just disconnected. Log the final delta and clear session.
        const lastUpdate = lastUpdateTime || sessionStartTime;
        const durationDelta = now - lastUpdate;
        if (durationDelta > 0) {
          await logConnectionTime(durationDelta, DAILY_CONNECTION_TIME_STORAGE_KEY);
        }
        await AsyncStorage.removeItem(SESSION_START_TIME_STORAGE_KEY);
        await AsyncStorage.removeItem(LAST_LOG_UPDATE_TIME_KEY);
        // Dismiss the persistent notification
        await Notifications.dismissNotificationAsync(BACKGROUND_NOTIFICATION_ID).catch(()=>{});
        console.log(`[Background] Session ended. Logged final delta of ${durationDelta}ms.`);
        // Optionally notify user session ended.
      }
      // If not connected and no session, do nothing.
    }
  } catch (e) {
    console.error('[Background Task] Error during WiFi check:', e);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }

  return BackgroundTask.BackgroundTaskResult.Success;
});

export async function registerBackgroundWifiMonitor(): Promise<boolean> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(WIFI_MONITOR_TASK_NAME);
  if (isRegistered) {
    console.log('Background WiFi monitor already registered.');
    await SafeAsyncStorage.setItem(STORAGE_KEYS.BACKGROUND_MONITORING_ENABLED, true);
    return true;
  }

  // Check permissions WITHOUT prompting. We want to avoid showing permission dialogs
  const { status: foregroundLocationStatus } = await Location.getForegroundPermissionsAsync();
  const { status: backgroundLocationStatus } = await Location.getBackgroundPermissionsAsync();
  const { status: notificationStatus } = await Notifications.getPermissionsAsync();

  // Only proceed if the user has granted everything already (most likely after the onboarding step)
  if (foregroundLocationStatus !== 'granted' ||
      backgroundLocationStatus !== 'granted' ||
      notificationStatus !== 'granted') {
    console.log('[BackgroundWifiMonitor] Missing permissions – skipping task registration for now.');
    return false;
  }

  // All permissions are granted – register the task with system scheduler (WorkManager/BGTaskScheduler)
  try {
    await BackgroundTask.registerTaskAsync(WIFI_MONITOR_TASK_NAME, {
      minimumInterval: 10, // in minutes – platform minimum (Android), ignored on iOS but required
    });
    console.log('Background WiFi monitor registered with BackgroundTask API.');
    await SafeAsyncStorage.setItem(STORAGE_KEYS.BACKGROUND_MONITORING_ENABLED, true);
    return true;
  } catch (e) {
    console.error('Failed to register Background WiFi monitor:', e);
    return false;
  }
}

export async function unregisterBackgroundWifiMonitor() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(WIFI_MONITOR_TASK_NAME);
  if (isRegistered) {
    try {
      await BackgroundTask.unregisterTaskAsync(WIFI_MONITOR_TASK_NAME);
      console.log('Background WiFi monitor unregistered.');
      await SafeAsyncStorage.setItem(STORAGE_KEYS.BACKGROUND_MONITORING_ENABLED, false);
    } catch (e) {
      console.error('Failed to unregister Background WiFi monitor:', e);
    }
  }
} 