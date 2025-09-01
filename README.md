# 🏛️ Monitoreo Ciudadano - Aplicación Completa

[![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-53.0-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://postgresql.org/)

Una aplicación móvil completa de **React Native** para reportar y gestionar problemas ciudadanos, con backend integrado, mapas interactivos, sistema de autenticación y interfaz moderna.
![Imagen de WhatsApp 2025-09-01 a las 07 41 51_74641588](https://github.com/user-attachments/assets/4aa4e6a6-8f00-4cd1-b0ab-7436906c5ecf)


## 🎯 Características Principales

### 📱 **Aplicación Móvil**
- ✅ **Autenticación completa** (Google OAuth + Email/Password)
- ✅ **Reportes ciudadanos** con formulario dinámico y validaciones
- ✅ **Mapas interactivos** con OpenStreetMap y clustering inteligente
- ✅ **Captura de imágenes** con optimización automática
- ✅ **Geolocalización precisa** con selector de ubicación modal
- ✅ **Sistema de categorías** con emojis automáticos
- ✅ **Filtros avanzados** por categoría, estado y prioridad
- ✅ **UI moderna** con Material Design 3 y paleta de colores neutral
- ✅ **Notificaciones** y estados de reportes en tiempo real

### 🖥️ **Backend API REST**
- ✅ **Servidor Express.js** con arquitectura modular
- ✅ **Base de datos PostgreSQL** con esquema optimizado
- ✅ **Autenticación JWT** y middleware de seguridad
- ✅ **API completa** para usuarios, reportes, categorías y zonas
- ✅ **Upload de imágenes** con validación y compresión
- ✅ **Triggers automáticos** para auditoría y notificaciones

### 🗺️ **Sistema de Mapas**
- ✅ **OpenStreetMap** como proveedor principal
- ✅ **Clustering inteligente** de reportes por proximidad
- ✅ **Marcadores interactivos** con información detallada
- ✅ **Selector de ubicación** con modal y búsqueda
- ✅ **Filtros geográficos** y visualización por zonas

## 🚀 Instalación y Configuración

### **Prerrequisitos**

1. **Node.js 18+** y **npm**
   ```bash
   node --version  # Debe ser 18+
   npm --version
   ```

2. **PostgreSQL 16+**
   ```bash
   psql --version  # Instalar desde postgresql.org
   ```

3. **Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

4. **Git**
   ```bash
   git --version
   ```

### **1. Clonar y configurar el proyecto**

```bash
# Clonar repositorio
git clone https://github.com/MarcoEscobar1/monitoreo-ciudadano.git
cd monitoreo-ciudadano

# Instalar dependencias del frontend
npm install

# Instalar dependencias del backend
cd backend
npm install
cd ..
```

### **2. Configurar Base de Datos**

```bash
# Crear base de datos
createdb monitoreo_ciudadano

# Ejecutar scripts de base de datos en orden
psql -d monitoreo_ciudadano -f database/01_init_extensions.sql
psql -d monitoreo_ciudadano -f database/02_create_tables.sql
psql -d monitoreo_ciudadano -f database/03_secondary_tables.sql
psql -d monitoreo_ciudadano -f database/04_functions_procedures.sql
psql -d monitoreo_ciudadano -f database/05_triggers_automation.sql
psql -d monitoreo_ciudadano -f database/06_test_data.sql
```

### **3. Configurar Variables de Entorno**

**Frontend (.env)**
```env
# Copia de .env.example
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_GOOGLE_CLIENT_ID=tu_google_client_id
```

**Backend (backend/.env)**
```env
# Configuración de base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=monitoreo_ciudadano
DB_USER=tu_usuario
DB_PASSWORD=tu_password

# Configuración JWT
JWT_SECRET=tu_jwt_secret_muy_seguro

# Configuración del servidor
PORT=3000
NODE_ENV=development
```

### **4. Ejecutar la Aplicación**

**Terminal 1 - Backend:**
```bash
# Desde la raíz del proyecto
.\start-backend.bat
# O manualmente:
# cd backend && node server.js
```

**Terminal 2 - Frontend:**
```bash
# Desde la raíz del proyecto
npm start
# O: expo start --clear
```

## 📱 Cómo Usar la Aplicación

### **1. Autenticación**
- **Registro** con email y contraseña
- **Login** con Google OAuth o credenciales
- **Recuperación** de contraseña por email

### **2. Crear Reportes**
1. Ir a la tab **"Reportar"**
2. Llenar **título y descripción** del problema
3. Seleccionar **categoría** (Infraestructura, Seguridad, etc.)
4. Elegir **nivel de prioridad** (Baja, Media, Alta)
5. **Capturar foto** (opcional)
6. **Obtener ubicación** automática o seleccionar en mapa
7. **Enviar reporte**

### **3. Ver Reportes en Mapa**
1. Ir a la tab **"Mapa"**
2. Ver todos los reportes como **marcadores**
3. Usar **filtros** por categoría y estado
4. **Cluster automático** agrupa reportes cercanos
5. **Tocar marcador** para ver detalles

### **4. Gestionar Reportes**
- Ver **mis reportes** en el perfil
- **Seguimiento** de estados (Nuevo → En Revisión → En Progreso → Resuelto)
- **Estadísticas** personales de reportes creados

## 🎨 Funcionalidades Implementadas

### ✅ **AUTENTICACIÓN Y USUARIOS**
- Registro con validación de email
- Login con Google OAuth 2.0
- Gestión de sesiones con JWT
- Perfil de usuario editable
- Recuperación de contraseña

### ✅ **SISTEMA DE REPORTES**
- Formulario dinámico con validaciones
- 6+ categorías predefinidas con emojis
- Niveles de prioridad (Baja/Media/Alta)
- Estados de seguimiento automático
- Upload de imágenes optimizadas
- Geolocalización precisa

### ✅ **MAPAS INTERACTIVOS**
- Integración con OpenStreetMap
- Clustering inteligente de reportes
- Filtros por categoría y estado
- Selector de ubicación modal
- Marcadores personalizados
- Zoom y navegación fluida

### ✅ **INTERFAZ MODERNA**
- Material Design 3 actualizado
- Paleta de colores neutral profesional
- Animaciones fluidas con Reanimated
- Componentes reutilizables
- Responsive design
- Modo oscuro preparado

### ✅ **BACKEND ROBUSTO**
- API REST completa y documentada
- Autenticación segura con JWT
- Validación de datos en servidor
- Manejo de errores centralizado
- Logs de auditoría automáticos
- Optimización de consultas SQL
