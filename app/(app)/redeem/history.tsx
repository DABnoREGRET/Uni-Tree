import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenWrapper } from '../../components/layouts';
import { UniversalHeader } from '../../components/navigation';
import { Colors, Fonts, FontSizes } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

interface RedeemHistoryItem {
  id: string;
  redeemed_at: string;
  points_spent: number | null;
  reward: {
    id: string;
    name: string;
    image_url: string | null;
    category: string | null;
    points_cost: number | null;
  } | null;
}

const getImageSource = (reward: RedeemHistoryItem['reward']) => {
  if (!reward) return require('../../../assets/images/gift.png');
  if (reward.image_url) return { uri: reward.image_url };

  switch (reward.category) {
    case 'voucher':
      return require('../../../assets/images/voucher.png');
    case 'seedling_pack':
      return require('../../../assets/images/gift.png');
    default: {
      const cat = (reward.category || '').toLowerCase();
      if (cat.includes('tree')) return require('../../../assets/images/tree.png');
      if (cat.includes('mystery')) return require('../../../assets/images/gift.png');
      if (cat.includes('voucher') || cat.includes('coupon')) return require('../../../assets/images/voucher.png');
      return require('../../../assets/images/gift.png');
    }
  }
};

export default function RedeemHistoryScreen() {
  const { session } = useAuth();
  const [history, setHistory] = useState<RedeemHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!session?.user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_rewards')
        .select(
          `id, redeemed_at:created_at, points_spent, reward:rewards(id, name, image_url, category, points_cost)`
        )
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching redemption history:', error.message);
        throw error;
      }
      const mapped = (data as any[]).map((row) => ({
        ...row,
        // Supabase returns `reward` as an array – pick the first item
        reward: Array.isArray(row.reward) ? row.reward[0] : row.reward,
      })) as RedeemHistoryItem[];
      setHistory(mapped);
    } catch (err) {
      setHistory([]);
      console.error('Failed to fetch redemption history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: RedeemHistoryItem }) => {
    const reward = item.reward;
    return (
      <View style={styles.historyItem}>
        <Image source={getImageSource(reward)} style={styles.historyIcon} />
        <View style={styles.textContainer}>
          <Text style={styles.historyTitle} numberOfLines={1}>{reward?.name ?? 'Reward'}</Text>
          <Text style={styles.historyDate}>{new Date(item.redeemed_at).toLocaleDateString()}</Text>
        </View>
        <View style={styles.pointsContainer}>
          <FontAwesome name="star" size={16} color={Colors.primary} />
          <Text style={styles.pointsText}> {item.points_spent ?? reward?.points_cost ?? 0}</Text>
        </View>
      </View>
    );
  };

  // Skeleton placeholder data (array of 8 items) – used while the first load happens
  const skeletonData = Array.from({ length: 8 }).map((_, idx) => ({ key: `skeleton-${idx}` }));

  if (isLoading && history.length === 0) {
    return (
      <ScreenWrapper applyTopInset={false} withScrollView={false} style={{ backgroundColor: Colors.background }}>
        <StatusBar style="dark" />
        <UniversalHeader title="Redeem History" showBackButton />
        <FlatList
          data={skeletonData}
          keyExtractor={(item) => item.key}
          renderItem={() => (
            <View style={styles.skeletonItem}>
              <View style={styles.skeletonIcon} />
              <View style={styles.skeletonTextContainer}>
                <View style={styles.skeletonTextLineShort} />
                <View style={styles.skeletonTextLineLong} />
              </View>
              <View style={styles.skeletonPoints} />
            </View>
          )}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper applyTopInset={false} withScrollView={false} style={{ backgroundColor: Colors.background }}>
      <StatusBar style="dark" />
      <UniversalHeader title="Redeem History" showBackButton />
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={history.length === 0 ? styles.emptyContainer : styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={() => (
          !isLoading && history.length === 0 ? (
            <View style={styles.emptyContainerTrueEmpty}>
              <FontAwesome name="history" size={50} color={Colors.grayDark} />
              <Text style={styles.emptyText}>No redemption history yet</Text>
              <Text style={styles.emptySubText}>Redeem rewards and they&#39;ll appear here.</Text>
            </View>
          ) : null
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 15,
    marginVertical: 7,
    borderRadius: 12,
    padding: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.grayMedium,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  historyTitle: {
    fontFamily: Fonts.Poppins.SemiBold,
    fontSize: FontSizes.base,
    color: Colors.text,
  },
  historyDate: {
    fontFamily: Fonts.Poppins.Regular,
    fontSize: FontSizes.sm,
    color: Colors.grayDark,
    marginTop: 2,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontFamily: Fonts.Poppins.Bold,
    fontSize: FontSizes.base,
    color: Colors.primary,
  },
  listContainer: {
    paddingBottom: 40,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainerTrueEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: Fonts.Poppins.SemiBold,
    fontSize: FontSizes.lg,
    color: Colors.textLighter,
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontFamily: Fonts.Poppins.Regular,
    fontSize: FontSizes.base,
    color: Colors.grayDark,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  /* -------------------- Skeleton styles -------------------- */
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 15,
    marginVertical: 7,
    borderRadius: 12,
    padding: 12,
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.grayMedium,
  },
  skeletonTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  skeletonTextLineShort: {
    width: '50%',
    height: 12,
    backgroundColor: Colors.grayMedium,
    borderRadius: 6,
    marginBottom: 6,
  },
  skeletonTextLineLong: {
    width: '30%',
    height: 10,
    backgroundColor: Colors.grayMedium,
    borderRadius: 5,
  },
  skeletonPoints: {
    width: 30,
    height: 12,
    backgroundColor: Colors.grayMedium,
    borderRadius: 6,
  },
}); 