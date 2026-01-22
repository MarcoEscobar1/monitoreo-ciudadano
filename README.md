# Monitoreo Ciudadano

Sistema de reportes ciudadanos desarrollado con React Native, Node.js y PostgreSQL.

![Imagen de WhatsApp 2025-09-01 a las 07 41 51_74641588](https://github.com/user-attachments/assets/4aa4e6a6-8f00-4cd1-b0ab-7436906c5ecf)

---

## Descripcion del Sistema

Monitoreo Ciudadano es una aplicacion movil que permite a los ciudadanos reportar problemas en su comunidad de manera rapida y sencilla. Los reportes incluyen ubicacion geografica, fotografias y categorizacion, permitiendo a las autoridades gestionar y dar seguimiento a cada caso.

---

## Funcionalidades

### Para Ciudadanos

**Registro y Autenticacion**
- Crear cuenta con email y contrasena
- Iniciar sesion con credenciales o Google
- Recuperar contrasena por email
- Editar perfil personal

**Crear Reportes**
- Formulario para describir el problema (titulo y descripcion)
- Seleccionar categoria del problema (Infraestructura, Seguridad, Medio Ambiente, Transporte, Servicios Publicos, Salud)
- Definir nivel de prioridad (Baja, Media, Alta)
- Capturar o seleccionar fotografias del problema
- Obtener ubicacion automatica o seleccionar manualmente en el mapa
- Agregar direccion de referencia

**Consultar Reportes**
- Ver todos los reportes en un mapa interactivo
- Filtrar reportes por categoria y estado
- Ver detalle completo de cada reporte
- Consultar mis reportes creados
- Seguimiento del estado de mis reportes (Pendiente, En Revision, En Proceso, Resuelto, Rechazado)

**Notificaciones**
- Recibir notificaciones cuando un reporte cambia de estado
- Ver historial de notificaciones
- Marcar notificaciones como leidas

---

### Para Administradores

**Panel de Administracion**
- Dashboard con estadisticas generales del sistema
- Cantidad de reportes por estado
- Reportes de las ultimas 24 horas y ultima semana

**Gestion de Reportes**
- Ver lista de reportes pendientes de validacion
- Validar o rechazar reportes con comentarios
- Cambiar estado de reportes (En Revision, En Proceso, Resuelto)
- Ver reportes agrupados por categoria

**Gestion de Usuarios**
- Ver lista de usuarios registrados
- Aprobar o rechazar cuentas de nuevos usuarios
- Activar o desactivar cuentas de usuarios

**Gestion de Categorias**
- Ver todas las categorias disponibles
- Crear nuevas categorias de problemas
- Editar categorias existentes
- Ver estadisticas de reportes por categoria

---

## Mapa Interactivo

- Visualizacion de reportes geolocalizados en mapa OpenStreetMap
- Agrupacion automatica de reportes cercanos (clustering)
- Marcadores con colores segun categoria
- Filtros para mostrar reportes por categoria o estado
- Vista de detalle al seleccionar un marcador
- Selector de ubicacion para nuevos reportes

---

## Estados de un Reporte

| Estado | Descripcion |
|--------|-------------|
| Pendiente | Reporte creado, esperando validacion del administrador |
| En Revision | Reporte validado, siendo analizado por las autoridades |
| En Proceso | Se esta trabajando en la solucion del problema |
| Resuelto | El problema fue solucionado |
| Rechazado | El reporte no cumple con los criterios o es invalido |

---

## Categorias de Problemas

- Infraestructura: Problemas en calles, aceras, puentes, edificios publicos
- Transporte: Semaforos, senalizacion, transporte publico
- Medio Ambiente: Contaminacion, basuras, espacios verdes
- Seguridad: Alumbrado publico, zonas inseguras
- Servicios Publicos: Agua, luz, gas, recoleccion de basuras
- Salud: Servicios de salud publica, centros de salud

---

## Tecnologias Utilizadas

- Frontend: React Native con Expo
- Backend: Node.js con Express
- Base de Datos: PostgreSQL con PostGIS
- Mapas: OpenStreetMap con Leaflet
- Autenticacion: JWT y Google OAuth

---

## Autor

Desarrollado como proyecto de grado.
