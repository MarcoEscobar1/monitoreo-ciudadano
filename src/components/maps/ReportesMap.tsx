import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Alert } from 'react-native';
import { Text, FAB, Portal, Modal, Card, Chip } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS, SPACING } from '../../theme/designSystem';
import apiService from '../../services/apiService';

const { width, height } = Dimensions.get('window');

interface ReporteMapaItem {
  id: string;
  titulo: string;
  estado: string;
  prioridad: string;
  fecha_creacion: string;
  coordenadas: {
    latitude: number;
    longitude: number;
  };
  categoria: {
    nombre: string;
  };
}

interface ReportesMapProps {
  onReportPress?: (reporteId: string) => void;
}

export const ReportesMap: React.FC<ReportesMapProps> = ({ onReportPress }) => {
  const [reportes, setReportes] = useState<ReporteMapaItem[]>([]);
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReporteMapaItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      await getUserLocation();
      await loadReportes();
    } catch (error) {
      console.error('Error inicializando mapa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Se necesita acceso a la ubicación para mostrar el mapa');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.log('Error obteniendo ubicación del usuario:', error);
      // Ubicación por defecto (Cochabamba)
      setUserLocation({
        latitude: -17.3849429,
        longitude: -66.2007983,
      });
    }
  };

  const loadReportes = async () => {
    try {
      const filters: any = {
        limite: 100
      };

      if (userLocation) {
        filters.lat = userLocation.latitude;
        filters.lng = userLocation.longitude;
        filters.radio = 25; // 25km de radio
      }

      const response = await apiService.reportService.getForMap(filters);

      if (response.success) {
        setReportes(response.data);
      }
    } catch (error) {
      console.error('Error cargando reportes para mapa:', error);
    }
  };

  const getMarkerColor = (estado: string, prioridad: string): string => {
    switch (estado.toLowerCase()) {
      case 'nuevo':
        return COLORS.reportStatus.nuevo;
      case 'en_progreso':
        return COLORS.reportStatus.en_progreso;
      case 'resuelto':
        return COLORS.reportStatus.resuelto;
      case 'cerrado':
        return COLORS.reportStatus.cerrado;
      default:
        return COLORS.primary[500];
    }
  };

  const getEstadoLabel = (estado: string): string => {
    const labels: Record<string, string> = {
      'nuevo': 'Nuevo',
      'en_revision': 'En Revisión',
      'en_progreso': 'En Progreso',
      'resuelto': 'Resuelto',
      'cerrado': 'Cerrado',
      'rechazado': 'Rechazado'
    };
    return labels[estado.toLowerCase()] || estado;
  };

  const getPrioridadLabel = (prioridad: string): string => {
    const labels: Record<string, string> = {
      'baja': 'Baja',
      'media': 'Media',
      'alta': 'Alta',
      'urgente': 'Urgente'
    };
    return labels[prioridad.toLowerCase()] || prioridad;
  };

  const handleMarkerPress = (reporte: ReporteMapaItem) => {
    setSelectedReport(reporte);
    setModalVisible(true);
  };

  const handleVerReporte = () => {
    if (selectedReport && onReportPress) {
      onReportPress(selectedReport.id);
      setModalVisible(false);
    }
  };

  if (!userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {reportes.map((reporte) => (
          <Marker
            key={reporte.id}
            coordinate={reporte.coordenadas}
            pinColor={getMarkerColor(reporte.estado, reporte.prioridad)}
            onPress={() => handleMarkerPress(reporte)}
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{reporte.titulo}</Text>
                <Text style={styles.calloutCategory}>{reporte.categoria.nombre}</Text>
                <Text style={styles.calloutStatus}>
                  {getEstadoLabel(reporte.estado)} • {getPrioridadLabel(reporte.prioridad)}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <FAB
        icon="refresh"
        style={styles.refreshFab}
        onPress={loadReportes}
        color={COLORS.text.inverse}
      />

      {/* Modal de detalles del reporte */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedReport && (
            <Card style={styles.modalCard}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.modalTitle}>
                  {selectedReport.titulo}
                </Text>
                
                <View style={styles.chipContainer}>
                  <Chip 
                    icon={selectedReport.categoria.icono} 
                    style={[styles.chip, { backgroundColor: selectedReport.categoria.color + '20' }]}
                  >
                    {selectedReport.categoria.nombre}
                  </Chip>
                  <Chip 
                    style={[styles.chip, { backgroundColor: getMarkerColor(selectedReport.estado, selectedReport.prioridad) + '20' }]}
                  >
                    {getEstadoLabel(selectedReport.estado)}
                  </Chip>
                  <Chip style={styles.chip}>
                    {getPrioridadLabel(selectedReport.prioridad)}
                  </Chip>
                </View>

                <Text style={styles.fechaTexto}>
                  Reportado: {new Date(selectedReport.fecha_creacion).toLocaleDateString()}
                </Text>
              </Card.Content>
              
              <Card.Actions style={styles.modalActions}>
                <FAB
                  icon="close"
                  mode="flat"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalButton}
                />
                {onReportPress && (
                  <FAB
                    icon="eye"
                    mode="elevated"
                    onPress={handleVerReporte}
                    style={styles.modalButton}
                    label="Ver Detalles"
                  />
                )}
              </Card.Actions>
            </Card>
          )}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface.background,
  },
  calloutContainer: {
    minWidth: 200,
    padding: SPACING.sm,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  calloutCategory: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  calloutStatus: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  refreshFab: {
    position: 'absolute',
    right: SPACING.base,
    bottom: SPACING.base,
    backgroundColor: COLORS.primary[500],
  },
  modalContainer: {
    margin: SPACING.lg,
    padding: 0,
  },
  modalCard: {
    backgroundColor: COLORS.surface.card,
  },
  modalTitle: {
    marginBottom: SPACING.base,
    color: COLORS.text.primary,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.base,
  },
  chip: {
    marginBottom: SPACING.xs,
  },
  fechaTexto: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
  modalActions: {
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
  },
  modalButton: {
    margin: SPACING.xs,
  },
});

export default ReportesMap;
