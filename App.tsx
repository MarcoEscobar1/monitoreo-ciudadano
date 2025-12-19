/**
 * App.tsx Actualizado - FASE 7
 * Aplicación principal con nuevas pantallas integradas
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';

// Importar sistema de diseño de FASE 7
import DESIGN_SYSTEM from './src/theme/designSystem';

// Importar navegación existente
import AppNavigator from './src/navigation/AppNavigator';

// Importar contextos
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { AdminBadgeProvider } from './src/context/AdminBadgeContext';

// ================================
// CONFIGURACIÓN DEL TEMA
// ================================

const customTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: DESIGN_SYSTEM.COLORS.primary[500],
    primaryContainer: DESIGN_SYSTEM.COLORS.primary[100],
    secondary: DESIGN_SYSTEM.COLORS.secondary[500],
    secondaryContainer: DESIGN_SYSTEM.COLORS.secondary[100],
    surface: DESIGN_SYSTEM.COLORS.neutral[100],
    background: DESIGN_SYSTEM.COLORS.neutral[50],
    onPrimary: 'white',
    onSecondary: 'white',
    onSurface: DESIGN_SYSTEM.COLORS.neutral[800],
    onBackground: DESIGN_SYSTEM.COLORS.neutral[800],
    outline: DESIGN_SYSTEM.COLORS.neutral[300],
    outlineVariant: DESIGN_SYSTEM.COLORS.neutral[200],
  },
};

// ================================
// COMPONENTE PRINCIPAL
// ================================

const App: React.FC = () => {
  // 🗑️ LIMPIEZA TEMPORAL: Eliminar tokens de modo demo antiguos
  // QUITAR ESTE useEffect después de la primera ejecución exitosa
  useEffect(() => {
    const cleanupOldTokens = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token && token.startsWith('demo_token_')) {
          console.log('🗑️ Eliminando token de modo demo antiguo...');
          await SecureStore.deleteItemAsync('userToken');
          await SecureStore.deleteItemAsync('userData');
          console.log('✅ Datos antiguos eliminados - se mostrará pantalla de login');
        }
      } catch (error) {
        console.log('⚠️ Error limpiando tokens antiguos:', error);
      }
    };
    cleanupOldTokens();
  }, []);

  return (
    <PaperProvider theme={customTheme}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            <AdminBadgeProvider>
              <NavigationContainer>
                <StatusBar 
                  style="dark" 
                  backgroundColor={DESIGN_SYSTEM.COLORS.neutral[50]} 
                  translucent={false}
                />
                <AppNavigator />
              </NavigationContainer>
            </AdminBadgeProvider>
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
};

export default App;
