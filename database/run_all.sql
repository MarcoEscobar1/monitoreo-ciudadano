-- =====================================================
-- SCRIPT PRINCIPAL DE EJECUCIÓN COMPLETA
-- App de Monitoreo Ciudadano
-- =====================================================

-- Este script ejecuta todos los archivos en orden correcto
-- Para PostgreSQL con extensión PostGIS

\echo 'INICIANDO CONFIGURACION DE BASE DE DATOS - MONITOREO CIUDADANO'
\echo '================================================='

-- Mostrar información de conexión
SELECT 
    current_database() as base_datos,
    current_user as usuario_actual,
    version() as version_postgresql;

\echo 'PASO 1: Inicializando extensiones y tipos...'
\i 01_init_extensions.sql

\echo 'PASO 2: Creando tablas principales...'
\i 02_create_tables.sql

\echo 'PASO 3: Creando funciones y procedures...'
\i 04_functions_procedures.sql

\echo 'PASO 4: Configurando triggers y automatización...'
\i 05_triggers_automation.sql

\echo 'PASO 5: Configurando notificaciones de admin...'
\i 08_admin_notifications.sql

\echo 'CONFIGURACION COMPLETADA EXITOSAMENTE'
\echo '================================================='
\echo 'Base de datos lista para desarrollo de la app movil'
\echo 'Esquema: monitoreo_ciudadano'
\echo 'Extensiones: PostGIS, UUID, pgcrypto habilitadas'
\echo '================================================='
