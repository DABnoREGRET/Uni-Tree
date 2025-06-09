import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Colors, Fonts, FontSizes } from '../../constants';

interface TabBarButtonProps {
  isFocused: boolean;
  label: string;
  routeName: string;
  onPress: () => void;
  onLongPress: () => void;
  style?: any;
  accessibilityRole?: any;
  accessibilityState?: any;
  accessibilityLabel?: string;
  testID?: string;
}

const iconMap: Record<string, React.ComponentProps<typeof FontAwesome>['name']> = {
  'home/index': 'bars',
  'redeem/index': 'bookmark',
  'tree/index': 'home',
  'leaderboard/index': 'star',
  'profile/index': 'user',
};

const ACTIVE_TEXT_ICON_COLOR = Colors.white;
const INACTIVE_ICON_COLOR = Colors.primary;
const PILL_BACKGROUND_COLOR = Colors.primary;
const BOUNCE_SCALE = 0.9;
const BOUNCE_UP_TRANSLATE_Y = -8;

const CustomTabBarButton: React.FC<TabBarButtonProps> = (props) => {
  const { isFocused, label, routeName, onPress, onLongPress, style } = props;
  const animationProgress = useSharedValue(0);
  const pressProgress = useSharedValue(0);

  useEffect(() => {
    animationProgress.value = withTiming(isFocused ? 1 : 0, {
      duration: 300,
    });
  }, [isFocused, animationProgress]);

  const handlePressIn = () => {
    if (isFocused) {
      pressProgress.value = withTiming(1, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (isFocused) {
      pressProgress.value = withTiming(0, { duration: 150 });
    }
  };

  const animatedBounceStyle = useAnimatedStyle(() => {
    if (!isFocused) {
      return {};
    }
    const translateY = interpolate(pressProgress.value, [0, 1], [0, BOUNCE_UP_TRANSLATE_Y]);
    const scale = interpolate(pressProgress.value, [0, 1], [1, BOUNCE_SCALE]);
    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const animatedPillStyle = useAnimatedStyle(() => {
    const opacity = animationProgress.value;
    return {
      opacity,
      backgroundColor: PILL_BACKGROUND_COLOR,
      paddingHorizontal: interpolate(animationProgress.value, [0, 1], [styles.iconOnlyWrapper.paddingHorizontal || 8, styles.contentWrapperBase.paddingHorizontal || 20]),
      paddingVertical: interpolate(animationProgress.value, [0, 1], [styles.iconOnlyWrapper.paddingVertical || 8, styles.contentWrapperBase.paddingVertical || 12]),
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    const opacity = animationProgress.value;
    const maxWidth = interpolate(animationProgress.value, [0, 1], [0, 150]);

    return {
      opacity,
      maxWidth,
      color: ACTIVE_TEXT_ICON_COLOR,
      marginLeft: interpolate(animationProgress.value, [0, 1], [0, 6]),
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        animationProgress.value,
        [0, 1],
        [INACTIVE_ICON_COLOR, ACTIVE_TEXT_ICON_COLOR]
      ),
    };
  });

  const iconName = iconMap[routeName] || 'circle';

  const handlePress = () => {
    onPress();
  };

  return (
    <Pressable
      {...props}
      style={[styles.container, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={onLongPress}
      android_ripple={
        isFocused ? undefined : {
          color: Colors.primaryRipple,
          borderless: true,
          radius: 22,
        }
      }
    >
      <Animated.View style={[styles.outerWrapper, animatedBounceStyle, {borderRadius: 25, overflow: 'hidden'}]}>
        <Animated.View style={[styles.pillBackground, animatedPillStyle]} />
        <View style={isFocused ? styles.contentWrapperBase : styles.iconOnlyWrapper}>
          <Animated.Text style={[styles.iconStyle, iconAnimatedStyle]}>
            <FontAwesome name={iconName} size={20} />
          </Animated.Text>
          {isFocused && (
            <Animated.Text 
              numberOfLines={1}
              style={[styles.label, animatedLabelStyle]}
            >
              {label}
            </Animated.Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pillBackground: {
    position: 'absolute',
    borderRadius: 20,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  contentWrapperBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 1,
    overflow: 'visible',
  },
  iconOnlyWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    zIndex: 1,
  },
  iconStyle: {
  },
  label: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.SemiBold,
  },
});

export default CustomTabBarButton; 