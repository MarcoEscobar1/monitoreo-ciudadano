// Servicio de API para comunicación con el backend PostgreSQL
// Conecta React Native con el servidor Express/PostgreSQL

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_CONFIG } from '../constants';
import * as Device from 'expo-device';

// Detectar si estamos en emulador Android y ajustar IP
const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://tu-api-produccion.com/api';
  }
  
  const envUrl = process.env.EXPO_PUBLIC_API_URL || API_CONFIG.baseUrl;
  
  // Si es Android y estamos en emulador, usar 10.0.2.2 en lugar de localhost o 192.168.x.x
  if (Platform.OS === 'android' && !Device.isDevice) {
    return envUrl.replace('localhost', '10.0.2.2').replace(/192\.168\.\d+\.\d+/, '10.0.2.2');
  }
  
  return envUrl;
};

// Configuración del API
const API_BASE_URL = getApiBaseUrl();

// Función para obtener token de autenticación
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (error) {
    console.error('Error obteniendo token:', error);
    return null;
  }
};

// Función para hacer peticiones HTTP
const makeRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const token = await getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Agregar token de autenticación si existe
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error en petición API:', error);
    throw error;
  }
};

// Función para simular query de PostgreSQL (para mantener compatibilidad)
export const query = async (text: string, params?: any[]) => {
  // Redirigir a servicios específicos según el tipo de query
  if (text.includes('SELECT * FROM usuarios WHERE email =')) {
    const email = params?.[0];
    if (email) {
      try {
        const user = await userService.findByEmail(email);
        return {
          rows: user ? [user] : [],
          rowCount: user ? 1 : 0
        };
      } catch (error) {
        return { rows: [], rowCount: 0 };
      }
    }
  }
  
  if (text.includes('INSERT INTO usuarios')) {
    return {
      rows: [],
      rowCount: 0
    };
  }
  
  // Respuesta por defecto
  return {
    rows: [],
    rowCount: 0
  };
};

// Servicios específicos para cada entidad
export const authService = {
  // Login
  login: async (email: string, password: string) => {
    try {
      const response = await makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (response.success && response.data.token) {
        // Guardar token para futuras peticiones
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  // Registro
  register: async (userData: {
    nombre: string;
    apellidos?: string;
    email: string;
    password: string;
    telefono?: string;
  }) => {
    try {
      const response = await makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (response.success && response.data.token) {
        // Guardar token para futuras peticiones
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  },

  // Verificar token
  verifyToken: async () => {
    try {
      return await makeRequest('/auth/verify');
    } catch (error) {
      console.error('Error verificando token:', error);
      // Limpiar token inválido
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      throw error;
    }
  },

  // Recuperar contraseña
  forgotPassword: async (email: string) => {
    try {
      return await makeRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      console.error('Error en recuperación de contraseña:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      // 1. Intentar notificar al backend
      try {
        await makeRequest('/auth/logout', {
          method: 'POST'
        });
      } catch (backendError) {
        // No es crítico, continuamos con logout local
      }
      
      // 2. Limpiar datos locales
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      
      return { success: true };
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  }
};

export const userService = {
  // Buscar usuario por email (legacy)
  findByEmail: async (email: string) => {
    try {
      return await makeRequest(`/users/email/${encodeURIComponent(email)}`);
    } catch (error) {
      return null;
    }
  },

  // Crear nuevo usuario (legacy - usar authService.register)
  create: async (userData: {
    nombre: string;
    email: string;
    password_hash: string;
    telefono?: string;
  }) => {
    try {
      return await authService.register({
        nombre: userData.nombre,
        email: userData.email,
        password: userData.password_hash, // Se hasheará en el backend
        telefono: userData.telefono
      });
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw error;
    }
  },

  // Obtener perfil del usuario
  getProfile: async () => {
    try {
      return await makeRequest('/users/profile');
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      throw error;
    }
  },

  // Actualizar perfil
  update: async (userData: { nombre: string; telefono?: string }) => {
    try {
      return await makeRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }
  },

  // Actualizar perfil completo (nuevo)
  updateProfile: async (userData: {
    nombre: string;
    apellidos?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    avatar_url?: string | null;
  }) => {
    try {
      return await makeRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }
  },

  // Obtener reportes del usuario
  getMyReports: async (filters?: any) => {
    try {
      const queryParams = filters ? `?${new URLSearchParams(filters)}` : '';
      const response = await makeRequest(`/users/reports${queryParams}`);
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo mis reportes:', error);
      return [];
    }
  }
};

export const reportService = {
  // Obtener reportes para mapa
  getForMap: async (filters?: any) => {
    try {
      const queryParams = filters ? `?${new URLSearchParams(filters)}` : '';
      const response = await makeRequest(`/reports/mapa${queryParams}`);
      return response;
    } catch (error) {
      console.error('Error obteniendo reportes para mapa:', error);
      return { success: false, data: [] };
    }
  },

  // Obtener reportes
  getAll: async (filters?: any) => {
    try {
      const queryParams = filters ? `?${new URLSearchParams(filters)}` : '';
      const response = await makeRequest(`/reports${queryParams}`);
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo reportes:', error);
      return [];
    }
  },

  // Obtener reporte por ID
  getById: async (id: number) => {
    try {
      const response = await makeRequest(`/reports/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo reporte:', error);
      return null;
    }
  },

  // Crear reporte
  create: async (reportData: any) => {
    try {
      const response = await makeRequest('/reports', {
        method: 'POST',
        body: JSON.stringify(reportData),
      });
      return response;
    } catch (error) {
      console.error('Error creando reporte:', error);
      throw error;
    }
  },

  // Actualizar estado de reporte
  updateStatus: async (id: number, estado: string) => {
    try {
      return await makeRequest(`/reports/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
      });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      throw error;
    }
  },

  // Obtener reportes del usuario autenticado
  getMy: async () => {
    try {
      const response = await makeRequest('/reports/my');
      return response;
    } catch (error) {
      console.error('Error obteniendo mis reportes:', error);
      return { success: false, data: [] };
    }
  },

  // Obtener detalle de un reporte por ID
  getById: async (id: string) => {
    try {
      const response = await makeRequest(`/reports/${id}`);
      return response;
    } catch (error) {
      console.error('Error obteniendo reporte:', error);
      throw error;
    }
  }
};

export const categoryService = {
  // Obtener todas las categorías
  getAll: async () => {
    try {
      const response = await makeRequest('/categories');
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      return [];
    }
  },

  // Obtener categoría por ID
  getById: async (id: string) => {
    try {
      const response = await makeRequest(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo categoría:', error);
      return null;
    }
  }
};

export const notificationService = {
  // Obtener notificaciones
  getAll: async (filters?: any) => {
    try {
      const queryParams = filters ? `?${new URLSearchParams(filters)}` : '';
      const response = await makeRequest(`/notifications${queryParams}`);
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      return [];
    }
  },

  // Marcar como leída
  markAsRead: async (id: number) => {
    try {
      return await makeRequest(`/notifications/${id}/read`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('Error marcando notificación:', error);
      throw error;
    }
  }
};

// Función para testear conexión (compatibilidad)
export const testConnection = async (): Promise<boolean> => {
  try {
    await makeRequest('/health');
    return true;
  } catch (error) {
    return false;
  }
};

// Función para transacciones (compatibilidad)
export const transaction = async (callback: (client: any) => Promise<any>) => {
  // En un entorno real, esto podría manejar transacciones a través de la API
  return await callback(null);
};

// Métodos HTTP genéricos para servicios
export const httpClient = {
  get: async (endpoint: string) => {
    return makeRequest(endpoint, { method: 'GET' });
  },
  
  post: async (endpoint: string, data?: any) => {
    return makeRequest(endpoint, { 
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  patch: async (endpoint: string, data?: any) => {
    return makeRequest(endpoint, { 
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  
  put: async (endpoint: string, data?: any) => {
    return makeRequest(endpoint, { 
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  delete: async (endpoint: string) => {
    return makeRequest(endpoint, { method: 'DELETE' });
  }
};

// Actualizar servicio de notificaciones existente
export const notificationServiceUpdated = {
  ...notificationService,
  
  // Obtener notificaciones del usuario (nuevo método)
  getNotifications: async (params?: { limite?: number; pagina?: number }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limite) queryParams.append('limite', params.limite.toString());
      if (params?.pagina) queryParams.append('pagina', params.pagina.toString());
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';
      
      return await makeRequest(endpoint, { method: 'GET' });
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      throw error;
    }
  },
};

// API Service con métodos HTTP
const apiService = {
  query,
  testConnection,
  transaction,
  users: userService,
  userService, // Mantener para compatibilidad
  reportService,
  notifications: notificationServiceUpdated,
  get: httpClient.get,
  post: httpClient.post,
  patch: httpClient.patch,
  put: httpClient.put,
  delete: httpClient.delete,
};

export default apiService;
export { authService, userService, reportService, notificationService, notificationServiceUpdated };
