import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { testBackendConnection, testMultipleUrls } from '../utils/testConnection';
import { API_CONFIG } from '../constants';

export const ConnectionTestScreen: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testConnection = async () => {
    setTesting(true);
    setResults(null);

    try {
      // URL configurada
      const configuredUrl = process.env.EXPO_PUBLIC_API_URL || API_CONFIG.baseUrl;
      
      // URLs alternativas para probar
      const urlsToTest = [
        configuredUrl,
        'http://10.0.2.2:3001/api', // Emulador Android
        'http://192.168.100.60:3001/api', // IP local
        'http://localhost:3001/api', // Localhost
      ];

      console.log('🧪 Iniciando pruebas de conexión...');
      const testResults = await testMultipleUrls(urlsToTest);

      setResults({
        platform: Platform.OS,
        isDevice: Device.isDevice,
        configuredUrl,
        ...testResults,
      });
    } catch (error) {
      setResults({
        error: true,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Diagnóstico de Conexión</Text>
        <Text style={styles.subtitle}>Prueba la conexión con el backend</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Información del Dispositivo:</Text>
        <Text style={styles.infoText}>• Platform: {Platform.OS}</Text>
        <Text style={styles.infoText}>
          • Tipo: {Device.isDevice ? 'Dispositivo Físico' : 'Emulador/Simulador'}
        </Text>
        <Text style={styles.infoText}>
          • URL Configurada: {process.env.EXPO_PUBLIC_API_URL || API_CONFIG.baseUrl}
        </Text>
      </View>

      {Platform.OS === 'android' && !Device.isDevice && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Emulador Android Detectado</Text>
          <Text style={styles.warningText}>
            Para conectar con el backend en tu PC, debes usar la IP especial:
          </Text>
          <Text style={styles.warningCode}>10.0.2.2:3001</Text>
          <Text style={styles.warningText}>
            en lugar de localhost o 192.168.x.x
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={testConnection}
        disabled={testing}
      >
        {testing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Probar Conexión</Text>
        )}
      </TouchableOpacity>

      {results && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Resultados:</Text>
          
          {results.error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>❌ Error: {results.message}</Text>
            </View>
          ) : (
            <>
              {results.workingUrl ? (
                <View style={styles.successBox}>
                  <Text style={styles.successTitle}>✅ Conexión Exitosa</Text>
                  <Text style={styles.successText}>URL funcionando:</Text>
                  <Text style={styles.urlText}>{results.workingUrl}</Text>
                </View>
              ) : (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>
                    ❌ No se pudo conectar con ninguna URL
                  </Text>
                </View>
              )}

              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Detalles de las pruebas:</Text>
                {results.results?.map((result: any, index: number) => (
                  <View key={index} style={styles.resultItem}>
                    <Text style={result.success ? styles.successIcon : styles.errorIcon}>
                      {result.success ? '✅' : '❌'}
                    </Text>
                    <View style={styles.resultContent}>
                      <Text style={styles.resultUrl}>{result.url}</Text>
                      <Text style={styles.resultMessage}>{result.message}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      )}

      <View style={styles.instructionsSection}>
        <Text style={styles.instructionsTitle}>💡 Instrucciones:</Text>
        <Text style={styles.instructionsText}>
          1. Asegúrate de que el backend esté corriendo:{'\n'}
          {'   '}cd backend && npm start
        </Text>
        <Text style={styles.instructionsText}>
          2. El backend debe estar en el puerto 3001
        </Text>
        <Text style={styles.instructionsText}>
          3. Si usas emulador Android, debe usar 10.0.2.2
        </Text>
        <Text style={styles.instructionsText}>
          4. Si usas dispositivo físico, debe estar en la misma WiFi
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 5,
  },
  warningCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d39e00',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsSection: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  successBox: {
    backgroundColor: '#d4edda',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 5,
  },
  successText: {
    fontSize: 14,
    color: '#155724',
    marginBottom: 5,
  },
  urlText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#155724',
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorText: {
    fontSize: 14,
    color: '#721c24',
  },
  detailsSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultItem: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  successIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  resultContent: {
    flex: 1,
  },
  resultUrl: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  resultMessage: {
    fontSize: 12,
    color: '#666',
  },
  instructionsSection: {
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004085',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#004085',
    marginBottom: 10,
    lineHeight: 20,
  },
});
