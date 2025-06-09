import React, { useRef } from 'react';
import { FlatList, FlatListProps, NativeScrollEvent, NativeSyntheticEvent, ScrollView, ScrollViewProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_TAB_BAR_HEIGHT, Colors } from '../../constants';
import { useTabBarVisibility } from '../../contexts/TabBarVisibilityContext';

interface ScreenWrapperProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  withScrollView?: boolean;
  scrollViewProps?: ScrollViewProps;
  flatListProps?: FlatListProps<any>;
  isFlatList?: boolean;
  controlsTabBarVisibility?: boolean;
  applyTopInset?: boolean;
}

const SCROLL_THRESHOLD = 50;

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  contentContainerStyle,
  withScrollView = true,
  scrollViewProps = {},
  flatListProps = {},
  isFlatList = false,
  controlsTabBarVisibility = true,
  applyTopInset = true,
}) => {
  const insets = useSafeAreaInsets();
  const { setIsTabBarVisible, scrollY, setScrollY, setScrollDirection } = useTabBarVisibility();
  const lastScrollY = useRef(scrollY);

  const baseScreenStyle: StyleProp<ViewStyle> = [styles.defaultScreenStyle];
  if (applyTopInset) {
    baseScreenStyle.push({ paddingTop: insets.top });
  }

  const combinedStyle = StyleSheet.flatten([
    baseScreenStyle,
    style,
  ]);
  const combinedContentContainerStyle = StyleSheet.flatten([
    styles.defaultContentContainerStyle,
    { paddingBottom: BOTTOM_TAB_BAR_HEIGHT },
    contentContainerStyle,
  ]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!controlsTabBarVisibility) return;

    const currentScrollY = event.nativeEvent.contentOffset.y;
    const deltaY = currentScrollY - lastScrollY.current;

    setScrollY(currentScrollY);
    if (deltaY > 0) {
      setScrollDirection('down');
      if (currentScrollY > SCROLL_THRESHOLD) {
        setIsTabBarVisible(false);
      }
    } else if (deltaY < 0) {
      setScrollDirection('up');
      if (currentScrollY <= 0 || deltaY < 0) {
        setIsTabBarVisible(true);
      }
    } else {
      if (currentScrollY <= 0) {
        setIsTabBarVisible(true);
      }
    }

    lastScrollY.current = currentScrollY;

    if (isFlatList && 'onScroll' in flatListProps && typeof flatListProps.onScroll === 'function') {
      flatListProps.onScroll(event);
    } else if (!isFlatList && withScrollView && 'onScroll' in scrollViewProps && typeof scrollViewProps.onScroll === 'function') {
      scrollViewProps.onScroll(event);
    }
  };

  if (isFlatList) {
    return (
      <FlatList
        style={combinedStyle}
        contentContainerStyle={combinedContentContainerStyle}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        {...(flatListProps as FlatListProps<any>)}
      />
    );
  }

  if (withScrollView) {
    return (
      <ScrollView
        style={combinedStyle}
        contentContainerStyle={combinedContentContainerStyle}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={combinedStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  defaultScreenStyle: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  defaultContentContainerStyle: {
    flexGrow: 1,
  },
});

export default ScreenWrapper; 