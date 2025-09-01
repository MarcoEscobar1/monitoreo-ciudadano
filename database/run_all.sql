-- =====================================================
-- SCRIPT PRINCIPAL DE EJECUCIÓN COMPLETA
-- App de Monitoreo Ciudadano - FASE 1
-- =====================================================

-- Este script ejecuta todos los archivos en orden correcto
-- Para PostgreSQL con extensión PostGIS

\echo '🚀 INICIANDO CONFIGURACIÓN DE BASE DE DATOS - MONITOREO CIUDADANO'
\echo '================================================='

-- Mostrar información de conexión
SELECT 
    current_database() as base_datos,
    current_user as usuario_actual,
    version() as version_postgresql;

\echo '📋 PASO 1: Inicializando extensiones y tipos...'
\i 01_init_extensions.sql

\echo '📋 PASO 2: Creando tablas principales...'
\i 02_create_tables.sql

\echo '📋 PASO 3: Creando tablas secundarias...'
\i 03_secondary_tables.sql

\echo '📋 PASO 4: Creando funciones y procedures...'
\i 04_functions_procedures.sql

\echo '📋 PASO 5: Configurando triggers y automatización...'
\i 05_triggers_automation.sql

\echo '📋 PASO 6: Insertando datos de prueba...'
\i 06_test_data.sql

\echo '📋 PASO 7: Ejecutando consultas de validación...'
\i 07_test_queries.sql

\echo '✅ CONFIGURACIÓN COMPLETADA EXITOSAMENTE'
\echo '================================================='
\echo 'Base de datos lista para desarrollo de la app móvil'
\echo 'Esquema: monitoreo_ciudadano'
\echo 'Extensiones: PostGIS, UUID, pgcrypto habilitadas'
\echo '================================================='
