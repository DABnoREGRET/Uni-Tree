import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Colors } from '../constants'; // Assuming Colors is in constants

// Configure notification handler for how notifications are handled when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Be less intrusive for certain notification types when app is in foreground
    const isWifiNotification = notification.request.content.data?.type === 'wifi';
    const isSystemNotification = notification.request.content.data?.type === 'system';
    
    return {
      shouldShowAlert: !isWifiNotification, // Don't show alert for WiFi notifications in foreground
      shouldPlaySound: !isWifiNotification && !isSystemNotification, // No sound for WiFi/system notifications
      shouldSetBadge: false, //iOS only
      shouldShowBanner: true, // Added for iOS NotificationBehavior
      shouldShowList: true,   // Added for iOS NotificationBehavior
    };
  },
});

export const requestNotificationPermissions = async (showAlert = false) => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Notification permissions denied');
      if (showAlert) {
        // Import Alert from react-native in the file that calls this with showAlert=true
        return { granted: false, showSettings: true };
      }
      return { granted: false, showSettings: false };
    }
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'UniTree Notifications',
        importance: Notifications.AndroidImportance.HIGH, // Changed from MAX to be less intrusive
        vibrationPattern: [0, 250, 250, 250],
        lightColor: Colors.primary || '#FF231F7C',
        sound: 'default',
      });
    }
    
    return { granted: true, showSettings: false };
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return { granted: false, showSettings: false };
  }
};

interface ScheduleNotificationParams {
  title: string;
  body: string;
  data?: Record<string, any>;
  trigger?: Notifications.NotificationTriggerInput;
  identifier?: string; // To allow cancelling specific repeating notifications
}

export const scheduleLocalNotification = async ({
  title,
  body,
  data,
  trigger = null, // Changed default trigger to null for immediate display
  identifier,
}: ScheduleNotificationParams) => {


  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        data,
        sound: 'default', // Ensure you have a default sound or remove for silent
      },
      trigger,
    });
    console.log('Notification scheduled with ID or identifier:', identifier || notificationId);
    return identifier || notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

export const cancelNotificationByIdentifier = async (identifier: string) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log('Cancelled notification with identifier:', identifier);
  } catch (error) {
    console.error('Error cancelling notification by identifier:', error, identifier);
  }
};

export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Cancelled all scheduled notifications');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
};

// Example for daily repeating notification at a specific time (e.g., 9 AM)
// The identifier is important for being able to cancel/update it later.
export const DAILY_REMINDER_IDENTIFIER = 'daily-app-reminder';

export const scheduleDailyReminder = async (
  title: string, 
  body: string, 
  hour: number, 
  minute: number
) => {
  // Make sure permissions are granted before calling this.
  // Consider cancelling any existing one first if the time/content might change
  await cancelNotificationByIdentifier(DAILY_REMINDER_IDENTIFIER);

  console.log(`Scheduling daily reminder for ${hour}:${minute}`);
  try {
    await scheduleLocalNotification({
      identifier: DAILY_REMINDER_IDENTIFIER,
      title,
      body,
      data: { type: 'daily_reminder', navigateTo: '/(app)/home' }, // Example data
      trigger: {
        hour: hour,
        minute: minute,
        repeats: true, // repeats is valid for CalendarTriggerInput that repeats daily
      } as Notifications.CalendarTriggerInput, // Explicitly cast to CalendarTriggerInput
    });
    console.log('Daily reminder scheduled with identifier:', DAILY_REMINDER_IDENTIFIER);
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
  }
};

// Call this on app startup, e.g., in your root layout or main App component
export const initializeLocalNotifications = async () => {
  const permissionResult = await requestNotificationPermissions();
  if (permissionResult.granted) {
    console.log('Notification permissions granted.');
    // Daily reminders should only be scheduled if user explicitly opts in
    // Check user preferences before scheduling any notifications
  } else {
    console.log('Notification permissions denied or not yet requested.');
  }
};

// Placeholder for formatTimeAgo
export const formatTimeAgo = (dateString: string): string => {
  // Basic placeholder logic
  const date = new Date(dateString);
  const now = new Date();
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};

// Placeholder for getNotificationTypeColor
export const getNotificationTypeColor = (
  type: 'info' | 'reward' | 'alert' | 'tree' | 'system' | 'wifi' | 'levelup' | 'reminder',
  is_read: boolean
): string => {
  if (!is_read) {
    switch (type) {
      case 'reward': return Colors.orangeWarning; // Example: more vibrant for unread rewards
      case 'alert': return Colors.error;
      default: return Colors.primary;
    }
  }
  // Read colors (more muted)
  switch (type) {
    case 'reward': return Colors.success; // Muted green for read reward
    case 'alert': return Colors.warning; // Muted orange for read alert
    default: return Colors.textLight;
  }
}; 