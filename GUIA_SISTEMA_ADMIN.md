# Guía Rápida - Sistema de Administración Implementado

## ✅ Implementación Completada

Se ha implementado completamente el sistema de administración con las siguientes características:

### Características Principales

#### 1. **Validación de Reportes**
- ✅ Los administradores deben validar cada reporte antes de que aparezca en el mapa público
- ✅ Sistema de aprobación/rechazo con motivos
- ✅ Notificaciones automáticas a administradores cuando se crea un nuevo reporte
- ✅ Notificaciones a usuarios cuando su reporte es validado o rechazado

#### 2. **Panel de Administración**
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Gestión de usuarios (activar/desactivar, filtrar por tipo)
- ✅ Gestión de categorías (activar/desactivar, ver estadísticas)
- ✅ Reportes por categoría con gráficos y porcentajes
- ✅ Lista de reportes pendientes de validación

#### 3. **Navegación Diferenciada**
- ✅ Administradores ven panel administrativo
- ✅ Ciudadanos ven interfaz normal de usuario
- ✅ Detección automática basada en tipo de usuario

#### 4. **Sistema de Notificaciones**
- ✅ Triggers automáticos en base de datos
- ✅ Notificación a todos los admins cuando hay nuevo reporte
- ✅ Notificación al usuario cuando su reporte es validado/rechazado

## 🚀 Cómo Usar

### Para Iniciar la Aplicación

1. **Backend:**
   ```bash
   cd backend
   npm start
   ```
   El servidor estará en: `http://192.168.100.60:3001`

2. **Frontend (React Native):**
   ```bash
   npx expo start --clear
   ```

### Credenciales de Prueba

#### Administrador
- **Email:** `admin@monitoreo.gov.co`
- **Password:** `admin123`

#### Moderador
- **Email:** `moderador@monitoreo.gov.co`
- **Password:** `admin123`

#### Usuario Ciudadano
- Crear nueva cuenta desde la app
- O usar cualquier cuenta ciudadana existente

## 📱 Flujo de Uso

### Como Ciudadano:
1. Abrir la app
2. Iniciar sesión o registrarse
3. Crear un reporte con foto, ubicación y descripción
4. El reporte queda en estado **PENDIENTE**
5. Esperar validación del administrador
6. Recibir notificación cuando sea validado o rechazado

### Como Administrador:
1. Iniciar sesión con cuenta de administrador
2. Ver el **Dashboard** con estadísticas
3. Ir a **"Validar"** para ver reportes pendientes
4. Revisar cada reporte:
   - Ver imagen, ubicación, descripción
   - Ver datos del usuario que reportó
   - Ver categoría y prioridad
5. **Aprobar** o **Rechazar** el reporte:
   - Si apruebas: aparece en el mapa público
   - Si rechazas: indicar motivo (el usuario lo verá)
6. Gestionar usuarios y categorías desde las otras pestañas

## 🗂️ Archivos Creados/Modificados

### Backend
```
backend/
├── src/
│   ├── routes/
│   │   └── admin.js                    ✅ NUEVO
│   └── middleware/
│       └── auth.js                     ✅ MODIFICADO (adminMiddleware)
└── server.js                           ✅ MODIFICADO (rutas admin)
```

### Frontend
```
src/
├── screens/
│   └── admin/
│       ├── AdminDashboardScreen.tsx           ✅ NUEVO
│       ├── PendingReportsScreen.tsx           ✅ NUEVO  
│       ├── UserManagementScreen.tsx           ✅ NUEVO
│       ├── CategoryManagementScreen.tsx       ✅ NUEVO
│       └── ReportsByCategoryScreen.tsx        ✅ NUEVO
├── services/
│   └── adminService.ts                 ✅ NUEVO
├── navigation/
│   └── AppNavigator.tsx                ✅ MODIFICADO
└── types/
    └── index.ts                        ✅ MODIFICADO
```

### Base de Datos
```
database/
├── 08_admin_notifications.sql          ✅ NUEVO (triggers de notificaciones)
└── crear_usuarios_admin.sql            ✅ NUEVO (script para crear admins)
```

### Documentación
```
docs/
└── SISTEMA_ADMINISTRACION.md           ✅ NUEVO (documentación completa)
```

## 🔐 Seguridad

- ✅ JWT con tipo de usuario incluido
- ✅ Middleware que verifica rol de administrador
- ✅ Rutas protegidas en backend (`/api/admin/*`)
- ✅ Navegación diferenciada en frontend
- ✅ Solo reportes validados aparecen en mapa público

## 🎯 Estados de Reportes

| Estado | Descripción |
|--------|-------------|
| **PENDIENTE** | Recién creado, esperando validación |
| **EN_REVISION** | Validado por admin, en revisión |
| **EN_PROCESO** | Se está trabajando en la solución |
| **RESUELTO** | Problema solucionado |
| **RECHAZADO** | Rechazado por administrador |
| **DUPLICADO** | Duplicado de otro reporte |

## 📊 Endpoints de Administración

### Reportes
- `GET /api/admin/reports/pending` - Reportes pendientes
- `GET /api/admin/reports/stats` - Estadísticas
- `POST /api/admin/reports/:id/validate` - Validar reporte
- `POST /api/admin/reports/:id/reject` - Rechazar reporte
- `PATCH /api/admin/reports/:id/status` - Cambiar estado
- `GET /api/admin/reports/by-category` - Por categoría

### Usuarios
- `GET /api/admin/users` - Listar usuarios
- `PATCH /api/admin/users/:id/status` - Activar/desactivar

### Categorías
- `GET /api/admin/categories` - Listar categorías
- `POST /api/admin/categories` - Crear categoría
- `PUT /api/admin/categories/:id` - Actualizar categoría

## ⚠️ Importante

### Restricciones Implementadas
- ✅ **NO se modificó la base de datos existente** (solo se agregaron triggers)
- ✅ **NO se modificaron las vistas del ciudadano**
- ✅ **Las funcionalidades existentes se mantienen intactas**
- ✅ **Se usaron las estructuras existentes como referencia**

### Mapa Público
- Solo muestra reportes donde: `validado = TRUE` AND `visible_publicamente = TRUE`
- Los reportes pendientes NO aparecen en el mapa
- Solo después de que un admin apruebe, el reporte es visible

## 🐛 Solución de Problemas

### El admin no puede iniciar sesión
```sql
-- Verificar que el usuario es administrador
SELECT nombre, email, tipo_usuario 
FROM monitoreo_ciudadano.usuarios 
WHERE email = 'admin@monitoreo.gov.co';

-- Si no aparece o no es ADMINISTRADOR, actualizar:
UPDATE monitoreo_ciudadano.usuarios 
SET tipo_usuario = 'ADMINISTRADOR' 
WHERE email = 'admin@monitoreo.gov.co';
```

### Los reportes validados no aparecen en el mapa
```sql
-- Verificar estado de un reporte
SELECT id, titulo, validado, visible_publicamente, estado 
FROM monitoreo_ciudadano.reportes 
WHERE id = 'REPORTE_ID';

-- Asegurarse que esté validado y visible
UPDATE monitoreo_ciudadano.reportes 
SET validado = TRUE, visible_publicamente = TRUE 
WHERE id = 'REPORTE_ID';
```

### No llegan notificaciones a administradores
```sql
-- Verificar que los triggers existen
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_schema = 'monitoreo_ciudadano' 
AND event_object_table = 'reportes';

-- Si no existen, ejecutar:
psql -U postgres -d monitoreo_ciudadano -f database/08_admin_notifications.sql
```

### El backend no inicia
```bash
# Verificar que el puerto 3001 no esté en uso
netstat -ano | findstr :3001

# Si está en uso, matar el proceso
taskkill /PID <PID_NUMBER> /F

# Reiniciar backend
cd backend
npm start
```

## 📚 Documentación Adicional

Para más detalles técnicos, consultar:
- [`docs/SISTEMA_ADMINISTRACION.md`](./SISTEMA_ADMINISTRACION.md) - Documentación técnica completa
- [`database/08_admin_notifications.sql`](../database/08_admin_notifications.sql) - Script de triggers
- [`backend/src/routes/admin.js`](../backend/src/routes/admin.js) - Rutas de administración

## ✨ Resumen de Cambios

1. ✅ **Sistema de validación** - Los reportes requieren aprobación admin
2. ✅ **Panel administrativo** - Interfaz completa para administradores
3. ✅ **Notificaciones automáticas** - Triggers en base de datos
4. ✅ **Navegación por rol** - Admin y ciudadano ven interfaces diferentes
5. ✅ **Gestión de usuarios** - Activar/desactivar, filtrar, ver estadísticas
6. ✅ **Gestión de categorías** - Administrar todas las categorías
7. ✅ **Reportes por categoría** - Estadísticas detalladas
8. ✅ **Mapa filtrado** - Solo reportes validados son públicos

---

**Estado:** ✅ Completado y Funcional  
**Fecha:** Diciembre 2024  
**Versión:** 1.0.0

## 🎉 ¡Listo para Usar!

El sistema está completamente funcional. Solo necesitas:
1. Iniciar el backend
2. Iniciar la app móvil
3. Iniciar sesión como admin
4. Comenzar a validar reportes

**¡Disfruta tu nuevo sistema de administración!** 🚀
