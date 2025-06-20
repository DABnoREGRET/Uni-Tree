import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '../../components/layouts';
import { CustomHeader } from '../../components/navigation';
import { PrimaryButton } from '../../components/ui';
import { Colors, Fonts, FontSizes } from '../../constants';
import { RewardItem, useAppContext } from '../../contexts/AppContext';
import { useUserData } from '../../contexts/UserDataContext';
import { formatPoints } from '../../utils';

// Helper: prefer image_url, otherwise choose by category, else generic
const getRewardImageSource = (reward: RewardItem) => {
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

export default function RedeemItemDetailScreen() {
    const router = useRouter();
    const { itemId } = useLocalSearchParams<{ itemId: string }>();
    const { rewards, isLoadingRewards, redeemReward } = useAppContext();
    const { userStats, isLoading: isLoadingUserStats, fetchUserData, updateUserPoints } = useUserData();
    const insets = useSafeAreaInsets();

    const [isRedeeming, setIsRedeeming] = useState(false);
    
    const reward = useMemo(() => {
        return rewards.find((r: RewardItem) => r.id === itemId);
    }, [rewards, itemId]);

    const currentUserPoints = userStats?.totalPoints ?? 0;

    const handleRedeem = async () => {
        if (!reward || !userStats) return;

        if (currentUserPoints < reward.points_cost) {
            Alert.alert("Not Enough Points", `You need ${formatPoints(reward.points_cost)} points to redeem this item.`);
            return;
        }

        Alert.alert(
            "Confirm Redemption",
            `Are you sure you want to redeem "${reward.name}" for ${formatPoints(reward.points_cost)} points?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Redeem",
                    onPress: async () => {
                        setIsRedeeming(true);
                        const result = await redeemReward(reward.id);
                        
                        if (result.success) {
                            // Immediately update points locally for instant feedback
                            if (result.newTotalPoints !== undefined) {
                                updateUserPoints(result.newTotalPoints);
                            }
                            // Also trigger a full refresh from the server immediately
                            // to ensure all parts of the app are in sync.
                            await fetchUserData();
                            
                            setIsRedeeming(false); // Stop loading indicator before showing alert
                            
                            Alert.alert("Success!", `"${reward.name}" has been redeemed.`, [
                                { text: "OK", onPress: () => router.back() }
                            ]);
                        } else {
                            setIsRedeeming(false);
                            Alert.alert("Redemption Failed", result.message || "Could not redeem item. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    if (isLoadingRewards || isLoadingUserStats) {
        return (
            <ScreenWrapper withScrollView={false} style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </ScreenWrapper>
        );
    }

    if (!reward) {
        return (
            <ScreenWrapper applyTopInset={false} withScrollView={false}>
                <CustomHeader title="Not Found" />
                <View style={styles.centerContainer}>
                    <FontAwesome name="question-circle" size={50} color={Colors.grayDark} />
                    <Text style={styles.errorText}>Reward not found.</Text>
                    <PrimaryButton title="Go Back" onPress={() => router.back()} />
                </View>
            </ScreenWrapper>
        );
    }
    
    const canAfford = currentUserPoints >= reward.points_cost;
    const isOutOfStock = reward.stock_available !== null && reward.stock_available <= 0;

    const getButtonText = () => {
        if (isOutOfStock) return 'Out of Stock';
        if (!canAfford) return 'Not Enough Points';
        return 'Redeem Now';
    };

    return (
        <ScreenWrapper 
            applyTopInset={false} 
            withScrollView={false}
            style={{ backgroundColor: Colors.white }}
        >
            <StatusBar style="light" />
            <CustomHeader title={reward.name} />

            <ScrollView 
                style={styles.container} 
                contentContainerStyle={{ paddingBottom: 0 }}
            >
                <View style={styles.imageContainer}>
                    <Image source={getRewardImageSource(reward)} style={styles.image} />
                </View>
                
                <View style={styles.detailsContainer}>
                    <Text style={styles.rewardName}>{reward.name}</Text>
                    <Text style={styles.categoryText}>{reward.category || 'General'}</Text>
                    
                    <View style={styles.pointsPill}>
                        <FontAwesome name="star" size={16} color={Colors.primaryDark} />
                        <Text style={styles.pointsText}>{formatPoints(reward.points_cost)} Points</Text>
                    </View>

                    <Text style={styles.description}>{reward.description}</Text>

                    {reward.stock_available !== null && (
                        <Text style={[styles.stockText, isOutOfStock && { color: Colors.errorDark }]}>
                            {reward.stock_available > 0 ? `${reward.stock_available} left in stock` : 'Out of stock'}
                        </Text>
                    )}

                    <TouchableOpacity 
                        style={[styles.redeemButton, (isOutOfStock || !canAfford) && styles.redeemButtonDisabled]} 
                        onPress={handleRedeem} 
                        disabled={isOutOfStock}
                    >
                        {isRedeeming ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.redeemButtonText}>
                                {getButtonText()}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: FontSizes.lg,
        fontFamily: Fonts.Poppins.SemiBold,
        color: Colors.textLighter,
        textAlign: 'center',
        marginVertical: 20,
    },
    container: {
        flex: 1,
        backgroundColor: '#ffced3',
    },
    imageContainer: {
        width: '100%',
        height: 300,
        backgroundColor: Colors.white,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    detailsContainer: {
        padding: 20,
        backgroundColor: '#ffced3',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -20,
        paddingBottom: 40,
    },
    rewardName: {
        fontSize: FontSizes.xxl,
        fontFamily: Fonts.Poppins.Bold,
        color: Colors.text,
        marginBottom: 5,
    },
    categoryText: {
        fontSize: FontSizes.base,
        fontFamily: Fonts.Poppins.Regular,
        color: Colors.textLighter,
        marginBottom: 15,
        backgroundColor: Colors.grayLight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
        alignSelf: 'flex-start',
    },
    pointsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryLightOpacity,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    pointsText: {
        fontSize: FontSizes.md,
        fontFamily: Fonts.Poppins.Bold,
        color: Colors.primaryDark,
        marginLeft: 8,
    },
    description: {
        fontSize: FontSizes.base,
        fontFamily: Fonts.Poppins.Regular,
        color: Colors.textLight,
        lineHeight: 22,
    },
    stockText: {
        fontSize: FontSizes.sm,
        fontFamily: Fonts.Poppins.Medium,
        color: Colors.error,
        marginTop: 15,
        marginBottom: 30,
    },
    redeemButton: {
        backgroundColor: Colors.primary,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
    },
    redeemButtonDisabled: {
        backgroundColor: Colors.disabled,
    },
    redeemButtonText: {
        fontSize: FontSizes.md,
        fontFamily: Fonts.Poppins.Bold,
        color: Colors.white,
    },
});
