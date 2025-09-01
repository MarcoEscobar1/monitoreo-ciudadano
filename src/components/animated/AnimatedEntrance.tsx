/**
 * Componente de Entrada Animada - FASE 7
 * Animaciones suaves para entrada de elementos
 */

import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  FadeIn,
  SlideInUp,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  ZoomIn,
} from 'react-native-reanimated';

// Configuraciones de animación constantes
const ANIMATIONS = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 800,
  },
  spring: {
    gentle: {
      damping: 500,
      stiffness: 300,
      mass: 1,
    },
  },
};

// ================================
// TIPOS DE ANIMACIÓN
// ================================

export type AnimationType = 
  | 'fadeIn'
  | 'slideInUp'
  | 'slideInDown'
  | 'slideInLeft'
  | 'slideInRight'
  | 'zoomIn'
  | 'custom';

export type AnimationConfig = {
  duration?: number;
  delay?: number;
  damping?: number;
  stiffness?: number;
  mass?: number;
};

// ================================
// PROPIEDADES DEL COMPONENTE
// ================================

interface AnimatedEntranceProps {
  children: React.ReactNode;
  type?: AnimationType;
  config?: AnimationConfig;
  style?: ViewStyle;
  trigger?: boolean;
  onComplete?: () => void;
}

// ================================
// CONFIGURACIONES PREDEFINIDAS
// ================================

const getAnimationConfig = (type: AnimationType, config?: AnimationConfig) => {
  const defaultConfig = {
    duration: config?.duration || ANIMATIONS.duration.normal,
    delay: config?.delay || 0,
  };

  switch (type) {
    case 'fadeIn':
      return FadeIn.duration(defaultConfig.duration).delay(defaultConfig.delay);
    
    case 'slideInUp':
      return SlideInUp.duration(defaultConfig.duration).delay(defaultConfig.delay);
    
    case 'slideInDown':
      return SlideInDown.duration(defaultConfig.duration).delay(defaultConfig.delay);
    
    case 'slideInLeft':
      return SlideInLeft.duration(defaultConfig.duration).delay(defaultConfig.delay);
    
    case 'slideInRight':
      return SlideInRight.duration(defaultConfig.duration).delay(defaultConfig.delay);
    
    case 'zoomIn':
      return ZoomIn.duration(defaultConfig.duration).delay(defaultConfig.delay);
    
    default:
      return FadeIn.duration(defaultConfig.duration).delay(defaultConfig.delay);
  }
};

// ================================
// COMPONENTE PRINCIPAL
// ================================

export const AnimatedEntrance: React.FC<AnimatedEntranceProps> = ({
  children,
  type = 'fadeIn',
  config,
  style,
  trigger = true,
  onComplete,
}) => {
  const animationConfig = getAnimationConfig(type, config);

  return (
    <Animated.View
      entering={trigger ? animationConfig : undefined}
      style={style}
      onLayout={onComplete}
    >
      {children}
    </Animated.View>
  );
};

// ================================
// COMPONENTE DE ANIMACIÓN PERSONALIZADA
// ================================

interface CustomAnimatedProps {
  children: React.ReactNode;
  fromOpacity?: number;
  toOpacity?: number;
  fromScale?: number;
  toScale?: number;
  fromTranslateX?: number;
  toTranslateX?: number;
  fromTranslateY?: number;
  toTranslateY?: number;
  fromRotation?: number;
  toRotation?: number;
  config?: AnimationConfig;
  style?: ViewStyle;
  trigger?: boolean;
  loop?: boolean;
  onComplete?: () => void;
}

export const CustomAnimated: React.FC<CustomAnimatedProps> = ({
  children,
  fromOpacity = 0,
  toOpacity = 1,
  fromScale = 1,
  toScale = 1,
  fromTranslateX = 0,
  toTranslateX = 0,
  fromTranslateY = 0,
  toTranslateY = 0,
  fromRotation = 0,
  toRotation = 0,
  config,
  style,
  trigger = true,
  loop = false,
  onComplete,
}) => {
  const opacity = useSharedValue(fromOpacity);
  const scale = useSharedValue(fromScale);
  const translateX = useSharedValue(fromTranslateX);
  const translateY = useSharedValue(fromTranslateY);
  const rotation = useSharedValue(fromRotation);

  const animationConfig = {
    duration: config?.duration || ANIMATIONS.duration.normal,
    easing: Easing.out(Easing.cubic),
  };

  const springConfig = {
    damping: config?.damping || ANIMATIONS.spring.gentle.damping,
    stiffness: config?.stiffness || ANIMATIONS.spring.gentle.stiffness,
    mass: config?.mass || ANIMATIONS.spring.gentle.mass,
  };

  useEffect(() => {
    if (trigger) {
      const startAnimation = () => {
        // Usar spring para escalas y movimientos, timing para opacidad y rotación
        if (config?.damping || config?.stiffness) {
          // Animación con spring
          scale.value = withDelay(
            config?.delay || 0,
            withSpring(toScale, springConfig, (finished) => {
              if (finished && onComplete && !loop) onComplete();
            })
          );
          translateX.value = withDelay(config?.delay || 0, withSpring(toTranslateX, springConfig));
          translateY.value = withDelay(config?.delay || 0, withSpring(toTranslateY, springConfig));
        } else {
          // Animación con timing
          scale.value = withDelay(
            config?.delay || 0,
            withTiming(toScale, animationConfig, (finished) => {
              if (finished && onComplete && !loop) onComplete();
            })
          );
          translateX.value = withDelay(config?.delay || 0, withTiming(toTranslateX, animationConfig));
          translateY.value = withDelay(config?.delay || 0, withTiming(toTranslateY, animationConfig));
        }

        opacity.value = withDelay(config?.delay || 0, withTiming(toOpacity, animationConfig));
        rotation.value = withDelay(config?.delay || 0, withTiming(toRotation, animationConfig));
      };

      startAnimation();

      // Configurar loop si es necesario
      if (loop) {
        const interval = setInterval(() => {
          // Reset values
          opacity.value = fromOpacity;
          scale.value = fromScale;
          translateX.value = fromTranslateX;
          translateY.value = fromTranslateY;
          rotation.value = fromRotation;
          
          // Start animation again
          setTimeout(startAnimation, 50);
        }, (animationConfig.duration + (config?.delay || 0)) * 2);

        return () => clearInterval(interval);
      }
    }
  }, [trigger, loop]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// ================================
// COMPONENTE DE LISTA ANIMADA
// ================================

interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  style?: ViewStyle;
  staggerDelay?: number;
  animationType?: AnimationType;
  config?: AnimationConfig;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index,
  style,
  staggerDelay = 100,
  animationType = 'slideInUp',
  config,
}) => {
  const delay = index * staggerDelay;
  const itemConfig = { ...config, delay };

  return (
    <AnimatedEntrance
      type={animationType}
      config={itemConfig}
      style={style}
    >
      {children}
    </AnimatedEntrance>
  );
};

// ================================
// HOOKS DE ANIMACIÓN
// ================================

export const useAnimatedValue = (initialValue: number = 0) => {
  const value = useSharedValue(initialValue);

  const animateTo = (
    toValue: number,
    config?: AnimationConfig,
    onComplete?: () => void
  ) => {
    if (config?.damping || config?.stiffness) {
      const springConfig = {
        damping: config?.damping || ANIMATIONS.spring.gentle.damping,
        stiffness: config?.stiffness || ANIMATIONS.spring.gentle.stiffness,
        mass: config?.mass || ANIMATIONS.spring.gentle.mass,
      };
      value.value = withDelay(
        config?.delay || 0,
        withSpring(toValue, springConfig, onComplete)
      );
    } else {
      const timingConfig = {
        duration: config?.duration || ANIMATIONS.duration.normal,
        easing: Easing.out(Easing.cubic),
      };
      value.value = withDelay(
        config?.delay || 0,
        withTiming(toValue, timingConfig, onComplete)
      );
    }
  };

  const reset = () => {
    value.value = initialValue;
  };

  return { value, animateTo, reset };
};

export const useAnimatedSequence = () => {
  const sequence = useSharedValue(0);

  const runSequence = (
    steps: Array<{
      toValue: number;
      duration?: number;
      delay?: number;
    }>,
    onComplete?: () => void
  ) => {
    let totalDelay = 0;

    steps.forEach((step, index) => {
      const config = {
        duration: step.duration || ANIMATIONS.duration.normal,
        easing: Easing.out(Easing.cubic),
      };

      const delay = totalDelay + (step.delay || 0);
      totalDelay += config.duration + (step.delay || 0);

      sequence.value = withDelay(
        delay,
        withTiming(step.toValue, config, (finished) => {
          if (finished && index === steps.length - 1 && onComplete) {
            onComplete();
          }
        })
      );
    });
  };

  return { sequence, runSequence };
};

// ================================
// COMPONENTE DE PULSO ANIMADO
// ================================

interface AnimatedPulseProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scale?: number;
  duration?: number;
  enabled?: boolean;
}

export const AnimatedPulse: React.FC<AnimatedPulseProps> = ({
  children,
  style,
  scale = 1.05,
  duration = 1000,
  enabled = true,
}) => {
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    if (enabled) {
      const startPulse = () => {
        pulseValue.value = withTiming(scale, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
        }, (finished) => {
          if (finished) {
            pulseValue.value = withTiming(1, {
              duration: duration / 2,
              easing: Easing.inOut(Easing.ease),
            }, (finished) => {
              if (finished && enabled) {
                // Restart pulse
                setTimeout(startPulse, 100);
              }
            });
          }
        });
      };

      startPulse();
    }
  }, [enabled, scale, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseValue.value }],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export default {
  AnimatedEntrance,
  CustomAnimated,
  AnimatedListItem,
  AnimatedPulse,
  useAnimatedValue,
  useAnimatedSequence,
};
