import { FontAwesome } from '@expo/vector-icons';
import React, { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, FontSizes } from '../../constants';

interface StyledTextInputProps extends TextInputProps {
  iconName?: React.ComponentProps<typeof FontAwesome>['name'];
  label?: string;
  error?: string;
  touched?: boolean;
  containerStyle?: object;
  inputStyle?: object;
  showPasswordToggle?: boolean;
  passwordVisible?: boolean;
  onTogglePasswordVisibility?: () => void;
  labelStyle?: object;
}

const StyledTextInput = forwardRef<TextInput, StyledTextInputProps>((
  {
    iconName,
    label,
    error,
    touched,
    containerStyle,
    inputStyle,
    showPasswordToggle = false,
    passwordVisible = false,
    onTogglePasswordVisibility,
    labelStyle,
    ...props
  }, 
  ref
) => {
  return (
    <View style={[styles.outerContainer, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle, !!error && styles.labelError]}>{label}</Text>}
      <View style={[styles.inputContainer, !!error && styles.inputContainerError]}>
        {iconName && <FontAwesome name={iconName} size={20} color={Colors.text} style={styles.icon} />}
        <TextInput
          ref={ref}
          style={[styles.input, inputStyle]}
          placeholderTextColor={Colors.inputPlaceholder}
          secureTextEntry={showPasswordToggle && !passwordVisible}
          {...props}
        />
        {showPasswordToggle && onTogglePasswordVisibility && (
          <TouchableOpacity onPress={onTogglePasswordVisibility} style={styles.eyeIconContainer}>
            <FontAwesome name={passwordVisible ? "eye-slash" : "eye"} size={20} color={Colors.text} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.errorContainer}>
        {!!error && !!error.trim() && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    fontSize: FontSizes.md, 
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.white,
    marginBottom: 8,
    marginLeft: 5,
  },
  labelError: {
    color: Colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'transparent',
    height: 50,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: FontSizes.md,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.text,
  },
  eyeIconContainer: {
    padding: 5,
  },
  errorContainer: {
    minHeight: 20,
    paddingTop: 6,
    paddingLeft: 5,
  },
  errorText: {
    fontSize: FontSizes.sm, 
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.error,
  },
});

export default StyledTextInput; 