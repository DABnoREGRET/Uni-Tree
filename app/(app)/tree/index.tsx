import { FontAwesome } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenWrapper } from '../../components/layouts';
import { Colors, Fonts, FontSizes } from '../../constants';
import { useUserData } from '../../contexts/UserDataContext';
import { useConnectionTimer } from '../../hooks/useConnectionTimer';
import { getTreeImageForLevel } from '../../utils/treeUtils';

export default function TreeScreen() {
  const { 
    userStats, 
    isLoading, 
    fetchUserData
  } = useUserData();
  const [refreshing, setRefreshing] = useState(false);
  
  // Use the centralized timer hook
  const { timeConnectedTodayDisplay } = useConnectionTimer();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchUserData();
    } catch (error) {
      console.error("Failed to refresh user stats for tree screen:", error);
    }
    setRefreshing(false);
  }, [fetchUserData]);


  // Timer logic is now handled by useConnectionTimer hook



  if (isLoading && !userStats) {
    return (
      <ScreenWrapper withScrollView={false} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Your UniTree...</Text>
      </ScreenWrapper>
    );
  }

  if (!userStats) {
    return (
      <ScreenWrapper withScrollView={false} style={styles.errorContainer}>
        <FontAwesome name="exclamation-triangle" size={50} color={Colors.error} />
        <Text style={styles.errorText}>Could not load your UniTree data.</Text>
        <Text style={styles.errorSubText}>Please check your connection or try again.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </ScreenWrapper>
    );
  }

  const treeName = userStats.treeName || `Level ${userStats.treeLevel} Tree`;
  const treeImagePlaceholderColor = Colors.primary.replace('#', ''); // Use primary color for placeholder

  return (
    <ScreenWrapper 
      contentContainerStyle={styles.contentContainer}
      scrollViewProps={{
        refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }}
    >
      <Stack.Screen options={{ title: 'UniTree' }} />

      <View style={styles.treeDisplayContainer}>
        <Image 
          source={getTreeImageForLevel(userStats.treeLevel)}
          style={styles.treeImage}
          resizeMode="contain"
        />
        <View style={styles.treeNamePlate}>
            <Text style={styles.treeLevelText}>{`Level ${userStats.treeLevel}`}</Text>
            <Text style={styles.treeNameText}>{treeName}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.progressLabel}>Progress to Next Level</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${userStats.treeProgress}%` }]} />
        </View>
        <Text style={styles.progressPercentage}>{`${userStats.treeProgress.toFixed(1)}%`}</Text>
        
        <View style={styles.divider} />

        <View style={styles.timeConnectedRow}>
          <FontAwesome name="clock-o" size={28} color={Colors.primaryDark} />
          <View style={styles.timeConnectedTextContainer}>
            <Text style={styles.timeConnectedLabel}>Time Connected Today</Text>
            <Text style={styles.timeConnectedValue}>{timeConnectedTodayDisplay}</Text>
          </View>
        </View>
      </View>

      {/* Removed Stat Cards */}

      {/* Removed Timer Container at Bottom */}
      
    </ScreenWrapper>
  );
}

const StatCard = ({ icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <View style={styles.statCard}>
    <FontAwesome name={icon} size={28} color={Colors.primary} style={styles.statIcon} />
    <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{String(value)}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: FontSizes.base,
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
    fontSize: FontSizes.sm,
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
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontFamily: Fonts.Poppins.SemiBold,
  },
  treeDisplayContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  treeImage: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    marginBottom: 15,
  },
  treeNamePlate: {
      alignItems: 'center',
      backgroundColor: 'transparent',
      paddingHorizontal: 20,
      borderRadius: 0,
      height: 25,
  },
  treeLevelText: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.Poppins.Bold,
    color: Colors.greenDarkText,
  },
  treeNameText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Poppins.SemiBold,
    color: Colors.success,
  },
  progressSection: {
    padding: 15,
    marginBottom: 15,
    backgroundColor: Colors.white,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  progressLabel: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLight,
    marginBottom: 10,
  },
  progressBarContainer: {
    width: '100%',
    height: 18,
    backgroundColor: Colors.greenProgressBarBg,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.greenProgressBar,
    borderRadius: 10,
  },
  progressPercentage: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.SemiBold,
    color: Colors.success,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  divider: {
    height: 1,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: Colors.grayLight,
    marginVertical: 15,
  },
  timeConnectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  timeConnectedTextContainer: {
    marginLeft: 15,
  },
  timeConnectedLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLighter,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  timeConnectedValue: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.Poppins.Bold,
    color: Colors.primaryDark,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    flexDirection: 'row',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  statIcon: {
    marginRight: 12,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLighter,
    marginBottom: 3,
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Poppins.SemiBold,
    color: Colors.text,
  },
  // Removed tipContainer, tipIcon, and tipText styles
  /*
  tipContainer: {
    backgroundColor: Colors.white,
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 15,
  },
  tipIcon: {
    marginRight: 12,
  },
  tipText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.success,
    flex: 1,
    lineHeight: 20,
  },*/
  timerContainer: {
    alignItems: 'center',
    marginVertical: 25,
  },
  timerLabel: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Poppins.SemiBold,
    color: Colors.text,
    marginBottom: 5,
  },
  timerText: {
    fontSize: FontSizes.xxxl,
    fontFamily: Fonts.Poppins.Bold,
    color: Colors.textLighter,
  },
  timerTextActive: {
    color: Colors.successDark,
  },
}); 