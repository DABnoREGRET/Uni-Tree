import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Colors } from '../../constants';

interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  color?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ value, onValueChange, color }) => {
  return (
    <Pressable
      style={[styles.checkboxBase, value && { borderColor: color || Colors.primary }]}
      onPress={() => onValueChange(!value)}
    >
      {value && <Ionicons name="checkmark" size={20} color={color || Colors.primary} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  checkboxBase: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.grayMedium,
    backgroundColor: Colors.white,
  },
});

export default Checkbox; 