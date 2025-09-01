import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import MapView, { 
  Marker, 
  Region 
} from 'react-native-maps';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

const SimpleMapTest: React.FC = () => {
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: 4.7110,
    longitude: -74.0721,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const handleMapReady = () => {
    console.log('🗺️ Mapa simple listo');
    setMapReady(true);
    Alert.alert('Éxito', 'El mapa se cargó correctamente');
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    console.log('📍 Toque en mapa:', latitude, longitude);
    Alert.alert(
      'Ubicación',
      `Lat: ${latitude.toFixed(6)}\nLng: ${longitude.toFixed(6)}`
    );
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

  const centerOnMedellin = () => {
    const medellinRegion = {
      latitude: 6.2442,
      longitude: -75.5812,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setRegion(medellinRegion);
  };

  return (
    <View style={styles.container}>
      {/* Header de información */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text style={styles.title}>Mapa Simple - Debugging</Text>
          <Text style={styles.subtitle}>
            Plataforma: {Platform.OS} • Estado: {mapReady ? '✅ Listo' : '⏳ Cargando'}
          </Text>
        </Card.Content>
      </Card>

      {/* Mapa básico */}
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
          mapType="standard"
        >
          {/* Marcador de prueba en Bogotá */}
          <Marker
            coordinate={{ latitude: 4.7110, longitude: -74.0721 }}
            title="Bogotá"
            description="Capital de Colombia"
          />
          
          {/* Marcador de prueba en Medellín */}
          <Marker
            coordinate={{ latitude: 6.2442, longitude: -75.5812 }}
            title="Medellín"
            description="Ciudad de la eterna primavera"
          />
        </MapView>

        {/* Overlay de carga */}
        {!mapReady && (
          <View style={styles.loadingOverlay}>
            <Card style={styles.loadingCard}>
              <Card.Content style={styles.loadingContent}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando mapa base...</Text>
              </Card.Content>
            </Card>
          </View>
        )}
      </View>

      {/* Controles de navegación */}
      <Card style={styles.controlsCard}>
        <Card.Content>
          <Text style={styles.controlsTitle}>Controles de Prueba</Text>
          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              icon="home-city"
              onPress={centerOnBogota}
              style={styles.button}
            >
              Bogotá
            </Button>
            <Button
              mode="contained"
              icon="city"
              onPress={centerOnMedellin}
              style={styles.button}
            >
              Medellín
            </Button>
          </View>
          <Text style={styles.instructions}>
            • Toca en el mapa para ver coordenadas
            {'\n'}• Usa los botones para navegar
            {'\n'}• El mapa debe mostrar ciudades colombianas
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

export default SimpleMapTest;
