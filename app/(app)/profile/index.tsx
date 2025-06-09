import { FontAwesome } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '../../components/layouts';
import { Colors, Fonts, FontSizes } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useUserData } from '../../contexts/UserDataContext';
import { ImagePickerAsset, useImagePicker } from '../../hooks/useImagePicker';
import { supabase } from '../../services/supabase';
import { formatPoints } from '../../utils';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, isLoading: authIsLoading } = useAuth();
  const { userProfile, userStats, isLoading: userDataIsLoading, fetchUserData, updateUserProfile } = useUserData();
  const [refreshing, setRefreshing] = useState(false);
  const { pickImage, error: imagePickerError } = useImagePicker();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const insets = useSafeAreaInsets();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchUserData();
    } catch (error) {
      console.error("Failed to refresh user data on profile screen:", error);
    }
    setRefreshing(false);
  }, [fetchUserData]);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await signOut();
        },
        style: "destructive",
      },
    ]);
  };

  const uploadAndLinkImage = async (asset: ImagePickerAsset) => {
    if (!user?.id) return;
    setIsUploadingImage(true);
    try {
      const imageUri = asset.uri;
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      const originalFileName = asset.fileName || imageUri.split('/').pop() || 'avatar.jpg';
      const fileExt = originalFileName.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/avatar.${fileExt}`;

      console.log(`Uploading file to Supabase Storage: avatars/${filePath}`);
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: asset.mimeType || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error('Could not get public URL for avatar.');
      
      // Append a timestamp to the URL to bust the cache
      const cacheBustedUrl = `${publicUrl}?t=${new Date().getTime()}`;
      console.log('New avatar public URL (cache-busted):', cacheBustedUrl);
      
      await updateUserProfile({ avatarUrl: cacheBustedUrl });
      // The alert in `updateUserProfile` is now the single source of truth.
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile picture.');
      console.error("Error uploading avatar:", e);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAvatarChange = async () => {
    const imageAsset = await pickImage();
    if (imageAsset) {
      await uploadAndLinkImage(imageAsset);
    }
  };

  useEffect(() => {
    if (imagePickerError) {
      Alert.alert('Image Picker Error', imagePickerError);
    }
  }, [imagePickerError]);
  
  const profileOptions = [
    {
      id: 'settings',
      label: 'Settings',
      icon: 'cog',
      action: () => router.push('/(app)/profile/settings'),
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'sign-out',
      action: handleLogout,
      color: Colors.error,
    },
  ];

  if (userDataIsLoading && !userProfile) {
    return (
      <ScreenWrapper withScrollView={false} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </ScreenWrapper>
    );
  }

  if (!userProfile || !userStats) {
    return (
      <ScreenWrapper 
        withScrollView={false} 
        style={styles.errorContainer}
        scrollViewProps={{
          refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }}
      >
        <Stack.Screen options={{ title: 'Profile' }} />
        <FontAwesome name="exclamation-triangle" size={50} color={Colors.error} />
        <Text style={styles.errorText}>Could not load user profile.</Text>
        <Text style={styles.errorSubText}>Please check your connection or try again later.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
         <TouchableOpacity style={styles.logoutButtonError} onPress={handleLogout}>
          <Text style={styles.logoutButtonErrorText}>Logout</Text>
        </TouchableOpacity>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper 
      applyTopInset={false}
      scrollViewProps={{
        refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }}
    >
      <Stack.Screen options={{ title: 'Profile' }} />
      <StatusBar style="light" />

      <View style={[
        styles.profileHeader,
        { paddingTop: insets.top + 20, paddingBottom: 30 }
      ]}>
        <TouchableOpacity onPress={handleAvatarChange} style={styles.avatarContainer} disabled={isUploadingImage || userDataIsLoading}>
          <Image source={{ uri: userProfile.avatarUrl || 'https://via.placeholder.com/120/cccccc/FFFFFF?text=User' }} style={styles.avatar} />
          <View style={styles.avatarEditIconContainer}>
            {isUploadingImage ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <FontAwesome name="camera" size={16} color={Colors.white} />
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{userProfile.name || "Anonymous User"}</Text>
        {userProfile?.studentId && (
          <Text style={styles.studentIdText}>{`Student ID: ${userProfile.studentId}`}</Text>
        )}
        <Text style={styles.userDetails}>{userProfile.email}</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatBox label="Total Points" value={formatPoints(userStats.totalPoints)} icon="star" />
        <StatBox label="Tree Level" value={userStats.treeLevel.toString()} icon="tree" />
      </View>

      <View style={styles.optionsContainer}>
        {profileOptions.map((option) => (
          <TouchableOpacity 
            key={option.id} 
            style={styles.optionButton} 
            onPress={option.action} 
            disabled={authIsLoading && option.id === 'logout'}
          >
            { (authIsLoading && option.id === 'logout') ? 
                <ActivityIndicator size="small" color={option.color || Colors.textLight} style={styles.optionIcon}/> :
                <FontAwesome name={option.icon as any} size={22} color={option.color || Colors.textLight} style={styles.optionIcon} />
            }
            <Text style={[styles.optionText, option.color ? {color: option.color} : {}]}>{option.label}</Text>
            {option.id !== 'logout' && 
              <FontAwesome name="chevron-right" size={18} color={Colors.grayDark} />
            }
          </TouchableOpacity>
        ))}
      </View>

    </ScreenWrapper>
  );
}

const StatBox = ({label, value, icon}: {label: string, value: string, icon: any}) => (
    <View style={styles.statBox}>
        <FontAwesome name={icon} size={24} color={Colors.primary} style={styles.statIcon} />
        <View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: FontSizes.md,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLight,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, 
  },
  errorText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Poppins.SemiBold,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  errorSubText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginBottom: 15,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontFamily: Fonts.Poppins.SemiBold,
  },
  logoutButtonError: {
    backgroundColor: Colors.error,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  logoutButtonErrorText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontFamily: Fonts.Poppins.SemiBold,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: Colors.primary, 
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarEditIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 15,
  },
  avatar: {
    width: 110, 
    height: 110,
    borderRadius: 55, 
    borderWidth: 3,
    borderColor: Colors.primary,
    backgroundColor: Colors.grayMedium, 
  },
  userName: {
    fontSize: FontSizes.xxl, 
    fontFamily: Fonts.Poppins.Bold,
    color: Colors.white,
    marginBottom: 5,
  },
  userDetails: {
    fontSize: FontSizes.base, 
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLight,
    marginBottom: 3,
  },
  studentIdText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.white,
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 15,
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: Colors.white,
    paddingHorizontal: 15, 
    paddingVertical: 20,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statIcon: {
      marginRight: 10,
  },
  statValue: {
    fontSize: FontSizes.xl, 
    fontFamily: Fonts.Poppins.Bold,
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLighter,
    textTransform: 'uppercase',
  },
  optionsContainer: {
    marginHorizontal: 15,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
  },
  optionIcon: {
    marginRight: 20,
    width: 22, 
    textAlign: 'center',
  },
  optionText: {
    flex: 1,
    fontSize: FontSizes.md, 
    fontFamily: Fonts.Poppins.Medium,
    color: Colors.text,
  },
}); 