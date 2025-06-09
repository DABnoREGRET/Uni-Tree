import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '../../components/layouts';
import { PrimaryButton } from '../../components/ui';
import { Colors, Fonts, FontSizes } from '../../constants';
import { TREE_COST_POINTS } from '../../constants/Config';
import { RewardItem, useAppContext } from '../../contexts/AppContext';
import { useUserData } from '../../contexts/UserDataContext';
import { formatPoints } from '../../utils';

// Helper to get local image source based on reward name
const getRewardImageSource = (itemName: string, imageUrl: string | null) => {
  switch (itemName) {
    case 'UniTree Seedling Pack':
      return require('../../../assets/images/gift.png');
    case 'Campus Cafe Coupon':
      return require('../../../assets/images/voucher.png');
    default:
      // Fallback to URL if provided, otherwise a generic placeholder
      return imageUrl ? { uri: imageUrl } : require('../../../assets/images/gift.png'); // Generic gift icon as a final fallback
  }
};

export default function RedeemScreen() {
  const { rewards, isLoadingRewards, fetchRewards } = useAppContext();
  const { userStats, isLoading: isLoadingUserStats, fetchUserData, redeemRealTree } = useUserData();
  const [refreshing, setRefreshing] = useState(false);
  const [isRedeemingTree, setIsRedeemingTree] = useState(false);
  const currentUserPoints = userStats?.totalPoints ?? 0;
  const isRedemptionPending = userStats?.realTreeRedemptionPending || false;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isConfirmationVisible, setConfirmationVisible] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchRewards(), fetchUserData()]);
    } catch (error) {
      console.error("Failed to refresh data for redeem screen:", error);
    }
    setRefreshing(false);
  }, [fetchRewards, fetchUserData]);

  const handleRedeemRealTree = async () => {
    if (isRedeemingTree) return;

    if (isRedemptionPending) {
        Alert.alert("Request Pending", "Your previous request to plant a real tree is still being processed.");
        return;
    }

    if (currentUserPoints < TREE_COST_POINTS) {
      Alert.alert("Not Enough Points", `You need ${formatPoints(TREE_COST_POINTS)} points to plant a real tree. You currently have ${formatPoints(currentUserPoints)}.`);
      return;
    }
    
    setConfirmationVisible(true);
  };

  const confirmAndRedeemTree = async () => {
    setConfirmationVisible(false);
    setIsRedeemingTree(true);
    const result = await redeemRealTree();
    setIsRedeemingTree(false);
    if (result.success) {
      fetchUserData(); 
    }
  }

  const ListHeader = () => (
    <>
      <RealTreeRedemptionCard />
      <Text style={styles.sectionTitle}>Other Rewards</Text>
    </>
  );

  const RealTreeRedemptionCard = () => (
    <TouchableOpacity 
      style={[
        styles.rewardItem, 
        styles.realTreeCard,
        isRedeemingTree && styles.disabledCard 
      ]}
      onPress={handleRedeemRealTree}
      disabled={isRedeemingTree || isLoadingUserStats}
    >
        <Image 
          source={require('../../../assets/images/tree.png')} 
          style={styles.rewardIcon} 
        />
      <View style={styles.rewardTextContent}>
        <Text style={[styles.rewardTitle, styles.realTreeCardText]}>{isRedemptionPending ? "Request Pending..." : "Plant a Real Tree!"}</Text>
        <Text style={[styles.rewardDescription, styles.realTreeCardText, { opacity: 0.9 }]}>
          {isRedemptionPending 
            ? "Your request is being processed!" 
            : "Make a real-world impact. Redeem your points to have a tree planted."}
        </Text>
        <View style={styles.pointsContainer}>
          <FontAwesome name="star" size={16} color={Colors.white} />
          <Text style={[styles.rewardPoints, styles.realTreeCardText]}> {formatPoints(TREE_COST_POINTS)} Points </Text> 
        </View>
      </View>
      {!isRedeemingTree ? 
        <FontAwesome name="arrow-right" size={20} color={Colors.white} style={styles.rewardChevron}/> :
        <ActivityIndicator color={Colors.white} />
      }
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: RewardItem }) => {
    return (
      <TouchableOpacity
        style={styles.rewardItem}
        onPress={() => router.push(`/(app)/redeem/${item.id}`)}
      >
        <Image 
          source={getRewardImageSource(item.name, item.image_url)} 
          style={styles.rewardIcon} 
        />
        <View style={styles.rewardTextContent}>
          <Text style={styles.rewardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.rewardDescription}>{item.category || 'Virtual Goods'}</Text>
          <View style={styles.pointsContainer}>
            <FontAwesome name="star" size={16} color={Colors.primary} />
            <Text style={[styles.rewardPoints, {color: Colors.primary}]}>{formatPoints(item.points_cost)} Points</Text>
          </View>
        </View>
        <FontAwesome name="chevron-right" size={20} color={Colors.grayDark} style={styles.rewardChevron}/>
      </TouchableOpacity>
    );
  };

  if ((isLoadingRewards || isLoadingUserStats) && !refreshing && rewards.length === 0) {
    return (
      <ScreenWrapper 
        applyTopInset={false}
        withScrollView={false} 
        style={styles.loadingContainer}
      >
        <StatusBar style="dark" />
        <View
          style={[
            styles.customHeader,
            { paddingTop: insets.top + 15, paddingBottom: 15 },
          ]}
        >
          <Text style={styles.headerTitle}>Redeem Rewards</Text>
        </View>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Rewards...</Text>
      </ScreenWrapper>
    );
  }

  if (!isLoadingRewards && !isLoadingUserStats && rewards.length === 0 && !userStats) {
     return (
      <ScreenWrapper 
        applyTopInset={false}
        withScrollView={false} 
        style={styles.errorContainer}
      >
        <StatusBar style="dark" />
        <View
          style={[
            styles.customHeader,
            { paddingTop: insets.top + 15, paddingBottom: 15 },
          ]}
        >
          <Text style={styles.headerTitle}>Redeem Rewards</Text>
        </View>
        <FontAwesome name="gift" size={50} color={Colors.grayDark} />
        <Text style={styles.errorText}>Could not load rewards.</Text>
        <Text style={styles.errorSubText}>Please check your connection or try again later.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </ScreenWrapper>
    );
  }

  return (
    <View style={{backgroundColor: Colors.background, flex: 1}}>
      <StatusBar style="light" />
      <View
        style={[
          styles.customHeader,
          { paddingTop: insets.top + 15, paddingBottom: 25 },
        ]}
      >
        <Text style={styles.headerTitle}>Redeem Rewards</Text>
      </View>
      <FlatList
          data={rewards}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={rewards.length === 0 ? styles.emptyListContentContainer : styles.listContentContainer}
          ListHeaderComponent={ListHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} title=""/>}
          ListEmptyComponent={() => (
              !isLoadingRewards && rewards.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                      <FontAwesome name="dropbox" size={50} color={Colors.grayDark} />
                      <Text style={styles.emptyStateText}>No Rewards Available Yet</Text>
                      <Text style={styles.emptyStateSubText}>Check back soon for new ways to spend your points!</Text>
                  </View>
              ) : null
          )}
        />
        <Modal
            animationType="slide"
            transparent={true}
            visible={isConfirmationVisible}
            onRequestClose={() => setConfirmationVisible(false)}
        >
            <View style={styles.modalBackdrop}>
                <Pressable style={styles.modalBackdropPressable} onPress={() => setConfirmationVisible(false)} />
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Confirm Your Action</Text>
                    <Image 
                        source={require('../../../assets/images/trees/ICON-01.png')}
                        style={styles.modalTreeIcon}
                    />
                    <Text style={styles.modalText}>
                        You are about to spend <Text style={{fontFamily: Fonts.Grandstander.Bold}}>{formatPoints(TREE_COST_POINTS)}</Text> points to have a real tree planted. This is a final action.
                    </Text>
                    <PrimaryButton 
                        title="Yes, Plant My Tree!"
                        onPress={confirmAndRedeemTree}
                        isLoading={isRedeemingTree}
                        disabled={isRedeemingTree}
                        buttonStyle={styles.modalConfirmButton}
                    />
                    <TouchableOpacity onPress={() => setConfirmationVisible(false)} style={styles.modalCancelButton}>
                        <Text style={styles.modalCancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: FontSizes.md,
    fontFamily: Fonts.Grandstander.SemiBold,
    color: Colors.text,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Grandstander.Bold,
    color: Colors.errorDark,
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
  },
  retryButtonText: {
    color: Colors.white,
    fontFamily: Fonts.Grandstander.SemiBold,
    fontSize: FontSizes.md,
  },
  customHeaderContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: Colors.primary, 
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  customHeaderTitle: {
    fontSize: FontSizes.xl, 
    fontFamily: Fonts.Poppins.Bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  userPointsContainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignSelf: 'center',
  },
  userPointsTextHeader: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.SemiBold,
    color: Colors.white,
    marginLeft: 8,
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  emptyListContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  rewardItem: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: Colors.grayLight,
  },
  rewardTextContent: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.Grandstander.SemiBold,
    color: Colors.text,
    marginBottom: 2,
  },
  rewardDescription: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLighter,
    marginBottom: 6,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardPoints: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.SemiBold,
    marginLeft: 5,
  },
  rewardChevron: {
    marginLeft: 10,
  },
  disabledCard: {
    opacity: 0.7,
  },
  emptyStateContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Grandstander.SemiBold,
    color: Colors.grayDark,
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateSubText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.grayDark,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  realTreeCard: {
    backgroundColor: Colors.primary,
    marginTop: 15,
  },
  realTreeCardText: {
    color: Colors.white,
    alignItems: 'center',
  },
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
    textAlign: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Grandstander.SemiBold,
    color: Colors.text,
    paddingHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdropPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.Grandstander.Bold,
    marginBottom: 15,
    textAlign: 'center',
    color: Colors.text,
  },
  modalTreeIcon: {
    width: 80,
    height: 80,
    marginVertical: 10,
  },
  modalText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  modalConfirmButton: {
    width: '100%',
    backgroundColor: Colors.primary,
  },
  modalCancelButton: {
    marginTop: 10,
    padding: 10,
  },
  modalCancelButtonText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.Poppins.Medium,
    color: Colors.textLighter,
  }
}); 