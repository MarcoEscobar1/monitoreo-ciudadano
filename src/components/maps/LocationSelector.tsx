import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Button,
  Card,
  Text,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import WebMapComponent from './WebMapComponent';
import { useLocation } from '../../services/locationService';
import { Coordenada, UbicacionCompleta } from '../../types';

const { width, height } = Dimensions.get('window');

interface LocationSelectorProps {
  onLocationSelect: (location: UbicacionCompleta) => void;
  onCancel?: () => void;
  initialLocation?: Coordenada;
  title?: string;
  subtitle?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationSelect,
  onCancel,
  initialLocation,
  title = 'Selecciona la ubicación',
  subtitle = 'Toca en el mapa o arrastra el marcador para seleccionar la ubicación exacta del problema',
}) => {
  const { getCurrentLocation, hasLocationPermissions, requestPermissions } = useLocation();
  
  const [selectedLocation, setSelectedLocation] = useState<UbicacionCompleta | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        address: 'Ubicación seleccionada',
      });
    } else {
      getUserLocation();
    }
  }, [initialLocation]);

  /**
   * Obtener ubicación actual del usuario
   */
  const getUserLocation = async () => {
    try {
      setIsLoadingLocation(true);
      
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
        setAddress(location.address || 'Ubicación actual');
      }
    } catch (error) {
      console.error('❌ Error obteniendo ubicación:', error);
      Alert.alert(
        'Error de Ubicación',
        'No se pudo obtener tu ubicación actual. Por favor, selecciona manualmente en el mapa.'
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  /**
   * Manejar selección de ubicación en el mapa
   */
  const handleLocationSelect = (location: UbicacionCompleta) => {
    setSelectedLocation(location);
    setAddress(location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
  };

  /**
   * Confirmar selección de ubicación
   */
  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    } else {
      Alert.alert('Ubicación Requerida', 'Por favor, selecciona una ubicación en el mapa.');
    }
  };

  /**
   * Centrar mapa en ubicación actual
   */
  const handleCenterOnUser = () => {
    getUserLocation();
  };

  return (
    <View style={styles.container}>
      {/* Header con información */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            {onCancel && (
              <IconButton
                icon="close"
                size={24}
                onPress={onCancel}
              />
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Mapa de selección */}
      <View style={styles.mapContainer}>
        <WebMapComponent
          showUserLocation={true}
          locationSelectionMode={true}
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          initialRegion={selectedLocation ? {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          } : undefined}
        />

        {/* Botón de centrar en usuario */}
        <View style={styles.mapControls}>
          <IconButton
            icon="crosshairs-gps"
            size={24}
            style={styles.locationButton}
            iconColor={COLORS.primary}
            onPress={handleCenterOnUser}
            disabled={isLoadingLocation}
          />
        </View>

        {/* Indicador de carga */}
        {isLoadingLocation && (
          <View style={styles.loadingOverlay}>
            <Card style={styles.loadingCard}>
              <Card.Content style={styles.loadingContent}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
              </Card.Content>
            </Card>
          </View>
        )}
      </View>

      {/* Información de ubicación seleccionada */}
      {selectedLocation && (
        <Card style={styles.locationCard}>
          <Card.Content>
            <View style={styles.locationInfo}>
              <MaterialIcons
                name="place"
                size={24}
                color={COLORS.primary}
                style={styles.locationIcon}
              />
              <View style={styles.locationDetails}>
                <Text style={styles.locationTitle}>Ubicación seleccionada:</Text>
                <Text style={styles.locationAddress}>{address}</Text>
                <Text style={styles.locationCoords}>
                  {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Botones de acción */}
      <View style={styles.actions}>
        {onCancel && (
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.cancelButton}
          >
            Cancelar
          </Button>
        )}
        <Button
          mode="contained"
          onPress={handleConfirm}
          disabled={!selectedLocation}
          style={styles.confirmButton}
          icon="check"
        >
          Confirmar Ubicación
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerCard: {
    margin: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
  },
  locationButton: {
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 80,
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
    color: COLORS.textSecondary,
  },
  locationCard: {
    margin: 10,
    elevation: 2,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  locationDetails: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  locationAddress: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 3,
    lineHeight: 18,
  },
  locationCoords: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
});

export default LocationSelector;
