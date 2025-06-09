import { FontAwesome } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DefaultImage } from '../../components/ui/DefaultImage';
import MarqueeText from '../../components/ui/MarqueeText';
import { Colors, Fonts, FontSizes } from '../../constants';
import { LeaderboardEntry, useUserData } from '../../contexts/UserDataContext';
import { formatPoints } from '../../utils';

export default function LeaderboardScreen() {
  const {
    leaderboardData,
    isLoadingLeaderboard,
    fetchLeaderboard,
    userProfile,
  } = useUserData();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const loadData = useCallback(async () => {
    try {
      await fetchLeaderboard();
    } catch (error) {
      console.error("Failed to load leaderboard on screen:", error);
      // Alert is handled in context
    }
  }, [fetchLeaderboard]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isCurrentUser = item.user_id === userProfile?.id;
    return (
      <View
        style={[
          styles.itemContainer,
          isCurrentUser && styles.currentUserItemContainer,
        ]}
      >
        <Text style={[styles.rank, isCurrentUser && styles.currentUserText]}>
          {item.rank}
        </Text>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <DefaultImage style={styles.avatar} iconSize={20} />
        )}
        <View style={styles.userInfoContainer}>
          <MarqueeText 
            text={item.username} 
            style={[styles.username, isCurrentUser && styles.currentUserText]} 
          />
          {item.student_id && (
            <Text style={[styles.studentId, isCurrentUser && styles.currentUserText]}>
              {item.student_id}
            </Text>
          )}
          <Text
            style={[
              styles.points,
              isCurrentUser && styles.currentUserPointsText,
            ]}
          >
            {formatPoints(item.total_points)} Points
          </Text>
        </View>
      </View>
    );
  };

  const ListEmptyComponent = () => {
    if (isLoadingLeaderboard && !refreshing) {
      return (
        <View style={styles.centeredMessageContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.messageText}>Loading Leaderboard...</Text>
        </View>
      );
    }
    if (!leaderboardData || leaderboardData.length === 0) {
      return (
        <View style={styles.centeredMessageContainer}>
          <FontAwesome name="trophy" size={40} color={Colors.grayMedium} />
          <Text style={styles.messageText}>Leaderboard is Empty</Text>
          <Text style={styles.subMessageText}>
            Start connecting to climb the ranks!
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={[
          styles.customHeader,
          { paddingTop: insets.top + 15, paddingBottom: 15 },
        ]}
      >
        <Text style={styles.headerTitle}>Leaderboard</Text>
      </View>

      <FlatList
        data={leaderboardData}
        renderItem={renderItem}
        keyExtractor={(item) => item.user_id.toString()}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  customHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.Grandstander.Bold,
    color: Colors.white,
  },
  listContentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserItemContainer: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryLight,
    borderWidth: 1,
  },
  rank: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.Grandstander.SemiBold,
    color: Colors.textLighter,
    marginRight: 15,
    minWidth: 25, // for alignment
    textAlign: 'center',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
    backgroundColor: Colors.grayLight,
  },
  userInfoContainer: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  username: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.Grandstander.SemiBold,
    color: Colors.text,
    marginBottom: 2,
  },
  studentId: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLighter,
    marginBottom: 4,
  },
  points: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.primary,
  },
  currentUserText: {
    color: Colors.white,
  },
  currentUserPointsText: {
    color: Colors.secondary, // A lighter color for points on dark background
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50, // Adjust as needed to center it in the visible area
  },
  messageText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Grandstander.SemiBold,
    color: Colors.textLighter,
    marginTop: 15,
    textAlign: 'center',
  },
  subMessageText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.grayDark,
    textAlign: 'center',
    marginTop: 5,
  },
}); 