import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenWrapper } from '../../components/layouts';
import { UniversalHeader } from '../../components/navigation';
import { Colors, Fonts, FontSizes } from '../../constants';
import { CollectedTree, useUserData } from '../../contexts/UserDataContext';
import { formatTimeAgo } from '../../utils/notifications';

export default function ForestScreen() {
  const { 
    collectedRealTrees, 
    isLoadingCollectedTrees, 
    fetchCollectedRealTrees, 
    userStats 
  } = useUserData();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchCollectedRealTrees();
    setRefreshing(false);
  }, [fetchCollectedRealTrees]);

  const renderTreeItem = ({ item }: { item: CollectedTree }) => (
    <View key={item.id} style={styles.collectedTreeItem}>
      <Image 
        source={{ uri: item.image_url || 'https://via.placeholder.com/150/A5D6A7/FFFFFF?text=Tree' }} 
        style={styles.collectedTreeImage} 
      />
      <View style={styles.treeInfoContainer}>
        <Text style={styles.collectedTreeName} numberOfLines={1}>{item.name}</Text>
        {item.species && <Text style={styles.collectedTreeSpecies} numberOfLines={1}>{item.species}</Text>}
        <View style={styles.dateContainer}>
            <FontAwesome name="calendar" size={FontSizes.sm - 2} color={Colors.grayDark} />
            <Text style={styles.collectedTreeDate}> {formatTimeAgo(item.date_redeemed)}</Text>
        </View>
      </View>
    </View>
  );

  if (isLoadingCollectedTrees && collectedRealTrees.length === 0 && !refreshing) {
    return (
      <ScreenWrapper 
        applyTopInset={false}
        style={styles.loadingContainer}
        withScrollView={false}
      >
        <StatusBar style="dark" />
        <UniversalHeader title="My Real-World Forest" showBackButton={false} />
         <View style={styles.subtitleContainer}>
            <Text style={styles.headerSubtitle}>
              Each tree here represents a real tree planted thanks to your efforts!
            </Text>
          </View>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Your Forest...</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper 
      applyTopInset={false}
      withScrollView={false}
      style={{backgroundColor: Colors.background}}
    >
      <StatusBar style="dark" />
      <UniversalHeader title="My Real-World Forest" showBackButton={true} />
      
      <View style={styles.subtitleContainer}>
        <Text style={styles.headerSubtitle}>
          Each tree here represents a real tree planted thanks to your efforts!
        </Text>
      </View>

      <FlatList
        data={collectedRealTrees}
        renderItem={renderTreeItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={collectedRealTrees.length === 0 ? styles.emptyForestContainer : styles.treeListContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={() => (
            !isLoadingCollectedTrees && collectedRealTrees.length === 0 ? (
                <View style={styles.emptyForestContainerTrueEmpty}>
                    <FontAwesome name="tree" size={50} color={Colors.grayDark} />
                    <Text style={styles.emptyForestText}>Your forest is waiting to grow!</Text>
                    <Text style={styles.emptyForestSubText}>Redeem points on the Redeem page to plant real trees and see them here.</Text>
                </View>
            ) : null
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screenContentContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    flex:1,
  },
  loadingText: {
    marginTop: 50,
    fontSize: FontSizes.md,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLight,
  },
  subtitleContainer: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.Poppins.Bold,
    color: Colors.primary,
    marginBottom: 5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLight,
    textAlign: 'center',
  },
  treeListContainer: {
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  collectedTreeItem: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    marginBottom: 20,
    width: '46%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  collectedTreeImage: {
    width: '100%',
    height: 130,
    backgroundColor: Colors.grayMedium, 
  },
  treeInfoContainer: {
    padding: 12,
  },
  collectedTreeName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.Poppins.SemiBold,
    color: Colors.text,
    marginBottom: 4,
  },
  collectedTreeSpecies: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLight,
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  collectedTreeDate: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.grayDark,
  },
  emptyForestContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyForestContainerTrueEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 30,
  },
  emptyForestText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Poppins.SemiBold,
    color: Colors.textLighter,
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyForestSubText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.grayDark,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
}); 