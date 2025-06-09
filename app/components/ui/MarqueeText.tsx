import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

interface MarqueeTextProps {
  text: string;
  style?: any;
}

const MarqueeText: React.FC<MarqueeTextProps> = ({ text, style }) => {
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const isOverflowing = textWidth > containerWidth;
  // Calculate the distance to scroll only if the text is overflowing
  const scrollDistance = isOverflowing ? textWidth - containerWidth + 20 : 0; 

  useEffect(() => {
    // Always reset the animation when text changes or overflow status changes
    animatedValue.setValue(0);
    
    if (isOverflowing) {
      const duration = (scrollDistance / 40) * 1000; // Dynamic duration based on text length
      const scrollAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1, // Animate from 0 to 1
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.delay(1500), // Hold at the end
          Animated.timing(animatedValue, {
            toValue: 0, // Animate from 1 back to 0
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.delay(1500), // Hold at the beginning
        ])
      );
      scrollAnimation.start();
      return () => scrollAnimation.stop();
    }
  }, [isOverflowing, scrollDistance, text, animatedValue]);

  // Interpolate the 0-1 value to the actual pixel distance
  const translateX = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -scrollDistance], // Map 0 to 0px and 1 to -scrollDistance px
      extrapolate: 'clamp'
  });

  return (
    <View 
      style={styles.container}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View 
        style={[
          styles.textView,
          // Only apply the transform if the text is overflowing
          { transform: [{ translateX: isOverflowing ? translateX : 0 }] }
        ]}
      >
        <Text 
          style={style} 
          onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
          numberOfLines={1}
        >
          {text}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    width: '100%',
  },
  textView: {
    flexDirection: 'row',
  },
});

export default MarqueeText; 