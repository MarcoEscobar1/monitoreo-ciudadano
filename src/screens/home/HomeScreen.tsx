import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Snackbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Importar el nuevo Dashboard de FASE 7
import { Dashboard } from '../../components/dashboard/Dashboard';
import DESIGN_SYSTEM from '../../theme/designSystem';
import { useNotifications } from '../../context/NotificationContext';
import apiService from '../../services/apiService';

type NavigationProp = StackNavigationProp<any>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [popupShown, setPopupShown] = useState(false);
  const { unreadCount } = useNotifications();

  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbarVisible(false);
  }, []);

  const handleViewAllReports = useCallback(() => {
    try {
      navigation.navigate('ReportsList');
    } catch {
      showSnackbar('Navegando a lista de reportes...');
    }
  }, [navigation, showSnackbar]);

  const handleViewReport = useCallback((reportId: string) => {
    try {
      navigation.navigate('ReportDetail', { reportId });
    } catch {
      showSnackbar(`Navegando a reporte ${reportId}...`);
    }
  }, [navigation, showSnackbar]);

  const handleRefresh = useCallback(async () => {
    // Simular actualización de datos
    await new Promise(resolve => setTimeout(resolve, 1500));
    showSnackbar('Datos actualizados correctamente');
  }, [showSnackbar]);

  // Verificar notificaciones sin leer al entrar a la pantalla
  useFocusEffect(
    useCallback(() => {
      const checkUnreadNotifications = async () => {
        // Solo mostrar el popup una vez por sesión
        if (popupShown) {
          return;
        }

        try {
          // Esperar un momento para que el token se guarde después del login
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verificar si el usuario está autenticado
          const token = await SecureStore.getItemAsync('userToken');
          if (!token) return; // No hacer nada si no hay sesión

          // Obtener notificaciones del backend
          const response = await apiService.notifications.getNotifications();
          if (!response.success || !response.data) return;

          // Obtener notificaciones leídas del AsyncStorage
          const readNotificationsData = await AsyncStorage.getItem('readNotifications');
          const readNotifications = readNotificationsData 
            ? new Set(JSON.parse(readNotificationsData)) 
            : new Set();

          // Contar notificaciones sin leer
          const unreadCount = response.data.filter(
            (notif: any) => !readNotifications.has(notif.id)
          ).length;

          // Mostrar popup si hay notificaciones sin leer
          if (unreadCount > 0) {
            setTimeout(() => {
              Alert.alert(
                'Notificaciones pendientes',
                `Tienes ${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer`,
                [
                  { 
                    text: 'Ver', 
                    style: 'default',
                    onPress: () => navigation.navigate('Notifications')
                  },
                  { text: 'Después', style: 'cancel' }
                ]
              );
            }, 1000);
            setPopupShown(true);
          }
        } catch (error) {
          // Silenciar errores de autenticación
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('Token de acceso requerido')) {
            console.error('Error verificando notificaciones:', error);
          }
        }
      };

      checkUnreadNotifications();
    }, [popupShown, navigation])
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={DESIGN_SYSTEM.COLORS.neutral[50]} />
      <Dashboard
        onViewAllReports={handleViewAllReports}
        onViewReport={handleViewReport}
        onRefresh={handleRefresh}
      />
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={hideSnackbar}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[50],
  },
  snackbar: {
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[800],
  },
});

export default HomeScreen;
