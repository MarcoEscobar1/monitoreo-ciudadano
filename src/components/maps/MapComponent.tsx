import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { 
  Marker, 
  Region, 
  MarkerDragStartEndEvent,
  MapPressEvent 
} from 'react-native-maps';
import { Button, FAB, Card, Text, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useLocation } from '../../services/locationService';
import { Coordenada, UbicacionCompleta, Reporte } from '../../types';

const { width, height } = Dimensions.get('window');

interface MapComponentProps {
  // Configuración del mapa
  initialRegion?: Region;
  showUserLocation?: boolean;
  showCompass?: boolean;
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
  
  // Marcadores y reportes
  reports?: Reporte[];
  markers?: MapMarker[];
  
  // Callbacks
  onLocationSelect?: (location: UbicacionCompleta) => void;
  onMarkerPress?: (marker: MapMarker | Reporte) => void;
  onMapPress?: (coordinate: Coordenada) => void;
  
  // Modo de selección de ubicación
  locationSelectionMode?: boolean;
  selectedLocation?: Coordenada | null;
  
  // Clustering
  enableClustering?: boolean;
  clusterColor?: string;
  clusterTextColor?: string;
  
  // Estilo
  style?: any;
  mapStyle?: any[];
}

export interface MapMarker {
  id: string | number;
  coordinate: Coordenada;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  type?: 'report' | 'user' | 'custom';
}

const MapComponent: React.FC<MapComponentProps> = ({
  initialRegion,
  showUserLocation = true,
  showCompass = true,
  zoomEnabled = true,
  scrollEnabled = true,
  reports = [],
  markers = [],
  onLocationSelect,
  onMarkerPress,
  onMapPress,
  locationSelectionMode = false,
  selectedLocation,
  enableClustering = false,
  clusterColor = COLORS.primary,
  clusterTextColor = '#FFFFFF',
  style,
  mapStyle,
}) => {
  const mapRef = useRef<MapView>(null);
  const {
    getCurrentLocation,
    requestPermissions,
    hasLocationPermissions,
    reverseGeocode
  } = useLocation();

  const [region, setRegion] = useState<Region>(
    initialRegion || {
      latitude: 4.7110, // Bogotá, Colombia por defecto
      longitude: -74.0721,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }
  );

  const [userLocation, setUserLocation] = useState<Coordenada | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Coordenada | null>(selectedLocation || null);

  // Efecto para obtener ubicación inicial
  useEffect(() => {
    if (showUserLocation) {
      getUserLocation();
    }
  }, [showUserLocation]);

  // Efecto para actualizar marcador seleccionado
  useEffect(() => {
    setSelectedMarker(selectedLocation || null);
  }, [selectedLocation]);

  /**
   * Obtener ubicación del usuario
   */
  const getUserLocation = async () => {
    try {
      setIsLoadingLocation(true);
      
      if (!hasLocationPermissions()) {
        const permissionResult = await requestPermissions();
        if (!permissionResult.granted) {
          Alert.alert(
            'Permisos Requeridos',
            'Para mostrar tu ubicación en el mapa, necesitamos acceso a tu GPS.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      const location = await getCurrentLocation({ showDialog: true });
      if (location) {
        setUserLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });

        // Centrar mapa en la ubicación del usuario
        const newRegion = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      }
    } catch (error) {
      console.error('❌ Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  /**
   * Manejar presión en el mapa
   */
  const handleMapPress = async (event: MapPressEvent) => {
    const coordinate = event.nativeEvent.coordinate;
    
    if (locationSelectionMode) {
      setSelectedMarker(coordinate);
      
      if (onLocationSelect) {
        try {
          const locationInfo = await reverseGeocode(coordinate);
          if (locationInfo) {
            onLocationSelect(locationInfo);
          }
        } catch (error) {
          console.error('❌ Error en geocodificación inversa:', error);
          onLocationSelect({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            address: `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`,
          });
        }
      }
    }
    
    if (onMapPress) {
      onMapPress(coordinate);
    }
  };

  /**
   * Manejar presión en marcador
   */
  const handleMarkerPress = (marker: MapMarker | Reporte) => {
    if (onMarkerPress) {
      onMarkerPress(marker);
    }
  };

  /**
   * Manejar arrastre de marcador
   */
  const handleMarkerDragEnd = async (event: MarkerDragStartEndEvent) => {
    const coordinate = event.nativeEvent.coordinate;
    setSelectedMarker(coordinate);
    
    if (onLocationSelect) {
      try {
        const locationInfo = await reverseGeocode(coordinate);
        if (locationInfo) {
          onLocationSelect(locationInfo);
        }
      } catch (error) {
        onLocationSelect({
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          address: `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`,
        });
      }
    }
  };

  /**
   * Centrar mapa en ubicación específica
   */
  const centerMap = (coordinate: Coordenada, zoom?: number) => {
    const newRegion = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: zoom || 0.01,
      longitudeDelta: zoom || 0.01,
    };
    
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  };

  /**
   * Obtener color del marcador según tipo de reporte
   */
  const getMarkerColor = (item: Reporte | MapMarker): string => {
    if ('color' in item && item.color) {
      return item.color;
    }
    
    if ('estado' in item) {
      // Es un reporte
      switch (item.estado) {
        case 'nuevo': return '#FF5722'; // Rojo
        case 'en_revision': return '#FF9800'; // Naranja
        case 'en_progreso': return '#2196F3'; // Azul
        case 'resuelto': return '#4CAF50'; // Verde
        default: return COLORS.primary;
      }
    }
    
    return COLORS.primary;
  };

  /**
   * Obtener ícono del marcador
   */
  const getMarkerIcon = (item: Reporte | MapMarker): string => {
    if ('icon' in item && item.icon) {
      return item.icon;
    }
    
    if ('categoria' in item) {
      return item.categoria.icono || 'place';
    }
    
    return 'place';
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation={showUserLocation && !isLoadingLocation}
        showsCompass={showCompass}
        zoomEnabled={zoomEnabled}
        scrollEnabled={scrollEnabled}
        showsMyLocationButton={false}
        onMapReady={() => console.log('🗺️ Mapa nativo sin Google Maps listo')}
        mapType="standard"
        showsScale={true}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
      >
        {/* Marcadores de reportes */}
        {reports.map((report) => (
          <Marker
            key={`report-${report.id}`}
            coordinate={report.ubicacion}
            title={report.titulo}
            description={report.descripcion}
            pinColor={getMarkerColor(report)}
            onPress={() => handleMarkerPress(report)}
          >
            <View style={[styles.customMarker, { backgroundColor: getMarkerColor(report) }]}>
              <MaterialIcons 
                name={getMarkerIcon(report) as any} 
                size={20} 
                color="#FFFFFF" 
              />
            </View>
          </Marker>
        ))}

        {/* Marcadores personalizados */}
        {markers.map((marker) => (
          <Marker
            key={`marker-${marker.id}`}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor={getMarkerColor(marker)}
            onPress={() => handleMarkerPress(marker)}
          >
            <View style={[styles.customMarker, { backgroundColor: getMarkerColor(marker) }]}>
              <MaterialIcons 
                name={getMarkerIcon(marker) as any} 
                size={20} 
                color="#FFFFFF" 
              />
            </View>
          </Marker>
        ))}

        {/* Marcador de ubicación seleccionada */}
        {locationSelectionMode && selectedMarker && (
          <Marker
            coordinate={selectedMarker}
            draggable
            onDragEnd={handleMarkerDragEnd}
            title="Ubicación seleccionada"
            description="Arrastra para ajustar la posición"
          >
            <View style={styles.selectedMarker}>
              <MaterialIcons name="place" size={30} color={COLORS.primary} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Botones de control */}
      <View style={styles.controls}>
        {showUserLocation && (
          <FAB
            style={[styles.fab, styles.locationFab]}
            small
            icon="crosshairs-gps"
            onPress={getUserLocation}
            loading={isLoadingLocation}
            disabled={isLoadingLocation}
          />
        )}
      </View>

      {/* Indicador de carga de ubicación */}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
    gap: 10,
  },
  fab: {
    backgroundColor: '#FFFFFF',
  },
  locationFab: {
    backgroundColor: COLORS.primary,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedMarker: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
});

export default MapComponent;
