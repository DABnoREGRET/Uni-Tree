import { FontAwesome } from '@expo/vector-icons'; // Or other icon library
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Dimensions, Image, Linking, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '../../components/layouts';
import { Colors, Fonts, FontSizes } from '../../constants';
import { GEOFENCE_RADIUS, SCHOOL_LOCATION, SCHOOL_WIFI_BSSIDS, SCHOOL_WIFI_SSIDS, TREE_COST_POINTS } from '../../constants/Config';
import { useUserData } from '../../contexts/UserDataContext';
import { useConnectionTimer } from '../../hooks/useConnectionTimer';
import { formatPoints } from '../../utils';
import { getDistance } from '../../utils/location';
import { scheduleLocalNotification } from '../../utils/notifications';
import { getTreeImageForLevel } from '../../utils/treeUtils';

// Limit the width used for scaling so that UI elements don\'t become excessively large on tablets like iPad
const deviceWidth = Dimensions.get("window").width;
const screenWidth = Math.min(deviceWidth, 428); // 428 is roughly the width of larger iPhones in points

// Configure NetInfo to fetch SSID on iOS
if (Platform.OS === 'ios') {
  NetInfo.configure({
    shouldFetchWiFiSSID: true,
  });
}

interface DailyTimeProgressProps {
  day: string;
  connectedTime: number; // in minutes
  targetTime: number; // in minutes
  size?: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    userProfile, 
    userStats, 
    isLoading, 
    fetchUserData, 
    sessionStartTime,
    startWifiSession,
    endWifiSession,
  } = useUserData();
  const [refreshing, setRefreshing] = useState(false);
  const [isConnectedToSchoolWifi, setIsConnectedToSchoolWifi] = useState(false);
  const [currentSsid, setCurrentSsid] = useState<string | null>(null);
  const [wifiLoading, setWifiLoading] = useState(true);
  const [previousConnectionState, setPreviousConnectionState] = useState<boolean | null>(null);
  const [connectionMethod, setConnectionMethod] = useState<string | null>(null);
  
  // Use the centralized timer hook
  const { timeConnectedTodayDisplay, pointsToday } = useConnectionTimer();

  const checkWifiStatus = useCallback(async () => {
    setWifiLoading(true);
    try {
      let isConnectedNow = false;
      let ssid: string | null = null;
      let bssid: string | null = null;
      let reason = '';
      let netInfoState: NetInfoState | null = null;

      if (Platform.OS === 'ios') {
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
          status = newStatus;
          if (status !== 'granted') {
            setCurrentSsid(null);
            setIsConnectedToSchoolWifi(false);
            setConnectionMethod(null);
            scheduleLocalNotification({
              title: "Location Permission Needed",
              body: "UniTree needs location access to detect school WiFi. Please grant permission in Settings.",
            });
          }
        }
        if (status === 'granted') {
          // Activating location services can help in retrieving Wi-Fi details on iOS.
          netInfoState = await NetInfo.fetch();
          console.log('[iOS WiFi Check] NetInfo state:', JSON.stringify(netInfoState, null, 2));
          if (netInfoState.isConnected && netInfoState.type === 'wifi' && netInfoState.details) {
            ssid = netInfoState.details.ssid || null;
            bssid = netInfoState.details.bssid || null;
          }
        } else {
          setCurrentSsid(null);
          setIsConnectedToSchoolWifi(false);
          setConnectionMethod(null);
        }
      } else {
        netInfoState = await NetInfo.fetch();
        if (netInfoState.isConnected && netInfoState.type === 'wifi' && netInfoState.details) {
          ssid = netInfoState.details.ssid || null;
          bssid = netInfoState.details.bssid || null;
        }
      }

      console.log(`[WiFi Check] Detected SSID: ${ssid}, BSSID: ${bssid}`);
      setCurrentSsid(ssid || null);
      const lowerCaseSsid = ssid ? ssid.toLowerCase() : null;
      const lowerCaseSchoolSsids = SCHOOL_WIFI_SSIDS.map(s => s.toLowerCase());
      const isSchoolSsid = lowerCaseSsid ? lowerCaseSchoolSsids.includes(lowerCaseSsid) : false;
      const isSchoolBssid = bssid ? SCHOOL_WIFI_BSSIDS.includes(bssid.toLowerCase()) : false;
      
      if (isSchoolSsid || isSchoolBssid) {
        isConnectedNow = true;
        reason = `WiFi (${ssid || 'details unavailable'})`;
      }


      // --- Geofencing Fallback ---
      if (!isConnectedNow) {
        console.log('[Geofence] WiFi check failed, attempting geofence fallback.');
        try {
          // Ensure we have permission one last time
          let { status } = await Location.getForegroundPermissionsAsync();
          if (status === 'granted') {
            const currentPosition = await Location.getCurrentPositionAsync({});
            const distance = getDistance(
              currentPosition.coords.latitude,
              currentPosition.coords.longitude,
              SCHOOL_LOCATION.latitude,
              SCHOOL_LOCATION.longitude
            );
            console.log(`[Geofence] Distance to school: ${distance.toFixed(2)} meters`);
            if (distance <= GEOFENCE_RADIUS) {
              isConnectedNow = true;
              reason = 'Geofence';
              console.log('[Geofence] User is within the school radius.');
            } else {
              console.log('[Geofence] User is outside the school radius.');
            }
          } else {
            console.log('[Geofence] Location permission not granted, cannot perform check.');
          }
        } catch (locationError) {
          console.error('[Geofence] Error getting location for fallback check:', locationError);
        }
      }
      
      console.log(`[Check] Is School Connected: ${isConnectedNow}, Method: ${reason}`);
      setIsConnectedToSchoolWifi(isConnectedNow);
      setConnectionMethod(reason);

      // --- Session Management Logic ---
      if (isConnectedNow) {
        if (!sessionStartTime) {
          console.log('[Home] Starting new WiFi session...');
          await startWifiSession();
          // Only notify when actually connecting (not on initial check)
          if (previousConnectionState === false) {
            scheduleLocalNotification({
              title: "WiFi Session Started",
              body: "Your UniTree timer is now running!",
            });
          }
        }
      } else {
        if (sessionStartTime) {
          console.log('[Home] Ending WiFi session...');
          await endWifiSession();
          // Only notify when actually disconnecting (not on initial check)
          if (previousConnectionState === true) {
            scheduleLocalNotification({
              title: "WiFi Session Ended",
              body: "You've disconnected from the school WiFi. Your timer has paused.",
            });
          }
        }
      }

      // Update previous state after handling notifications
      setPreviousConnectionState(isConnectedNow);

    } catch (error) {
      // Avoid alerting for connection checks, as they can happen frequently.
      // A silent console log is better here.
      console.error("Silent Check: Failed to check WiFi status:", error);
      if (isConnectedToSchoolWifi) setIsConnectedToSchoolWifi(false);
      if (currentSsid) setCurrentSsid(null);
      setConnectionMethod(null);
    } finally {
      setWifiLoading(false);
    }
  }, [sessionStartTime, startWifiSession, endWifiSession, previousConnectionState, isConnectedToSchoolWifi, currentSsid]);

  useEffect(() => {
    checkWifiStatus(); // Initial check
    
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      console.log("Network state changed:", state.type, state.isConnected);
      checkWifiStatus();
    });

    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkWifiStatus();
      }
    });

    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [checkWifiStatus]);

  // Timer logic is now handled by useConnectionTimer hook

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchUserData(), checkWifiStatus()]);
    } catch (error) {
      console.error("Failed to refresh home screen:", error);
    }
    setRefreshing(false);
  }, [fetchUserData, checkWifiStatus]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good Morning,`;
    if (hour < 18) return `Good Afternoon,`;
    return `Good Evening,`;
  };
  
  const getUserFirstName = () => {
    return userProfile?.name ? userProfile.name.split(' ')[0] : 'User';
  }

  const handleNotificationPress = () => {
    router.push('/(app)/notifications');
  };

  const handleWifiSettingsPress = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('App-Prefs:WIFI');
    } else {
      Linking.sendIntent('android.settings.WIFI_SETTINGS');
    }
  };

  if (isLoading && !userProfile && !userStats) {
    return (
      <ScreenWrapper withScrollView={false} style={styles.loadingContainer}>
        <Stack.Screen options={{ headerRight: () => null, headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </ScreenWrapper>
    );
  }

  if (!userProfile || !userStats) {
    return (
      <ScreenWrapper withScrollView={false} style={styles.errorContainer}>
        <Stack.Screen options={{ headerRight: () => null, headerShown: false }} />
        <FontAwesome name="exclamation-triangle" size={50} color={Colors.error} />
        <Text style={styles.errorText}>Could not load dashboard data.</Text>
        <Text style={styles.errorSubText}>Please check your connection or try again later.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </ScreenWrapper>
    );
  }

  return (
    <View style={styles.screenWrapperBg}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={[
        styles.customHeader,
        { paddingTop: insets.top + 15, paddingBottom: 15 }
      ]}>
        <View style={styles.headerLeft}>
          <Image 
            source={{ uri: userProfile.avatarUrl || 'https://via.placeholder.com/60/FFFFFF/CCCCCC?text=' }} 
            style={styles.headerAvatar} 
          />
          <View>
            <Text style={styles.headerWelcomeText}>{getGreeting()}</Text>
            <Text style={styles.headerUserNameText}>{getUserFirstName()}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleNotificationPress} style={styles.notificationButtonContainer}>
          <FontAwesome name="bell-o" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScreenWrapper 
        applyTopInset={false}
        contentContainerStyle={[styles.screenWrapperContent, {paddingBottom: insets.bottom + 90}]}
        scrollViewProps={{
          refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }}
      >
        {/* WiFi Status Section */}
        <View style={styles.wifiStatusContainer}>
          <TouchableOpacity 
            onPress={handleWifiSettingsPress} 
            style={styles.wifiStatusCard}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Connection status: ${wifiLoading ? 'Checking' : isConnectedToSchoolWifi ? (connectionMethod === 'Geofence' ? 'On Campus using geofence' : 'Connected via WiFi') : 'Not connected'}`}
            accessibilityHint="Tap to open WiFi settings"
          >
            {wifiLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} style={styles.wifiIcon} />
            ) : (
              <FontAwesome 
                name={isConnectedToSchoolWifi ? (connectionMethod === 'Geofence' ? 'map-marker' : 'wifi') : 'times-circle'} 
                size={FontSizes.lg} 
                color={isConnectedToSchoolWifi ? Colors.successDark : Colors.errorDark}
                style={styles.wifiIcon}
              />
            )}
            <Text style={[styles.wifiStatusText, { color: isConnectedToSchoolWifi ? Colors.successDark : Colors.errorDark }]}>
              {wifiLoading ? 'Checking status...' :
                isConnectedToSchoolWifi ? (
                  connectionMethod === 'Geofence' ? 'On Campus (Geofence)' :
                  connectionMethod || (currentSsid ? `Connected to ${currentSsid}` : 'Connected to School WiFi')
                ) : (
                  currentSsid ? `Connected to ${currentSsid} (Not School WiFi)` : 'Not connected'
                )}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={checkWifiStatus} 
            style={styles.refreshButton}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Refresh WiFi status"
            disabled={wifiLoading}
          >
            {wifiLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <FontAwesome name="refresh" size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Main Content Grid */}
        <View style={styles.mainContentGrid}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            <TouchableOpacity style={[styles.gridCard, styles.pointsCard]} onPress={() => router.push('/(app)/redeem')}> 
              <Text style={styles.cardTitle}>Total Points</Text>
              <Text style={styles.pointsValue}>{formatPoints(userStats.totalPoints)}</Text>
              <FontAwesome name="star" size={28} color={Colors.starYellow} style={styles.cardIconBottom} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.gridCard, styles.treeStatusCard]} onPress={() => router.push('/(app)/tree')}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>My UniTree</Text>
              </View>
              <Image source={getTreeImageForLevel(userStats?.treeLevel || 1)} style={styles.cardIconImage} />
              <Text style={styles.treeLevelText}>Level {userStats.treeLevel}</Text>
            </TouchableOpacity>
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            <TouchableOpacity style={[styles.gridCard, styles.pointsChartCard]} onPress={() => router.push('/(app)/tree')}>
              <Text style={styles.cardTitle}>Tree Progress</Text>
              <View style={styles.verticalProgressContainer}>
                <View style={styles.verticalProgressBarTrack}>
                  <View style={[styles.verticalProgressBarFill, {height: `${Math.min((userStats.totalPoints / TREE_COST_POINTS) * 100, 100)}%`}]} />
                </View>
                <View style={styles.progressTextContainer}>
                  <FontAwesome name="tree" size={30} color={Colors.primaryDark} />
                  <Text style={styles.progressText}>{formatPoints(Math.min(userStats.totalPoints, TREE_COST_POINTS))} / {formatPoints(TREE_COST_POINTS)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Forest Collection Nav Card */}
        <TouchableOpacity style={[styles.gridCard, styles.forestCardFullWidth]} onPress={() => router.push('/(app)/forest')}>
          <FontAwesome name="tree" size={24} color={Colors.white} style={styles.forestIcon} />
          <View style={styles.forestTextContainer}>
            <Text style={styles.cardTitleWhite}>My Real Forest</Text>
            <Text style={styles.forestCardText}>View your collection of real trees.</Text>
          </View>
          <FontAwesome name="arrow-right" size={20} color={Colors.white} />
        </TouchableOpacity>

        {/* Today's Stats Card */}
        <View style={[styles.gridCard, styles.todayStatsCard]}>
          <Text style={styles.cardTitle}>Today&apos;s Progress</Text>
          <View style={styles.todayStatsContainer}>
            <View style={styles.todayStatBox}>
              <FontAwesome name="star" size={24} color={Colors.starYellow} style={styles.todayStatIcon} />
              <Text style={styles.todayStatValue}>{formatPoints(pointsToday)}</Text>
              <Text style={styles.todayStatLabel}>Points Today</Text>
            </View>
            <View style={styles.todayStatBox}>
              <FontAwesome name="clock-o" size={24} color={Colors.primary} style={styles.todayStatIcon} />
              <Text style={styles.todayStatValue}>{timeConnectedTodayDisplay}</Text>
              <Text style={styles.todayStatLabel}>Time Connected</Text>
            </View>
          </View>
        </View>
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapperBg: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenWrapperContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: FontSizes.md,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
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
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontFamily: Fonts.Poppins.SemiBold,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: Colors.white,
  },
  headerWelcomeText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.Grandstander.Regular,
    color: Colors.white,
    opacity: 0.9,
  },
  headerUserNameText: {
    fontSize: FontSizes.xxl,
    fontFamily: Fonts.Grandstander.Bold,
    color: Colors.white,
    marginTop: 2,
  },
  notificationButtonContainer: {
    padding: 10,
  },
  wifiStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 15,
  },
  wifiStatusCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  refreshButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  wifiIcon: {
    marginRight: 10,
  },
  wifiStatusText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.Poppins.Regular,
  },
  mainContentGrid: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  leftColumn: {
    flex: 1,
    marginRight: 8,
  },
  rightColumn: {
    flex: 1,
    marginLeft: 8,
  },
  gridCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 15,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, 
    shadowRadius: 5,
    elevation: 3,
    justifyContent: 'space-between',
  },
  pointsCard: {
    height: screenWidth * 0.4,
    marginBottom: 15,
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
  },
  cardTitle: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.SemiBold,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardTitleWhite: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.SemiBold,
    color: Colors.white,
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: FontSizes.xxl, 
    fontFamily: Fonts.Grandstander.Bold,
    color: Colors.primaryDark,
    textAlign: 'center',
    flexShrink: 1,
  },
  cardIconBottom: {
      marginTop: 'auto',
      paddingTop: 5,
  },
  treeStatusCard: {
    height: screenWidth * 0.45,
    alignItems: 'center',
  },
  treeImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginVertical: 8,
  },
  treeLevelText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.Poppins.SemiBold,
    color: Colors.text,
  },
  pointsChartCard: {
    height: screenWidth * 0.4 + screenWidth * 0.45 + 15,
    padding: 15, 
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verticalProgressContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  verticalProgressBarTrack: {
    height: '70%',
    width: 60,
    backgroundColor: Colors.grayLight,
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  verticalProgressBarFill: {
    width: '100%',
    backgroundColor: Colors.greenProgressBar,
  },
  progressTextContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  progressText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.Grandstander.Bold,
    color: Colors.primaryDark,
    marginTop: 5,
  },
  forestCardFullWidth: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryDark,
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 20,
  },
  forestIcon: {
      marginRight: 15,
  },
  forestTextContainer: {
      flex: 1,
  },
  forestCardText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.white,
    opacity: 0.9,
  },
  todayStatsCard: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 20,
  },
  todayStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  todayStatBox: {
    alignItems: 'center',
    flex: 1,
  },
  todayStatIcon: {
    marginBottom: 5,
  },
  todayStatValue: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Grandstander.Bold,
    color: Colors.text,
    marginBottom: 2,
  },
  todayStatLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLighter,
    textTransform: 'uppercase',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
}); 