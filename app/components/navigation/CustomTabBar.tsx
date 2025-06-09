import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors } from '../../constants'; // Assuming constants are here
import { useTabBarVisibility } from '../../contexts/TabBarVisibilityContext'; // Added
import CustomTabBarButton from './CustomTabBarButton';

const HIDDEN_TAB_ROUTES = [
  'redeem/[itemId]',
  'profile/settings',
  'notifications/index',
  'forest/index',
  'profile/privacy-policy',
  'profile/terms-and-service',
  'profile/change-password',
  'profile/about',
  'profile/acknowledgements',
  'profile/edit-profile'
  // Add route names that should NEVER appear in the tab bar
];

const TAB_BAR_HEIGHT = 85; // Approximate height: 60 (minHeight) + 10*2 (paddingVertical) + 25 (bottom offset) - adjust as needed

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { width } = useWindowDimensions();
  const { isTabBarVisible, setIsTabBarVisible } = useTabBarVisibility(); // Consuming the context

  // Determine if the current route is a hidden one
  const currentRouteName = state.routes[state.index].name;
  const isCurrentRouteHidden = HIDDEN_TAB_ROUTES.includes(currentRouteName);

  // Effect to explicitly set tab bar visibility context based on route type
  useEffect(() => {
    if (isCurrentRouteHidden) {
      setIsTabBarVisible(false); // Keep context in sync: hidden routes mean tab bar is not visible
    } else {
      // When on a non-hidden route (a main tab screen), ensure the context
      // reflects that the tab bar *should* be visible by default.
      // ScreenWrapper will then handle hiding it on scroll if applicable.
      setIsTabBarVisible(true); 
    }
  }, [isCurrentRouteHidden, setIsTabBarVisible, currentRouteName]);

  const animatedStyle = useAnimatedStyle(() => {
    let translateTarget = 0;
    if (isCurrentRouteHidden) { // If current route is a designated hidden route, always hide
        translateTarget = TAB_BAR_HEIGHT + 50;
    } else if (!isTabBarVisible) { // Otherwise, use the context value (for scroll-based hiding)
        translateTarget = TAB_BAR_HEIGHT + 50;
    }

    return {
      transform: [
        {
          translateY: withTiming(translateTarget, {
            duration: 300,
          }),
        },
      ],
      // Position absolutely and centered, then offset by bottom value in styles
      // width: width - 40, // Corresponds to marginHorizontal: 20 on each side
      // left: 20, // Corresponds to marginHorizontal: 20
    };
  });

  // Filter out routes that should not be in the tab bar
  const visibleRoutes = state.routes.filter(route => {
    // const { options } = descriptors[route.key];
    // console.log(`CustomTabBar processing route: ${route.name}, options.href: ${(options as any).href}`);
    
    // Hide routes explicitly defined in HIDDEN_TAB_ROUTES
    if (HIDDEN_TAB_ROUTES.includes(route.name)) return false;
    
    // Hide Expo Router internal routes
    if (['_sitemap', '+not-found'].includes(route.name)) return false; 
    
    return true;
  });

  return (
    <Animated.View style={[styles.tabbar, animatedStyle]}>
      {visibleRoutes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        // To determine if the current route in the filtered list is focused,
        // we need to find its original index in the full state.routes array
        // and compare that to state.index.
        // However, Expo Router's `state.index` refers to the index in `state.routes` (which includes hidden ones).
        // A simpler way for focus is to check if the current `route.key` matches the key of the focused route in the `state`.
        const isFocused = state.routes[state.index].key === route.key;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params as any);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <View style={{ flex: isFocused ? 2 : 1, alignItems: 'center', justifyContent: 'center' }} key={route.key}>
            <CustomTabBarButton
              onPress={onPress}
              onLongPress={onLongPress}
              isFocused={isFocused}
              routeName={route.name}
              label={label as string}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
            />
          </View>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tabbar: {
    position: 'absolute',
    bottom: 25,
    left: 20, // Ensure it matches marginHorizontal from original design
    right: 20, // Ensure it matches marginHorizontal from original design
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    // marginHorizontal: 20, // Replaced by left/right for Animated.View width calculation if needed
    paddingVertical: 10,
    borderRadius: 25,
    borderCurve: 'continuous',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    shadowOpacity: 0.1,
    elevation: 5,
    minHeight: 60, // Used for TAB_BAR_HEIGHT calculation
    overflow: 'hidden',
  },
});

export default CustomTabBar; 