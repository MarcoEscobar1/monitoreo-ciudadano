-- =====================================================
-- VERIFICACION FINAL - FASE 1 COMPLETADA
-- App de Monitoreo Ciudadano
-- =====================================================

-- Conectar al esquema
\c appmovil;
SET search_path TO monitoreo_ciudadano, public;

-- Verificacion final simplificada
SELECT 'EXTENSIONES INSTALADAS' as verificacion, COUNT(*) as total
FROM pg_extension 
WHERE extname IN ('postgis', 'uuid-ossp', 'pgcrypto', 'btree_gist');

SELECT 'TABLAS CREADAS' as verificacion, COUNT(*) as total
FROM pg_tables 
WHERE schemaname = 'monitoreo_ciudadano';

SELECT 'DATOS INSERTADOS' as verificacion;
SELECT 'zonas_geograficas' as tabla, COUNT(*) as registros FROM zonas_geograficas
UNION ALL
SELECT 'categorias_problemas', COUNT(*) FROM categorias_problemas
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'reportes', COUNT(*) FROM reportes
UNION ALL
SELECT 'configuracion_sistema', COUNT(*) FROM configuracion_sistema;

-- Test PostGIS final
SELECT 'TEST POSTGIS' as verificacion;
SELECT ST_AsText(ST_GeomFromText('POINT(-74.0721 4.6097)', 4326)) as coordenadas_bogota;

-- Mensaje final
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'monitoreo_ciudadano') >= 12
        AND (SELECT COUNT(*) FROM zonas_geograficas) >= 5
        AND (SELECT COUNT(*) FROM categorias_problemas) >= 10
        THEN 'FASE 1 COMPLETADA EXITOSAMENTE!'
        ELSE 'Fase 1 requiere ajustes'
    END as estado_final,
    'Lista para FASE 2: React Native + Expo' as siguiente_paso;
