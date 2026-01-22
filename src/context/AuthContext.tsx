import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { authService } from '../services/apiService';
import { Usuario } from '../types';

// Completar la configuración de WebBrowser para OAuth
WebBrowser.maybeCompleteAuthSession();

// Tipos para el contexto de autenticación
interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: Usuario | null;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone?: string, apellidos?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithFacebook: () => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateUser: (userData: Partial<Usuario>) => Promise<void>;
}

type AuthAction =
  | { type: 'LOADING' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: Usuario; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_TOKEN'; payload: { user: Usuario; token: string } };

// Reducer para manejar el estado de autenticación
const authReducer = (prevState: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOADING':
      return {
        ...prevState,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...prevState,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'LOGOUT':
      return {
        ...prevState,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    case 'RESTORE_TOKEN':
      return {
        ...prevState,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    default:
      return prevState;
  }
};

// Configuración OAuth
const GOOGLE_CLIENT_ID = process.env.OAUTH_GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.OAUTH_FACEBOOK_APP_ID;

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider del contexto de autenticación
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isLoading: true,
    isAuthenticated: false,
    user: null,
    token: null,
  });

  // Configuración para Google OAuth
  const [googleRequest, googleResponse, googlePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID || '',
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'your-app-scheme',
      }),
    },
    {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
    }
  );

  // Configuración para Facebook OAuth
  const [facebookRequest, facebookResponse, facebookPromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: FACEBOOK_APP_ID || '',
      scopes: ['public_profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'your-app-scheme',
      }),
    },
    {
      authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
    }
  );

  // Función de login manual
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'LOADING' });

      // Usar el servicio de autenticación real
      const response = await authService.login(email, password);

      if (response.success && response.data) {
        // Si la cuenta requiere validación
        if (response.data.requiresValidation) {
          dispatch({ type: 'LOGOUT' });
          throw new Error('ACCOUNT_PENDING_VALIDATION');
        }

        const { user, token } = response.data;

        // Convertir datos del backend al formato del contexto
        const usuario: Usuario = {
          id: user.id,
          nombre: user.nombre,
          apellidos: user.apellidos,
          email: user.email,
          telefono: user.telefono,
          direccion: user.direccion,
          fecha_registro: new Date(user.fecha_registro),
          activo: user.activo,
          avatar_url: undefined,
          role: user.role || 'user',
          tipo_usuario: user.tipo_usuario,
          configuracion_notificaciones: {
            push_reportes_cercanos: true,
            push_actualizaciones: true,
            push_emergencias: true,
            email_resumen_semanal: false,
          },
          total_reportes: 0,
          reportes_validados: 0,
        };

        // Guardar token y usuario en SecureStore
        await SecureStore.setItemAsync('userToken', token);
        await SecureStore.setItemAsync('userData', JSON.stringify(usuario));

        // Actualizar estado
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: usuario, token } });

        return true;
      }

      // Si el backend respondió pero las credenciales son incorrectas
      dispatch({ type: 'LOGOUT' });
      throw new Error('Credenciales incorrectas');
    } catch (error: any) {
      console.error('Error en login:', error);
      dispatch({ type: 'LOGOUT' });
      
      // Propagar el error para que el LoginScreen lo maneje
      if (error.message) {
        throw error;
      }
      
      throw new Error('Error de conexión con el servidor. Intenta nuevamente.');
    }
  };

  // Función de registro
  const register = async (name: string, email: string, password: string, phone?: string, apellidos?: string): Promise<boolean> => {
    try {
      dispatch({ type: 'LOADING' });

      // Usar el servicio de autenticación real
      const response = await authService.register({
        nombre: name,
        apellidos: apellidos || '',
        email: email,
        password: password,
        telefono: phone
      });

      if (response.success && response.data) {
        // Si el registro requiere validación, no iniciar sesión automáticamente
        if (response.data.requiresValidation) {
          dispatch({ type: 'LOGOUT' });
          throw new Error('REQUIRES_VALIDATION');
        }

        const { user, token } = response.data;

        // Convertir datos del backend al formato del contexto
        const usuario: Usuario = {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
          fecha_registro: new Date(user.fecha_registro),
          activo: user.activo,
          avatar_url: undefined,
          role: user.role || 'user',
          tipo_usuario: user.tipo_usuario,
          configuracion_notificaciones: {
            push_reportes_cercanos: true,
            push_actualizaciones: true,
            push_emergencias: true,
            email_resumen_semanal: false,
          },
          total_reportes: 0,
          reportes_validados: 0,
        };

        // Actualizar estado
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: usuario, token } });

        return true;
      }
      dispatch({ type: 'LOGOUT' });
      throw new Error('No se pudo completar el registro');
    } catch (error: any) {
      console.error('Error en registro:', error);
      dispatch({ type: 'LOGOUT' });
      
      // Propagar el error para que el RegisterScreen lo maneje
      if (error.message) {
        throw error;
      }
      
      throw new Error('Error de conexión con el servidor. Intenta nuevamente.');
    }
  };

  // Función de login con Google
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      dispatch({ type: 'LOADING' });
      
      if (!googleRequest) {
        console.error('Google OAuth no configurado');
        return false;
      }

      const result = await googlePromptAsync();
      
      if (result.type === 'success') {
        // Aquí procesarías el token de Google y crearías/buscarías el usuario
        // Por ahora, simulamos un login exitoso
        
        // En una implementación real, aquí harías:
        // 1. Obtener información del usuario de Google
        // 2. Verificar/crear usuario en tu base de datos
        // 3. Generar JWT propio
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error en login con Google:', error);
      return false;
    }
  };

  // Función de login con Facebook
  const loginWithFacebook = async (): Promise<boolean> => {
    try {
      dispatch({ type: 'LOADING' });
      
      if (!facebookRequest) {
        console.error('Facebook OAuth no configurado');
        return false;
      }

      const result = await facebookPromptAsync();
      
      if (result.type === 'success') {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error en login con Facebook:', error);
      return false;
    }
  };

  // Función de logout
  const logout = async (): Promise<void> => {
    try {
      // 1. Actualizar estado inmediatamente para cambiar la navegación
      dispatch({ type: 'LOGOUT' });
      
      // 2. Limpiar datos almacenados de manera asíncrona
      try {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
      } catch (storageError) {
        console.warn('Error eliminando datos locales:', storageError);
        // No es crítico, continuamos
      }
      
      // 3. Intentar notificar al backend (opcional, no crítico)
      try {
        await authService.logout();
      } catch (backendError) {
        // No es crítico si falla
      }
    } catch (error) {
      console.error('Error en logout:', error);
      
      // Asegurar que el logout se complete aunque haya errores
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Función de reseteo de contraseña
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error en reseteo de contraseña:', error);
      
      // Simular éxito para desarrollo
      return true;
    }
  };

  // Efecto para restaurar sesión al cargar la app
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        const userData = await SecureStore.getItemAsync('userData');

        if (token && userData) {
          const user = JSON.parse(userData) as Usuario;
          
          // Intentar verificar token con el backend
          try {
            const response = await authService.verifyToken();
            if (response.success && response.data) {
              // Token válido, usar datos actualizados del backend
              const backendUser = response.data.user;
              const updatedUser: Usuario = {
                id: backendUser.id,
                nombre: backendUser.nombre,
                email: backendUser.email,
                telefono: backendUser.telefono,
                fecha_registro: new Date(backendUser.fecha_registro),
                activo: backendUser.activo,
                avatar_url: undefined,
                role: backendUser.role || 'user',
                configuracion_notificaciones: {
                  push_reportes_cercanos: true,
                  push_actualizaciones: true,
                  push_emergencias: true,
                  email_resumen_semanal: false,
                },
                total_reportes: 0,
                reportes_validados: 0,
              };
              
              dispatch({ type: 'RESTORE_TOKEN', payload: { user: updatedUser, token } });
            } else {
              throw new Error('Token inválido');
            }
          } catch (error) {
            // Si no se puede verificar con backend, eliminar sesión inválida
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('userData');
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        console.error('Error restaurando sesión:', error);
        dispatch({ type: 'LOGOUT' });
      }
    };

    restoreSession();
  }, []);

  // Manejar respuestas de OAuth
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      // Manejar respuesta exitosa de Google
    }
  }, [googleResponse]);

  useEffect(() => {
    if (facebookResponse?.type === 'success') {
      // Manejar respuesta exitosa de Facebook
    }
  }, [facebookResponse]);

  // Actualizar datos del usuario en contexto
  const updateUser = async (userData: Partial<Usuario>) => {
    if (state.user) {
      const updatedUser = { ...state.user, ...userData };
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: updatedUser, token: state.token || '' }
      });
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    resetPassword,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto de autenticación
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
