-- =====================================================
-- SCRIPT DE VERIFICACIÓN COMPLETA - FASE 1
-- App de Monitoreo Ciudadano
-- =====================================================

-- Conectar al esquema
\c appmovil;
SET search_path TO monitoreo_ciudadano, public;

-- =====================================================
-- 1. VERIFICAR EXTENSIONES
-- =====================================================
SELECT 
    '🔧 EXTENSIONES INSTALADAS' as verificacion,
    extname as extension_name, 
    extversion as version
FROM pg_extension 
WHERE extname IN ('postgis', 'uuid-ossp', 'pgcrypto', 'btree_gist')
ORDER BY extname;

-- =====================================================
-- 2. VERIFICAR ESTRUCTURA DE BASE DE DATOS
-- =====================================================
SELECT 
    '📊 TABLAS CREADAS' as verificacion,
    tablename as tabla,
    'monitoreo_ciudadano' as esquema
FROM pg_tables 
WHERE schemaname = 'monitoreo_ciudadano'
ORDER BY tablename;

-- =====================================================
-- 3. VERIFICAR TIPOS ENUM
-- =====================================================
SELECT 
    '🏷️ TIPOS ENUM' as verificacion,
    t.typname as tipo,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as valores_permitidos
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('estado_reporte', 'tipo_problema', 'tipo_usuario', 'prioridad_reporte', 'metodo_autenticacion')
GROUP BY t.typname
ORDER BY t.typname;

-- =====================================================
-- 4. VERIFICAR DATOS INSERTADOS
-- =====================================================
SELECT '📈 CONTEOS DE DATOS' as verificacion;

SELECT 'usuarios' as tabla, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'zonas_geograficas', COUNT(*) FROM zonas_geograficas
UNION ALL
SELECT 'categorias_problemas', COUNT(*) FROM categorias_problemas
UNION ALL
SELECT 'reportes', COUNT(*) FROM reportes
UNION ALL
SELECT 'comentarios', COUNT(*) FROM comentarios
UNION ALL
SELECT 'configuracion_sistema', COUNT(*) FROM configuracion_sistema
ORDER BY tabla;

-- =====================================================
-- 5. VERIFICAR FUNCIONES PERSONALIZADAS
-- =====================================================
SELECT 
    '⚙️ FUNCIONES CREADAS' as verificacion,
    routine_name as funcion,
    data_type as tipo_retorno
FROM information_schema.routines 
WHERE routine_schema = 'monitoreo_ciudadano'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- =====================================================
-- 6. VERIFICAR ÍNDICES GEOESPACIALES
-- =====================================================
SELECT 
    '🗺️ ÍNDICES GEOESPACIALES' as verificacion,
    schemaname,
    tablename,
    indexname,
    CASE WHEN indexdef LIKE '%GIST%' THEN '✅ GIST' ELSE '❌ NO-GIST' END as tipo_index
FROM pg_indexes
WHERE schemaname = 'monitoreo_ciudadano'
  AND indexdef LIKE '%GIST%'
ORDER BY tablename, indexname;

-- =====================================================
-- 7. TEST DE FUNCIONALIDADES GEOESPACIALES
-- =====================================================
SELECT '🌍 TEST POSTJIS' as verificacion;

-- Test básico de creación de geometrías
SELECT 
    'geometria_punto' as test,
    ST_AsText(ST_GeomFromText('POINT(-74.0721 4.6097)', 4326)) as resultado;

-- Test de cálculo de distancias
SELECT 
    'calculo_distancia' as test,
    ROUND(
        ST_Distance(
            ST_Transform(ST_GeomFromText('POINT(-74.0721 4.6097)', 4326), 3857),
            ST_Transform(ST_GeomFromText('POINT(-74.0589 4.6535)', 4326), 3857)
        )::numeric, 2
    ) || ' metros' as distancia_centro_chapinero;

-- Test de función personalizada (si existe)
SELECT 
    'funcion_zona' as test,
    CASE 
        WHEN obtener_zona_por_ubicacion(4.66, -74.06) IS NOT NULL 
        THEN '✅ Función operativa'
        ELSE '⚠️ Función retorna NULL'
    END as estado_funcion;

-- =====================================================
-- 8. VERIFICAR ZONAS GEOGRÁFICAS CON GEOMETRÍAS
-- =====================================================
SELECT '🗺️ ZONAS GEOGRÁFICAS' as verificacion;

SELECT 
    nombre as zona,
    tipo,
    CASE 
        WHEN poligono IS NOT NULL THEN '✅ Con polígono'
        ELSE '❌ Sin polígono'
    END as geometria_poligono,
    CASE 
        WHEN centro IS NOT NULL THEN '✅ Con centro'
        ELSE '❌ Sin centro'
    END as geometria_centro,
    area_km2 || ' km²' as area
FROM zonas_geograficas
ORDER BY area_km2 DESC;

-- =====================================================
-- 9. VERIFICAR CATEGORÍAS DE PROBLEMAS
-- =====================================================
SELECT '📋 CATEGORÍAS' as verificacion;

SELECT 
    nombre as categoria,
    tipo_problema,
    prioridad_base,
    CASE 
        WHEN categoria_padre_id IS NULL THEN '📁 Principal'
        ELSE '📄 Subcategoría'
    END as tipo_categoria,
    CASE WHEN activo THEN '✅ Activa' ELSE '❌ Inactiva' END as estado
FROM categorias_problemas
ORDER BY tipo_problema, orden_visualizacion;

-- =====================================================
-- 10. RESUMEN FINAL DE ESTADO
-- =====================================================
SELECT '🎯 RESUMEN FINAL' as verificacion;

WITH conteos AS (
    SELECT 
        (SELECT COUNT(*) FROM pg_extension WHERE extname IN ('postgis', 'uuid-ossp', 'pgcrypto')) as extensiones,
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'monitoreo_ciudadano') as tablas,
        (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'monitoreo_ciudadano') as funciones,
        (SELECT COUNT(*) FROM zonas_geograficas) as zonas,
        (SELECT COUNT(*) FROM categorias_problemas WHERE activo = true) as categorias_activas,
        (SELECT COUNT(*) FROM configuracion_sistema) as configuraciones
)
SELECT 
    '🔧 Extensiones instaladas: ' || extensiones || '/3' as ext_status,
    '📊 Tablas creadas: ' || tablas || '/12' as tabla_status,
    '⚙️ Funciones: ' || funciones as func_status,
    '🗺️ Zonas geográficas: ' || zonas as zona_status,
    '📋 Categorías activas: ' || categorias_activas as cat_status,
    '⚙️ Configuraciones: ' || configuraciones as config_status
FROM conteos;

-- Mensaje final
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'monitoreo_ciudadano') = 12
        AND (SELECT COUNT(*) FROM zonas_geograficas) >= 5
        AND (SELECT COUNT(*) FROM categorias_problemas WHERE activo = true) >= 10
        THEN '🎉 ¡FASE 1 COMPLETADA EXITOSAMENTE!'
        ELSE '⚠️ Fase 1 requiere completar algunos elementos'
    END as estado_fase_1,
    
    'Base de datos lista para FASE 2: React Native + Expo' as proximo_paso,
    
    NOW() as fecha_verificacion;
