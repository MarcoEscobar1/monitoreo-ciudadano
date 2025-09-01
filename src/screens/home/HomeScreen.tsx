import React, { useCallback, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Snackbar } from 'react-native-paper';

// Importar el nuevo Dashboard de FASE 7
import { Dashboard } from '../../components/dashboard/Dashboard';
import DESIGN_SYSTEM from '../../theme/designSystem';

type NavigationProp = StackNavigationProp<any>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

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
