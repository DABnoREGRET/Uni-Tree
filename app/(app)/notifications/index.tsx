import { FontAwesome } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CustomHeader } from '../../components/navigation';
import { Colors, Fonts, FontSizes } from '../../constants';
import { NotificationItem, useAppContext } from '../../contexts/AppContext';
import { formatTimeAgo, getNotificationTypeColor } from '../../utils/notifications';

export default function NotificationsScreen() {
  const {
    notifications,
    isLoadingNotifications,
    fetchNotifications,
    markNotificationAsRead,
    deleteNotification,
  } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const handleDeleteNotification = (id: string, title: string) => {
    Alert.alert("Delete Notification", `Are you sure you want to delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: async () => await deleteNotification(id), style: "destructive"  }
    ]);
  };

  const handleNotificationPress = (item: NotificationItem) => {
    markNotificationAsRead(item.id);
    if (item.link_to && typeof item.link_to === 'string' && item.link_to.trim().startsWith('/')) {
      try {
        router.push(item.link_to as Href);
      } catch (e) {
        console.error("Failed to navigate from notification:", e, "Path:", item.link_to);
        Alert.alert("Navigation Error", "Could not open the linked content.");
      }
    } else {
      console.log("Notification pressed, but no link_to provided or link is invalid/not an absolute path:", item.link_to);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <View style={styles.notificationItemContainer}> 
      <TouchableOpacity 
          style={[styles.notificationItem, !item.is_read && styles.unreadItem]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
      >
        <FontAwesome name={item.iconName as any} size={24} color={getNotificationTypeColor(item.type, item.is_read)} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, !item.is_read && styles.unreadTitle]}>{item.title}</Text>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.time}>{formatTimeAgo(item.created_at)}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteNotification(item.id, item.title)} style={styles.deleteButtonContainer}>
        <FontAwesome name="trash" size={20} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );

  if (isLoadingNotifications && notifications.length === 0 && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <CustomHeader title="Notifications" />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CustomHeader title="Notifications" />
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={notifications.length === 0 ? styles.emptyListContainer : styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} title=""/>}
        ListEmptyComponent={() => (
            !isLoadingNotifications && notifications.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <FontAwesome name="bell-slash-o" size={60} color={Colors.grayDark} />
                    <Text style={styles.emptyStateText}>No Notifications Yet</Text>
                    <Text style={styles.emptyStateSubText}>We'll let you know when something important happens!</Text>
                </View>
            ) : null
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex:1,
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: FontSizes.md,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLight,
  },
  listContainer: {
    paddingVertical: 10,
  },
  emptyListContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  notificationItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
    backgroundColor: Colors.white,
    borderRadius: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    flex: 1,
  },
  icon: {
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.Poppins.SemiBold,
    color: Colors.text,
    marginBottom: 3,
  },
  unreadTitle: {
    fontFamily: Fonts.Poppins.Bold,
  },
  message: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLighter,
    marginBottom: 5,
  },
  time: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.grayDark,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginLeft: 10,
  },
  deleteButtonContainer: {
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: Colors.backgroundLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 20,
    flex: 1,
    justifyContent: 'center'
  },
  emptyStateText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Poppins.SemiBold,
    color: Colors.textLighter,
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
}); 