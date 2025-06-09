import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { registerBackgroundWifiMonitor } from './services/backgroundWifiMonitor';
// import Swiper from 'react-native-swiper'; // Consider adding a swiper for multi-page onboarding

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  key: string;
  title: string;
  text: string;
  imageType: 'image' | 'icon' | 'image_and_icon';
  imageSource?: any; // For Image
  iconName?: React.ComponentProps<typeof FontAwesome>['name']; // For FontAwesome icon
  secondaryImageSource?: any; // For greet_mascot on slide 3
  secondaryIconName?: React.ComponentProps<typeof FontAwesome>['name']; // For store icon on slide 3
  backgroundColor: string;
}

const onboardingSlides: OnboardingSlide[] = [
  {
    key: '1',
    title: 'Welcome to UniTree!',
    text: 'Connect to campus WiFi, grow your virtual tree, and earn real rewards.',
    imageType: 'image',
    imageSource: require('../assets/images/hello_mascot.png'),
    backgroundColor: '#FFCED3', // Light Pinkish
  },
  {
    key: '2',
    title: 'Grow Your Tree',
    text: 'The more you stay connected on campus, the more your unique tree flourishes.',
    imageType: 'icon',
    iconName: 'tree',
    backgroundColor: '#A5D6A7', // Light Mint Green
  },
  {
    key: '3',
    title: 'Redeem Rewards',
    text: 'Use your points to get exclusive discounts, university merch, and more!',
    imageType: 'image_and_icon',
    imageSource: require('../assets/images/greet_mascot.png'),
    secondaryIconName: 'shopping-bag', // Example store/gift icon
    backgroundColor: '#F4D06F', // Example Yellow/Orange
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleGetStarted = async () => {
    try {
      console.log("Attempting to set hasCompletedOnboarding to true...");
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      console.log("hasCompletedOnboarding set to true. Navigating to login...");
      await registerBackgroundWifiMonitor();
      router.replace('/(auth)/login');
    } catch (e) {
      console.error("Failed to save onboarding status or navigate:", e);
      // Still navigate, but log the error
      router.replace('/(auth)/login');
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;


  const renderItem = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slideContainer, { backgroundColor: item.backgroundColor, width: width }]}>
      <View style={styles.illustrationContainer}>
        {item.imageType === 'image' && item.imageSource && (
          <Image source={item.imageSource} style={styles.mainImage} resizeMode="contain" />
        )}
        {item.imageType === 'icon' && item.iconName && (
          <FontAwesome name={item.iconName} size={width * 0.5} color="#FFFFFF" />
        )}
        {item.imageType === 'image_and_icon' && (
          <View style={styles.combinedImageContainer}>
            {item.imageSource && <Image source={item.imageSource} style={styles.mascotImage} resizeMode="contain" />}
            {item.secondaryIconName && <FontAwesome name={item.secondaryIconName} size={width * 0.3} color="#FFFFFF" style={styles.secondaryIcon} />}
          </View>
        )}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={{ flex: 1 }}
      />
      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {onboardingSlides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === currentIndex ? styles.activeDot : {}]}
            />
          ))}
        </View>

        {currentIndex < onboardingSlides.length - 1 ? (
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFCED3',
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
    paddingHorizontal: 30,
    paddingTop: height * 0.1,
    paddingBottom: height * 0.25, // Make space for footer
  },
  illustrationContainer: {
    width: width * 0.85,
    height: height * 0.40, // Reduced height slightly
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30, // Increased margin
  },
  mainImage: {
    width: '90%',
    height: '90%',
  },
  combinedImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  mascotImage: {
    width: width * 0.4,
    height: height * 0.3,
  },
  secondaryIcon: {
    // marginLeft: 10, // Add some space if needed
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 36, // Adjusted from Figma 'Welcome Gre...!' (58px)
    fontFamily: 'Grandstander-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40, // Adjusted line height
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18, // Adjusted from Figma 'alo alo alo...' (28px)
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.9,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.20, // Consistent with paddingBottom of slideContainer
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 30, // Padding for button from edge
    paddingHorizontal: 30,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 20, // Space between dots and button
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 12, // Slightly larger active dot
    height: 12,
    borderRadius: 6,
  },
  button: {
    backgroundColor: '#A2C00E',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 18,
    width: width * 0.7,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    fontSize: 20,
    fontFamily: 'Grandstander-Bold',
    color: '#FFFFFF',
    fontWeight: '700',
  },
}); 