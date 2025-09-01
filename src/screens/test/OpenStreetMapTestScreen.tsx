import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  List,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { OpenStreetMapService } from '../../services/openStreetMapService';
import { UbicacionCompleta, Coordenada } from '../../types';

const OpenStreetMapTestScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [testCoords, setTestCoords] = useState('4.7110,-74.0721'); // Bogotá
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UbicacionCompleta[]>([]);
  const [geocodeResult, setGeocodeResult] = useState<UbicacionCompleta | null>(null);

  /**
   * Probar geocodificación inversa
   */
  const testReverseGeocode = async () => {
    setLoading(true);
    try {
      const [lat, lng] = testCoords.split(',').map(s => parseFloat(s.trim()));
      
      if (isNaN(lat) || isNaN(lng)) {
        Alert.alert('Error', 'Coordenadas inválidas. Formato: lat,lng');
        return;
      }

      const coordinate: Coordenada = { latitude: lat, longitude: lng };
      const result = await OpenStreetMapService.reverseGeocode(coordinate);
      
      setGeocodeResult(result);
      
      if (result) {
        Alert.alert(
          'Geocodificación Exitosa',
          `Dirección: ${result.address}\nCiudad: ${result.city || 'N/A'}\nPaís: ${result.country || 'N/A'}`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Error en geocodificación inversa');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Probar búsqueda de lugares
   */
  const testSearchPlaces = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Ingresa un término de búsqueda');
      return;
    }

    setLoading(true);
    try {
      const searchResults = await OpenStreetMapService.searchPlaces(searchQuery);
      setResults(searchResults);
      
      Alert.alert(
        'Búsqueda Completada',
        `Se encontraron ${searchResults.length} resultados`
      );
    } catch (error) {
      Alert.alert('Error', 'Error en la búsqueda de lugares');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Probar geocodificación directa
   */
  const testGeocode = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Ingresa una dirección para geocodificar');
      return;
    }

    setLoading(true);
    try {
      const coordinates = await OpenStreetMapService.geocode(searchQuery);
      
      if (coordinates.length > 0) {
        const coord = coordinates[0];
        setTestCoords(`${coord.latitude},${coord.longitude}`);
        
        Alert.alert(
          'Geocodificación Exitosa',
          `Coordenadas: ${coord.latitude.toFixed(6)}, ${coord.longitude.toFixed(6)}`
        );
      } else {
        Alert.alert('Sin Resultados', 'No se encontraron coordenadas para esa dirección');
      }
    } catch (error) {
      Alert.alert('Error', 'Error en la geocodificación');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Limpiar resultados
   */
  const clearResults = () => {
    setResults([]);
    setGeocodeResult(null);
    setSearchQuery('');
  };

  /**
   * Usar coordenadas predefinidas
   */
  const usePresetCoords = (name: string, coords: string) => {
    setTestCoords(coords);
    Alert.alert('Coordenadas Actualizadas', `Usando coordenadas de ${name}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <MaterialIcons name="public" size={32} color={COLORS.primary} />
            <View style={styles.headerText}>
              <Text style={styles.title}>OpenStreetMap Testing</Text>
              <Text style={styles.subtitle}>
                Prueba las funcionalidades de geocodificación gratuita
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Controles de búsqueda */}
      <Card style={styles.controlsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Búsqueda de Lugares</Text>
          
          <TextInput
            label="Buscar lugar o dirección"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.input}
            placeholder="Ej: Universidad Nacional Bogotá"
            right={<TextInput.Icon icon="magnify" onPress={testSearchPlaces} />}
          />
          
          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              onPress={testSearchPlaces}
              disabled={loading || !searchQuery.trim()}
              style={styles.button}
            >
              Buscar Lugares
            </Button>
            <Button
              mode="outlined"
              onPress={testGeocode}
              disabled={loading || !searchQuery.trim()}
              style={styles.button}
            >
              Geocodificar
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Controles de geocodificación inversa */}
      <Card style={styles.controlsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Geocodificación Inversa</Text>
          
          <TextInput
            label="Coordenadas (lat,lng)"
            value={testCoords}
            onChangeText={setTestCoords}
            style={styles.input}
            placeholder="4.7110,-74.0721"
            right={<TextInput.Icon icon="crosshairs-gps" onPress={testReverseGeocode} />}
          />
          
          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              onPress={testReverseGeocode}
              disabled={loading}
              style={styles.button}
            >
              Obtener Dirección
            </Button>
            <Button
              mode="outlined"
              onPress={clearResults}
              style={styles.button}
            >
              Limpiar
            </Button>
          </View>

          {/* Coordenadas predefinidas */}
          <Text style={styles.subsectionTitle}>Ubicaciones de prueba:</Text>
          <View style={styles.presetButtons}>
            <Button
              mode="outlined"
              compact
              onPress={() => usePresetCoords('Bogotá', '4.7110,-74.0721')}
            >
              Bogotá
            </Button>
            <Button
              mode="outlined"
              compact
              onPress={() => usePresetCoords('Medellín', '6.2442,-75.5812')}
            >
              Medellín
            </Button>
            <Button
              mode="outlined"
              compact
              onPress={() => usePresetCoords('Cali', '3.4516,-76.5320')}
            >
              Cali
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Indicador de carga */}
      {loading && (
        <Card style={styles.loadingCard}>
          <Card.Content style={styles.loadingContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Procesando solicitud...</Text>
          </Card.Content>
        </Card>
      )}

      {/* Resultado de geocodificación inversa */}
      {geocodeResult && (
        <Card style={styles.resultCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Resultado de Geocodificación</Text>
            <List.Item
              title={geocodeResult.address || 'Dirección no disponible'}
              description={`${geocodeResult.latitude.toFixed(6)}, ${geocodeResult.longitude.toFixed(6)}`}
              left={(props) => <List.Icon {...props} icon="map-marker" />}
            />
            {geocodeResult.city && (
              <List.Item
                title={geocodeResult.city}
                description="Ciudad"
                left={(props) => <List.Icon {...props} icon="city" />}
              />
            )}
            {geocodeResult.region && (
              <List.Item
                title={geocodeResult.region}
                description="Región/Estado"
                left={(props) => <List.Icon {...props} icon="map" />}
              />
            )}
            {geocodeResult.country && (
              <List.Item
                title={geocodeResult.country}
                description="País"
                left={(props) => <List.Icon {...props} icon="flag" />}
              />
            )}
          </Card.Content>
        </Card>
      )}

      {/* Resultados de búsqueda */}
      {results.length > 0 && (
        <Card style={styles.resultCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>
              Resultados de Búsqueda ({results.length})
            </Text>
            {results.map((result, index) => (
              <View key={index}>
                <List.Item
                  title={result.address || 'Sin dirección'}
                  description={`${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`}
                  left={(props) => <List.Icon {...props} icon="map-marker" />}
                  right={(props) => (
                    <Button
                      {...props}
                      mode="outlined"
                      compact
                      onPress={() => setTestCoords(`${result.latitude},${result.longitude}`)}
                    >
                      Usar
                    </Button>
                  )}
                />
                {index < results.length - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Información del servicio */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Información del Servicio</Text>
          <List.Item
            title="OpenStreetMap"
            description="Mapas colaborativos de código abierto"
            left={(props) => <List.Icon {...props} icon="earth" />}
          />
          <List.Item
            title="Nominatim"
            description="Servicio de geocodificación gratuito"
            left={(props) => <List.Icon {...props} icon="magnify" />}
          />
          <List.Item
            title="Sin API Key"
            description="No requiere configuración ni pago"
            left={(props) => <List.Icon {...props} icon="key-off" />}
          />
          <List.Item
            title="Uso Responsable"
            description="Máximo 1 request por segundo"
            left={(props) => <List.Icon {...props} icon="timer" />}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  controlsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  button: {
    flex: 1,
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  loadingCard: {
    marginBottom: 16,
    elevation: 2,
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  resultCard: {
    marginBottom: 16,
    elevation: 2,
  },
  infoCard: {
    elevation: 2,
  },
});

export default OpenStreetMapTestScreen;
