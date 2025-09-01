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
  IconButton,
  Divider,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import LocationSelector from '../../components/maps/LocationSelector';
import { UbicacionCompleta } from '../../types';

const LocationTestScreen: React.FC = () => {
  const [showSelector, setShowSelector] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<UbicacionCompleta | null>(null);
  const [locations, setLocations] = useState<UbicacionCompleta[]>([]);

  /**
   * Manejar selección de ubicación
   */
  const handleLocationSelect = (location: UbicacionCompleta) => {
    setSelectedLocation(location);
    setLocations(prev => [...prev, location]);
    setShowSelector(false);
    
    Alert.alert(
      'Ubicación Seleccionada',
      `${location.address || 'Sin dirección'}\n\nCoordenadas: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
      [{ text: 'OK' }]
    );
  };

  /**
   * Abrir selector de ubicación
   */
  const openLocationSelector = () => {
    setShowSelector(true);
  };

  /**
   * Cerrar selector de ubicación
   */
  const closeLocationSelector = () => {
    setShowSelector(false);
  };

  /**
   * Limpiar ubicaciones
   */
  const clearLocations = () => {
    setSelectedLocation(null);
    setLocations([]);
  };

  /**
   * Eliminar ubicación específica
   */
  const removeLocation = (index: number) => {
    const newLocations = locations.filter((_, i) => i !== index);
    setLocations(newLocations);
    
    if (selectedLocation && locations[index] === selectedLocation) {
      setSelectedLocation(newLocations.length > 0 ? newLocations[newLocations.length - 1] : null);
    }
  };

  if (showSelector) {
    return (
      <View style={styles.container}>
        <LocationSelector
          onLocationSelect={handleLocationSelect}
          onCancel={closeLocationSelector}
          title="Prueba de Selector de Ubicación"
          subtitle="Selecciona una ubicación para probar la funcionalidad"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <MaterialIcons name="location-on" size={32} color={COLORS.primary} />
            <View style={styles.headerText}>
              <Text style={styles.title}>Prueba de Geolocalización</Text>
              <Text style={styles.subtitle}>
                Prueba el selector de ubicación y revisa las funcionalidades de mapas
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Controles */}
      <Card style={styles.controlsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Controles</Text>
          <View style={styles.buttons}>
            <Button
              mode="contained"
              icon="add-location"
              onPress={openLocationSelector}
              style={styles.button}
            >
              Seleccionar Ubicación
            </Button>
            <Button
              mode="outlined"
              icon="clear"
              onPress={clearLocations}
              disabled={locations.length === 0}
              style={styles.button}
            >
              Limpiar Todo
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Ubicación actual seleccionada */}
      {selectedLocation && (
        <Card style={styles.currentLocationCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Ubicación Actual</Text>
            <View style={styles.locationInfo}>
              <MaterialIcons name="place" size={24} color={COLORS.primary} />
              <View style={styles.locationDetails}>
                <Text style={styles.locationAddress}>
                  {selectedLocation.address || 'Sin dirección disponible'}
                </Text>
                <Text style={styles.locationCoords}>
                  Lat: {selectedLocation.latitude.toFixed(6)}
                </Text>
                <Text style={styles.locationCoords}>
                  Lng: {selectedLocation.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Historial de ubicaciones */}
      {locations.length > 0 && (
        <Card style={styles.historyCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>
              Historial de Ubicaciones ({locations.length})
            </Text>
            {locations.map((location, index) => (
              <View key={index}>
                <View style={styles.historyItem}>
                  <View style={styles.historyInfo}>
                    <MaterialIcons name="place" size={20} color={COLORS.textSecondary} />
                    <View style={styles.historyDetails}>
                      <Text style={styles.historyAddress}>
                        {location.address || 'Sin dirección'}
                      </Text>
                      <Text style={styles.historyCoords}>
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </Text>
                    </View>
                  </View>
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor={COLORS.error}
                    onPress={() => removeLocation(index)}
                  />
                </View>
                {index < locations.length - 1 && <Divider style={styles.divider} />}
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Información de funcionalidades */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Funcionalidades Implementadas</Text>
          <View style={styles.featureList}>
            <View style={styles.feature}>
              <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
              <Text style={styles.featureText}>Selección de ubicación por toque en mapa</Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
              <Text style={styles.featureText}>Marcador arrastrable para ajuste fino</Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
              <Text style={styles.featureText}>Geocodificación inversa automática</Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
              <Text style={styles.featureText}>Detección de ubicación actual (GPS)</Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
              <Text style={styles.featureText}>Interfaz intuitiva y responsive</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Instrucciones */}
      <Card style={styles.instructionsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Instrucciones de Uso</Text>
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              1. Presiona "Seleccionar Ubicación" para abrir el mapa
            </Text>
            <Text style={styles.instructionText}>
              2. Toca en cualquier punto del mapa para seleccionar esa ubicación
            </Text>
            <Text style={styles.instructionText}>
              3. Arrastra el marcador para hacer ajustes finos
            </Text>
            <Text style={styles.instructionText}>
              4. Usa el botón de ubicación actual para centrar en tu GPS
            </Text>
            <Text style={styles.instructionText}>
              5. Confirma la selección para guardar la ubicación
            </Text>
          </View>
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
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
  currentLocationCard: {
    marginBottom: 16,
    elevation: 2,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDetails: {
    marginLeft: 12,
    flex: 1,
  },
  locationAddress: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  locationCoords: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  historyCard: {
    marginBottom: 16,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  historyInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  historyDetails: {
    marginLeft: 8,
    flex: 1,
  },
  historyAddress: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 2,
  },
  historyCoords: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  divider: {
    marginVertical: 8,
  },
  infoCard: {
    marginBottom: 16,
    elevation: 2,
  },
  featureList: {
    gap: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  instructionsCard: {
    elevation: 2,
  },
  instructions: {
    gap: 8,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default LocationTestScreen;
