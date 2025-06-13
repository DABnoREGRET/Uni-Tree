import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { registerBackgroundWifiMonitor } from './services/backgroundWifiMonitor';
import { STORAGE_KEYS } from './utils/asyncStorage';
import { requestNotificationPermissions } from './utils/notifications';
// import Swiper from 'react-native-swiper'; // Consider adding a swiper for multi-page onboarding

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  key: string;
  title: string;
  text: string;
  imageType: 'image' | 'icon' | 'image_and_icon' | 'permissions';
  imageSource?: any; // For Image
  iconName?: React.ComponentProps<typeof FontAwesome>['name']; // For FontAwesome icon
  secondaryImageSource?: any; // For greet_mascot on slide 3
  secondaryIconName?: React.ComponentProps<typeof FontAwesome>['name']; // For store icon on slide 3
  backgroundColor: string;
}

const onboardingSlides: OnboardingSlide[] = [
  {
    key: '1',
    title: 'Welcome to UniTree!',
    text: 'Connect to campus WiFi, grow your virtual tree, and earn real rewards.',
    imageType: 'image',
    imageSource: require('../assets/images/hello_mascot.png'),
    backgroundColor: '#FFCED3', // Light Pinkish
  },
  {
    key: '2',
    title: 'Grow your\nTree',
    text: 'The more you stay connected on campus, the more your unique tree flourishes.',
    imageType: 'icon',
    iconName: 'tree',
    backgroundColor: '#A5D6A7', // Light Mint Green
  },
  {
    key: '3',
    title: 'Redeem Rewards',
    text: 'Use your points to get exclusive discounts, university merch, and more!',
    imageType: 'image_and_icon',
    imageSource: require('../assets/images/greet_mascot.png'),
    secondaryIconName: 'shopping-bag', // Example store/gift icon
    backgroundColor: '#F4D06F', // Example Yellow/Orange
  },
  {
    key: '4',
    title: 'Enable Permissions',
    text: 'UniTree needs a few permissions to run smoothly. Please grant these permissions.',
    imageType: 'permissions' as any,
    backgroundColor: '#8EC5FC',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  // Permission states
  type PermState = 'granted' | 'denied' | 'undetermined';
  const [notifStatus, setNotifStatus] = useState<PermState>('undetermined');
  const [fgLocStatus, setFgLocStatus] = useState<PermState>('undetermined');
  const [bgLocStatus, setBgLocStatus] = useState<PermState>('undetermined');

  const allPermissionsGranted = fgLocStatus === 'granted' && bgLocStatus === 'granted';

  const refreshPermissionStatuses = async () => {
    const notifPerm = await Notifications.getPermissionsAsync();
    setNotifStatus(notifPerm.status);

    const fgLocPerm = await Location.getForegroundPermissionsAsync();
    setFgLocStatus(fgLocPerm.status);

    const bgLocPerm = await Location.getBackgroundPermissionsAsync();
    setBgLocStatus(bgLocPerm.status);
  };

  useEffect(() => {
    refreshPermissionStatuses();
  }, []);

  const requestAllPermissions = async () => {
    const notif = await requestNotificationPermissions(true);
    if (notif.granted) setNotifStatus('granted'); else setNotifStatus('denied');

    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    setFgLocStatus(fgStatus);

    if (fgStatus === 'granted') {
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      setBgLocStatus(bgStatus);
    }
  };

  const handleNext = async () => {
    if (currentIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // We're on permissions slide; attempt to ensure permissions then proceed
      if (allPermissionsGranted) {
        await handleGetStarted();
      } else {
        await requestAllPermissions();
        // Re-check after requesting
        const grantedNow = fgLocStatus === 'granted' && bgLocStatus === 'granted';
        if (grantedNow) {
          await handleGetStarted();
        }
      }
    }
  };

  const handleSkip = async () => {
    await handleGetStarted();
  };

  const handleGetStarted = async () => {
    try {
      // Request permissions in sequence so OS dialogs don't overlap
      await requestNotificationPermissions(true);

      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus === 'granted') {
        await Location.requestBackgroundPermissionsAsync();
      }

      // Register background WiFi monitor (handles its own permission checks too)
      await registerBackgroundWifiMonitor();
    } catch (err) {
      console.warn('[Onboarding] Permission request failed:', err);
    } finally {
      await saveOnboardingCompleted();
      router.replace('/(auth)/login');
    }
  };

  const saveOnboardingCompleted = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
    }
  };


  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;


  const renderItem = ({ item }: { item: OnboardingSlide }) => {
    const isPermissionSlide = item.imageType === 'permissions';

    return (
      <View
        style={[
          styles.slideContainer,
          {
            backgroundColor: item.backgroundColor,
            width,
            // Reduce bottom padding on permission slide so the rows are fully visible
            paddingBottom: isPermissionSlide ? height * 0.15 : undefined,
          },
        ]}
      >
        <View style={styles.illustrationContainer}>
          {item.imageType === 'image' && item.imageSource && (
            <Image source={item.imageSource} style={styles.mainImage} resizeMode="contain" />
          )}
          {item.imageType === 'icon' && item.iconName && (
            <FontAwesome name={item.iconName} size={width * 0.5} color="#FFFFFF" />
          )}
          {item.imageType === 'image_and_icon' && (
            <View style={styles.combinedImageContainer}>
              {item.imageSource && (
                <Image source={item.imageSource} style={styles.mascotImage} resizeMode="contain" />
              )}
              {item.secondaryIconName && (
                <FontAwesome
                  name={item.secondaryIconName}
                  size={width * 0.3}
                  color="#FFFFFF"
                  style={styles.secondaryIcon}
                />
              )}
            </View>
          )}
          {isPermissionSlide && (
            <View style={styles.permissionListContainer}>
              {renderPermissionRow(
                'Push Notifications (Optional)',
                'Allows UniTree to send study reminders, reward alerts, and important notices. You can say "Don\'t Allow" and still use the app.',
                notifStatus,
              )}
              {renderPermissionRow(
                'Location (Foreground)',
                "Required by the operating system so UniTree can read the Wi-Fi name (SSID) and confirm you're on campus. No GPS coordinates are stored.",
                fgLocStatus,
              )}
              {renderPermissionRow(
                'Location (Background)',
                'Lets UniTree keep counting your campus Wi-Fi time even if the app is closed. Uses low power and automatically stops when you log out.',
                bgLocStatus,
              )}
              <Text
                style={{
                  color: '#FFF',
                  fontSize: 12,
                  marginTop: 15,
                  opacity: 0.8,
                  textAlign: 'center',
                }}
              >
                You can revoke any permission later in your device settings, but some UniTree features may stop working.
              </Text>
            </View>
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.text}</Text>
        </View>
      </View>
    );
  };

  const renderPermissionRow = (title: string, subtitle: string, status: PermState) => {
    const icon = status === 'granted' ? 'check-circle' : status === 'denied' ? 'times-circle' : 'circle-o';
    const color = status === 'granted' ? '#4CAF50' : status === 'denied' ? '#F44336' : '#FFFFFFAA';
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
        <FontAwesome name={icon as any} size={24} color={color} style={{ marginRight: 15 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FFF', fontSize: 18, fontFamily: 'Poppins-SemiBold' }}>{title}</Text>
          <Text style={{ color: '#FFF', fontSize: 14, opacity: 0.9 }}>{subtitle}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={{ flex: 1 }}
      />

      {/* Progress dots at TOP */}
      <View style={styles.progressContainer}>
        {onboardingSlides.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === currentIndex ? styles.activeDot : {}]}
          />
        ))}
      </View>

      {/* Footer with navigation button */}
      <View style={styles.footer}>
        {currentIndex < onboardingSlides.length - 1 ? (
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText} numberOfLines={1} adjustsFontSizeToFit>
              Next
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={allPermissionsGranted ? handleSkip : requestAllPermissions}>
            <Text style={styles.buttonText} numberOfLines={1} adjustsFontSizeToFit>
              {allPermissionsGranted ? 'Get Started' : 'Continue'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFCED3',
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start', // Align content from top for consistent title position
    paddingHorizontal: 30,
    paddingTop: height * 0.1,
    paddingBottom: height * 0.25, // Make space for footer
  },
  illustrationContainer: {
    width: width * 0.85,
    height: height * 0.40, // Slightly less than half of the screen height
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 65, // Increase margin to move titles & subtitles down
  },
  mainImage: {
    width: '90%',
    height: '90%',
  },
  combinedImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  mascotImage: {
    width: width * 0.4,
    height: height * 0.3,
  },
  secondaryIcon: {
    // marginLeft: 10, // Add some space if needed
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  title: {
    fontSize: 36, // Adjusted from Figma 'Welcome Gre...!' (58px)
    fontFamily: 'Grandstander-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40, // Adjusted line height
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18, // Adjusted from Figma 'alo alo alo...' (28px)
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.9,
    marginBottom: 40,

  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.20, // Consistent with paddingBottom of slideContainer
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 30, // Padding for button from edge
    paddingHorizontal: 30,
  },
  dotsContainer: {
    flexDirection: 'row',
    // This style is now repurposed for the top indicator, spacing handled by progressContainer
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 12, // Slightly larger active dot
    height: 12,
    borderRadius: 6,
  },
  button: {
    backgroundColor: '#A2C00E',
    height: 56, // Consistent height
    borderRadius: 18,
    width: width * 0.72, // Slightly wider, consistent across all labels
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    fontSize: 20,
    fontFamily: 'Grandstander-Bold',
    color: '#FFFFFF',
    fontWeight: '600',
  },
  permissionListContainer: {
    marginTop: 20, // Push the list a bit lower
  },
  progressContainer: {
    position: 'absolute',
    top: height * 0.06, // roughly 6% from top, adjust as needed
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
}); 