import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontSizes } from '../../constants';

interface UniversalHeaderProps {
  title: string;
  showBackButton?: boolean;
}

const UniversalHeader: React.FC<UniversalHeaderProps> = ({ title, showBackButton = false }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 15, paddingBottom: 15 }]}>
      {showBackButton ? (
        <TouchableOpacity onPress={handleBackPress} style={styles.backButtonContainer}>
          <FontAwesome name="arrow-left" size={20} color={Colors.white} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backButtonContainer} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.backButtonContainer} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.Grandstander.Bold,
    color: Colors.white,
    textAlign: 'center',
    flex: 1, // Allows title to take space and truly center if placeholders are equal
  },
  backButtonContainer: {
    minWidth: 30, // Ensure it has some width, same as backButton for balance
  },
});

export default UniversalHeader; 