import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase'; // Import Supabase client
import { useAuth } from './AuthContext'; // To potentially fetch data based on auth state

// Define structure for Notification items - Will be repurposed for local notifications
export interface NotificationItem {
  id: string; // For local notifications, this could be a generated ID
  user_id?: string; // May not be needed for local-only notifications
  title: string;
  message: string;
  created_at: string; // ISO string or timestamp
  is_read: boolean;
  type: 'info' | 'reward' | 'alert' | 'tree' | 'system' | 'wifi' | 'levelup' | 'reminder'; // Added more types
  iconName?: string; // Derived from type for UI
  link_to?: string | null;
}

// Define structure for Reward items (as in RedeemScreen)
export interface RewardItem {
  id: string;
  name: string;
  points_cost: number; // Changed from points
  description: string;
  image_url: string | null; // Changed from image, and can be null
  category: string | null;
  stock_available: number | null; // Added
  is_active: boolean; // Added (though we'll likely only fetch active ones)
}

interface AppContextType {
  // Rewards
  rewards: RewardItem[];
  isLoadingRewards: boolean;
  fetchRewards: () => Promise<void>;
  redeemReward: (rewardId: string) => Promise<{ success: boolean; message?: string; error?: string; newTotalPoints?: number }>; // Adjusted message to be optional

  // Notifications
  notifications: NotificationItem[];
  isLoadingNotifications: boolean;
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Supabase API call functions for Rewards (existing) ---
// Placeholder for redeemRewardAPI - replace with actual implementation if it exists
const redeemRewardAPI = async (rewardId: string, userId: string): Promise<{ success: boolean; message?: string; error?: string; newTotalPoints?: number }> => {
  console.log(`redeemRewardAPI: Calling Supabase function 'redeem_reward' for reward ${rewardId} by user ${userId}`);
  try {
    const { data, error } = await supabase.rpc('redeem_reward', {
      reward_id_input: rewardId,
      user_id_input: userId // Assuming your function needs user_id
    });

    if (error) {
      console.error("Supabase RPC (redeem_reward) error:", error.message);
      return { success: false, error: error.message || "Failed to redeem reward due to a server error." };
    }

    // Assuming the RPC function returns an object like: { success: boolean, message: string, new_total_points: number }
    if (data && typeof data.success === 'boolean') {
      return {
        success: data.success,
        message: data.message || (data.success ? "Reward redeemed successfully!" : "Redemption failed."),
        error: data.success ? undefined : (data.message || "Redemption was not successful."),
        newTotalPoints: data.new_total_points
      };
    } else {
      console.error("Supabase RPC (redeem_reward) unexpected response:", data);
      return { success: false, error: "Unexpected response from server during redemption." };
    }

  } catch (e: any) {
    console.error("Exception calling redeemRewardAPI:", e.message);
    return { success: false, error: e.message || "An unexpected error occurred." };
  }
};


const fetchActiveRewardsFromSupabase = async (): Promise<RewardItem[]> => {
    console.log("Supabase: Fetching active rewards list");
    try {
        const { data, error } = await supabase
            .from('rewards')
            .select('id, name, description, points_cost, image_url, category, stock_available, is_active')
            .eq('is_active', true)
            .order('points_cost', { ascending: true });

        if (error) {
            console.error("Error fetching rewards from Supabase:", error.message);
            throw error;
        }
        return data || []; 
    } catch (error) {
        console.error("Failed to fetch rewards:", error);
        return [];
    }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { session, isAuthenticated } = useAuth();
  
  // Rewards State
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // --- Rewards Functions ---
  const fetchRewardsData = async () => {
    setIsLoadingRewards(true);
    try {
        const data = await fetchActiveRewardsFromSupabase();
        setRewards(data);
    } catch (error) {
        setRewards([]);
    } finally {
        setIsLoadingRewards(false);
    }
  };

  const redeemRewardHandler = async (rewardId: string) => {
    if (!isAuthenticated || !session?.user) return {success: false, error: "User not authenticated"};
    
    // Pass userId to the API
    const result = await redeemRewardAPI(rewardId, session.user.id); 
    
    // No need to fetch rewards here as the UserDataContext will handle the point update
    // which is the only thing that changes on the user side.
    
    return result;
  };

  // --- Notifications Functions ---
  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching notifications from Supabase:', error.message);
        throw error;
      }
      if (data && data.length > 0) {
        const notificationsWithIcons = data.map((n: any) => ({
          ...n,
          iconName: getNotificationIconName(n.type),
        }));
        setNotifications(notificationsWithIcons);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]); // Fallback to empty array on error
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    if (!session?.user) return;
    console.log(`AppContext: Marking notification ${id} as read for user ${session.user.id}...`);
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error("Error marking notification as read in Supabase:", error.message);
        throw error;
      }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error: any) {
      console.error("Failed to mark notification as read:", error.message);
      // Alert.alert("Error", "Could not update notification status.");
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!session?.user) return;
    console.log(`AppContext: Marking all notifications as read for user ${session.user.id}...`);
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false); // Only update unread ones

      if (error) {
        console.error("Error marking all notifications as read in Supabase:", error.message);
        throw error;
      }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error: any) {
      console.error("Failed to mark all notifications as read:", error.message);
      // Alert.alert("Error", "Could not update all notification statuses.");
    }
  };

  const clearAllNotifications = async () => {
    if (!session?.user) return;
    console.log(`AppContext: Clearing all notifications for user ${session.user.id}...`);
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', session.user.id);

      if (error) {
        console.error("Error clearing all notifications in Supabase:", error.message);
        throw error;
      }
    setNotifications([]);
    } catch (error: any) {
      console.error("Failed to clear all notifications:", error.message);
      // Alert.alert("Error", "Could not clear notifications.");
    }
  };

  const deleteNotification = async (id: string) => {
    if (!session?.user) return;
    console.log(`AppContext: Deleting notification ${id} for user ${session.user.id}...`);
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error("Error deleting notification in Supabase:", error.message);
        throw error;
      }
    setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error: any) {
      console.error("Failed to delete notification:", error.message);
      // Alert.alert("Error", "Could not delete notification.");
    }
  };

  // Helper function to derive icon name (move to utils if preferred)
  const getNotificationIconName = (type: NotificationItem['type']): string => {
    switch (type) {
      case 'reward': return 'gift';
      case 'alert': return 'warning';
      case 'tree': return 'tree';
      case 'system': return 'cogs';
      case 'wifi': return 'wifi';
      case 'levelup': return 'arrow-up';
      case 'reminder': return 'clock-o';
      case 'info':
      default: return 'info-circle';
    }
  };

  // Effect for fetching initial data
  useEffect(() => {
    if (isAuthenticated && session?.user) {
      fetchRewardsData();
      fetchNotifications(); // Fetch notifications as well
    }
    if (!isAuthenticated) {
      setRewards([]); 
      setNotifications([]); // Clear notifications on logout
    }
  }, [isAuthenticated, session]); // Keep session dependency for now, can be session?.user?.id if only user change matters

  const contextValue = React.useMemo(() => ({
      // Rewards
      rewards,
      isLoadingRewards,
      fetchRewards: fetchRewardsData,
      redeemReward: redeemRewardHandler,
      // Notifications
      notifications,
      isLoadingNotifications,
      fetchNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      clearAllNotifications,
      deleteNotification,
  }), [
    rewards, isLoadingRewards, fetchRewardsData, redeemRewardHandler, // Ensure all dependencies are listed
    notifications, isLoadingNotifications, fetchNotifications, markNotificationAsRead,
    markAllNotificationsAsRead, clearAllNotifications, deleteNotification
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 