# 🗺️ Configuración de Google Maps API

## Problema: Mapa aparece en blanco

Si el mapa aparece en blanco, es porque necesitas configurar la API Key de Google Maps.

## Solución Rápida (Para Desarrollo)

### 1. Obtener API Key de Google Maps

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las siguientes APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Maps JavaScript API
   - Geocoding API

4. Ve a "Credenciales" → "Crear credenciales" → "Clave de API"
5. Copia la API Key generada

### 2. Configurar en el proyecto

Edita el archivo `.env`:
```env
GOOGLE_MAPS_API_KEY=tu_api_key_real_aqui
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_real_aqui
```

### 3. Reiniciar el servidor

```bash
# Detener el servidor actual (Ctrl+C)
# Luego ejecutar:
npx expo start --tunnel --clear
```

## Solución Temporal (Mapa Básico)

Si no puedes obtener la API Key inmediatamente, el mapa usará el proveedor por defecto que debería mostrar un mapa básico.

## Verificar Configuración

1. **Permisos de ubicación**: ✅ Ya configurados
2. **Dependencias**: ✅ Ya instaladas
3. **API Key**: ❌ Necesita configuración real

## Estados del Mapa

- **Mapa en blanco**: Falta API Key o API Key inválida
- **Mapa básico sin estilo**: Usando proveedor por defecto
- **Mapa completo de Google**: API Key configurada correctamente

## Comandos Útiles

```bash
# Limpiar caché de Expo
npx expo start --clear

# Verificar variables de entorno
npx expo config

# Ver logs detallados
npx expo start --tunnel --max-workers 1
```

## Próximos Pasos

1. Obtener API Key real de Google Maps
2. Configurar restricciones de API Key por dominio/package
3. Habilitar APIs adicionales según sea necesario
4. Configurar facturación en Google Cloud (requerido para producción)

---

**Nota**: En desarrollo con Expo Go, el mapa debería funcionar con el proveedor por defecto, pero para la mejor experiencia necesitas la API Key de Google Maps.
