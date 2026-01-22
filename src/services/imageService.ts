import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';

export interface ImageData {
  uri: string;
  filename: string;
  type: string;
  size: number;
  base64?: string;
}

export interface ImageUploadResult {
  success: boolean;
  imageUrl?: string;
  localUri?: string;
  error?: string;
}

class ImageService {
  private uploadDirectory = `${FileSystem.documentDirectory}uploads/`;

  constructor() {
    this.ensureUploadDirectory();
  }

  /**
   * Asegurar que el directorio de uploads existe
   */
  private async ensureUploadDirectory() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.uploadDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.uploadDirectory, { intermediates: true });
      }
    } catch (error) {
      console.error('Error creando directorio de uploads:', error);
    }
  }

  /**
   * Solicitar permisos para cámara e imágenes
   */
  async requestPermissions(): Promise<{
    camera: boolean;
    mediaLibrary: boolean;
  }> {
    try {
      const [cameraResult, mediaResult] = await Promise.all([
        ImagePicker.requestCameraPermissionsAsync(),
        MediaLibrary.requestPermissionsAsync(),
      ]);

      return {
        camera: cameraResult.status === 'granted',
        mediaLibrary: mediaResult.status === 'granted',
      };
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return { camera: false, mediaLibrary: false };
    }
  }

  /**
   * Verificar permisos actuales
   */
  async checkPermissions(): Promise<{
    camera: boolean;
    mediaLibrary: boolean;
  }> {
    try {
      const [cameraStatus, mediaStatus] = await Promise.all([
        ImagePicker.getCameraPermissionsAsync(),
        MediaLibrary.getPermissionsAsync(),
      ]);

      return {
        camera: cameraStatus.status === 'granted',
        mediaLibrary: mediaStatus.status === 'granted',
      };
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return { camera: false, mediaLibrary: false };
    }
  }

  /**
   * Capturar foto con la cámara
   */
  async capturePhoto(options?: {
    quality?: number;
    base64?: boolean;
    maxWidth?: number;
    maxHeight?: number;
  }): Promise<ImageData | null> {
    try {
      const permissions = await this.checkPermissions();
      
      if (!permissions.camera) {
        const requestResult = await this.requestPermissions();
        if (!requestResult.camera) {
          Alert.alert(
            'Permisos Requeridos',
            'Para tomar fotos, necesitamos acceso a tu cámara.',
            [{ text: 'OK' }]
          );
          return null;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: options?.quality || 0.8,
        base64: options?.base64 || false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      
      return {
        uri: asset.uri,
        filename: asset.fileName || `photo_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
        size: asset.fileSize || 0,
        base64: asset.base64 || undefined,
      };
    } catch (error) {
      console.error('Error capturando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto. Inténtalo de nuevo.');
      return null;
    }
  }

  /**
   * Seleccionar imagen de la galería
   */
  async selectFromGallery(options?: {
    quality?: number;
    base64?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    allowsMultipleSelection?: boolean;
  }): Promise<ImageData[] | null> {
    try {
      const permissions = await this.checkPermissions();
      
      if (!permissions.mediaLibrary) {
        const requestResult = await this.requestPermissions();
        if (!requestResult.mediaLibrary) {
          Alert.alert(
            'Permisos Requeridos',
            'Para seleccionar fotos, necesitamos acceso a tu galería.',
            [{ text: 'OK' }]
          );
          return null;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: !options?.allowsMultipleSelection,
        aspect: [4, 3],
        quality: options?.quality || 0.8,
        base64: options?.base64 || false,
        allowsMultipleSelection: options?.allowsMultipleSelection || false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      return result.assets.map(asset => ({
        uri: asset.uri,
        filename: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
        size: asset.fileSize || 0,
        base64: asset.base64 || undefined,
      }));
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen. Inténtalo de nuevo.');
      return null;
    }
  }

  /**
   * Mostrar opciones para seleccionar origen de imagen
   */
  async showImagePicker(options?: {
    quality?: number;
    base64?: boolean;
    maxWidth?: number;
    maxHeight?: number;
  }): Promise<ImageData | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Seleccionar Imagen',
        'Elige una opción para agregar una imagen',
        [
          {
            text: 'Cámara',
            onPress: async () => {
              const result = await this.capturePhoto(options);
              resolve(result);
            },
          },
          {
            text: 'Galería',
            onPress: async () => {
              const results = await this.selectFromGallery(options);
              resolve(results ? results[0] : null);
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    });
  }

  /**
   * Guardar imagen localmente
   */
  async saveImageLocally(imageData: ImageData): Promise<string | null> {
    try {
      await this.ensureUploadDirectory();
      
      const filename = `${Date.now()}_${imageData.filename}`;
      const localUri = `${this.uploadDirectory}${filename}`;
      
      // Copiar imagen al directorio local
      await FileSystem.copyAsync({
        from: imageData.uri,
        to: localUri,
      });

      return localUri;
    } catch (error) {
      console.error('Error guardando imagen localmente:', error);
      return null;
    }
  }

  /**
   * Redimensionar imagen si es necesario
   */
  async resizeImage(
    uri: string,
    maxWidth: number = 1024,
    maxHeight: number = 1024,
    quality: number = 0.8
  ): Promise<string | null> {
    try {
      // En una implementación real, aquí usarías una librería como expo-image-manipulator
      // Por ahora, retornamos la URI original
      return uri;
    } catch (error) {
      console.error('Error redimensionando imagen:', error);
      return null;
    }
  }

  /**
   * Obtener información de una imagen
   */
  async getImageInfo(uri: string): Promise<{
    width: number;
    height: number;
    size: number;
  } | null> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      
      if (!info.exists) {
        return null;
      }

      // En una implementación real, obtendrías las dimensiones
      // Por ahora, retornamos valores por defecto
      return {
        width: 1024,
        height: 768,
        size: info.size || 0,
      };
    } catch (error) {
      console.error('Error obteniendo info de imagen:', error);
      return null;
    }
  }

  /**
   * Simular upload a servidor (en una implementación real conectarías con tu API)
   */
  async uploadImage(imageData: ImageData): Promise<ImageUploadResult> {
    try {
      // Guardar localmente primero
      const localUri = await this.saveImageLocally(imageData);
      
      if (!localUri) {
        return {
          success: false,
          error: 'No se pudo guardar la imagen localmente',
        };
      }

      // Simular delay de upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      // En una implementación real, aquí harías el POST a tu API
      const mockImageUrl = `https://api.monitoreo-ciudadano.com/images/${imageData.filename}`;

      return {
        success: true,
        imageUrl: mockImageUrl,
        localUri: localUri,
      };
    } catch (error) {
      console.error('Error en upload de imagen:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Eliminar imagen local
   */
  async deleteLocalImage(uri: string): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      
      if (info.exists) {
        await FileSystem.deleteAsync(uri);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error eliminando imagen local:', error);
      return false;
    }
  }

  /**
   * Limpiar imágenes temporales
   */
  async cleanupTempImages(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.uploadDirectory);
      
      if (dirInfo.exists && dirInfo.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(this.uploadDirectory);
        
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        
        for (const file of files) {
          const filePath = `${this.uploadDirectory}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          if (fileInfo.exists && fileInfo.modificationTime) {
            const fileAge = now - fileInfo.modificationTime * 1000;
            
            if (fileAge > maxAge) {
              await FileSystem.deleteAsync(filePath);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error limpiando imágenes temporales:', error);
    }
  }
}

// Exportar instancia singleton
export const imageService = new ImageService();
export default imageService;
