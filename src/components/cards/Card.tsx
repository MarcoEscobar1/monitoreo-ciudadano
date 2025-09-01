/**
 * Componentes de Tarjetas Reutilizables - FASE 7
 * Tarjetas responsivas con animaciones suaves
 */

import React from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Image,
  ImageStyle,
} from 'react-native';
import { Text, Surface, Divider } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { AnimatedEntrance } from '../animated/AnimatedEntrance';

// Importar sistema de diseño
const COLORS = {
  primary: {
    500: '#FFC107',
  },
  secondary: {
    500: '#4CAF50',
  },
  neutral: {
    0: '#FFFFFF',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    500: '#9E9E9E',
    600: '#757575',
    800: '#424242',
  },
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
  },
  surface: {
    card: '#FFFFFF',
    elevated: '#FFFFFF',
  },
};

const SPACING = {
  xs: 4,
  sm: 8,
  base: 16,
  lg: 24,
  xl: 32,
};

const BORDERS = {
  radius: {
    base: 8,
    lg: 12,
  },
};

const SHADOWS = {
  base: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// ================================
// TIPOS Y INTERFACES
// ================================

export type CardVariant = 'elevated' | 'outlined' | 'filled';
export type CardSize = 'small' | 'medium' | 'large';

interface BaseCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  animated?: boolean;
  elevation?: number;
  testID?: string;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  avatar?: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardActionsProps {
  children: React.ReactNode;
  style?: ViewStyle;
  alignment?: 'left' | 'center' | 'right' | 'space-between';
}

interface CardMediaProps {
  source: { uri: string } | number;
  height?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  style?: ImageStyle;
}

// ================================
// CONFIGURACIONES
// ================================

const getCardStyles = (variant: CardVariant, size: CardSize, elevation?: number) => {
  const sizeConfig = {
    small: {
      padding: SPACING.sm,
      borderRadius: BORDERS.radius.base,
    },
    medium: {
      padding: SPACING.base,
      borderRadius: BORDERS.radius.base,
    },
    large: {
      padding: SPACING.lg,
      borderRadius: BORDERS.radius.lg,
    },
  };

  const variantConfig = {
    elevated: {
      backgroundColor: COLORS.surface.elevated,
      borderWidth: 0,
      ...(elevation ? { elevation } : SHADOWS.base),
    },
    outlined: {
      backgroundColor: COLORS.surface.card,
      borderWidth: 1,
      borderColor: COLORS.neutral[300],
    },
    filled: {
      backgroundColor: COLORS.neutral[100],
      borderWidth: 0,
    },
  };

  return {
    ...sizeConfig[size],
    ...variantConfig[variant],
  };
};

// ================================
// COMPONENTE ANIMADO
// ================================

const AnimatedSurface = Animated.createAnimatedComponent(Surface);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// ================================
// COMPONENTE PRINCIPAL
// ================================

export const Card: React.FC<BaseCardProps> = ({
  children,
  variant = 'elevated',
  size = 'medium',
  onPress,
  style,
  contentStyle,
  animated = true,
  elevation,
  testID,
}) => {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(variant === 'elevated' ? 0.25 : 0);

  const cardStyles = getCardStyles(variant, size, elevation);

  const handlePressIn = () => {
    if (!onPress) return;
    
    scale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 150,
    });
    
    if (variant === 'elevated') {
      shadowOpacity.value = withTiming(0.35, { duration: 150 });
    }
  };

  const handlePressOut = () => {
    if (!onPress) return;
    
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
    
    if (variant === 'elevated') {
      shadowOpacity.value = withTiming(0.25, { duration: 150 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      shadowOpacity: shadowOpacity.value,
    };
  });

  const cardStyle: ViewStyle = {
    ...cardStyles,
    ...style,
  };

  const content = (
    <View style={[styles.content, contentStyle]}>
      {children}
    </View>
  );

  const cardComponent = onPress ? (
    <AnimatedTouchableOpacity
      style={[cardStyle, animated && animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      testID={testID}
    >
      {content}
    </AnimatedTouchableOpacity>
  ) : (
    <AnimatedSurface
      style={[cardStyle, animated && animatedStyle]}
      testID={testID}
    >
      {content}
    </AnimatedSurface>
  );

  return animated ? (
    <AnimatedEntrance type="fadeIn" config={{ duration: 300 }}>
      {cardComponent}
    </AnimatedEntrance>
  ) : (
    cardComponent
  );
};

// ================================
// COMPONENTE DE HEADER
// ================================

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  avatar,
  style,
  titleStyle,
  subtitleStyle,
}) => {
  return (
    <View style={[styles.header, style]}>
      {avatar && <View style={styles.avatar}>{avatar}</View>}
      
      <View style={styles.headerContent}>
        <Text 
          variant="titleMedium" 
          style={[styles.title, titleStyle]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text 
            variant="bodyMedium" 
            style={[styles.subtitle, subtitleStyle]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>
      
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
};

// ================================
// COMPONENTE DE CONTENIDO
// ================================

export const CardContent: React.FC<CardContentProps> = ({
  children,
  style,
}) => {
  return (
    <View style={[styles.cardContent, style]}>
      {children}
    </View>
  );
};

// ================================
// COMPONENTE DE ACCIONES
// ================================

export const CardActions: React.FC<CardActionsProps> = ({
  children,
  style,
  alignment = 'right',
}) => {
  const alignmentStyles = {
    left: { justifyContent: 'flex-start' as const },
    center: { justifyContent: 'center' as const },
    right: { justifyContent: 'flex-end' as const },
    'space-between': { justifyContent: 'space-between' as const },
  };

  return (
    <View style={[styles.actions, alignmentStyles[alignment], style]}>
      {children}
    </View>
  );
};

// ================================
// COMPONENTE DE IMAGEN
// ================================

export const CardMedia: React.FC<CardMediaProps> = ({
  source,
  height = 200,
  resizeMode = 'cover',
  style,
}) => {
  return (
    <Image
      source={source}
      style={[
        styles.media,
        {
          height,
        },
        style,
      ]}
      resizeMode={resizeMode}
    />
  );
};

// ================================
// COMPONENTE DE TARJETA DE ESTADÍSTICA
// ================================

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'neutral';
  onPress?: () => void;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  color = 'primary',
  onPress,
  style,
}) => {
  const colorMap = {
    primary: COLORS.primary[500],
    secondary: COLORS.secondary[500],
    neutral: COLORS.neutral[500],
  };

  const selectedColor = colorMap[color];

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return COLORS.secondary[500]; // Verde para positivo
      case 'down':
        return '#F44336'; // Rojo para negativo
      case 'neutral':
        return COLORS.neutral[500]; // Gris para neutral
    }
  };

  const statCardStyle: ViewStyle = {
    ...styles.statCard,
    ...style,
  };

  return (
    <Card 
      variant="elevated" 
      size="medium" 
      onPress={onPress}
      style={statCardStyle}
    >
      <View style={styles.statHeader}>
        <View style={styles.statInfo}>
          <Text variant="bodySmall" style={styles.statTitle}>
            {title}
          </Text>
          <Text variant="headlineMedium" style={[styles.statValue, { color: selectedColor }]}>
            {value}
          </Text>
        </View>
        {icon && (
          <View style={[styles.statIcon, { backgroundColor: `${selectedColor}20` }]}>
            {icon}
          </View>
        )}
      </View>
      
      {change && (
        <>
          <Divider style={styles.statDivider} />
          <View style={styles.statChange}>
            <Text 
              variant="bodySmall" 
              style={[styles.changeText, { color: getTrendColor(change.trend) }]}
            >
              {change.trend === 'up' ? '↑' : change.trend === 'down' ? '↓' : '→'} 
              {Math.abs(change.value)}%
            </Text>
            <Text variant="bodySmall" style={styles.changeLabel}>
              vs período anterior
            </Text>
          </View>
        </>
      )}
    </Card>
  );
};

// ================================
// COMPONENTE DE TARJETA DE LISTA
// ================================

interface ListCardProps {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    trailing?: React.ReactNode;
    onPress?: () => void;
  }>;
  title?: string;
  style?: ViewStyle;
  maxItems?: number;
  showSeeAll?: boolean;
  onSeeAllPress?: () => void;
}

export const ListCard: React.FC<ListCardProps> = ({
  items,
  title,
  style,
  maxItems = 5,
  showSeeAll = false,
  onSeeAllPress,
}) => {
  const displayItems = items.slice(0, maxItems);
  const hasMoreItems = items.length > maxItems;

  return (
    <Card variant="elevated" size="medium" style={style}>
      {title && (
        <>
          <CardHeader title={title} />
          <Divider />
        </>
      )}
      
      <CardContent>
        {displayItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.listItem,
              index === displayItems.length - 1 && styles.listItemLast,
            ]}
            onPress={item.onPress}
          >
            <View style={styles.listItemContent}>
              <Text variant="bodyLarge" style={styles.listItemTitle}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text variant="bodyMedium" style={styles.listItemSubtitle}>
                  {item.subtitle}
                </Text>
              )}
            </View>
            {item.trailing && (
              <View style={styles.listItemTrailing}>
                {item.trailing}
              </View>
            )}
          </TouchableOpacity>
        ))}
        
        {(hasMoreItems || showSeeAll) && onSeeAllPress && (
          <>
            <Divider style={styles.seeAllDivider} />
            <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAllPress}>
              <Text variant="bodyMedium" style={styles.seeAllText}>
                Ver todos ({items.length})
              </Text>
            </TouchableOpacity>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ================================
// ESTILOS
// ================================

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  avatar: {
    marginRight: SPACING.sm,
  },
  
  headerContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  
  title: {
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  
  subtitle: {
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  
  action: {
    alignSelf: 'flex-start',
  },
  
  cardContent: {
    marginVertical: SPACING.sm,
  },
  
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  
  media: {
    width: '100%',
    borderTopLeftRadius: BORDERS.radius.base,
    borderTopRightRadius: BORDERS.radius.base,
    marginBottom: SPACING.sm,
  },
  
  // Tarjeta de estadística
  statCard: {
    flex: 0, // No crecer ni encogerse
    justifyContent: 'space-between', // Distribuir contenido uniformemente
    padding: SPACING.sm, // Padding interno fijo
  },
  
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1, // Tomar todo el espacio disponible
  },
  
  statInfo: {
    flex: 1,
    justifyContent: 'center', // Centrar contenido verticalmente
  },
  
  statTitle: {
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10, // Reducir para que quepa mejor
    marginBottom: SPACING.xs,
    lineHeight: 12,
  },

  statValue: {
    fontWeight: '700',
    fontSize: 20, // Reducir para que quepa en tarjetas cuadradas
    lineHeight: 24,
  },  statIcon: {
    width: 32, // Reducir más para tarjetas cuadradas
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs, // Reducir margen
  },
  
  statDivider: {
    marginVertical: SPACING.xs, // Reducir margen para tarjetas compactas
  },
  
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  changeText: {
    fontWeight: '600',
    fontSize: 10, // Reducir tamaño para que quepa
  },
  
  changeLabel: {
    color: COLORS.text.secondary,
    fontSize: 9, // Muy pequeño para tarjetas compactas
  },
  
  // Tarjeta de lista
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  
  listItemLast: {
    borderBottomWidth: 0,
  },
  
  listItemContent: {
    flex: 1,
  },
  
  listItemTitle: {
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  
  listItemSubtitle: {
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  
  listItemTrailing: {
    marginLeft: SPACING.sm,
  },
  
  seeAllDivider: {
    marginTop: SPACING.sm,
  },
  
  seeAllButton: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  
  seeAllText: {
    color: COLORS.primary[500],
    fontWeight: '500',
  },
});

export default {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  CardMedia,
  StatCard,
  ListCard,
};
