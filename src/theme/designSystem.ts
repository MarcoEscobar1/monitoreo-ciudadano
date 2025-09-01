/**
 * Sistema de Diseño Completo para Monitoreo Ciudadano
 * FASE 7: UI/UX y Animaciones
 */

import { Dimensions, PixelRatio } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ================================
// PALETA DE COLORES - Nueva paleta inspirada en tonos naturales
// ================================

export const COLORS = {
  // Colores primarios - Azul de la mañana
  primary: {
    50: '#F0F2F2',   // Muy claro
    100: '#D4DADA',  // Claro  
    200: '#B8C2C1',  // Suave
    300: '#9CAAA9',  // Medium claro
    400: '#95A3A2',  // Medium
    500: '#8E9C9B',  // Principal - Azul de la mañana
    600: '#7A8A89',  // Medium oscuro
    700: '#677776',  // Oscuro
    800: '#546564',  // Muy oscuro
    900: '#415251',  // Extra oscuro
  },

  // Colores secundarios - Plata filipina
  secondary: {
    50: '#F6F7F8',   // Muy claro
    100: '#E3E7E8',  // Claro
    200: '#D0D7D9',  // Suave
    300: '#BDC7CA',  // Medium claro
    400: '#B5BFBC',  // Medium
    500: '#AEB7B9',  // Principal - Plata filipina
    600: '#9BA5A7',  // Medium oscuro
    700: '#889294',  // Oscuro
    800: '#758082',  // Muy oscuro
    900: '#626D6F',  // Extra oscuro
  },

  // Colores de estado - Semánticos y accesibles
  success: {
    50: '#F0F7F0',
    500: '#4CAF50',  // Verde éxito
    700: '#388E3C',
  },

  warning: {
    50: '#FFF8E1',
    500: '#BEA892',  // Toscana - Color cálido para advertencias
    700: '#A1926F',
  },

  error: {
    50: '#FFEBEE',
    500: '#F44336',  // Rojo error
    700: '#D32F2F',
  },

  info: {
    50: '#F3F7F7',
    100: '#E1EAEA',  // Azul muy claro
    500: '#BFC8C8',  // Jet Stream
    700: '#A8B3B3',
  },

  // Grises neutrales - Usando Jet Stream y variaciones
  neutral: {
    0: '#FFFFFF',    // Blanco puro
    50: '#F3F2F0',   // Blanco Anti-Flash
    100: '#EAEAEA',  // Gris muy claro
    200: '#DCDCDC',  // Gris claro
    300: '#CECDBC',  // Gris pastel
    400: '#BFC8C8',  // Jet Stream
    500: '#AEB7B9',  // Plata filipina
    600: '#9CAAA9',  // Gris medio oscuro
    700: '#8E9C9B',  // Azul de la mañana
    800: '#7A8A89',  // Gris muy oscuro
    900: '#546564',  // Casi negro
    1000: '#000000', // Negro puro
  },

  // Colores de superficie - Para fondos y contenedores
  surface: {
    background: '#F3F2F0',      // Blanco Anti-Flash
    card: '#FFFFFF',            // Tarjetas
    elevated: '#FFFFFF',        // Elementos elevados
    overlay: 'rgba(0,0,0,0.5)', // Overlays y modales
    disabled: '#EAEAEA',        // Elementos deshabilitados
  },

  // Colores de texto - Jerarquía clara
  text: {
    primary: '#546564',         // Texto principal
    secondary: '#7A8A89',       // Texto secundario
    disabled: '#AEB7B9',        // Texto deshabilitado
    inverse: '#FFFFFF',         // Texto sobre fondos oscuros
    link: '#8E9C9B',           // Enlaces
    placeholder: '#BFC8C8',     // Placeholders
  },

  // Colores específicos de la app
  categories: {
    infrastructure: '#BEA892',  // Toscana
    environment: '#8E9C9B',     // Azul de la mañana
    security: '#7A8A89',        // Variación oscura
    transport: '#AEB7B9',       // Plata filipina
    health: '#CECDBC',          // Gris pastel
    education: '#BFC8C8',       // Jet Stream
    social: '#95A3A2',          // Variación media
    other: '#9CAAA9',           // Variación neutra
  },

  // Estados de reporte con colores específicos
  reportStatus: {
    nuevo: '#BEA892',           // Toscana - Nuevo
    en_revision: '#8E9C9B',     // Azul de la mañana - En revisión
    en_progreso: '#AEB7B9',     // Plata filipina - En progreso
    resuelto: '#4CAF50',        // Verde - Resuelto
    cerrado: '#BFC8C8',         // Jet Stream - Cerrado
    rechazado: '#F44336',       // Rojo - Rechazado
  },

} as const;

// ================================
// TIPOGRAFÍA - Jerarquía clara
// ================================

export const TYPOGRAPHY = {
  // Tamaños de fuente responsivos
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },

  // Alturas de línea
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Pesos de fuente
  fontWeights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Familias de fuente
  fontFamilies: {
    system: 'System',
    heading: 'System',
    body: 'System',
    mono: 'Courier New',
  },

  // Estilos predefinidos
  styles: {
    h1: {
      fontSize: 30,
      fontWeight: '700' as const,
      lineHeight: 36,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 30,
      letterSpacing: -0.25,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 26,
      letterSpacing: 0,
    },
    h4: {
      fontSize: 18,
      fontWeight: '500' as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    h5: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 22,
      letterSpacing: 0,
    },
    h6: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
      letterSpacing: 0,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
      letterSpacing: 0.25,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
      letterSpacing: 0.4,
    },
    overline: {
      fontSize: 10,
      fontWeight: '500' as const,
      lineHeight: 16,
      letterSpacing: 1.5,
      textTransform: 'uppercase' as const,
    },
    button: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
      letterSpacing: 1.25,
      textTransform: 'uppercase' as const,
    },
  },
} as const;

// ================================
// ESPACIADO - Sistema de 8px
// ================================

export const SPACING = {
  xs: 4,    // 0.25rem
  sm: 8,    // 0.5rem
  base: 16, // 1rem
  lg: 24,   // 1.5rem
  xl: 32,   // 2rem
  '2xl': 48, // 3rem
  '3xl': 64, // 4rem
  '4xl': 80, // 5rem
  '5xl': 96, // 6rem
} as const;

// ================================
// BORDES Y RADIOS
// ================================

export const BORDERS = {
  radius: {
    none: 0,
    xs: 2,
    sm: 4,
    base: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },

  width: {
    none: 0,
    thin: 1,
    base: 2,
    thick: 4,
  },
} as const;

// ================================
// SOMBRAS Y ELEVACIONES
// ================================

export const SHADOWS = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
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
  xl: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  '2xl': {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.51,
    shadowRadius: 13.16,
    elevation: 20,
  },
} as const;

// ================================
// RESPONSIVE DESIGN
// ================================

export const SCREEN_SIZES = {
  xs: 0,     // Teléfonos pequeños
  sm: 576,   // Teléfonos grandes
  md: 768,   // Tablets
  lg: 992,   // Tablets grandes
  xl: 1200,  // Escritorio
  '2xl': 1400, // Escritorio grande
} as const;

export const RESPONSIVE = {
  // Dimensiones actuales
  screen: {
    width: screenWidth,
    height: screenHeight,
    isSmall: screenWidth < SCREEN_SIZES.sm,
    isMedium: screenWidth >= SCREEN_SIZES.sm && screenWidth < SCREEN_SIZES.lg,
    isLarge: screenWidth >= SCREEN_SIZES.lg,
    isTablet: screenWidth >= SCREEN_SIZES.md,
    pixelRatio: PixelRatio.get(),
  },

  // Funciones de utilidad
  moderateScale: (size: number, factor: number = 0.5) => {
    return size + (screenWidth / 350 - 1) * factor;
  },

  verticalScale: (size: number) => {
    return (screenHeight / 680) * size;
  },

  horizontalScale: (size: number) => {
    return (screenWidth / 360) * size;
  },

  // Breakpoints para componentes
  getResponsiveSize: (sizes: { xs?: number; sm?: number; md?: number; lg?: number }) => {
    if (screenWidth >= SCREEN_SIZES.lg && sizes.lg) return sizes.lg;
    if (screenWidth >= SCREEN_SIZES.md && sizes.md) return sizes.md;
    if (screenWidth >= SCREEN_SIZES.sm && sizes.sm) return sizes.sm;
    return sizes.xs || sizes.sm || sizes.md || sizes.lg || 16;
  },
} as const;

// ================================
// ANIMACIONES Y TIMING
// ================================

export const ANIMATIONS = {
  // Duraciones estándar
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 800,
  },

  // Curvas de easing
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'spring',
  },

  // Configuraciones de resorte
  spring: {
    gentle: {
      damping: 500,
      stiffness: 300,
      mass: 1,
    },
    wobbly: {
      damping: 300,
      stiffness: 400,
      mass: 1,
    },
    bouncy: {
      damping: 200,
      stiffness: 600,
      mass: 1,
    },
  },
} as const;

// ================================
// CONFIGURACIÓN DE MATERIAL DESIGN 3
// ================================

export const MATERIAL_THEME = {
  colors: {
    primary: COLORS.primary[500],           // Azul de la mañana
    primaryContainer: COLORS.primary[100],
    secondary: COLORS.secondary[500],       // Plata filipina
    secondaryContainer: COLORS.secondary[100],
    tertiary: COLORS.info[500],            // Jet Stream
    tertiaryContainer: COLORS.info[100],
    surface: COLORS.surface.card,
    surfaceVariant: COLORS.neutral[100],
    background: COLORS.surface.background,  // Blanco Anti-Flash
    error: COLORS.error[500],
    errorContainer: COLORS.error[50],
    onPrimary: COLORS.text.inverse,
    onSecondary: COLORS.text.inverse,
    onTertiary: COLORS.text.primary,
    onSurface: COLORS.text.primary,
    onSurfaceVariant: COLORS.text.secondary,
    onBackground: COLORS.text.primary,
    onError: COLORS.text.inverse,
    onErrorContainer: COLORS.error[700],
    outline: COLORS.neutral[300],
    outlineVariant: COLORS.neutral[200],
    inverseSurface: COLORS.neutral[800],
    inverseOnSurface: COLORS.neutral[50],
    inversePrimary: COLORS.primary[200],
    shadow: COLORS.neutral[1000],
    scrim: COLORS.neutral[1000],
    surfaceDisabled: `rgba(${COLORS.text.primary}, 0.12)`,
    onSurfaceDisabled: `rgba(${COLORS.text.primary}, 0.38)`,
    backdrop: 'rgba(0, 0, 0, 0.4)',
  },
  roundness: BORDERS.radius.base,
} as const;

// ================================
// UTILIDADES DE TEMA
// ================================

export const THEME_UTILS = {
  // Obtener color con opacidad
  getColorWithOpacity: (color: string, opacity: number): string => {
    return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  },

  // Obtener color de contraste
  getContrastColor: (backgroundColor: string): string => {
    // Lógica simplificada - en producción usar una librería como chroma-js
    const lightColors = [
      '#FFF8E1', '#FFECB3', '#FFE082', // primary light colors
      '#E8F5E8', '#C8E6C9', '#A5D6A7', // secondary light colors
      '#FFFFFF', '#FAFAFA', '#F5F5F5', // neutral light colors
    ];
    
    return lightColors.includes(backgroundColor) 
      ? COLORS.text.primary 
      : COLORS.text.inverse;
  },

  // Obtener tamaño responsivo
  getResponsiveFontSize: (baseSize: number): number => {
    return RESPONSIVE.moderateScale(baseSize);
  },

  // Obtener espaciado responsivo
  getResponsiveSpacing: (baseSpacing: number): number => {
    return RESPONSIVE.horizontalScale(baseSpacing);
  },
} as const;

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDERS,
  SHADOWS,
  RESPONSIVE,
  ANIMATIONS,
  MATERIAL_THEME,
  THEME_UTILS,
};
