// Tipos de Usuario
export interface Usuario {
  id: number;
  nombre: string;
  apellidos?: string;
  email: string;
  telefono?: string;
  direccion?: string;
  fecha_registro: Date;
  activo: boolean;
  avatar_url?: string;
  role: 'admin' | 'moderator' | 'user' | 'guest';
  tipo_usuario?: 'ADMINISTRADOR' | 'MODERADOR' | 'CIUDADANO';
  configuracion_notificaciones?: ConfiguracionNotificaciones;
  total_reportes?: number;
  reportes_validados?: number;
}

// Tipo de Usuario para contexto de autenticación
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'moderator' | 'user' | 'guest';
  avatar?: string;
  phone?: string;
  createdAt: Date;
  isActive: boolean;
}

export interface ConfiguracionNotificaciones {
  push_reportes_cercanos: boolean;
  push_actualizaciones: boolean;
  push_emergencias: boolean;
  email_resumen_semanal: boolean;
}

// Tipos de Reporte
export interface Reporte {
  id: number;
  usuario_id: number;
  categoria_id: string;
  zona_id: number;
  titulo: string;
  descripcion: string;
  ubicacion: Coordenada;
  direccion: string;
  estado: EstadoReporte;
  prioridad: PrioridadReporte;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  imagenes: string[];
  likes: number;
  dislikes: number;
  validaciones: number;
  comentarios_count: number;
  validado?: boolean; // Campo para control de validación por admin
  usuario: Partial<Usuario>;
  categoria: CategoriaProblema;
  zona: ZonaGeografica;
}

export type EstadoReporte = 'nuevo' | 'en_revision' | 'en_progreso' | 'resuelto' | 'cerrado' | 'rechazado';
export type PrioridadReporte = 'baja' | 'media' | 'alta' | 'critica';

// Tipos de Coordenadas y Ubicación
export interface Coordenada {
  latitude: number;
  longitude: number;
}

export interface UbicacionCompleta extends Coordenada {
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

// Tipos de Categorías
export interface CategoriaProblema {
  id: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
}

// Tipos de Zonas Geográficas
export interface ZonaGeografica {
  id: number;
  nombre: string;
  tipo: TipoZona;
  coordenadas: Coordenada[];
  activa: boolean;
  poblacion?: number;
  area_km2?: number;
}

export type TipoZona = 'barrio' | 'localidad' | 'municipio' | 'departamento' | 'zona_especial';

// Tipos de Comentarios
export interface Comentario {
  id: number;
  reporte_id: number;
  usuario_id: number;
  contenido: string;
  fecha_creacion: Date;
  likes: number;
  dislikes: number;
  usuario: Partial<Usuario>;
}

// Tipos de Notificaciones
export interface Notificacion {
  id: number;
  usuario_id: number;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  leida: boolean;
  fecha_creacion: Date;
  datos_adicionales?: any;
}

export type TipoNotificacion = 
  | 'nuevo_reporte_cerca' 
  | 'actualizacion_reporte' 
  | 'comentario_reporte' 
  | 'like_reporte' 
  | 'validacion_reporte' 
  | 'emergencia' 
  | 'sistema';

// Tipos de API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Tipos de Filtros
export interface FiltrosReporte {
  categoria_id?: string;
  zona_id?: number;
  estado?: EstadoReporte;
  prioridad?: PrioridadReporte;
  fecha_desde?: Date;
  fecha_hasta?: Date;
  radio_km?: number;
  ubicacion?: Coordenada;
  solo_mis_reportes?: boolean;
  ordenar_por?: 'fecha_creacion' | 'fecha_actualizacion' | 'likes' | 'distancia';
  orden?: 'asc' | 'desc';
}

// Tipos de Formularios
export interface CrearReporteForm {
  titulo: string;
  descripcion: string;
  categoria_id: string;
  ubicacion: Coordenada;
  direccion: string;
  imagenes: string[];
  prioridad: PrioridadReporte;
}

export interface ActualizarPerfilForm {
  nombre: string;
  telefono?: string;
  avatar_url?: string;
  configuracion_notificaciones: ConfiguracionNotificaciones;
}

// Tipos de Estadísticas
export interface EstadisticasUsuario {
  total_reportes: number;
  reportes_resueltos: number;
  reportes_en_progreso: number;
  reportes_validados: number;
  likes_recibidos: number;
  comentarios_realizados: number;
  racha_dias: number;
}

export interface EstadisticasZona {
  zona_id: number;
  zona_nombre: string;
  total_reportes: number;
  reportes_por_categoria: { categoria: string; count: number }[];
  reportes_por_estado: { estado: EstadoReporte; count: number }[];
  tiempo_promedio_resolucion: number;
}

// Tipos de Navegación
export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  CreateReport: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  ReportDetail: { reportId: number };
  ReportsByCategory: { categoryId: number };
  Search: { query?: string };
};

export type MapStackParamList = {
  MapScreen: undefined;
  LocationSelection: {
    onLocationSelect?: (location: UbicacionCompleta) => void;
    initialLocation?: Coordenada;
    title?: string;
    subtitle?: string;
  };
  LocationTest: undefined;
  OpenStreetMapTest: undefined;
  SimpleMapTest: undefined;
  OSMMapTest: undefined;
  WebMapTest: undefined;
  ReportDetail: { reportId: number };
  FilterMap: undefined;
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  MyReports: undefined;
  Settings: undefined;
  Statistics: undefined;
  Help: undefined;
  About: undefined;
};
