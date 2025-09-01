import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import MapView, { 
  Marker, 
  Region,
  UrlTile 
} from 'react-native-maps';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

const OSMMapTest: React.FC = () => {
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: -17.3849904, // Cochabamba, Bolivia (tu ubicación actual)
    longitude: -66.2007625,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const handleMapReady = () => {
    console.log('🗺️ Mapa OSM con tiles listo');
    setMapReady(true);
    Alert.alert('Éxito', 'El mapa OSM se cargó correctamente');
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    console.log('📍 Toque en mapa OSM:', latitude, longitude);
    Alert.alert(
      'Ubicación OSM',
      `Lat: ${latitude.toFixed(6)}\nLng: ${longitude.toFixed(6)}`
    );
  };

  const centerOnCochabamba = () => {
    const cochabambaRegion = {
      latitude: -17.3849904,
      longitude: -66.2007625,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setRegion(cochabambaRegion);
  };

  const centerOnBogota = () => {
    const bogotaRegion = {
      latitude: 4.7110,
      longitude: -74.0721,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setRegion(bogotaRegion);
  };

  return (
    <View style={styles.container}>
      {/* Header de información */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text style={styles.title}>Mapa OpenStreetMap - Test Directo</Text>
          <Text style={styles.subtitle}>
            Tiles OSM • Estado: {mapReady ? '✅ Listo' : '⏳ Cargando'}
          </Text>
        </Card.Content>
      </Card>

      {/* Mapa con tiles OSM */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          onMapReady={handleMapReady}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          mapType="none" // Importante: usar "none" para tiles custom
        >
          {/* Tiles de OpenStreetMap */}
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
          
          {/* Marcador en Cochabamba */}
          <Marker
            coordinate={{ latitude: -17.3849904, longitude: -66.2007625 }}
            title="Cochabamba"
            description="Tu ubicación actual"
          >
            <View style={styles.customMarker}>
              <MaterialIcons name="location-on" size={30} color="#E53E3E" />
            </View>
          </Marker>
          
          {/* Marcador en Bogotá */}
          <Marker
            coordinate={{ latitude: 4.7110, longitude: -74.0721 }}
            title="Bogotá"
            description="Capital de Colombia"
          >
            <View style={styles.customMarker}>
              <MaterialIcons name="location-city" size={30} color="#3182CE" />
            </View>
          </Marker>
        </MapView>

        {/* Overlay de carga */}
        {!mapReady && (
          <View style={styles.loadingOverlay}>
            <Card style={styles.loadingCard}>
              <Card.Content style={styles.loadingContent}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando tiles OSM...</Text>
              </Card.Content>
            </Card>
          </View>
        )}
      </View>

      {/* Controles de navegación */}
      <Card style={styles.controlsCard}>
        <Card.Content>
          <Text style={styles.controlsTitle}>Controles OSM</Text>
          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              icon="home-map-marker"
              onPress={centerOnCochabamba}
              style={styles.button}
            >
              Cochabamba
            </Button>
            <Button
              mode="contained"
              icon="city"
              onPress={centerOnBogota}
              style={styles.button}
            >
              Bogotá
            </Button>
          </View>
          <Text style={styles.instructions}>
            • Usando tiles directos de OpenStreetMap
            {'\n'}• Sin dependencias de Google Maps
            {'\n'}• Totalmente gratuito y funcional
          </Text>
        </Card.Content>
      </Card>
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
  map: {
    flex: 1,
  },
  customMarker: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
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
  controlsCard: {
    margin: 10,
    elevation: 2,
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  button: {
    flex: 1,
  },
  instructions: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});

export default OSMMapTest;
