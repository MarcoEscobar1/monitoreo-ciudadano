import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ReportesMap } from '../../components/maps/ReportesMap';
import { COLORS } from '../../theme/designSystem';

const MapScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleReportPress = (reporteId: string) => {
    // Navegar a la pantalla de detalles del reporte
    (navigation as any).navigate('ReportDetail', { reportId: reporteId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <ReportesMap onReportPress={handleReportPress} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface.background,
  },
  mapContainer: {
    flex: 1,
  },
});

export default MapScreen;
