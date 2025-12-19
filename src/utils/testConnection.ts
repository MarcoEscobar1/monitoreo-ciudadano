/**
 * Utilidad para probar la conexión con el backend
 */

import { Platform } from 'react-native';
import * as Device from 'expo-device';

export const testBackendConnection = async (baseUrl: string): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  console.log('🧪 Iniciando prueba de conexión...');
  console.log('📱 Platform:', Platform.OS);
  console.log('📱 Es dispositivo físico:', Device.isDevice);
  console.log('🌐 URL a probar:', baseUrl);

  try {
    // Detectar si es emulador Android
    const isAndroidEmulator = Platform.OS === 'android' && !Device.isDevice;
    
    if (isAndroidEmulator) {
      console.log('⚠️ Emulador Android detectado');
      console.log('💡 Usa 10.0.2.2 para conectar al host local');
      
      // Si la URL tiene 192.168.x.x o localhost, sugerir cambio
      if (baseUrl.includes('192.168') || baseUrl.includes('localhost')) {
        const suggestedUrl = baseUrl.replace(/192\.168\.\d+\.\d+/, '10.0.2.2').replace('localhost', '10.0.2.2');
        console.log('💡 URL sugerida para emulador:', suggestedUrl);
      }
    }

    // Probar health check
    const healthUrl = `${baseUrl}/health`;
    console.log('🔍 Probando health check:', healthUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('📥 Respuesta recibida:', response.status);

    if (!response.ok) {
      return {
        success: false,
        message: `Servidor respondió con status ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText,
        },
      };
    }

    const data = await response.json();
    console.log('✅ Health check exitoso:', data);

    return {
      success: true,
      message: 'Conexión exitosa con el backend',
      details: data,
    };
  } catch (error) {
    console.error('❌ Error en prueba de conexión:', error);

    let message = 'Error desconocido';
    let details: any = {};

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        message = 'Timeout: El servidor no respondió en 5 segundos';
        details.timeout = true;
      } else if (error.message.includes('Network request failed')) {
        message = 'No se pudo conectar al servidor';
        details.networkError = true;
        
        if (Platform.OS === 'android' && !Device.isDevice) {
          message += '\n\n💡 Estás en emulador Android. Asegúrate de:\n' +
                    '1. El backend esté corriendo (npm start en /backend)\n' +
                    '2. Usar 10.0.2.2 en lugar de localhost o 192.168.x.x\n' +
                    '3. El backend escuche en 0.0.0.0 (no solo localhost)';
        } else {
          message += '\n\n💡 Asegúrate de:\n' +
                    '1. El backend esté corriendo\n' +
                    '2. Tu dispositivo esté en la misma red WiFi\n' +
                    '3. El firewall no esté bloqueando el puerto 3001';
        }
      } else {
        message = error.message;
      }
      details.errorType = error.name;
      details.errorMessage = error.message;
    }

    return {
      success: false,
      message,
      details,
    };
  }
};

/**
 * Probar múltiples URLs de conexión
 */
export const testMultipleUrls = async (urls: string[]): Promise<{
  workingUrl: string | null;
  results: Array<{ url: string; success: boolean; message: string }>;
}> => {
  console.log('🧪 Probando múltiples URLs...');
  
  const results = [];
  let workingUrl = null;

  for (const url of urls) {
    const result = await testBackendConnection(url);
    results.push({
      url,
      success: result.success,
      message: result.message,
    });

    if (result.success && !workingUrl) {
      workingUrl = url;
      console.log('✅ URL funcionando encontrada:', url);
      break; // Si encontramos una URL que funciona, no probar más
    }
  }

  return { workingUrl, results };
};
