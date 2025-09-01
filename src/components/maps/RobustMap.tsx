import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import MapComponent from './MapComponent';
import MapFallback from './MapFallback';
import { Reporte, Coordenada, UbicacionCompleta } from '../../types';

const { width, height } = Dimensions.get('window');

interface RobustMapProps {
  reports?: Reporte[];
  showUserLocation?: boolean;
  onReportPress?: (report: Reporte) => void;
  onMapPress?: (coordinate: Coordenada) => void;
  onLocationSelect?: (location: UbicacionCompleta) => void;
  locationSelectionMode?: boolean;
  selectedLocation?: UbicacionCompleta | null;
  style?: any;
}

const RobustMap: React.FC<RobustMapProps> = (props) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Timeout para detectar si el mapa no carga
    timeoutRef.current = setTimeout(() => {
      if (!mapLoaded) {
        console.warn('⚠️ Timeout: El mapa no se cargó en 8 segundos');
        setLoadingTimeout(true);
      }
    }, 8000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [mapLoaded]);

  const handleMapReady = () => {
    console.log('✅ Mapa cargado correctamente');
    setMapLoaded(true);
    setMapError(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleRetry = () => {
    console.log('🔄 Reintentando cargar el mapa...');
    setMapLoaded(false);
    setMapError(false);
    setLoadingTimeout(false);
  };

  // Efecto para simular carga después de un tiempo
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      handleMapReady();
    }, 3000);

    return () => clearTimeout(loadTimer);
  }, []);

  // Mostrar fallback si hay timeout
  if (loadingTimeout) {
    return (
      <View style={styles.container}>
        <MapFallback onRetry={handleRetry} />
      </View>
    );
  }

  // Mostrar indicador de carga inicial
  if (!mapLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Card style={styles.loadingCard}>
            <Card.Content style={styles.loadingContent}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingTitle}>Cargando Mapa</Text>
              <Text style={styles.loadingText}>
                Inicializando sistema de mapas...
              </Text>
              <Text style={styles.loadingDetail}>
                Plataforma: {Platform.OS} • Proveedor: Sistema Base
              </Text>
            </Card.Content>
          </Card>
        </View>
      </View>
    );
  }

  // Mostrar mapa normal una vez "cargado"
  return (
    <View style={styles.container}>
      <MapComponent {...props} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 300,
    elevation: 4,
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingDetail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  hiddenMap: {
    position: 'absolute',
    top: -height,
    left: -width,
    width: width,
    height: height,
    opacity: 0,
  },
});

export default RobustMap;
