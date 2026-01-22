import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import apiService from '../services/apiService';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastNotificationCheck, setLastNotificationCheck] = useState(0);
  const [popupShownThisSession, setPopupShownThisSession] = useState(false);

  const refreshUnreadCount = async () => {
    try {
      // Verificar si el usuario está autenticado
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        // Si no hay token, resetear el contador y salir
        setUnreadCount(0);
        return;
      }

      // Obtener notificaciones leídas desde AsyncStorage
      const readNotifs = await AsyncStorage.getItem('readNotifications');
      const readSet = readNotifs ? new Set<string>(JSON.parse(readNotifs)) : new Set<string>();

      // Obtener todas las notificaciones del backend
      const response = await apiService.notifications.getNotifications();
      
      if (response.success && response.data) {
        // Contar cuántas no están en el readSet
        const unread = response.data.filter((notif: any) => !readSet.has(notif.id)).length;
        
        // Actualizar el badge SIEMPRE
        const previousCount = unreadCount;
        setUnreadCount(unread);
        
        // Si hay más notificaciones sin leer que antes, mostrar alerta (solo una vez por sesión)
        if (unread > previousCount && unread > 0 && !popupShownThisSession) {
          const newNotifications = response.data.filter((notif: any) => !readSet.has(notif.id));
          const latestNotif = newNotifications[0];
          
          setPopupShownThisSession(true);
          
          // Mostrar alerta de nueva notificación
          setTimeout(() => {
            Alert.alert(
              'Nueva Notificación',
              latestNotif?.mensaje || 'Tienes una nueva notificación',
              [
                {
                  text: 'Ver',
                  onPress: () => {
                    // Navegar a notificaciones
                  }
                },
                {
                  text: 'Más tarde',
                  style: 'cancel'
                }
              ]
            );
          }, 500);
        }
        
        setLastNotificationCheck(Date.now());
      }
    } catch (error) {
      // Silenciar errores de autenticación cuando no hay sesión
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('Token de acceso requerido')) {
        console.error('Error obteniendo contador de no leídas:', error);
      }
      setUnreadCount(0);
    }
  };

  // Monitorear cambios en el token de autenticación
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = await SecureStore.getItemAsync('userToken');
      const wasAuthenticated = isAuthenticated;
      const nowAuthenticated = !!token;
      
      setIsAuthenticated(nowAuthenticated);
      
      // Si el usuario cerró sesión, resetear el flag del popup
      if (wasAuthenticated && !nowAuthenticated) {
        setPopupShownThisSession(false);
      }
      
      // Si acabamos de autenticarnos, refrescar inmediatamente y resetear flag
      if (!wasAuthenticated && nowAuthenticated) {
        setPopupShownThisSession(false); // Permitir popup en nueva sesión
        await refreshUnreadCount();
      }
    };
    
    // Verificar inmediatamente
    checkAuthStatus();
    
    // Verificar cada segundo durante los primeros 5 segundos (para detectar login rápido)
    const rapidChecks = [100, 300, 500, 800, 1200].map(delay =>
      setTimeout(checkAuthStatus, delay)
    );
    
    // Actualizar cada 30 segundos para reducir carga al servidor
    const interval = setInterval(async () => {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        await refreshUnreadCount();
      }
    }, 30000); // 30 segundos
    
    return () => {
      rapidChecks.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};
