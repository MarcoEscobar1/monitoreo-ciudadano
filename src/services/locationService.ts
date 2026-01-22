import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { Coordenada, UbicacionCompleta } from '../types';
import { OpenStreetMapService } from './openStreetMapService';

export interface LocationPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

export interface LocationService {
  requestPermissions: () => Promise<LocationPermissionResult>;
  getCurrentLocation: (options?: LocationOptions) => Promise<UbicacionCompleta | null>;
  watchLocation: (callback: (location: UbicacionCompleta) => void, options?: LocationOptions) => Promise<Location.LocationSubscription | null>;
  reverseGeocode: (coordinate: Coordenada) => Promise<UbicacionCompleta | null>;
  geocode: (address: string) => Promise<Coordenada | null>;
  calculateDistance: (from: Coordenada, to: Coordenada) => number;
  isLocationInRadius: (center: Coordenada, target: Coordenada, radiusKm: number) => boolean;
}

export interface LocationOptions {
  accuracy?: Location.Accuracy;
  timeout?: number;
  maximumAge?: number;
  showDialog?: boolean;
}

class LocationServiceImpl implements LocationService {
  private hasPermissions = false;
  private lastKnownLocation: UbicacionCompleta | null = null;

  /**
   * Solicitar permisos de ubicación
   */
  async requestPermissions(): Promise<LocationPermissionResult> {
    try {
      // Verificar si los servicios de ubicación están habilitados
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        Alert.alert(
          'Servicios de Ubicación Deshabilitados',
          'Por favor, habilita los servicios de ubicación en la configuración de tu dispositivo.',
          [{ text: 'OK' }]
        );
        return {
          granted: false,
          canAskAgain: false,
          status: Location.PermissionStatus.DENIED
        };
      }

      // Solicitar permisos de ubicación
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      this.hasPermissions = status === Location.PermissionStatus.GRANTED;

      if (!this.hasPermissions && canAskAgain) {
        Alert.alert(
          'Permisos de Ubicación',
          'Esta aplicación necesita acceso a tu ubicación para mostrarte reportes cercanos y permitirte crear reportes geolocalizados.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Permitir', onPress: () => this.requestPermissions() }
          ]
        );
      }

      return {
        granted: this.hasPermissions,
        canAskAgain,
        status
      };
    } catch (error) {
      console.error('Error solicitando permisos de ubicación:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.DENIED
      };
    }
  }

  /**
   * Obtener ubicación actual
   */
  async getCurrentLocation(options: LocationOptions = {}): Promise<UbicacionCompleta | null> {
    try {
      if (!this.hasPermissions) {
        const permissionResult = await this.requestPermissions();
        if (!permissionResult.granted) {
          if (options.showDialog) {
            Alert.alert(
              'Ubicación No Disponible',
              'No se puede obtener la ubicación. Verifica que hayas otorgado permisos de ubicación.'
            );
          }
          return null;
        }
      }

      const locationOptions: Location.LocationOptions = {
        accuracy: options.accuracy || Location.Accuracy.Balanced,
        maximumAge: options.maximumAge || 10000,
      };

      const location = await Location.getCurrentPositionAsync(locationOptions);
      
      const ubicacionCompleta: UbicacionCompleta = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Intentar geocodificación inversa para obtener la dirección
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addresses.length > 0) {
          const address = addresses[0];
          ubicacionCompleta.address = this.formatAddress(address);
          ubicacionCompleta.city = address.city || address.subregion || undefined;
          ubicacionCompleta.region = address.region || undefined;
          ubicacionCompleta.country = address.country || undefined;
          ubicacionCompleta.postalCode = address.postalCode || undefined;
        }
      } catch (geocodeError) {
        // Geocodificación falló silenciosamente
      }

      this.lastKnownLocation = ubicacionCompleta;
      return ubicacionCompleta;

    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      
      // Intentar obtener la última ubicación conocida del sistema
      try {
        const lastLocation = await Location.getLastKnownPositionAsync({
          maxAge: 300000, // Aceptar ubicaciones de hasta 5 minutos
          requiredAccuracy: 1000, // Aceptar precisión de hasta 1km
        });
        
        if (lastLocation) {
          const ubicacionCompleta: UbicacionCompleta = {
            latitude: lastLocation.coords.latitude,
            longitude: lastLocation.coords.longitude,
          };
          this.lastKnownLocation = ubicacionCompleta;
          return ubicacionCompleta;
        }
      } catch (lastLocError) {
        // No hay última ubicación conocida disponible
      }
      
      if (options.showDialog) {
        Alert.alert(
          'Ubicación No Disponible',
          'No se pudo obtener tu ubicación actual. Por favor:\n\n1. Verifica que el GPS esté activado\n2. Asegúrate de estar al aire libre o cerca de una ventana\n3. Intenta nuevamente en unos segundos',
          [{ text: 'Entendido' }]
        );
      }
      
      return this.lastKnownLocation;
    }
  }

  /**
   * Monitorear cambios de ubicación
   */
  async watchLocation(
    callback: (location: UbicacionCompleta) => void,
    options: LocationOptions = {}
  ): Promise<Location.LocationSubscription | null> {
    try {
      if (!this.hasPermissions) {
        const permissionResult = await this.requestPermissions();
        if (!permissionResult.granted) {
          return null;
        }
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: options.accuracy || Location.Accuracy.Balanced,
          timeInterval: options.timeout || 5000,
          distanceInterval: 10, // Actualizar cada 10 metros
        },
        (location) => {
          const ubicacionCompleta: UbicacionCompleta = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          callback(ubicacionCompleta);
        }
      );

      return subscription;
    } catch (error) {
      console.error('Error monitoreando ubicación:', error);
      return null;
    }
  }

  /**
   * Geocodificación inversa usando OpenStreetMap (gratuito)
   */
  async reverseGeocode(coordinate: Coordenada): Promise<UbicacionCompleta | null> {
    try {
      const result = await OpenStreetMapService.reverseGeocode(coordinate);
      return result;
    } catch (error) {
      console.error('Error en geocodificacion inversa:', error);
      return {
        ...coordinate,
        address: `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`,
      };
    }
  }

  /**
   * Geocodificación usando OpenStreetMap (gratuito)
   */
  async geocode(address: string): Promise<Coordenada | null> {
    try {
      const results = await OpenStreetMapService.geocode(address);
      
      if (results.length > 0) {
        return results[0]; // Retornar el primer resultado
      }

      return null;
    } catch (error) {
      console.error('Error en geocodificacion:', error);
      return null;
    }
  }

  /**
   * Calcular distancia entre dos puntos (en km)
   */
  calculateDistance(from: Coordenada, to: Coordenada): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.degToRad(to.latitude - from.latitude);
    const dLng = this.degToRad(to.longitude - from.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.degToRad(from.latitude)) * Math.cos(this.degToRad(to.latitude)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Verificar si una ubicación está dentro de un radio específico
   */
  isLocationInRadius(center: Coordenada, target: Coordenada, radiusKm: number): boolean {
    const distance = this.calculateDistance(center, target);
    return distance <= radiusKm;
  }

  /**
   * Formatear dirección legible
   */
  private formatAddress(address: Location.LocationGeocodedAddress): string {
    const components = [
      address.name,
      address.street,
      address.streetNumber,
      address.district,
      address.city || address.subregion,
      address.region
    ].filter(Boolean);

    return components.join(', ');
  }

  /**
   * Convertir grados a radianes
   */
  private degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Obtener última ubicación conocida
   */
  getLastKnownLocation(): UbicacionCompleta | null {
    return this.lastKnownLocation;
  }

  /**
   * Verificar si hay permisos concedidos (síncrono, puede estar desactualizado)
   */
  hasLocationPermissions(): boolean {
    return this.hasPermissions;
  }

  /**
   * Verificar permisos de ubicación de manera asíncrona (más preciso)
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      this.hasPermissions = status === Location.PermissionStatus.GRANTED;
      return this.hasPermissions;
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return false;
    }
  }
}

// Instancia singleton del servicio
export const locationService = new LocationServiceImpl();

// Hook personalizado para usar el servicio de ubicación en componentes
export const useLocation = () => {
  return {
    requestPermissions: locationService.requestPermissions.bind(locationService),
    getCurrentLocation: locationService.getCurrentLocation.bind(locationService),
    watchLocation: locationService.watchLocation.bind(locationService),
    reverseGeocode: locationService.reverseGeocode.bind(locationService),
    geocode: locationService.geocode.bind(locationService),
    calculateDistance: locationService.calculateDistance.bind(locationService),
    isLocationInRadius: locationService.isLocationInRadius.bind(locationService),
    getLastKnownLocation: locationService.getLastKnownLocation.bind(locationService),
    hasLocationPermissions: locationService.hasLocationPermissions.bind(locationService),
    checkPermissions: locationService.checkPermissions.bind(locationService),
  };
};

export default locationService;
