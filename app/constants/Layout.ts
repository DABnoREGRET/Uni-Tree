import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Approximate height of the custom tab bar
// Consider its absolute position (bottom: 25) and its internal height (minHeight: 60 or actual rendered height)
// Total space taken from bottom of screen = bottom_offset + tab_bar_height
// Tab bar height itself is roughly 60 (minHeight) + 10*2 (paddingVertical in tabbar) = 80. But it's offset by 25 from bottom.
// Let's use a value that represents the space content needs to clear from the very bottom of the screen.
// Effective Tab Bar height from screen bottom: 60 (minHeight of tabbar) + 25 (bottom offset of tabbar) = 85 is a good starting point.
// Or more simply, the tab bar is `minHeight: 60` and its bottom is `25` from screen bottom. So, content should end above `25 + some_of_tab_bar_height`.
// Current BOTTOM_TAB_BAR_HEIGHT is 100. Let's increase it further.
export const BOTTOM_TAB_BAR_HEIGHT = 150;

export default {
  window: {
    width,
    height,
  },
  isSmallDevice: width < 375,
  BOTTOM_TAB_BAR_HEIGHT,
}; 