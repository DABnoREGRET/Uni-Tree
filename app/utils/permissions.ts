import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { STORAGE_KEYS } from './asyncStorage';

/**
 * Requests all permissions the app needs on first launch.
 * Subsequent launches will skip requesting again (unless storage is cleared)
 */
export async function requestInitialPermissions() {
  try {
    const alreadyRequested = await AsyncStorage.getItem(STORAGE_KEYS.PERMISSIONS_REQUESTED);
    if (alreadyRequested === 'true') return;

    // ---- Location permission ---- //
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        await Location.requestForegroundPermissionsAsync();
      }
    } catch (err) {
      console.warn('Location permission request failed', err);
    }

    // ---- Notification permission ---- //
    try {
      const { status: notifStatus } = await Notifications.getPermissionsAsync();
      if (notifStatus !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    } catch (err) {
      console.warn('Notification permission request failed', err);
    }

    // Mark as requested so we don\'t ask again
    await AsyncStorage.setItem(STORAGE_KEYS.PERMISSIONS_REQUESTED, 'true');
  } catch (e) {
    console.error('Error while requesting initial permissions', e);
  }
} 