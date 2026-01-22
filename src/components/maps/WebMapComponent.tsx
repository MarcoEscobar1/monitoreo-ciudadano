import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Button, FAB, Card, Text, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useLocation } from '../../services/locationService';
import { Coordenada, UbicacionCompleta, Reporte } from '../../types';

const { width, height } = Dimensions.get('window');

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapPressEvent {
  coordinate: Coordenada;
}

interface WebMapComponentProps {
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

const WebMapComponent: React.FC<WebMapComponentProps> = ({
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
  const webViewRef = useRef<WebView>(null);
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
  const [mapReady, setMapReady] = useState(false);

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
        
        // Enviar comando al WebView para centrar el mapa
        if (mapReady && webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'centerMap',
            latitude: location.latitude,
            longitude: location.longitude,
            zoom: 15
          }));
        }
      }
    } catch (error) {
      console.error('Error obteniendo ubicacion:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual.');
    } finally {
      setIsLoadingLocation(false);
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
   * Crear HTML para mapa Leaflet con OpenStreetMap
   */
  const createMapHTML = () => {
    const lat = userLocation?.latitude || region.latitude;
    const lng = userLocation?.longitude || region.longitude;
    
    // Crear marcadores de reportes
    const reportMarkers = reports.map(report => ({
      lat: report.ubicacion.latitude,
      lng: report.ubicacion.longitude,
      title: report.titulo,
      description: report.descripcion,
      color: getMarkerColor(report),
      id: `report-${report.id}`,
      type: 'report'
    }));

    // Crear marcadores personalizados
    const customMarkers = markers.map(marker => ({
      lat: marker.coordinate.latitude,
      lng: marker.coordinate.longitude,
      title: marker.title,
      description: marker.description || '',
      color: getMarkerColor(marker),
      id: `marker-${marker.id}`,
      type: 'custom'
    }));

    const allMarkers = [...reportMarkers, ...customMarkers];
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
            body { margin: 0; padding: 0; }
            #map { height: 100vh; width: 100vw; }
            .marker-popup {
                font-family: Arial, sans-serif;
                font-size: 14px;
                max-width: 200px;
            }
            .custom-marker {
                background-color: #FFFFFF;
                border: 2px solid #333;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            // Inicializar mapa
            const map = L.map('map').setView([${lat}, ${lng}], 13);
            
            // Agregar tiles de OpenStreetMap
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(map);
            
            // Marcador en ubicación actual del usuario
            ${userLocation ? `
            const userMarker = L.marker([${lat}, ${lng}])
                .addTo(map)
                .bindPopup('<div class="marker-popup"><b>Tu Ubicacion</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}</div>');
            ` : ''}
            
            // Agregar marcadores de reportes y personalizados
            const markers = ${JSON.stringify(allMarkers)};
            markers.forEach(markerData => {
                const marker = L.marker([markerData.lat, markerData.lng])
                    .addTo(map)
                    .bindPopup('<div class="marker-popup"><b>' + markerData.title + '</b><br>' + 
                              (markerData.description || '') + '<br>' +
                              'Lat: ' + markerData.lat.toFixed(6) + '<br>Lng: ' + markerData.lng.toFixed(6) + '</div>');
                
                marker.on('click', function() {
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'markerPress',
                        marker: markerData
                    }));
                });
            });
            
            // Marcador de ubicación seleccionada
            ${selectedMarker ? `
            const selectedMarker = L.marker([${selectedMarker.latitude}, ${selectedMarker.longitude}], {
                draggable: ${locationSelectionMode}
            }).addTo(map)
              .bindPopup('<div class="marker-popup"><b>Ubicacion Seleccionada</b><br>Lat: ${selectedMarker.latitude.toFixed(6)}<br>Lng: ${selectedMarker.longitude.toFixed(6)}</div>');
            
            if (${locationSelectionMode}) {
                selectedMarker.on('dragend', function(e) {
                    const position = e.target.getLatLng();
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'markerDragEnd',
                        coordinate: { latitude: position.lat, longitude: position.lng }
                    }));
                });
            }
            ` : ''}
            
            // Manejar clics en el mapa
            map.on('click', function(e) {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                
                ${locationSelectionMode ? `
                // En modo de selección, agregar/mover marcador
                if (window.selectedLocationMarker) {
                    map.removeLayer(window.selectedLocationMarker);
                }
                window.selectedLocationMarker = L.marker([lat, lng], { draggable: true })
                    .addTo(map)
                    .bindPopup('<div class="marker-popup"><b>Nueva Ubicacion</b><br>Lat: ' + lat.toFixed(6) + '<br>Lng: ' + lng.toFixed(6) + '</div>');
                
                window.selectedLocationMarker.on('dragend', function(e) {
                    const position = e.target.getLatLng();
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'markerDragEnd',
                        coordinate: { latitude: position.lat, longitude: position.lng }
                    }));
                });
                ` : `
                // Mostrar popup con coordenadas
                L.popup()
                    .setLatLng(e.latlng)
                    .setContent('<div class="marker-popup"><b>Coordenadas</b><br>Lat: ' + lat.toFixed(6) + '<br>Lng: ' + lng.toFixed(6) + '</div>')
                    .openOn(map);
                `}
                
                // Enviar evento a React Native
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'mapPress',
                    coordinate: { latitude: lat, longitude: lng }
                }));
            });
            
            // Escuchar mensajes de React Native
            window.addEventListener('message', function(event) {
                const data = JSON.parse(event.data);
                
                if (data.type === 'centerMap') {
                    map.setView([data.latitude, data.longitude], data.zoom || 13);
                }
            });
            
            // Notificar que el mapa está listo
            setTimeout(() => {
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'mapReady',
                    location: { lat: ${lat}, lng: ${lng} }
                }));
            }, 1000);
        </script>
    </body>
    </html>
    `;
  };

  /**
   * Manejar mensajes del WebView
   */
  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'mapReady':
          setMapReady(true);
          break;
          
        case 'mapPress':
          const coordinate = data.coordinate;
          
          if (locationSelectionMode) {
            setSelectedMarker(coordinate);
            
            if (onLocationSelect) {
              try {
                const locationInfo = await reverseGeocode(coordinate);
                if (locationInfo) {
                  onLocationSelect(locationInfo);
                }
              } catch (error) {
                console.error('Error en geocodificacion inversa:', error);
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
          break;
          
        case 'markerPress':
          if (onMarkerPress) {
            onMarkerPress(data.marker);
          }
          break;
          
        case 'markerDragEnd':
          const dragCoordinate = data.coordinate;
          setSelectedMarker(dragCoordinate);
          
          if (onLocationSelect) {
            try {
              const locationInfo = await reverseGeocode(dragCoordinate);
              if (locationInfo) {
                onLocationSelect(locationInfo);
              }
            } catch (error) {
              onLocationSelect({
                latitude: dragCoordinate.latitude,
                longitude: dragCoordinate.longitude,
                address: `${dragCoordinate.latitude.toFixed(6)}, ${dragCoordinate.longitude.toFixed(6)}`,
              });
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error procesando mensaje WebView:', error);
    }
  };

  /**
   * Centrar mapa en ubicación específica
   */
  const centerMap = (coordinate: Coordenada, zoom?: number) => {
    if (mapReady && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'centerMap',
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        zoom: zoom || 15
      }));
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: createMapHTML() }}
        style={styles.webview}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        bounces={false}
        scrollEnabled={scrollEnabled}
        onLoadStart={() => {}}
        onLoadEnd={() => {}}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <Card style={styles.loadingCard}>
              <Card.Content style={styles.loadingContent}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando mapa web...</Text>
              </Card.Content>
            </Card>
          </View>
        )}
      />

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
  webview: {
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

export default WebMapComponent;
