-- =====================================================
-- CONSULTAS DE PRUEBA Y VALIDACIÓN
-- App de Monitoreo Ciudadano
-- =====================================================

SET search_path TO monitoreo_ciudadano, public;

-- =====================================================
-- CONSULTAS BÁSICAS DE VALIDACIÓN
-- =====================================================

-- 1. Verificar estructura de tablas y relaciones
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'monitoreo_ciudadano'
ORDER BY tablename;

-- 2. Verificar extensiones PostGIS
SELECT 
    name,
    installed_version,
    comment
FROM pg_extension
WHERE name IN ('postgis', 'uuid-ossp', 'pgcrypto');

-- 3. Verificar tipos enum creados
SELECT 
    t.typname,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as valores
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('tipo_problema', 'estado_reporte', 'prioridad_reporte', 'tipo_usuario', 'metodo_autenticacion')
GROUP BY t.typname
ORDER BY t.typname;

-- =====================================================
-- CONSULTAS FUNCIONALES
-- =====================================================

-- 4. Reportes por estado con información del usuario
SELECT 
    r.estado,
    COUNT(*) as cantidad,
    string_agg(DISTINCT u.nombre || ' ' || u.apellidos, ', ') as usuarios
FROM reportes r
JOIN usuarios u ON r.usuario_id = u.id
GROUP BY r.estado
ORDER BY cantidad DESC;

-- 5. Reportes por zona geográfica con métricas
SELECT 
    zg.nombre as zona,
    zg.tipo,
    COUNT(r.id) as total_reportes,
    COUNT(r.id) FILTER (WHERE r.estado = 'RESUELTO') as resueltos,
    COUNT(r.id) FILTER (WHERE r.estado = 'PENDIENTE') as pendientes,
    ROUND(
        COUNT(r.id) FILTER (WHERE r.estado = 'RESUELTO')::DECIMAL / 
        NULLIF(COUNT(r.id), 0) * 100, 2
    ) as porcentaje_resolucion
FROM zonas_geograficas zg
LEFT JOIN reportes r ON zg.id = r.zona_geografica_id
GROUP BY zg.id, zg.nombre, zg.tipo
ORDER BY total_reportes DESC;

-- 6. Categorías más reportadas
SELECT 
    cp.nombre as categoria,
    cp.tipo_problema,
    COUNT(r.id) as total_reportes,
    AVG(r.votos_ciudadanos) as promedio_votos,
    cp.prioridad_base
FROM categorias_problemas cp
LEFT JOIN reportes r ON cp.id = r.categoria_id
WHERE cp.categoria_padre_id IS NULL -- Solo categorías principales
GROUP BY cp.id, cp.nombre, cp.tipo_problema, cp.prioridad_base
ORDER BY total_reportes DESC;

-- 7. Reportes con mayor actividad (comentarios y votos)
SELECT 
    r.titulo,
    r.estado,
    u.nombre || ' ' || u.apellidos as reportado_por,
    r.votos_ciudadanos,
    (SELECT COUNT(*) FROM comentarios c WHERE c.reporte_id = r.id) as total_comentarios,
    r.fecha_creacion,
    zg.nombre as zona
FROM reportes r
JOIN usuarios u ON r.usuario_id = u.id
LEFT JOIN zonas_geograficas zg ON r.zona_geografica_id = zg.id
ORDER BY (r.votos_ciudadanos + (SELECT COUNT(*) FROM comentarios c WHERE c.reporte_id = r.id)) DESC
LIMIT 5;

-- =====================================================
-- CONSULTAS GEOESPACIALES
-- =====================================================

-- 8. Reportes dentro de un radio específico (ejemplo: 1km desde el centro de Chapinero)
SELECT 
    r.titulo,
    r.descripcion,
    ST_Distance(
        ST_Transform(r.ubicacion, 3857),
        ST_Transform(ST_GeomFromText('POINT(-74.055 4.63)', 4326), 3857)
    ) as distancia_metros,
    r.direccion
FROM reportes r
WHERE ST_DWithin(
    ST_Transform(r.ubicacion, 3857),
    ST_Transform(ST_GeomFromText('POINT(-74.055 4.63)', 4326), 3857),
    1000 -- 1000 metros
)
ORDER BY distancia_metros;

-- 9. Densidad de reportes por zona (reportes por km²)
SELECT 
    zg.nombre,
    zg.area_km2,
    COUNT(r.id) as total_reportes,
    ROUND(COUNT(r.id)::DECIMAL / NULLIF(zg.area_km2, 0), 2) as reportes_por_km2
FROM zonas_geograficas zg
LEFT JOIN reportes r ON zg.id = r.zona_geografica_id
WHERE zg.area_km2 > 0
GROUP BY zg.id, zg.nombre, zg.area_km2
ORDER BY reportes_por_km2 DESC;

-- 10. Reportes similares detectados automáticamente
SELECT 
    r1.titulo as reporte_original,
    r2.titulo as reporte_similar,
    rs.similitud_total,
    rs.similitud_ubicacion,
    rs.similitud_categoria,
    ST_Distance(
        ST_Transform(r1.ubicacion, 3857),
        ST_Transform(r2.ubicacion, 3857)
    ) as distancia_metros
FROM reportes_similares rs
JOIN reportes r1 ON rs.reporte_original_id = r1.id
JOIN reportes r2 ON rs.reporte_similar_id = r2.id
ORDER BY rs.similitud_total DESC;

-- =====================================================
-- CONSULTAS DE ANÁLISIS TEMPORAL
-- =====================================================

-- 11. Reportes por día de la última semana
SELECT 
    DATE(fecha_creacion) as fecha,
    COUNT(*) as reportes_creados,
    COUNT(*) FILTER (WHERE validado = true) as reportes_validados
FROM reportes
WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(fecha_creacion)
ORDER BY fecha DESC;

-- 12. Tiempo promedio de resolución por categoría
SELECT 
    cp.nombre as categoria,
    COUNT(r.id) FILTER (WHERE r.estado = 'RESUELTO') as reportes_resueltos,
    AVG(r.fecha_resolucion - r.fecha_creacion) FILTER (WHERE r.estado = 'RESUELTO') as tiempo_promedio_resolucion,
    cp.tiempo_respuesta_esperado
FROM categorias_problemas cp
LEFT JOIN reportes r ON cp.id = r.categoria_id
WHERE cp.categoria_padre_id IS NULL
GROUP BY cp.id, cp.nombre, cp.tiempo_respuesta_esperado
HAVING COUNT(r.id) FILTER (WHERE r.estado = 'RESUELTO') > 0
ORDER BY tiempo_promedio_resolucion;

-- 13. Historial de cambios de estado más frecuentes
SELECT 
    he.estado_anterior,
    he.estado_nuevo,
    COUNT(*) as total_transiciones,
    AVG(EXTRACT(EPOCH FROM (he.fecha_cambio - r.fecha_creacion))/3600) as horas_promedio_desde_creacion
FROM historial_estados he
JOIN reportes r ON he.reporte_id = r.id
GROUP BY he.estado_anterior, he.estado_nuevo
ORDER BY total_transiciones DESC;

-- =====================================================
-- CONSULTAS DE VALIDACIÓN DE FUNCIONES
-- =====================================================

-- 14. Probar función de detección de reportes similares
SELECT 
    'Función detectar_reportes_similares' as prueba,
    COUNT(*) as reportes_encontrados
FROM detectar_reportes_similares(
    (SELECT id FROM reportes LIMIT 1),
    500,
    0.6
);

-- 15. Probar función de estadísticas por zona
SELECT 
    'Función obtener_estadisticas_zona' as prueba,
    *
FROM obtener_estadisticas_zona(
    (SELECT id FROM zonas_geograficas WHERE codigo = 'BOG-CHA'),
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP
);

-- 16. Validar función de obtención de zona por ubicación
SELECT 
    'Función obtener_zona_por_ubicacion' as prueba,
    zg.nombre as zona_encontrada
FROM zonas_geograficas zg
WHERE zg.id = obtener_zona_por_ubicacion(4.66, -74.06); -- Zona Rosa

-- =====================================================
-- CONSULTAS DE RENDIMIENTO
-- =====================================================

-- 17. Verificar índices geoespaciales
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'monitoreo_ciudadano'
  AND indexdef LIKE '%GIST%'
ORDER BY tablename, indexname;

-- 18. Consulta de performance: reportes cerca de ubicación específica
EXPLAIN ANALYZE
SELECT 
    r.titulo,
    r.estado,
    ST_Distance(
        ST_Transform(r.ubicacion, 3857),
        ST_Transform(ST_GeomFromText('POINT(-74.0721 4.6097)', 4326), 3857)
    ) as distancia
FROM reportes r
WHERE ST_DWithin(
    ST_Transform(r.ubicacion, 3857),
    ST_Transform(ST_GeomFromText('POINT(-74.0721 4.6097)', 4326), 3857),
    2000
)
ORDER BY distancia
LIMIT 10;

-- =====================================================
-- CONSULTAS DE AUDITORÍA Y SEGURIDAD
-- =====================================================

-- 19. Logs de auditoría más recientes
SELECT 
    la.fecha_accion,
    la.accion,
    la.entidad,
    u.nombre || ' ' || u.apellidos as usuario,
    la.nivel,
    la.ip_address
FROM logs_auditoria la
LEFT JOIN usuarios u ON la.usuario_id = u.id
ORDER BY la.fecha_accion DESC
LIMIT 10;

-- 20. Usuarios más activos
SELECT 
    u.nombre || ' ' || u.apellidos as usuario,
    u.tipo_usuario,
    COUNT(r.id) as reportes_creados,
    COUNT(c.id) as comentarios_realizados,
    COUNT(vr.id) as votos_emitidos,
    u.fecha_registro,
    u.fecha_ultimo_acceso
FROM usuarios u
LEFT JOIN reportes r ON u.id = r.usuario_id
LEFT JOIN comentarios c ON u.id = c.usuario_id
LEFT JOIN votos_reportes vr ON u.id = vr.usuario_id
WHERE u.tipo_usuario = 'CIUDADANO'
GROUP BY u.id, u.nombre, u.apellidos, u.tipo_usuario, u.fecha_registro, u.fecha_ultimo_acceso
ORDER BY (COUNT(r.id) + COUNT(c.id) + COUNT(vr.id)) DESC;

-- =====================================================
-- RESUMEN FINAL DE VALIDACIÓN
-- =====================================================

-- 21. Resumen general del sistema
SELECT 
    'Total Usuarios' as metrica, COUNT(*)::TEXT as valor FROM usuarios
UNION ALL
SELECT 'Usuarios Verificados', COUNT(*)::TEXT FROM usuarios WHERE email_verificado = true
UNION ALL
SELECT 'Total Reportes', COUNT(*)::TEXT FROM reportes
UNION ALL
SELECT 'Reportes Validados', COUNT(*)::TEXT FROM reportes WHERE validado = true
UNION ALL
SELECT 'Reportes Resueltos', COUNT(*)::TEXT FROM reportes WHERE estado = 'RESUELTO'
UNION ALL
SELECT 'Total Comentarios', COUNT(*)::TEXT FROM comentarios
UNION ALL
SELECT 'Total Votos', COUNT(*)::TEXT FROM votos_reportes
UNION ALL
SELECT 'Zonas Geográficas', COUNT(*)::TEXT FROM zonas_geograficas
UNION ALL
SELECT 'Categorías Activas', COUNT(*)::TEXT FROM categorias_problemas WHERE activo = true
UNION ALL
SELECT 'Configuraciones Sistema', COUNT(*)::TEXT FROM configuracion_sistema;

-- Mensaje de finalización
SELECT 
    '✅ FASE 1 COMPLETADA EXITOSAMENTE' as status,
    'Base de datos PostgreSQL + PostGIS configurada' as descripcion,
    CURRENT_TIMESTAMP as fecha_completion;
