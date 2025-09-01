import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface MapFallbackProps {
  onRetry?: () => void;
  showRetry?: boolean;
}

const MapFallback: React.FC<MapFallbackProps> = ({
  onRetry,
  showRetry = true,
}) => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <MaterialIcons
            name="map"
            size={64}
            color={COLORS.textSecondary}
            style={styles.icon}
          />
          <Text style={styles.title}>Mapa no disponible</Text>
          <Text style={styles.subtitle}>
            El mapa no se puede cargar en este momento.
          </Text>
          <Text style={styles.description}>
            Posibles causas:
            {'\n'}• API Key de Google Maps no configurada
            {'\n'}• Problemas de conexión a internet
            {'\n'}• Configuración incorrecta del proveedor de mapas
          </Text>
          {showRetry && onRetry && (
            <Button
              mode="contained"
              onPress={onRetry}
              style={styles.retryButton}
              icon="refresh"
            >
              Intentar de nuevo
            </Button>
          )}
          <Text style={styles.help}>
            Consulta la documentación en docs/GOOGLE_MAPS_CONFIG.md
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    elevation: 4,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textAlign: 'left',
    lineHeight: 20,
  },
  retryButton: {
    marginBottom: 16,
  },
  help: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default MapFallback;
