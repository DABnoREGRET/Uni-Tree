import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenWrapper } from '../../components/layouts';
import { CustomHeader } from '../../components/navigation';
import { PrimaryButton } from '../../components/ui';
import { Colors, Fonts, FontSizes } from '../../constants';
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
        return imageUrl ? { uri: imageUrl } : require('../../../assets/images/gift.png');
    }
};

export default function RedeemItemDetailScreen() {
    const router = useRouter();
    const { itemId } = useLocalSearchParams<{ itemId: string }>();
    const { rewards, isLoadingRewards, redeemReward } = useAppContext();
    const { userStats, isLoading: isLoadingUserStats, fetchUserData, updateUserPoints } = useUserData();

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

    return (
        <ScreenWrapper applyTopInset={false} style={{ backgroundColor: Colors.background }}>
            <StatusBar style="light" />
            <CustomHeader title={reward.name} />
            <View style={styles.container}>
                <View style={styles.imageContainer}>
                    <Image source={getRewardImageSource(reward.name, reward.image_url)} style={styles.image} />
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
                        <Text style={styles.stockText}>
                            {reward.stock_available > 0 ? `${reward.stock_available} left in stock` : 'Out of stock'}
                        </Text>
                    )}
                </View>
            </View>
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.redeemButton, isRedeeming && styles.redeemButtonDisabled]} 
                    onPress={handleRedeem} 
                    disabled={isRedeeming || !canAfford || (reward.stock_available !== null && reward.stock_available <= 0)}
                >
                    <Text style={styles.redeemButtonText}>
                        {isRedeeming ? 'Redeeming...' : 'Redeem Now'}
                    </Text>
                </TouchableOpacity>
            </View>
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
        backgroundColor: Colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -20,
        flex: 1,
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
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: Colors.grayLight,
        backgroundColor: Colors.white,
    },
    redeemButton: {
        backgroundColor: Colors.primary,
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    redeemButtonDisabled: {
        backgroundColor: Colors.grayLight,
    },
    redeemButtonText: {
        fontSize: FontSizes.md,
        fontFamily: Fonts.Poppins.Bold,
        color: Colors.white,
    },
});
