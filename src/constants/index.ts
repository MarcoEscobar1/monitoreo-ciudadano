import { EstadoReporte, PrioridadReporte, TipoNotificacion } from '../types';

// Configuración de la aplicación
export const APP_CONFIG = {
  name: 'Monitoreo Ciudadano',
  version: '1.0.0',
  description: 'Aplicación para reportar problemas urbanos y dar seguimiento a su resolución',
  author: 'Equipo de Desarrollo',
  supportEmail: 'soporte@monitoreociudadano.com',
  privacyUrl: 'https://monitoreociudadano.com/privacy',
  termsUrl: 'https://monitoreociudadano.com/terms',
};

// Configuración de la API
export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Configuración de ubicación
export const LOCATION_CONFIG = {
  accuracy: 6, // High accuracy
  distanceInterval: 10, // metros
  timeInterval: 5000, // milisegundos
  maxAge: 60000, // milisegundos
  timeout: 15000, // milisegundos
  defaultRadius: 2, // km para búsquedas cercanas
  maxRadius: 20, // km máximo de búsqueda
};

// Configuración de mapas
export const MAP_CONFIG = {
  initialRegion: {
    latitude: 4.6097, // Bogotá, Colombia
    longitude: -74.0817,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  clusterRadius: 50,
  clusterMaxZoom: 15,
  animationDuration: 1000,
  markerSize: {
    small: 30,
    medium: 40,
    large: 50,
  },
};

// Estados de reporte
export const ESTADOS_REPORTE: { [key in EstadoReporte]: { label: string; color: string; icon: string } } = {
  nuevo: {
    label: 'Nuevo',
    color: '#2196F3',
    icon: 'fiber-new',
  },
  en_revision: {
    label: 'En Revisión',
    color: '#FF9800',
    icon: 'visibility',
  },
  en_progreso: {
    label: 'En Progreso',
    color: '#3F51B5',
    icon: 'build',
  },
  resuelto: {
    label: 'Resuelto',
    color: '#4CAF50',
    icon: 'check-circle',
  },
  cerrado: {
    label: 'Cerrado',
    color: '#9E9E9E',
    icon: 'cancel',
  },
  rechazado: {
    label: 'Rechazado',
    color: '#F44336',
    icon: 'cancel',
  },
};

// Prioridades de reporte
export const PRIORIDADES_REPORTE: { [key in PrioridadReporte]: { label: string; color: string; icon: string } } = {
  baja: {
    label: 'Baja',
    color: '#4CAF50',
    icon: 'keyboard-arrow-down',
  },
  media: {
    label: 'Media',
    color: '#FF9800',
    icon: 'remove',
  },
  alta: {
    label: 'Alta',
    color: '#FF5722',
    icon: 'keyboard-arrow-up',
  },
  critica: {
    label: 'Crítica',
    color: '#F44336',
    icon: 'warning',
  },
};

// Tipos de notificación
export const TIPOS_NOTIFICACION: { [key in TipoNotificacion]: { label: string; color: string; icon: string } } = {
  nuevo_reporte_cerca: {
    label: 'Reporte Cercano',
    color: '#2196F3',
    icon: 'location-on',
  },
  actualizacion_reporte: {
    label: 'Actualización',
    color: '#3F51B5',
    icon: 'update',
  },
  comentario_reporte: {
    label: 'Comentario',
    color: '#009688',
    icon: 'comment',
  },
  like_reporte: {
    label: 'Me Gusta',
    color: '#E91E63',
    icon: 'favorite',
  },
  validacion_reporte: {
    label: 'Validación',
    color: '#4CAF50',
    icon: 'verified',
  },
  emergencia: {
    label: 'Emergencia',
    color: '#F44336',
    icon: 'emergency',
  },
  sistema: {
    label: 'Sistema',
    color: '#9E9E9E',
    icon: 'info',
  },
};

// Configuración de archivos
export const FILE_CONFIG = {
  maxImageSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxImagesPerReport: 5,
  imageQuality: 0.8,
  thumbnailSize: 200,
};

// Configuración de validación
export const VALIDATION_CONFIG = {
  minTituloLength: 10,
  maxTituloLength: 100,
  minDescripcionLength: 20,
  maxDescripcionLength: 500,
  minNombreLength: 2,
  maxNombreLength: 50,
  minComentarioLength: 5,
  maxComentarioLength: 200,
  phoneRegex: /^(\+\d{1,3}[- ]?)?\d{10}$/,
  emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

// Configuración de paginación
export const PAGINATION_CONFIG = {
  defaultLimit: 20,
  maxLimit: 100,
  reportes: 10,
  comentarios: 15,
  notificaciones: 25,
};

// Configuración de cache
export const CACHE_CONFIG = {
  reportes: 5 * 60 * 1000, // 5 minutos
  categorias: 60 * 60 * 1000, // 1 hora
  zonas: 60 * 60 * 1000, // 1 hora
  perfil: 10 * 60 * 1000, // 10 minutos
  notificaciones: 2 * 60 * 1000, // 2 minutos
};

// Configuración de colores de la aplicación
export const COLORS = {
  primary: '#1976D2',
  primaryDark: '#1565C0',
  secondary: '#03DAC6',
  secondaryDark: '#018786',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  error: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
  info: '#2196F3',
  text: '#212121',
  textSecondary: '#757575',
  disabled: '#BDBDBD',
  divider: '#E0E0E0',
  transparent: 'transparent',
  
  // Gradientes
  gradientPrimary: ['#1976D2', '#42A5F5'],
  gradientSecondary: ['#03DAC6', '#4DB6AC'],
  gradientSuccess: ['#4CAF50', '#81C784'],
  gradientWarning: ['#FF9800', '#FFB74D'],
  gradientError: ['#F44336', '#E57373'],
};

// Configuración de animaciones
export const ANIMATION_CONFIG = {
  fast: 200,
  normal: 300,
  slow: 500,
  
  // Transiciones de navegación
  screenTransition: 250,
  modalTransition: 200,
  
  // Animaciones de elementos
  buttonPress: 100,
  cardLoad: 300,
  listItem: 150,
};

// Configuración de sonidos y hápticos
export const FEEDBACK_CONFIG = {
  enableHaptics: true,
  enableSounds: false,
  hapticIntensity: 'medium' as const,
};

// URLs de términos y condiciones
export const LEGAL_URLS = {
  privacy: 'https://monitoreociudadano.com/privacy',
  terms: 'https://monitoreociudadano.com/terms',
  support: 'https://monitoreociudadano.com/support',
  github: 'https://github.com/tu-repo/monitoreo-ciudadano',
};

// Configuración de notificaciones push
export const PUSH_NOTIFICATION_CONFIG = {
  channelId: 'monitoreo-ciudadano',
  channelName: 'Monitoreo Ciudadano',
  channelDescription: 'Notificaciones de la aplicación Monitoreo Ciudadano',
  defaultPriority: 'high' as const,
  defaultVisibility: 'public' as const,
};

// Configuración de debug
export const DEBUG_CONFIG = {
  enableLogs: __DEV__,
  enableNetworkLogs: __DEV__,
  enablePerformanceLogs: __DEV__,
  enableCrashlytics: !__DEV__,
};
