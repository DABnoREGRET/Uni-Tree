import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '../../components/layouts';
import { CustomHeader } from '../../components/navigation';
import { Colors, Fonts, FontSizes } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useUserData } from '../../contexts/UserDataContext';
import { registerBackgroundWifiMonitor, unregisterBackgroundWifiMonitor } from '../../services/backgroundWifiMonitor';
import { SafeAsyncStorage, STORAGE_KEYS } from '../../utils/asyncStorage';
import { cancelAllNotifications, ensureDailyReminder, requestNotificationPermissions } from '../../utils/notifications';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, isLoading: authIsLoading, deleteAccount } = useAuth();
  const { updateBackgroundMonitoring } = useUserData();

  const [isPushNotificationsEnabled, setIsPushNotificationsEnabled] = useState(true);
  const [isBackgroundMonitoringEnabled, setIsBackgroundMonitoringEnabled] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadPreferences = async () => {
      const storedPreference = await SafeAsyncStorage.getItem<boolean>(STORAGE_KEYS.NOTIFICATION_PREFERENCES);
      if (storedPreference !== null) {
        setIsPushNotificationsEnabled(storedPreference);
      }
      const storedBg = await SafeAsyncStorage.getItem<boolean>(STORAGE_KEYS.BACKGROUND_MONITORING_ENABLED);
      if (storedBg !== null) {
        setIsBackgroundMonitoringEnabled(storedBg);
      }
    };
    loadPreferences();
  }, []);

  const handleTogglePushNotifications = async (value: boolean) => {
    setIsPushNotificationsEnabled(value);
    await SafeAsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES, value);

    if (value) {
      const { granted, showSettings } = await requestNotificationPermissions();
      if (granted) {
        await ensureDailyReminder();
      }
      if (!granted && showSettings) {
        Alert.alert(
          "Enable Notifications",
          "To receive alerts, you need to enable notifications for UniTree in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() }
          ]
        );
      }
    } else {
      await cancelAllNotifications();
      Alert.alert(
        "Notifications Disabled",
        "All scheduled reminders and alerts have been cancelled."
      );
    }
  };

  const handleToggleBackgroundMonitoring = async (value: boolean) => {
    setIsBackgroundMonitoringEnabled(value);
    await updateBackgroundMonitoring(value);
    if (value) {
      await registerBackgroundWifiMonitor();
    } else {
      await unregisterBackgroundWifiMonitor();
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await signOut();
        },
        style: "destructive",
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert('Delete Account', 'This action will permanently remove your account and all associated data. This cannot be undone. Do you wish to continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteAccount();
        },
      },
    ]);
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'logout',
          label: 'Logout',
          type: 'action' as const,
          action: handleLogout,
          icon: 'sign-out',
          color: Colors.error
        },
        {
          id: 'deleteAccount',
          label: 'Delete Account',
          type: 'action' as const,
          action: handleDeleteAccount,
          icon: 'trash',
          color: Colors.error
        }
      ]
    },
    {
      title: 'App Preferences',
      items: [
        {
          id: 'push',
          label: 'Push Notifications',
          type: 'toggle' as const,
          value: isPushNotificationsEnabled,
          action: handleTogglePushNotifications,
          icon: 'bell-o'
        },
        {
          id: 'bgMonitor',
          label: 'Background Monitoring',
          type: 'toggle' as const,
          value: isBackgroundMonitoringEnabled,
          action: handleToggleBackgroundMonitoring,
          icon: 'wifi'
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          id: 'privacyPolicy',
          label: 'Privacy Policy',
          type: 'navigate' as const,
          action: () => router.push('/(app)/profile/privacy-policy'),
          icon: 'shield'
        },
        {
          id: 'termsAndService',
          label: 'Terms and Service',
          type: 'navigate' as const,
          action: () => router.push('/(app)/profile/terms-and-service'),
          icon: 'file-text'
        },
      ]
    },
    {
      title: 'About',
      items: [
        {
          id: 'aboutApp',
          label: 'About UniTree',
          type: 'navigate' as const,
          action: () => router.push('/(app)/profile/about'),
          icon: 'info-circle'
        },
        {
          id: 'version',
          label: 'Version',
          type: 'info' as const,
          value: '1.0.2',
          icon: 'info-circle'
        },
        {
          id: 'Acknowledgements',
          label: 'Acknowledgements',
          type: 'navigate' as const,
          action: () => router.push('/(app)/profile/acknowledgements'),
          icon: 'heart-o'
        },
      ],
    },
  ];

  return (
    <>
      <StatusBar style="dark" />
      <CustomHeader title="Settings" />
      <ScreenWrapper 
        applyTopInset={false}
        contentContainerStyle={styles.contentContainer}
      >
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.itemContainer} 
                onPress={() => {
                  if ((item.type === 'navigate' || item.type === 'action') && item.action && typeof item.action === 'function') {
                      (item.action as () => void)(); 
                  }
                }}
                activeOpacity={item.type === 'toggle' || item.type === 'info' ? 1 : 0.7}
                disabled={(item.type === 'info') || ((item.id === 'logout' || item.id === 'deleteAccount') && authIsLoading)}
              >
                {item.icon && <FontAwesome name={item.icon as any} size={20} color={Colors.textLight} style={styles.itemIcon} />}
                <Text style={styles.itemLabel}>{item.label}</Text>
                {item.type === 'toggle' && typeof item.action === 'function' && (
                  <Switch
                    trackColor={{ false: Colors.grayMedium, true: Colors.primary }} 
                    thumbColor={item.value ? Colors.white : Colors.grayLight}
                    ios_backgroundColor={Colors.grayMedium}
                    onValueChange={item.action as (value: boolean) => void | Promise<void>} 
                    value={typeof item.value === 'boolean' ? item.value : false} 
                  />
                )}
                {item.type === 'navigate' && (
                  <FontAwesome name="chevron-right" size={18} color={Colors.grayDark} />
                )}
                {item.type === 'info' && (
                  <Text style={styles.itemValue}>{item.value}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScreenWrapper>
    </>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 100,
  },
  sectionContainer: {
    marginTop: 15,
    marginHorizontal: 15,
    backgroundColor: Colors.white,
    borderRadius: 12, 
    overflow: 'hidden', 
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.SemiBold,
    color: Colors.textLighter,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
  },
  itemIcon: {
    marginRight: 20,
    width: 22,
    textAlign: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: FontSizes.md, 
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.text,
  },
  itemValue: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLighter,
  },
});