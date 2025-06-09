import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants';

interface DefaultImageProps {
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  iconName?: React.ComponentProps<typeof FontAwesome>['name'];
  iconColor?: string;
}

export const DefaultImage: React.FC<DefaultImageProps> = ({
  style,
  iconSize = 24,
  iconName = 'user',
  iconColor = Colors.grayDark,
}) => {
  return (
    <View style={[styles.container, style]}>
      <FontAwesome name={iconName} size={iconSize} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Ensures icon doesn't go out of bounds if padding/border applied
  },
}); 