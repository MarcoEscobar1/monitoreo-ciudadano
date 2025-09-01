/**
 * Servicio de geocodificación gratuito usando Nominatim (OpenStreetMap)
 * No requiere API Key ni tarjeta de crédito
 */

import { Coordenada, UbicacionCompleta } from '../types';

// Base URL para el servicio de Nominatim
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Headers requeridos por Nominatim
const HEADERS = {
  'User-Agent': 'MonitoreoCiudadano/1.0 (tu-email@ejemplo.com)', // Cambiar por tu email real
  'Accept': 'application/json',
};

/**
 * Geocodificación inversa: Coordenadas → Dirección
 */
export const reverseGeocode = async (coordinates: Coordenada): Promise<UbicacionCompleta | null> => {
  try {
    const { latitude, longitude } = coordinates;
    
    const url = `${NOMINATIM_BASE_URL}/reverse?` +
      `format=json&` +
      `lat=${latitude}&` +
      `lon=${longitude}&` +
      `zoom=18&` +
      `addressdetails=1&` +
      `accept-language=es`;

    console.log('🌍 Geocodificación inversa:', url);

    const response = await fetch(url, { headers: HEADERS });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || data.error) {
      console.warn('⚠️ No se encontró información de ubicación:', data?.error);
      return {
        latitude,
        longitude,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      };
    }

    // Extraer información de la respuesta
    const address = data.address || {};
    
    const ubicacion: UbicacionCompleta = {
      latitude,
      longitude,
      address: data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      city: address.city || address.town || address.village || address.municipality,
      region: address.state || address.province || address.region,
      country: address.country || 'Colombia',
      postalCode: address.postcode,
    };

    console.log('✅ Geocodificación exitosa:', ubicacion);
    return ubicacion;

  } catch (error) {
    console.error('❌ Error en geocodificación inversa:', error);
    return {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      address: `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`,
    };
  }
};

/**
 * Geocodificación directa: Dirección → Coordenadas
 */
export const geocode = async (address: string): Promise<Coordenada[]> => {
  try {
    const url = `${NOMINATIM_BASE_URL}/search?` +
      `format=json&` +
      `q=${encodeURIComponent(address)}&` +
      `limit=5&` +
      `addressdetails=1&` +
      `accept-language=es&` +
      `countrycodes=co`; // Limitar a Colombia

    console.log('🔍 Búsqueda de geocodificación:', url);

    const response = await fetch(url, { headers: HEADERS });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('⚠️ No se encontraron resultados para:', address);
      return [];
    }

    const coordenadas = data.map(item => ({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));

    console.log('✅ Geocodificación exitosa:', coordenadas);
    return coordenadas;

  } catch (error) {
    console.error('❌ Error en geocodificación:', error);
    return [];
  }
};

/**
 * Buscar lugares por nombre
 */
export const searchPlaces = async (query: string, coordinates?: Coordenada): Promise<UbicacionCompleta[]> => {
  try {
    let url = `${NOMINATIM_BASE_URL}/search?` +
      `format=json&` +
      `q=${encodeURIComponent(query)}&` +
      `limit=10&` +
      `addressdetails=1&` +
      `accept-language=es&` +
      `countrycodes=co`;

    // Si se proporcionan coordenadas, buscar cerca de esa ubicación
    if (coordinates) {
      url += `&lat=${coordinates.latitude}&lon=${coordinates.longitude}&radius=50000`; // 50km radius
    }

    console.log('🔍 Búsqueda de lugares:', url);

    const response = await fetch(url, { headers: HEADERS });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('⚠️ No se encontraron lugares para:', query);
      return [];
    }

    const lugares = data.map(item => {
      const address = item.address || {};
      return {
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        address: item.display_name,
        city: address.city || address.town || address.village,
        region: address.state || address.province,
        country: address.country || 'Colombia',
        postalCode: address.postcode,
      };
    });

    console.log('✅ Búsqueda exitosa:', lugares);
    return lugares;

  } catch (error) {
    console.error('❌ Error en búsqueda de lugares:', error);
    return [];
  }
};

/**
 * Obtener información detallada de un lugar por OSM ID
 */
export const getPlaceDetails = async (osmId: string, osmType: 'node' | 'way' | 'relation'): Promise<UbicacionCompleta | null> => {
  try {
    const url = `${NOMINATIM_BASE_URL}/lookup?` +
      `format=json&` +
      `osm_ids=${osmType[0].toUpperCase()}${osmId}&` +
      `addressdetails=1&` +
      `accept-language=es`;

    console.log('📍 Detalles de lugar:', url);

    const response = await fetch(url, { headers: HEADERS });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('⚠️ No se encontraron detalles para OSM ID:', osmId);
      return null;
    }

    const item = data[0];
    const address = item.address || {};
    
    const lugar: UbicacionCompleta = {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      address: item.display_name,
      city: address.city || address.town || address.village,
      region: address.state || address.province,
      country: address.country || 'Colombia',
      postalCode: address.postcode,
    };

    console.log('✅ Detalles obtenidos:', lugar);
    return lugar;

  } catch (error) {
    console.error('❌ Error obteniendo detalles del lugar:', error);
    return null;
  }
};

export const OpenStreetMapService = {
  reverseGeocode,
  geocode,
  searchPlaces,
  getPlaceDetails,
};
