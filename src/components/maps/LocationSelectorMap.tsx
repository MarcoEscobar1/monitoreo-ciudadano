import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Alert } from 'react-native';
import { Text, Button, Card, ActivityIndicator, IconButton } from 'react-native-paper';
import { COLORS, SPACING } from '../../theme/designSystem';
import WebMapComponent from './WebMapComponent';
import { useLocation } from '../../services/locationService';
import { UbicacionCompleta } from '../../types';

const { width, height } = Dimensions.get('window');

interface LocationSelectorProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address?: string }) => void;
  initialLocation?: { latitude: number; longitude: number };
  onCancel?: () => void;
}

export const LocationSelectorMap: React.FC<LocationSelectorProps> = ({ 
  onLocationSelect, 
  initialLocation,
  onCancel
}) => {
  const { getCurrentLocation, hasLocationPermissions, requestPermissions } = useLocation();
  
  const [selectedLocation, setSelectedLocation] = useState<UbicacionCompleta | null>(
    initialLocation ? {
      latitude: initialLocation.latitude,
      longitude: initialLocation.longitude,
      address: 'Ubicación inicial'
    } : null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        address: 'Ubicación inicial'
      });
    } else {
      getUserLocation();
    }
  }, [initialLocation]);

  const getUserLocation = async () => {
    try {
      setIsLoading(true);
      
      if (!hasLocationPermissions()) {
        const permissionResult = await requestPermissions();
        if (!permissionResult.granted) {
          Alert.alert(
            'Permisos de Ubicación',
            'Para seleccionar automáticamente tu ubicación, necesitamos acceso a tu GPS. Puedes seleccionar manualmente tocando en el mapa.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      const location = await getCurrentLocation({ showDialog: true });
      if (location) {
        setSelectedLocation(location);
      }
    } catch (error) {
      console.error('❌ Error obteniendo ubicación:', error);
      Alert.alert(
        'Error de Ubicación',
        'No se pudo obtener tu ubicación actual. Por favor, selecciona manualmente en el mapa.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (location: UbicacionCompleta) => {
    setSelectedLocation(location);
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: selectedLocation.address,
      });
    } else {
      Alert.alert('Ubicación Requerida', 'Por favor, selecciona una ubicación en el mapa.');
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            Seleccionar Ubicación
          </Text>
          <Text variant="bodySmall" style={styles.instruction}>
            Toca en el mapa para seleccionar la ubicación exacta del reporte
          </Text>
          
          <View style={styles.mapContainer}>
            <WebMapComponent
              showUserLocation={true}
              locationSelectionMode={true}
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              initialRegion={selectedLocation ? {
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              } : undefined}
              style={styles.map}
            />

            {/* Botón de centrar en usuario */}
            <View style={styles.mapControls}>
              <IconButton
                icon="crosshairs-gps"
                size={24}
                style={styles.locationButton}
                iconColor={COLORS.primary[500]}
                onPress={() => getUserLocation()}
                disabled={isLoading}
              />
            </View>

            {/* Indicador de carga */}
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <Card style={styles.loadingCard}>
                  <Card.Content style={styles.loadingContent}>
                    <ActivityIndicator size="small" color={COLORS.primary[500]} />
                    <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
                  </Card.Content>
                </Card>
              </View>
            )}
          </View>

          {selectedLocation && (
            <View style={styles.addressContainer}>
              <Text variant="bodySmall" style={styles.addressLabel}>
                Dirección seleccionada:
              </Text>
              <Text variant="bodyMedium" style={styles.addressText}>
                {selectedLocation.address || `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`}
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            {onCancel && (
              <Button
                mode="outlined"
                onPress={onCancel}
                style={styles.cancelButton}
                icon="close"
              >
                Cancelar
              </Button>
            )}
            <Button
              mode="contained"
              onPress={confirmLocation}
              style={styles.confirmButton}
              icon="check"
              disabled={!selectedLocation}
            >
              Confirmar Ubicación
            </Button>
            <Button
              mode="outlined"
              onPress={() => getUserLocation()}
              style={styles.currentLocationButton}
              icon="crosshairs-gps"
              disabled={isLoading}
            >
              Mi Ubicación Actual
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface.background,
  },
  card: {
    margin: SPACING.base,
    elevation: 4,
  },
  title: {
    marginBottom: SPACING.sm,
    textAlign: 'center',
    color: COLORS.primary[500],
    fontWeight: 'bold',
  },
  instruction: {
    marginBottom: SPACING.base,
    textAlign: 'center',
    color: COLORS.text.secondary,
  },
  mapContainer: {
    position: 'relative',
    height: height * 0.4,
    marginBottom: SPACING.base,
  },
  map: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  mapControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
  },
  locationButton: {
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 60,
    zIndex: 1001,
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    elevation: 3,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  addressContainer: {
    backgroundColor: COLORS.surface.card,
    padding: SPACING.base,
    borderRadius: 6,
    marginBottom: SPACING.base,
    elevation: 2,
  },
  addressLabel: {
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  addressText: {
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: SPACING.sm,
  },
  confirmButton: {
    backgroundColor: COLORS.primary[500],
  },
  currentLocationButton: {
    borderColor: COLORS.primary[500],
  },
  cancelButton: {
    borderColor: COLORS.neutral[400],
    flex: 1,
  },
});

export default LocationSelectorMap;
