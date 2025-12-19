# Diagnóstico de Conexión - Monitoreo Ciudadano

## Estado Actual ✅

### Backend
- ✅ **Puerto**: 3001
- ✅ **IP**: 192.168.100.60
- ✅ **URL API**: http://192.168.100.60:3001/api
- ✅ **Estado**: Funcionando correctamente
- ✅ **Base de datos**: Conectada a `monitoreo_ciudadano`
- ✅ **Tablas**: 12 tablas creadas correctamente
  - usuarios
  - reportes
  - categorias_problemas
  - zonas_geograficas
  - y más...

### Frontend (Expo)
- ✅ **IP Expo Metro**: 192.168.100.60:8081
- ✅ **Variable de entorno**: EXPO_PUBLIC_API_URL=http://192.168.100.60:3001/api
- ❌ **Problema**: No puede conectar con el backend ("Network request failed")

## Posibles Causas del Error "Network request failed"

### 1. Emulador Android no puede acceder a red local
El emulador Android tiene limitaciones para acceder a la red local de la máquina host.

**Soluciones**:
- **Usar dispositivo físico**: Conectar un teléfono real en la misma red WiFi
- **Configurar emulador**: Usar IP especial del emulador

### 2. Firewall de Windows bloqueando conexiones
El firewall puede estar bloqueando las conexiones entrantes al puerto 3001.

**Solución**:
```powershell
# Permitir tráfico en puerto 3001
New-NetFirewallRule -DisplayName "Node Backend 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

### 3. Problema con CORS (Ya está configurado)
El backend ya tiene CORS configurado correctamente para todas las IPs necesarias.

## Pasos para Solucionar

### Opción 1: Usar Dispositivo Físico (RECOMENDADO)
1. Conectar tu teléfono Android a la misma red WiFi que tu PC
2. En Expo, escanear el código QR con la app Expo Go
3. La aplicación debería conectarse automáticamente

### Opción 2: Configurar Emulador Android
Para emulador Android, usar `10.0.2.2` en lugar de `192.168.100.60`:

1. Cambiar en `.env`:
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001/api
```

2. Reiniciar Expo con caché limpio:
```bash
npx expo start -c
```

### Opción 3: Agregar Regla de Firewall
```powershell
New-NetFirewallRule -DisplayName "Node Backend 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

## Verificar Conexión Manualmente

### Desde PowerShell en tu PC:
```powershell
curl -UseBasicParsing http://192.168.100.60:3001/api/health
```

Respuesta esperada:
```json
{"status":"OK","timestamp":"...","database":"Conectada","version":"1.0.0"}
```

### Desde el navegador del emulador Android:
Abrir: `http://10.0.2.2:3001/api/health`

## Estado de los Servicios

### Backend Endpoints Verificados:
- ✅ `/api/health` - Funcionando
- ✅ `/api/categories` - Funcionando (devuelve 2528 bytes de categorías)
- ✅ `/api/auth/register` - Configurado (no probado aún)

## Configuración Actual

### Archivo `.env`:
```env
EXPO_PUBLIC_API_URL=http://192.168.100.60:3001/api
```

### Backend CORS:
```javascript
origin: [
  'http://localhost:19006',
  'exp://localhost:19000',
  'exp://localhost:8081',
  'http://localhost:3000',
  'http://192.168.100.60:8081',
  'http://192.168.100.60:19006',
  'exp://192.168.100.60:8081',
  'exp://192.168.100.60:19000'
]
```

## Próximos Pasos Recomendados

1. **INMEDIATO**: Probar con dispositivo físico Android
2. Si no funciona: Agregar regla de firewall
3. Si sigue sin funcionar: Usar `10.0.2.2` para emulador
4. Verificar que el backend no se esté cerrando

## Comandos Útiles

### Verificar si backend está corriendo:
```powershell
netstat -ano | findstr :3001
```

### Iniciar backend:
```powershell
cd backend
npm start
```

### Reiniciar Expo con caché limpio:
```powershell
npx expo start -c
```

### Ver logs del backend en tiempo real:
El backend ya muestra logs automáticamente en la consola.
