# Sistema de Administración - Monitoreo Ciudadano

## Resumen

Se ha implementado un sistema completo de administración que permite a los usuarios con rol de `ADMINISTRADOR` o `MODERADOR` gestionar reportes, usuarios y categorías de la aplicación.

## Características Implementadas

### 1. Backend - Rutas de Administración (`/api/admin`)

#### Gestión de Reportes
- **GET `/api/admin/reports/pending`** - Obtener reportes pendientes de validación
- **GET `/api/admin/reports/stats`** - Estadísticas generales de reportes
- **POST `/api/admin/reports/:id/validate`** - Validar (aprobar) un reporte
- **POST `/api/admin/reports/:id/reject`** - Rechazar un reporte con motivo
- **PATCH `/api/admin/reports/:id/status`** - Cambiar estado de un reporte
- **GET `/api/admin/reports/by-category`** - Estadísticas de reportes por categoría

#### Gestión de Usuarios
- **GET `/api/admin/users`** - Listar todos los usuarios (con paginación y filtros)
- **PATCH `/api/admin/users/:id/status`** - Activar/desactivar un usuario

#### Gestión de Categorías
- **GET `/api/admin/categories`** - Obtener todas las categorías con estadísticas
- **POST `/api/admin/categories`** - Crear nueva categoría
- **PUT `/api/admin/categories/:id`** - Actualizar categoría existente

### 2. Middleware de Autorización

Se implementó `adminMiddleware` que:
- Verifica que el usuario esté autenticado
- Valida que el usuario tenga rol `ADMINISTRADOR` o `MODERADOR`
- Protege todas las rutas `/api/admin/*`

### 3. Frontend - Pantallas de Administración

#### Dashboard de Administración (`AdminDashboardScreen`)
- Estadísticas generales (total reportes, pendientes, en proceso, resueltos)
- Alertas de reportes pendientes de validación
- Actividad reciente (últimas 24 horas, última semana)
- Accesos rápidos a todas las funcionalidades

#### Validación de Reportes (`PendingReportsScreen`)
- Lista de reportes pendientes de validación
- Vista detallada de cada reporte con imagen, ubicación, usuario
- Botones para aprobar o rechazar
- Modal para indicar motivo de rechazo
- Actualización automática después de cada acción

#### Gestión de Usuarios (`UserManagementScreen`)
- Lista paginada de todos los usuarios
- Filtros por tipo de usuario (Todos, Ciudadanos, Administradores)
- Información detallada (email, teléfono, fecha registro, total reportes)
- Activar/desactivar usuarios
- Indicadores visuales de estado

#### Gestión de Categorías (`CategoryManagementScreen`)
- Lista de todas las categorías con estadísticas
- Switch para activar/desactivar categorías
- Información de color, icono, prioridad base
- Contador de reportes totales y validados por categoría

#### Estadísticas por Categoría (`ReportsByCategoryScreen`)
- Visualización detallada de cada categoría
- Porcentaje de reportes validados y resueltos
- Barras de progreso visuales
- Reportes del último mes por categoría

### 4. Navegación Diferenciada por Rol

El sistema detecta automáticamente el tipo de usuario y muestra:

**Para Administradores/Moderadores:**
- Dashboard
- Validar Reportes
- Gestionar Usuarios
- Gestionar Categorías
- Estadísticas

**Para Ciudadanos:**
- Inicio
- Mapa
- Crear Reporte
- Notificaciones
- Perfil

### 5. Sistema de Validación de Reportes

#### Flujo de Validación
1. Usuario crea un reporte → Estado: `PENDIENTE`, `validado: false`
2. Administrador recibe notificación automática
3. Administrador revisa el reporte
4. Opción A: **Aprobar**
   - `validado: true`
   - `estado: EN_REVISION`
   - `visible_publicamente: true`
   - Reporte aparece en el mapa público
5. Opción B: **Rechazar**
   - `estado: RECHAZADO`
   - `validado: false`
   - `visible_publicamente: false`
   - Se guarda el motivo del rechazo

#### Campos de la Base de Datos
```sql
validado BOOLEAN DEFAULT FALSE
validado_por UUID REFERENCES usuarios(id)
fecha_validacion TIMESTAMP WITH TIME ZONE
comentarios_validacion TEXT
visible_publicamente BOOLEAN DEFAULT TRUE
```

### 6. Sistema de Notificaciones Automáticas

Se implementaron triggers en PostgreSQL:

#### Trigger 1: Notificación a Administradores
**Cuándo:** Después de INSERT en `reportes`
**Acción:** Crea notificación para todos los administradores activos
**Contenido:** "Nuevo reporte pendiente de validación: [título]"

#### Trigger 2: Notificación al Usuario
**Cuándo:** Después de UPDATE en `reportes`
**Acción:** Notifica al usuario cuando su reporte es validado o rechazado
**Contenido:** 
- Si validado: "¡Tu reporte ha sido validado!"
- Si rechazado: "Tu reporte fue rechazado. Motivo: [comentarios]"

### 7. Filtrado del Mapa Público

El endpoint `/api/reports/mapa` ahora filtra por:
```sql
WHERE r.visible_publicamente = true
  AND r.validado = true
```

**Resultado:** Solo los reportes validados por administradores aparecen en el mapa público.

## Estructura de Archivos Creados/Modificados

### Backend
```
backend/
├── src/
│   ├── routes/
│   │   └── admin.js                    # ✅ NUEVO - Rutas de administración
│   └── middleware/
│       └── auth.js                     # ✅ MODIFICADO - Agregado adminMiddleware
└── server.js                           # ✅ MODIFICADO - Rutas admin agregadas
```

### Frontend
```
src/
├── screens/
│   └── admin/
│       ├── AdminDashboardScreen.tsx           # ✅ NUEVO
│       ├── PendingReportsScreen.tsx           # ✅ NUEVO
│       ├── UserManagementScreen.tsx           # ✅ NUEVO
│       ├── CategoryManagementScreen.tsx       # ✅ NUEVO
│       └── ReportsByCategoryScreen.tsx        # ✅ NUEVO
├── services/
│   └── adminService.ts                 # ✅ NUEVO - Cliente API admin
├── navigation/
│   └── AppNavigator.tsx                # ✅ MODIFICADO - Navegación admin
└── types/
    └── index.ts                        # ✅ MODIFICADO - Tipo Usuario actualizado
```

### Base de Datos
```
database/
└── 08_admin_notifications.sql          # ✅ NUEVO - Triggers de notificaciones
```

## Uso del Sistema

### Para Desarrolladores

1. **Ejecutar migración de base de datos:**
   ```bash
   psql -U postgres -d monitoreo_ciudadano -f database/08_admin_notifications.sql
   ```

2. **Reiniciar backend:**
   ```bash
   cd backend
   npm start
   ```

3. **Reiniciar app móvil:**
   ```bash
   npx expo start --clear
   ```

### Para Administradores

1. **Login con cuenta de administrador**
   - El tipo de usuario debe ser `ADMINISTRADOR` o `MODERADOR` en la base de datos

2. **Dashboard:**
   - Ver estadísticas generales
   - Acceder a funcionalidades rápidamente

3. **Validar Reportes:**
   - Revisar reportes pendientes
   - Aprobar reportes legítimos
   - Rechazar reportes inapropiados con motivo

4. **Gestionar Usuarios:**
   - Ver lista completa de usuarios
   - Filtrar por tipo
   - Activar/desactivar cuentas

5. **Gestionar Categorías:**
   - Ver categorías con estadísticas
   - Activar/desactivar categorías
   - Ver uso de cada categoría

6. **Ver Estadísticas:**
   - Reportes por categoría
   - Porcentajes de validación y resolución
   - Tendencias del último mes

### Para Usuarios (Ciudadanos)

1. **Crear Reporte:**
   - El reporte se crea con estado `PENDIENTE`
   - No es visible públicamente hasta su validación

2. **Notificaciones:**
   - Recibirán notificación cuando su reporte sea validado
   - Recibirán notificación si su reporte es rechazado (con motivo)

3. **Mapa Público:**
   - Solo ven reportes validados por administradores
   - Garantiza calidad de la información

## Seguridad

### Autenticación y Autorización
- ✅ JWT con `tipo_usuario` incluido
- ✅ Middleware `adminMiddleware` protege todas las rutas admin
- ✅ Verificación en frontend (navegación diferenciada)
- ✅ Verificación en backend (rutas protegidas)

### Validación de Datos
- ✅ Validación de campos requeridos
- ✅ Verificación de permisos en cada endpoint
- ✅ Sanitización de entradas

## Estados de Reportes

```
PENDIENTE      → Recién creado, esperando validación
EN_REVISION    → Validado por admin, en revisión
EN_PROCESO     → Se está trabajando en solución
RESUELTO       → Problema solucionado
RECHAZADO      → Reporte rechazado por admin
DUPLICADO      → Reporte duplicado de otro existente
```

## Prioridades de Reportes

```
BAJA       → No urgente
MEDIA      → Importancia normal
ALTA       → Requiere atención pronta
CRITICA    → Urgente, atención inmediata
```

## Testing

### Crear Usuario Administrador (SQL)
```sql
-- Actualizar usuario existente a administrador
UPDATE monitoreo_ciudadano.usuarios
SET tipo_usuario = 'ADMINISTRADOR'
WHERE email = 'admin@example.com';

-- O crear nuevo administrador
INSERT INTO monitoreo_ciudadano.usuarios 
(nombre, apellidos, email, password_hash, tipo_usuario, activo, email_verificado, metodo_auth)
VALUES 
('Admin', 'Principal', 'admin@test.com', '$2a$12$hashed_password_here', 'ADMINISTRADOR', true, true, 'EMAIL');
```

### Endpoints de Testing
```bash
# Login como admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'

# Obtener reportes pendientes
curl -X GET http://localhost:3001/api/admin/reports/pending \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Validar reporte
curl -X POST http://localhost:3001/api/admin/reports/{id}/validate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comentarios":"Reporte válido"}'
```

## Próximas Mejoras (Opcional)

- [ ] Sistema de notificaciones push en tiempo real
- [ ] Dashboard con gráficos interactivos
- [ ] Exportar reportes a PDF/Excel
- [ ] Sistema de mensajería entre admin y usuario
- [ ] Logs de auditoría de acciones admin
- [ ] Filtros avanzados y búsqueda
- [ ] Asignación de reportes a moderadores específicos
- [ ] Sistema de priorización automática

## Soporte

Para problemas o dudas sobre el sistema de administración, revisar:
1. Logs del backend (`backend/server.js`)
2. Errores de validación en las respuestas API
3. Estado de autenticación en el frontend
4. Tipo de usuario en JWT token

---

**Fecha de Implementación:** 2024
**Versión:** 1.0.0
**Estado:** ✅ Completado y Funcional
