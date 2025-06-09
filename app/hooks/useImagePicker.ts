import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';

// Use ImagePickerAsset directly from expo-image-picker
export type { ImagePickerAsset } from 'expo-image-picker';

export interface UseImagePickerResult {
  pickImage: () => Promise<ImagePicker.ImagePickerAsset | null>;
  error: string | null;
  permissionGranted: boolean | null; // null if not yet determined, true/false after check
}

export const useImagePicker = (options?: ImagePicker.ImagePickerOptions): UseImagePickerResult => {
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const defaultOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1], // Square aspect ratio for avatars
    quality: 0.7, // Compress image slightly
    ...(options || {}),
  };

  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Sorry, we need camera roll permissions to make this work!'
        );
        setPermissionGranted(false);
        setError('Media library permission not granted.');
        return false;
      }
    }
    setPermissionGranted(true);
    return true;
  };

  const pickImage = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
    setError(null);

    const hasPermission = await requestPermission();
    if (!hasPermission) {
      return null;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync(defaultOptions);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0];
      }
      return null;
    } catch (e: any) {
      console.error("ImagePicker Error: ", e);
      setError(e.message || 'Failed to pick image.');
      Alert.alert('Error', 'Could not pick an image. Please try again.');
      return null;
    }
  };

  return { pickImage, error, permissionGranted };
}; 