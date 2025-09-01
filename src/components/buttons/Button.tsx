/**
 * Componentes de Botones Reutilizables - FASE 7
 * Sistema de botones consistente con animaciones
 */

import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { AnimatedEntrance } from '../animated/AnimatedEntrance';

// Importar colores y tipografía desde el sistema de diseño
import DESIGN_SYSTEM from '../../theme/designSystem';

const COLORS = DESIGN_SYSTEM.COLORS;

const TYPOGRAPHY = DESIGN_SYSTEM.TYPOGRAPHY;

const SPACING = DESIGN_SYSTEM.SPACING;

const BORDERS = DESIGN_SYSTEM.BORDERS;

const SHADOWS = DESIGN_SYSTEM.SHADOWS;

// ================================
// TIPOS Y INTERFACES
// ================================

export type ButtonVariant = 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';
export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'neutral';

interface BaseButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  animationType?: 'spring' | 'timing';
  testID?: string;
}

// ================================
// CONFIGURACIONES DE ESTILO
// ================================

const getButtonColors = (variant: ButtonVariant, color: ButtonColor, disabled: boolean) => {
  if (disabled) {
    return {
      backgroundColor: COLORS.surface.disabled,
      textColor: COLORS.text.disabled,
      borderColor: COLORS.neutral[500],
    };
  }

  switch (variant) {
    case 'filled':
      switch (color) {
        case 'primary':
          return {
            backgroundColor: COLORS.primary[500],
            textColor: COLORS.neutral[0],
            borderColor: COLORS.primary[500],
          };
        case 'secondary':
          return {
            backgroundColor: COLORS.secondary[500],
            textColor: COLORS.neutral[0],
            borderColor: COLORS.secondary[500],
          };
        case 'error':
          return {
            backgroundColor: COLORS.error[500],
            textColor: COLORS.neutral[0],
            borderColor: COLORS.error[500],
          };
        case 'warning':
          return {
            backgroundColor: COLORS.warning[500],
            textColor: COLORS.neutral[0],
            borderColor: COLORS.warning[500],
          };
        case 'info':
          return {
            backgroundColor: COLORS.info[500],
            textColor: COLORS.neutral[0],
            borderColor: COLORS.info[500],
          };
        case 'neutral':
          return {
            backgroundColor: COLORS.neutral[500],
            textColor: COLORS.neutral[900],
            borderColor: COLORS.neutral[500],
          };
      }
      break;
    
    case 'outlined':
      switch (color) {
        case 'primary':
          return {
            backgroundColor: 'transparent',
            textColor: COLORS.primary[500],
            borderColor: COLORS.primary[500],
          };
        case 'secondary':
          return {
            backgroundColor: 'transparent',
            textColor: COLORS.secondary[600],
            borderColor: COLORS.secondary[500],
          };
        case 'error':
          return {
            backgroundColor: 'transparent',
            textColor: COLORS.error[500],
            borderColor: COLORS.error[500],
          };
        case 'warning':
          return {
            backgroundColor: 'transparent',
            textColor: COLORS.warning[500],
            borderColor: COLORS.warning[500],
          };
        case 'info':
          return {
            backgroundColor: 'transparent',
            textColor: COLORS.info[500],
            borderColor: COLORS.info[500],
          };
        case 'neutral':
          return {
            backgroundColor: 'transparent',
            textColor: COLORS.neutral[600],
            borderColor: COLORS.neutral[500],
          };
      }
      break;
    
    case 'text':
      switch (color) {
        case 'primary':
          return {
            backgroundColor: 'transparent',
            textColor: COLORS.primary[600],
            borderColor: 'transparent',
          };
        case 'secondary':
          return {
            backgroundColor: 'transparent',
            textColor: COLORS.secondary[600],
            borderColor: 'transparent',
          };
        case 'error':
          return {
            backgroundColor: 'transparent',
            textColor: COLORS.error[500],
            borderColor: 'transparent',
          };
        case 'warning':
          return {
            backgroundColor: 'transparent',
            textColor: COLORS.warning[500],
            borderColor: 'transparent',
          };
        case 'info':
          return {
            backgroundColor: 'transparent',
            textColor: COLORS.info[500],
            borderColor: 'transparent',
          };
        case 'neutral':
          return {
            backgroundColor: 'transparent',
            textColor: COLORS.neutral[600],
            borderColor: 'transparent',
          };
      }
      break;
    
    case 'elevated':
      switch (color) {
        case 'primary':
          return {
            backgroundColor: COLORS.neutral[0],
            textColor: COLORS.primary[600],
            borderColor: 'transparent',
          };
        case 'secondary':
          return {
            backgroundColor: COLORS.neutral[0],
            textColor: COLORS.secondary[600],
            borderColor: 'transparent',
          };
        case 'error':
          return {
            backgroundColor: COLORS.neutral[0],
            textColor: COLORS.error[500],
            borderColor: 'transparent',
          };
        case 'warning':
          return {
            backgroundColor: COLORS.neutral[0],
            textColor: COLORS.warning[500],
            borderColor: 'transparent',
          };
        case 'info':
          return {
            backgroundColor: COLORS.neutral[0],
            textColor: COLORS.info[500],
            borderColor: 'transparent',
          };
        case 'neutral':
          return {
            backgroundColor: COLORS.neutral[0],
            textColor: COLORS.neutral[600],
            borderColor: 'transparent',
          };
      }
      break;
    
    case 'tonal':
      switch (color) {
        case 'primary':
          return {
            backgroundColor: `${COLORS.primary[500]}20`,
            textColor: COLORS.primary[700],
            borderColor: 'transparent',
          };
        case 'secondary':
          return {
            backgroundColor: `${COLORS.secondary[500]}20`,
            textColor: COLORS.secondary[600],
            borderColor: 'transparent',
          };
        case 'error':
          return {
            backgroundColor: `${COLORS.error[500]}20`,
            textColor: COLORS.error[700],
            borderColor: 'transparent',
          };
        case 'warning':
          return {
            backgroundColor: `${COLORS.warning[500]}20`,
            textColor: COLORS.warning[500],
            borderColor: 'transparent',
          };
        case 'info':
          return {
            backgroundColor: `${COLORS.info[500]}20`,
            textColor: COLORS.info[500],
            borderColor: 'transparent',
          };
        case 'neutral':
          return {
            backgroundColor: `${COLORS.neutral[500]}20`,
            textColor: COLORS.neutral[600],
            borderColor: 'transparent',
          };
      }
      break;
  }
  
  // Default fallback
  return {
    backgroundColor: COLORS.primary[500],
    textColor: COLORS.neutral[0],
    borderColor: COLORS.primary[500],
  };
};

const getButtonSizes = (size: ButtonSize) => {
  switch (size) {
    case 'small':
      return {
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        fontSize: 12,
        minHeight: 32,
      };
    
    case 'medium':
      return {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.base,
        fontSize: 14,
        minHeight: 40,
      };
    
    case 'large':
      return {
        paddingVertical: SPACING.sm + 2,
        paddingHorizontal: SPACING.lg,
        fontSize: 16,
        minHeight: 48,
      };
    
    default:
      return {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.base,
        fontSize: 14,
        minHeight: 40,
      };
  }
};

// ================================
// COMPONENTE ANIMADO
// ================================

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// ================================
// COMPONENTE PRINCIPAL
// ================================

export const Button: React.FC<BaseButtonProps> = ({
  title,
  onPress,
  variant = 'filled',
  size = 'medium',
  color = 'primary',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  animationType = 'spring',
  testID,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const colors = getButtonColors(variant, color, disabled || loading);
  const sizes = getButtonSizes(size);

  const handlePressIn = () => {
    if (disabled || loading) return;
    
    if (animationType === 'spring') {
      scale.value = withSpring(0.95, {
        damping: 15,
        stiffness: 150,
      });
    } else {
      scale.value = withTiming(0.95, { duration: 100 });
    }
    
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    
    if (animationType === 'spring') {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
    } else {
      scale.value = withTiming(1, { duration: 100 });
    }
    
    opacity.value = withTiming(1, { duration: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const buttonStyle: ViewStyle[] = [
    styles.button,
    {
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
      paddingVertical: sizes.paddingVertical,
      paddingHorizontal: sizes.paddingHorizontal,
      minHeight: sizes.minHeight,
      opacity: disabled ? 0.6 : 1,
    },
    variant === 'outlined' && styles.outlined,
    variant === 'elevated' && styles.elevated,
    fullWidth && { width: '100%' },
    style,
  ].filter(Boolean) as ViewStyle[];

  const contentStyle: ViewStyle = {
    ...styles.content,
    ...(icon && styles.contentWithIcon),
  };

  const textStyles = [
    styles.text,
    {
      color: colors.textColor,
      ...TYPOGRAPHY.styles.button,
    },
    textStyle,
  ];

  const renderContent = () => (
    <View style={contentStyle}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={colors.textColor}
          style={styles.loader}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </>
      )}
    </View>
  );

  return (
    <AnimatedEntrance type="fadeIn" config={{ duration: 200 }}>
      <AnimatedTouchableOpacity
        style={[...buttonStyle, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        testID={testID}
      >
        {renderContent()}
      </AnimatedTouchableOpacity>
    </AnimatedEntrance>
  );
};

// ================================
// COMPONENTE DE BOTÓN FAB
// ================================

interface FABProps {
  icon: React.ReactNode;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  color?: ButtonColor;
  disabled?: boolean;
  style?: ViewStyle;
  extended?: boolean;
  label?: string;
  testID?: string;
}

export const FloatingActionButton: React.FC<FABProps> = ({
  icon,
  onPress,
  size = 'medium',
  color = 'primary',
  disabled = false,
  style,
  extended = false,
  label,
  testID,
}) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const colors = getButtonColors('filled', color, disabled);
  
  const fabSizes = {
    small: { width: 40, height: 40, borderRadius: 20 },
    medium: { width: 56, height: 56, borderRadius: 28 },
    large: { width: 64, height: 64, borderRadius: 32 },
  };

  const selectedSize = fabSizes[size];

  const handlePressIn = () => {
    if (disabled) return;
    
    scale.value = withSpring(0.9, {
      damping: 15,
      stiffness: 200,
    });
    
    rotation.value = withSpring(15, {
      damping: 15,
      stiffness: 200,
    });
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 200,
    });
    
    rotation.value = withSpring(0, {
      damping: 15,
      stiffness: 200,
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  const fabStyle = [
    styles.fab,
    {
      backgroundColor: colors.backgroundColor,
      ...selectedSize,
      width: extended ? undefined : selectedSize.width,
      paddingHorizontal: extended ? SPACING.base : 0,
    },
    style,
  ];

  return (
    <AnimatedEntrance type="zoomIn" config={{ duration: 300 }}>
      <AnimatedTouchableOpacity
        style={[fabStyle, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        testID={testID}
      >
        <View style={styles.fabContent}>
          {icon}
          {extended && label && (
            <Text style={[styles.fabLabel, { color: colors.textColor }]}>
              {label}
            </Text>
          )}
        </View>
      </AnimatedTouchableOpacity>
    </AnimatedEntrance>
  );
};

// ================================
// COMPONENTE DE GRUPO DE BOTONES
// ================================

interface ButtonGroupProps {
  buttons: Array<{
    title: string;
    onPress: () => void;
    disabled?: boolean;
    selected?: boolean;
  }>;
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  style?: ViewStyle;
  orientation?: 'horizontal' | 'vertical';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  buttons,
  variant = 'outlined',
  color = 'primary',
  size = 'medium',
  style,
  orientation = 'horizontal',
}) => {
  const groupStyle = [
    styles.buttonGroup,
    orientation === 'vertical' && styles.buttonGroupVertical,
    style,
  ];

  return (
    <AnimatedEntrance type="slideInUp" config={{ duration: 300 }}>
      <View style={groupStyle}>
        {buttons.map((button, index) => (
          <Button
            key={index}
            title={button.title}
            onPress={button.onPress}
            variant={button.selected ? 'filled' : variant}
            color={color}
            size={size}
            disabled={button.disabled}
            style={StyleSheet.flatten([
              styles.groupButton,
              orientation === 'horizontal' && index > 0 && styles.groupButtonHorizontal,
              orientation === 'vertical' && index > 0 && styles.groupButtonVertical,
            ])}
          />
        ))}
      </View>
    </AnimatedEntrance>
  );
};

// ================================
// ESTILOS
// ================================

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDERS.radius.base,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  outlined: {
    borderWidth: 1,
  },
  
  elevated: {
    ...SHADOWS.base,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  contentWithIcon: {
    paddingHorizontal: SPACING.xs,
  },
  
  text: {
    textAlign: 'center',
    ...TYPOGRAPHY.styles.button,
  },
  
  iconLeft: {
    marginRight: SPACING.xs,
  },
  
  iconRight: {
    marginLeft: SPACING.xs,
  },
  
  loader: {
    marginRight: SPACING.xs,
  },
  
  fab: {
    ...SHADOWS.base,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: SPACING.base,
    right: SPACING.base,
  },
  
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  fabLabel: {
    marginLeft: SPACING.xs,
    fontSize: 14,
    fontWeight: '500',
  },
  
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  buttonGroupVertical: {
    flexDirection: 'column',
  },
  
  groupButton: {
    flex: 1,
  },
  
  groupButtonHorizontal: {
    marginLeft: -1, // Overlap borders
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  
  groupButtonVertical: {
    marginTop: -1, // Overlap borders
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
});

export default {
  Button,
  FloatingActionButton,
  ButtonGroup,
};
