import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
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
  register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithFacebook: () => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
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

      console.log('🔄 Iniciando sesión con backend...', email);

      // Usar el servicio de autenticación real
      const response = await authService.login(email, password);

      if (response.success && response.data) {
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

        console.log('✅ Login exitoso con backend');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      // En caso de error del backend, simular login para desarrollo
      console.log('🔄 Backend no disponible, usando modo demo...');
      
      const user: Usuario = {
        id: 1,
        nombre: 'Usuario Demo',
        email: email,
        telefono: undefined,
        fecha_registro: new Date(),
        activo: true,
        avatar_url: undefined,
        role: 'user',
        configuracion_notificaciones: {
          push_reportes_cercanos: true,
          push_actualizaciones: true,
          push_emergencias: true,
          email_resumen_semanal: false,
        },
        total_reportes: 0,
        reportes_validados: 0,
      };

      const token = `demo_token_${Date.now()}`;

      // Guardar en SecureStore
      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('userData', JSON.stringify(user));

      // Actualizar estado
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });

      console.log('✅ Login exitoso (modo demo)');
      return true;
    }
  };

  // Función de registro
  const register = async (name: string, email: string, password: string, phone?: string): Promise<boolean> => {
    try {
      dispatch({ type: 'LOADING' });

      console.log('🔄 Registrando usuario con backend...', email);

      // Usar el servicio de autenticación real
      const response = await authService.register({
        nombre: name,
        email: email,
        password: password,
        telefono: phone
      });

      if (response.success && response.data) {
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

        console.log('✅ Registro exitoso con backend');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error en registro:', error);

      // En caso de error del backend, simular registro para desarrollo
      console.log('🔄 Backend no disponible, usando modo demo...');

      const user: Usuario = {
        id: Math.floor(Math.random() * 1000),
        nombre: name,
        email: email,
        telefono: phone,
        fecha_registro: new Date(),
        activo: true,
        avatar_url: undefined,
        role: 'user',
        configuracion_notificaciones: {
          push_reportes_cercanos: true,
          push_actualizaciones: true,
          push_emergencias: true,
          email_resumen_semanal: false,
        },
        total_reportes: 0,
        reportes_validados: 0,
      };

      const token = `demo_token_${Date.now()}`;

      // Guardar en SecureStore
      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('userData', JSON.stringify(user));

      // Actualizar estado
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });

      console.log('✅ Registro exitoso (modo demo)');
      return true;
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
        console.log('✅ Login con Google exitoso');
        
        // En una implementación real, aquí harías:
        // 1. Obtener información del usuario de Google
        // 2. Verificar/crear usuario en tu base de datos
        // 3. Generar JWT propio
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error en login con Google:', error);
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
        console.log('✅ Login con Facebook exitoso');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error en login con Facebook:', error);
      return false;
    }
  };

  // Función de logout
  const logout = async (): Promise<void> => {
    try {
      console.log('🔄 Cerrando sesión...');
      
      // 1. Actualizar estado inmediatamente para cambiar la navegación
      dispatch({ type: 'LOGOUT' });
      
      // 2. Limpiar datos almacenados de manera asíncrona
      try {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
        console.log('✅ Datos locales eliminados');
      } catch (storageError) {
        console.warn('⚠️ Error eliminando datos locales:', storageError);
        // No es crítico, continuamos
      }
      
      // 3. Intentar notificar al backend (opcional, no crítico)
      try {
        await authService.logout();
        console.log('✅ Logout notificado al backend');
      } catch (backendError) {
        console.log('⚠️ No se pudo notificar al backend, pero logout local exitoso');
      }
      
      console.log('✅ Logout completado - Redirigiendo al login');
    } catch (error) {
      console.error('❌ Error en logout:', error);
      
      // Asegurar que el logout se complete aunque haya errores
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Función de reseteo de contraseña
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      console.log('🔄 Enviando solicitud de recuperación...', email);
      
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        console.log('✅ Email de recuperación enviado');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error en reseteo de contraseña:', error);
      
      // Simular éxito para desarrollo
      console.log('🔄 Simulando envío exitoso...');
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
              console.log('✅ Sesión restaurada desde backend');
            } else {
              throw new Error('Token inválido');
            }
          } catch (error) {
            // Si no se puede verificar con backend, usar datos locales temporalmente
            console.log('⚠️ Backend no disponible, usando sesión local');
            dispatch({ type: 'RESTORE_TOKEN', payload: { user, token } });
          }
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        console.error('❌ Error restaurando sesión:', error);
        dispatch({ type: 'LOGOUT' });
      }
    };

    restoreSession();
  }, []);

  // Manejar respuestas de OAuth
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      // Manejar respuesta exitosa de Google
      console.log('Google OAuth response:', googleResponse);
    }
  }, [googleResponse]);

  useEffect(() => {
    if (facebookResponse?.type === 'success') {
      // Manejar respuesta exitosa de Facebook
      console.log('Facebook OAuth response:', facebookResponse);
    }
  }, [facebookResponse]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    resetPassword,
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
