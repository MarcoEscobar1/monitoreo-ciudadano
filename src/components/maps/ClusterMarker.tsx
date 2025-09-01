import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { Coordenada, Reporte } from '../../types';

interface ClusterMarkerProps {
  coordinate: Coordenada;
  count: number;
  reports: Reporte[];
  onPress: (reports: Reporte[]) => void;
  color?: string;
  textColor?: string;
  size?: 'small' | 'medium' | 'large';
}

interface ClusterConfig {
  size: number;
  fontSize: number;
  iconSize: number;
}

const ClusterMarker: React.FC<ClusterMarkerProps> = ({
  coordinate,
  count,
  reports,
  onPress,
  color = COLORS.primary,
  textColor = '#FFFFFF',
  size = 'medium'
}) => {
  const getClusterConfig = (): ClusterConfig => {
    if (count < 5) {
      return { size: 40, fontSize: 12, iconSize: 16 };
    } else if (count < 10) {
      return { size: 50, fontSize: 14, iconSize: 20 };
    } else if (count < 25) {
      return { size: 60, fontSize: 16, iconSize: 24 };
    } else {
      return { size: 70, fontSize: 18, iconSize: 28 };
    }
  };

  const config = getClusterConfig();

  const handlePress = () => {
    onPress(reports);
  };

  return (
    <Marker
      coordinate={coordinate}
      onPress={handlePress}
      tracksViewChanges={false}
    >
      <View style={[
        styles.clusterContainer,
        {
          backgroundColor: color,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
        }
      ]}>
        <MaterialIcons
          name="location-on"
          size={config.iconSize}
          color={textColor}
          style={styles.clusterIcon}
        />
        <Text style={[
          styles.clusterText,
          {
            color: textColor,
            fontSize: config.fontSize,
          }
        ]}>
          {count}
        </Text>
      </View>
    </Marker>
  );
};

/**
 * Función para agrupar reportes cercanos en clusters
 */
export const clusterReports = (
  reports: Reporte[],
  zoom: number,
  mapDimensions: { width: number; height: number }
): Array<{ coordinate: Coordenada; reports: Reporte[]; count: number }> => {
  if (reports.length === 0) return [];

  // Calcular el radio de clustering basado en el zoom
  const getClusterRadius = (zoom: number): number => {
    if (zoom > 15) return 0.0001; // Muy cerca, clusters pequeños
    if (zoom > 12) return 0.0005; // Cerca, clusters medianos
    if (zoom > 10) return 0.001;  // Medio, clusters grandes
    if (zoom > 8) return 0.005;   // Lejos, clusters muy grandes
    return 0.01; // Muy lejos, clusters máximos
  };

  const clusterRadius = getClusterRadius(zoom);
  const clusters: Array<{ coordinate: Coordenada; reports: Reporte[]; count: number }> = [];
  const processedReports = new Set<number>();

  reports.forEach((report) => {
    if (processedReports.has(report.id)) return;

    const nearbyReports = reports.filter((otherReport) => {
      if (processedReports.has(otherReport.id) || otherReport.id === report.id) {
        return false;
      }

      const distance = calculateDistance(
        report.ubicacion,
        otherReport.ubicacion
      );

      return distance <= clusterRadius;
    });

    // Agregar el reporte principal
    nearbyReports.unshift(report);

    // Marcar todos los reportes como procesados
    nearbyReports.forEach(r => processedReports.add(r.id));

    // Calcular el centroide del cluster
    const centroid = calculateCentroid(nearbyReports.map(r => r.ubicacion));

    clusters.push({
      coordinate: centroid,
      reports: nearbyReports,
      count: nearbyReports.length
    });
  });

  return clusters;
};

/**
 * Calcular distancia entre dos coordenadas en grados
 */
const calculateDistance = (coord1: Coordenada, coord2: Coordenada): number => {
  const dLat = Math.abs(coord1.latitude - coord2.latitude);
  const dLng = Math.abs(coord1.longitude - coord2.longitude);
  return Math.sqrt(dLat * dLat + dLng * dLng);
};

/**
 * Calcular el centroide de un conjunto de coordenadas
 */
const calculateCentroid = (coordinates: Coordenada[]): Coordenada => {
  if (coordinates.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  const totalLat = coordinates.reduce((sum, coord) => sum + coord.latitude, 0);
  const totalLng = coordinates.reduce((sum, coord) => sum + coord.longitude, 0);

  return {
    latitude: totalLat / coordinates.length,
    longitude: totalLng / coordinates.length,
  };
};

/**
 * Hook para manejar clustering automático
 */
export const useMapClustering = (
  reports: Reporte[],
  region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number },
  mapDimensions: { width: number; height: number }
) => {
  const [clusters, setClusters] = React.useState<Array<{
    coordinate: Coordenada;
    reports: Reporte[];
    count: number;
  }>>([]);

  const prevRegionRef = React.useRef(region);
  const prevReportsRef = React.useRef(reports);

  React.useEffect(() => {
    // Solo recalcular si hay cambios significativos
    const regionChanged = 
      Math.abs(prevRegionRef.current.latitude - region.latitude) > 0.001 ||
      Math.abs(prevRegionRef.current.longitude - region.longitude) > 0.001 ||
      Math.abs(prevRegionRef.current.latitudeDelta - region.latitudeDelta) > 0.001;
    
    const reportsChanged = prevReportsRef.current.length !== reports.length ||
      !prevReportsRef.current.every((report, index) => report.id === reports[index]?.id);

    if (regionChanged || reportsChanged) {
      // Calcular el nivel de zoom aproximado basado en latitudeDelta
      const zoom = Math.log2(360 / region.latitudeDelta);
      
      const newClusters = clusterReports(reports, zoom, mapDimensions);
      setClusters(newClusters);

      prevRegionRef.current = region;
      prevReportsRef.current = reports;
    }
  }, [reports, region, mapDimensions]);

  return clusters;
};

const styles = StyleSheet.create({
  clusterContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clusterIcon: {
    position: 'absolute',
    top: 2,
  },
  clusterText: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default ClusterMarker;
