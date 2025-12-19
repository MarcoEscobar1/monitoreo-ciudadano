-- =====================================================
-- SCRIPT DE INICIALIZACIÓN Y EXTENSIONES
-- App de Monitoreo Ciudadano - Base de Datos
-- Versión: 1.0
-- Fecha: Agosto 2025
-- =====================================================

-- Conectar a la base de datos 'monitoreo_ciudadano'
\c monitoreo_ciudadano;

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Verificar versiones de extensiones
SELECT name, default_version, installed_version 
FROM pg_available_extensions 
WHERE name IN ('postgis', 'uuid-ossp', 'pgcrypto', 'btree_gist');

-- Crear esquema principal si no existe
CREATE SCHEMA IF NOT EXISTS monitoreo_ciudadano;

-- Establecer esquema por defecto
SET search_path TO monitoreo_ciudadano, public;

-- Comentarios del esquema
COMMENT ON SCHEMA monitoreo_ciudadano IS 'Esquema principal para la aplicación de monitoreo ciudadano';

-- Crear tipos enum personalizados
CREATE TYPE tipo_problema AS ENUM (
    'AGUA',
    'LUZ',
    'BASURA',
    'BACHES',
    'ALUMBRADO_PUBLICO',
    'ALCANTARILLADO',
    'SEMAFOROS',
    'PARQUES_JARDINES',
    'LIMPIEZA_VIAS',
    'OTRO'
);

CREATE TYPE estado_reporte AS ENUM (
    'PENDIENTE',
    'EN_REVISION',
    'EN_PROCESO',
    'RESUELTO',
    'RECHAZADO',
    'DUPLICADO'
);

CREATE TYPE prioridad_reporte AS ENUM (
    'BAJA',
    'MEDIA',
    'ALTA',
    'CRITICA'
);

CREATE TYPE tipo_usuario AS ENUM (
    'CIUDADANO',
    'MODERADOR',
    'ADMINISTRADOR',
    'ENTIDAD_PUBLICA'
);

CREATE TYPE metodo_autenticacion AS ENUM (
    'EMAIL',
    'GOOGLE',
    'FACEBOOK'
);

-- Comentarios de tipos
COMMENT ON TYPE tipo_problema IS 'Categorías de problemas que pueden reportar los ciudadanos';
COMMENT ON TYPE estado_reporte IS 'Estados del flujo de vida de un reporte';
COMMENT ON TYPE prioridad_reporte IS 'Niveles de prioridad para los reportes';
COMMENT ON TYPE tipo_usuario IS 'Tipos de usuario en el sistema';
COMMENT ON TYPE metodo_autenticacion IS 'Métodos de autenticación disponibles';

COMMIT;
