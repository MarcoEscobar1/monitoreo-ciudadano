import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import DESIGN_SYSTEM from '../../theme/designSystem';

interface InputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  style?: any;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Text style={styles.icon}>{leftIcon}</Text>
          </View>
        )}
        <TextInput
          style={[styles.input, leftIcon && styles.inputWithLeftIcon, rightIcon && styles.inputWithRightIcon]}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={DESIGN_SYSTEM.COLORS.neutral[400]}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity 
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{rightIcon}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: DESIGN_SYSTEM.SPACING.base,
  },
  label: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.sm,
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.medium,
    color: DESIGN_SYSTEM.COLORS.neutral[700],
    marginBottom: DESIGN_SYSTEM.SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.COLORS.neutral[300],
    borderRadius: 8,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[0],
    minHeight: 48,
  },
  inputContainerError: {
    borderColor: DESIGN_SYSTEM.COLORS.error[500],
  },
  input: {
    flex: 1,
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    color: DESIGN_SYSTEM.COLORS.neutral[900],
    paddingVertical: DESIGN_SYSTEM.SPACING.sm,
    paddingHorizontal: DESIGN_SYSTEM.SPACING.base,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  leftIconContainer: {
    paddingLeft: DESIGN_SYSTEM.SPACING.base,
    paddingRight: DESIGN_SYSTEM.SPACING.xs,
  },
  rightIconContainer: {
    paddingRight: DESIGN_SYSTEM.SPACING.base,
    paddingLeft: DESIGN_SYSTEM.SPACING.xs,
  },
  icon: {
    fontSize: 16,
  },
  errorText: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.xs,
    color: DESIGN_SYSTEM.COLORS.error[500],
    marginTop: DESIGN_SYSTEM.SPACING.xs,
  },
});
