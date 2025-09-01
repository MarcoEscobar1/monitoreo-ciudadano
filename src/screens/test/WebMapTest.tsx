import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  Portal,
  Modal,
  FAB,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useLocation } from '../../services/locationService';
import { Coordenada } from '../../types';

const WebMapTest: React.FC = () => {
  const [mapReady, setMapReady] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordenada | null>(null);
  const { getCurrentLocation, hasLocationPermissions, requestPermissions } = useLocation();

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      if (!hasLocationPermissions()) {
        const result = await requestPermissions();
        if (!result.granted) return;
      }

      const location = await getCurrentLocation({ showDialog: true });
      if (location) {
        setUserLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      }
    } catch (error) {
      console.error('❌ Error obteniendo ubicación:', error);
    }
  };

  // Crear HTML para mapa Leaflet con OpenStreetMap
  const createMapHTML = () => {
    const lat = userLocation?.latitude || -17.3849904; // Cochabamba por defecto
    const lng = userLocation?.longitude || -66.2007625;
    
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
            
            // Marcador en ubicación actual
            const userMarker = L.marker([${lat}, ${lng}])
                .addTo(map)
                .bindPopup('<div class="marker-popup"><b>Tu Ubicación</b><br>Lat: ${lat}<br>Lng: ${lng}</div>');
            
            // Marcador en Bogotá
            const bogotaMarker = L.marker([4.7110, -74.0721])
                .addTo(map)
                .bindPopup('<div class="marker-popup"><b>Bogotá, Colombia</b><br>Capital</div>');
            
            // Manejar clics en el mapa
            map.on('click', function(e) {
                const lat = e.latlng.lat.toFixed(6);
                const lng = e.latlng.lng.toFixed(6);
                
                L.popup()
                    .setLatLng(e.latlng)
                    .setContent('<div class="marker-popup"><b>Coordenadas</b><br>Lat: ' + lat + '<br>Lng: ' + lng + '</div>')
                    .openOn(map);
                    
                console.log('Coordenadas:', lat, lng);
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

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setMapReady(true);
        console.log('🗺️ Mapa web Leaflet listo:', data.location);
      }
    } catch (error) {
      console.error('❌ Error procesando mensaje WebView:', error);
    }
  };

  const centerOnBogota = () => {
    // Enviar comando al WebView para centrar en Bogotá
    // WebView no permite esto fácilmente, mejor mostrar modal con info
    setShowModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Header de información */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text style={styles.title}>Mapa Web - Leaflet + OpenStreetMap</Text>
          <Text style={styles.subtitle}>
            WebView • Estado: {mapReady ? '✅ Funcionando' : '⏳ Cargando...'}
          </Text>
        </Card.Content>
      </Card>

      {/* Mapa Web */}
      <View style={styles.mapContainer}>
        <WebView
          source={{ html: createMapHTML() }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          bounces={false}
          scrollEnabled={false}
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
      </View>

      {/* FAB para obtener ubicación */}
      <FAB
        style={styles.fab}
        icon="crosshairs-gps"
        onPress={getUserLocation}
        label="GPS"
      />

      {/* Modal de información */}
      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Card>
            <Card.Content>
              <Text style={styles.modalTitle}>Mapa Web Leaflet</Text>
              <Text style={styles.modalText}>
                • Usando Leaflet.js con OpenStreetMap{'\n'}
                • Renderizado en WebView{'\n'}
                • Totalmente gratuito{'\n'}
                • Funciona en todas las plataformas{'\n'}
                • Haz clic en el mapa para ver coordenadas
              </Text>
              <Button
                mode="contained"
                onPress={() => setShowModal(false)}
                style={styles.modalButton}
              >
                Entendido
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  mapContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    elevation: 4,
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
  },
  modalContent: {
    margin: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 15,
  },
  modalButton: {
    marginTop: 10,
  },
});

export default WebMapTest;
