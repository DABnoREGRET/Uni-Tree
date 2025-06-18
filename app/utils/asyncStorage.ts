import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys constants
export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'hasCompletedOnboarding',
  CURRENT_USER_ID: 'currentUserId',
  NOTIFICATION_PREFERENCES: 'notificationPreferences',
  BACKGROUND_MONITORING_ENABLED: 'backgroundMonitoringEnabled',
  PERMISSIONS_REQUESTED: 'hasRequestedPermissions',
  // Add more keys as needed
} as const;

// Type-safe storage operations with error handling
export const SafeAsyncStorage = {
  async getItem<T = string>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      console.error(`Error reading from AsyncStorage [${key}]:`, error);
      return null;
    }
  },

  async setItem(key: string, value: any): Promise<boolean> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.error(`Error writing to AsyncStorage [${key}]:`, error);
      return false;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from AsyncStorage [${key}]:`, error);
      return false;
    }
  },

  async multiGet(keys: string[]): Promise<Record<string, any>> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result: Record<string, any> = {};
      
      pairs.forEach(([key, value]) => {
        if (value !== null) {
          try {
            result[key] = JSON.parse(value);
          } catch {
            result[key] = value;
          }
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error in multiGet from AsyncStorage:', error);
      return {};
    }
  },

  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      return false;
    }
  }
};

// Storage migration utility
export async function migrateStorageKeys() {
  const migrations = [
    // Example: Migrate old key to new key
    { from: '@SchoolWifiSessionStartTime', to: '@SchoolWifiSessionStartTime_default' },
    { from: '@LastBackgroundUpdateTime', to: '@LastBackgroundUpdateTime_default' },
  ];

  for (const { from, to } of migrations) {
    try {
      const oldValue = await AsyncStorage.getItem(from);
      if (oldValue !== null) {
        await AsyncStorage.setItem(to, oldValue);
        await AsyncStorage.removeItem(from);
        console.log(`Migrated storage key: ${from} -> ${to}`);
      }
    } catch (error) {
      console.error(`Failed to migrate storage key ${from}:`, error);
    }
  }
}

// User-specific storage key generator
export function getUserStorageKey(baseKey: string, userId: string): string {
  return `${baseKey}_${userId}`;
}

// Storage size management
export async function getStorageInfo() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    let totalSize = 0;
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += key.length + value.length;
      }
    }
    
    return {
      keyCount: keys.length,
      approximateSizeInBytes: totalSize,
      approximateSizeInKB: (totalSize / 1024).toFixed(2),
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return null;
  }
} 