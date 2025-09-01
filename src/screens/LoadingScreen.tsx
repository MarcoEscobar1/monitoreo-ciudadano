import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import DESIGN_SYSTEM from '../theme/designSystem';

const LoadingScreen: React.FC = () => {
  // Animaciones para el logo
  const logoScale = useSharedValue(0.8);
  const logoRotation = useSharedValue(0);
  const logoOpacity = useSharedValue(0.7);

  // Animaciones para los puntos de carga
  const dot1Scale = useSharedValue(0.5);
  const dot2Scale = useSharedValue(0.5);
  const dot3Scale = useSharedValue(0.5);

  // Animación para la barra de progreso
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Animación del logo
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(0.9, { duration: 1000 })
      ),
      -1,
      true
    );

    logoOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.7, { duration: 1500 })
      ),
      -1,
      true
    );

    // Animación de rotación sutil
    logoRotation.value = withRepeat(
      withTiming(360, { duration: 8000 }),
      -1
    );

    // Animación de los puntos de carga
    const animateDots = () => {
      dot1Scale.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.5, { duration: 300 })
      );
      
      setTimeout(() => {
        dot2Scale.value = withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.5, { duration: 300 })
        );
      }, 200);
      
      setTimeout(() => {
        dot3Scale.value = withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.5, { duration: 300 })
        );
      }, 400);
    };

    // Repetir animación de puntos
    const dotsInterval = setInterval(animateDots, 1200);

    // Animación de progreso
    progressWidth.value = withTiming(100, { duration: 3000 });

    return () => {
      clearInterval(dotsInterval);
    };
  }, []);

  // Estilos animados
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` }
    ],
    opacity: logoOpacity.value,
  }));

  const dot1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dot1Scale.value }],
  }));

  const dot2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dot2Scale.value }],
  }));

  const dot3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dot3Scale.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      {/* Logo animado */}
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <View style={styles.logo}>
          <Text style={styles.logoIcon}>🏛️</Text>
        </View>
        <View style={styles.logoRing} />
        <View style={styles.logoRingOuter} />
      </Animated.View>

      {/* Título */}
      <Text style={styles.title}>Monitoreo Ciudadano</Text>
      <Text style={styles.subtitle}>Construyendo una ciudad mejor</Text>

      {/* Puntos de carga animados */}
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, dot1AnimatedStyle]} />
        <Animated.View style={[styles.dot, dot2AnimatedStyle]} />
        <Animated.View style={[styles.dot, dot3AnimatedStyle]} />
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, progressAnimatedStyle]} />
      </View>

      {/* Texto de carga */}
      <Text style={styles.loadingText}>Inicializando aplicación...</Text>

      {/* Elementos decorativos */}
      <View style={styles.decorativeElements}>
        <View style={[styles.floatingElement, styles.element1]} />
        <View style={[styles.floatingElement, styles.element2]} />
        <View style={[styles.floatingElement, styles.element3]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DESIGN_SYSTEM.COLORS.primary[500],
    position: 'relative',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DESIGN_SYSTEM.SPACING['2xl'],
    position: 'relative',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[0],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: DESIGN_SYSTEM.COLORS.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 3,
  },
  logoIcon: {
    fontSize: 48,
  },
  logoRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: DESIGN_SYSTEM.COLORS.neutral[0],
    opacity: 0.3,
    zIndex: 2,
  },
  logoRingOuter: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: DESIGN_SYSTEM.COLORS.neutral[0],
    opacity: 0.2,
    zIndex: 1,
  },
  title: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes['4xl'],
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.bold,
    color: DESIGN_SYSTEM.COLORS.neutral[0],
    textAlign: 'center',
    marginBottom: DESIGN_SYSTEM.SPACING.sm,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.lg,
    color: DESIGN_SYSTEM.COLORS.primary[100],
    textAlign: 'center',
    marginBottom: DESIGN_SYSTEM.SPACING['2xl'],
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DESIGN_SYSTEM.SPACING['2xl'],
    gap: DESIGN_SYSTEM.SPACING.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[0],
    shadowColor: DESIGN_SYSTEM.COLORS.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  progressContainer: {
    width: '60%',
    height: 4,
    backgroundColor: DESIGN_SYSTEM.COLORS.primary[300],
    borderRadius: 2,
    marginBottom: DESIGN_SYSTEM.SPACING.lg,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[0],
    borderRadius: 2,
    shadowColor: DESIGN_SYSTEM.COLORS.neutral[0],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingText: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    color: DESIGN_SYSTEM.COLORS.primary[100],
    textAlign: 'center',
    marginTop: DESIGN_SYSTEM.SPACING.base,
  },
  decorativeElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingElement: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[0],
    opacity: 0.1,
  },
  element1: {
    width: 60,
    height: 60,
    top: '15%',
    left: '10%',
  },
  element2: {
    width: 40,
    height: 40,
    top: '25%',
    right: '15%',
  },
  element3: {
    width: 80,
    height: 80,
    bottom: '20%',
    left: '20%',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: DESIGN_SYSTEM.COLORS.neutral[0],
  },
});

export default LoadingScreen;
