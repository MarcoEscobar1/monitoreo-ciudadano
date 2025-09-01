/**
 * Componente de Navegación Animada - FASE 7
 * Navegación fluida con micro-animaciones
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { AnimatedEntrance } from '../animated/AnimatedEntrance';

// Importar sistema de diseño
import DESIGN_SYSTEM from '../../theme/designSystem';

const COLORS = DESIGN_SYSTEM.COLORS;

const SPACING = DESIGN_SYSTEM.SPACING;

const SHADOWS = DESIGN_SYSTEM.SHADOWS;

const { width: screenWidth } = Dimensions.get('window');

// ================================
// TIPOS
// ================================

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: number;
  onPress: () => void;
}

interface AnimatedTabBarProps {
  items: NavigationItem[];
  activeIndex: number;
  style?: ViewStyle;
  tabStyle?: ViewStyle;
  indicatorStyle?: ViewStyle;
  labelStyle?: TextStyle;
  iconSize?: number;
  height?: number;
}

interface FloatingTabBarProps extends AnimatedTabBarProps {
  position?: 'bottom' | 'top';
  margin?: number;
}

interface SegmentedControlProps {
  items: string[];
  selectedIndex: number;
  onSelectionChange: (index: number) => void;
  style?: ViewStyle;
  segmentStyle?: ViewStyle;
  textStyle?: TextStyle;
  animated?: boolean;
}

// ================================
// COMPONENTE DE TAB BAR ANIMADA
// ================================

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
  items,
  activeIndex,
  style,
  tabStyle,
  indicatorStyle,
  labelStyle,
  iconSize = 24,
  height = 60,
}) => {
  const indicatorPosition = useSharedValue(0);
  const tabWidth = screenWidth / items.length;

  React.useEffect(() => {
    indicatorPosition.value = withSpring(activeIndex * tabWidth, {
      damping: 15,
      stiffness: 150,
    });
  }, [activeIndex, tabWidth]);

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value }],
    };
  });

  return (
    <AnimatedEntrance type="slideInUp" config={{ duration: 400 }}>
      <View style={[styles.tabBar, { height }, style]}>
        {/* Indicador animado */}
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabWidth,
            },
            indicatorAnimatedStyle,
            indicatorStyle,
          ]}
        />

        {/* Tabs */}
        {items.map((item, index) => (
          <TabBarItem
            key={item.id}
            item={item}
            index={index}
            isActive={index === activeIndex}
            tabWidth={tabWidth}
            iconSize={iconSize}
            style={tabStyle}
            labelStyle={labelStyle}
          />
        ))}
      </View>
    </AnimatedEntrance>
  );
};

// ================================
// COMPONENTE DE TAB ITEM
// ================================

interface TabBarItemProps {
  item: NavigationItem;
  index: number;
  isActive: boolean;
  tabWidth: number;
  iconSize: number;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

const TabBarItem: React.FC<TabBarItemProps> = ({
  item,
  index,
  isActive,
  tabWidth,
  iconSize,
  style,
  labelStyle,
}) => {
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const labelOpacity = useSharedValue(isActive ? 1 : 0.6);
  const badgeScale = useSharedValue(1);

  React.useEffect(() => {
    iconScale.value = withSpring(isActive ? 1.1 : 1, {
      damping: 15,
      stiffness: 200,
    });
    labelOpacity.value = withTiming(isActive ? 1 : 0.6, {
      duration: 200,
    });
  }, [isActive]);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 300,
    });
    
    if (item.badge && item.badge > 0) {
      badgeScale.value = withSpring(1.2, {
        damping: 10,
        stiffness: 150,
      });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
    
    if (item.badge && item.badge > 0) {
      badgeScale.value = withSpring(1, {
        damping: 10,
        stiffness: 150,
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: iconScale.value }],
    };
  });

  const labelAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: labelOpacity.value,
    };
  });

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: badgeScale.value }],
    };
  });

  const iconColorStyle = useAnimatedStyle(() => {
    return {
      opacity: isActive ? 1 : 0.6,
    };
  });

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.tab,
        { width: tabWidth },
        animatedStyle,
        style,
      ]}
      onPress={item.onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <View style={styles.tabContent}>
        {/* Icono */}
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          <View style={[styles.icon, iconColorStyle]}>
            {isActive && item.activeIcon ? item.activeIcon : item.icon}
          </View>
          
          {/* Badge */}
          {item.badge && item.badge > 0 && (
            <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
              <Text style={styles.badgeText}>
                {item.badge > 99 ? '99+' : item.badge.toString()}
              </Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Label */}
        <Animated.Text
          style={[
            styles.tabLabel,
            {
              color: isActive ? COLORS.primary[500] : COLORS.text.secondary,
            },
            labelAnimatedStyle,
            labelStyle,
          ]}
        >
          {item.label}
        </Animated.Text>
      </View>
    </AnimatedTouchableOpacity>
  );
};

// ================================
// COMPONENTE DE TAB BAR FLOTANTE
// ================================

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  items,
  activeIndex,
  position = 'bottom',
  margin = 16,
  style,
  ...props
}) => {
  const positionStyle: ViewStyle = {
    position: 'absolute',
    [position]: margin,
    left: margin,
    right: margin,
    borderRadius: 24,
    backgroundColor: COLORS.surface.elevated,
    ...SHADOWS.base,
  };

  const combinedStyle: ViewStyle = {
    ...positionStyle,
    ...style,
  };

  return (
    <AnimatedTabBar
      items={items}
      activeIndex={activeIndex}
      style={combinedStyle}
      {...props}
    />
  );
};

// ================================
// COMPONENTE DE CONTROL SEGMENTADO
// ================================

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  items,
  selectedIndex,
  onSelectionChange,
  style,
  segmentStyle,
  textStyle,
  animated = true,
}) => {
  const selectorPosition = useSharedValue(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const segmentWidth = containerWidth / items.length;

  React.useEffect(() => {
    if (animated && containerWidth > 0) {
      selectorPosition.value = withSpring(selectedIndex * segmentWidth, {
        damping: 15,
        stiffness: 150,
      });
    } else if (containerWidth > 0) {
      selectorPosition.value = selectedIndex * segmentWidth;
    }
  }, [selectedIndex, segmentWidth, animated, containerWidth]);

  const selectorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: selectorPosition.value,
        },
      ],
    };
  });

  return (
    <AnimatedEntrance type="fadeIn" config={{ duration: 300 }}>
      <View 
        style={[styles.segmentedControl, style]}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setContainerWidth(width);
        }}
      >
        {/* Selector animado */}
        <Animated.View
          style={[
            styles.selector,
            {
              width: segmentWidth,
            },
            selectorAnimatedStyle,
          ]}
        />

        {/* Segmentos */}
        {items.map((item, index) => (
          <SegmentItem
            key={index}
            label={item}
            index={index}
            isSelected={index === selectedIndex}
            onPress={() => onSelectionChange(index)}
            style={segmentStyle}
            textStyle={textStyle}
            animated={animated}
          />
        ))}
      </View>
    </AnimatedEntrance>
  );
};

// ================================
// COMPONENTE DE SEGMENTO
// ================================

interface SegmentItemProps {
  label: string;
  index: number;
  isSelected: boolean;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  animated?: boolean;
}

const SegmentItem: React.FC<SegmentItemProps> = ({
  label,
  index,
  isSelected,
  onPress,
  style,
  textStyle,
  animated = true,
}) => {
  const scale = useSharedValue(1);
  const textOpacity = useSharedValue(isSelected ? 1 : 0.7);

  React.useEffect(() => {
    if (animated) {
      textOpacity.value = withTiming(isSelected ? 1 : 0.7, {
        duration: 200,
      });
    }
  }, [isSelected, animated]);

  const handlePressIn = () => {
    if (animated) {
      scale.value = withSpring(0.98, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const handlePressOut = () => {
    if (animated) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      color: interpolateColor(
        textOpacity.value,
        [0.7, 1],
        [COLORS.text.secondary, COLORS.text.primary]
      ),
    };
  });

  return (
    <AnimatedTouchableOpacity
      style={[styles.segment, animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.Text
        style={[
          styles.segmentText,
          textAnimatedStyle,
          textStyle,
        ]}
      >
        {label}
      </Animated.Text>
    </AnimatedTouchableOpacity>
  );
};

// ================================
// ESTILOS
// ================================

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface.elevated,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
    position: 'relative',
  },

  indicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    backgroundColor: COLORS.primary[500],
    borderRadius: 2,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
  },

  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconContainer: {
    position: 'relative',
    marginBottom: SPACING.xs,
  },

  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  badgeText: {
    color: COLORS.text.inverse,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
  },

  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.neutral[200],
    borderRadius: 8,
    padding: 2,
    position: 'relative',
  },

  selector: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    backgroundColor: COLORS.surface.elevated,
    borderRadius: 6,
    ...SHADOWS.base,
  },

  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: 6,
  },

  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default {
  AnimatedTabBar,
  FloatingTabBar,
  SegmentedControl,
};
