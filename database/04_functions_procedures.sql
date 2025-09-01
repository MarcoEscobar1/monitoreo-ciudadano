-- =====================================================
-- FUNCIONES Y STORED PROCEDURES
-- App de Monitoreo Ciudadano
-- =====================================================

SET search_path TO monitoreo_ciudadano, public;

-- =====================================================
-- FUNCIÓN: calcular_distancia_reportes
-- Calcula la distancia entre dos reportes en metros
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_distancia_reportes(
    ubicacion1 GEOMETRY,
    ubicacion2 GEOMETRY
) RETURNS DECIMAL AS $$
BEGIN
    RETURN ST_Distance(
        ST_Transform(ubicacion1, 3857), -- Proyección web mercator para metros
        ST_Transform(ubicacion2, 3857)
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: obtener_zona_por_ubicacion
-- Determina la zona geográfica basada en coordenadas
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_zona_por_ubicacion(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION
) RETURNS UUID AS $$
DECLARE
    zona_id UUID;
    punto GEOMETRY;
BEGIN
    -- Crear punto geométrico
    punto := ST_SetSRID(ST_MakePoint(lng, lat), 4326);
    
    -- Buscar zona que contiene el punto (más específica primero)
    SELECT id INTO zona_id
    FROM zonas_geograficas
    WHERE ST_Contains(poligono, punto)
      AND activo = TRUE
    ORDER BY area_km2 ASC -- Zona más pequeña = más específica
    LIMIT 1;
    
    RETURN zona_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: validar_reporte_automatico
-- Valida automáticamente un reporte basado en reglas
-- =====================================================
CREATE OR REPLACE FUNCTION validar_reporte_automatico(
    reporte_uuid UUID
) RETURNS BOOLEAN AS $$
DECLARE
    reporte_record RECORD;
    reportes_cercanos INTEGER;
    usuario_reportes_recientes INTEGER;
    es_valido BOOLEAN := TRUE;
BEGIN
    -- Obtener información del reporte
    SELECT r.*, u.fecha_registro, c.requiere_validacion
    INTO reporte_record
    FROM reportes r
    JOIN usuarios u ON r.usuario_id = u.id
    JOIN categorias_problemas c ON r.categoria_id = c.id
    WHERE r.id = reporte_uuid;
    
    -- Si la categoría no requiere validación, aprobar automáticamente
    IF NOT reporte_record.requiere_validacion THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar si hay demasiados reportes similares cerca
    SELECT COUNT(*) INTO reportes_cercanos
    FROM reportes r
    WHERE r.id != reporte_uuid
      AND r.categoria_id = reporte_record.categoria_id
      AND ST_DWithin(
          ST_Transform(r.ubicacion, 3857),
          ST_Transform(reporte_record.ubicacion, 3857),
          100 -- 100 metros
      )
      AND r.fecha_creacion > (CURRENT_TIMESTAMP - INTERVAL '24 hours');
    
    IF reportes_cercanos > 3 THEN
        es_valido := FALSE;
    END IF;
    
    -- Verificar si el usuario ha hecho muchos reportes recientemente
    SELECT COUNT(*) INTO usuario_reportes_recientes
    FROM reportes r
    WHERE r.usuario_id = reporte_record.usuario_id
      AND r.fecha_creacion > (CURRENT_TIMESTAMP - INTERVAL '1 hour');
    
    IF usuario_reportes_recientes > 5 THEN
        es_valido := FALSE;
    END IF;
    
    -- Verificar si es un usuario muy nuevo (menos de 24 horas)
    IF reporte_record.fecha_registro > (CURRENT_TIMESTAMP - INTERVAL '24 hours') THEN
        es_valido := FALSE;
    END IF;
    
    RETURN es_valido;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: detectar_reportes_similares
-- Detecta reportes potencialmente duplicados
-- =====================================================
CREATE OR REPLACE FUNCTION detectar_reportes_similares(
    reporte_uuid UUID,
    radio_metros INTEGER DEFAULT 500,
    umbral_similitud DECIMAL DEFAULT 0.7
) RETURNS TABLE(
    reporte_similar_id UUID,
    similitud_total DECIMAL,
    distancia_metros DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH reporte_base AS (
        SELECT ubicacion, categoria_id, titulo, descripcion
        FROM reportes
        WHERE id = reporte_uuid
    ),
    candidatos AS (
        SELECT 
            r.id,
            r.ubicacion,
            r.titulo,
            r.descripcion,
            r.categoria_id,
            calcular_distancia_reportes(rb.ubicacion, r.ubicacion) as distancia
        FROM reportes r, reporte_base rb
        WHERE r.id != reporte_uuid
          AND r.estado IN ('PENDIENTE', 'EN_REVISION', 'EN_PROCESO')
          AND ST_DWithin(
              ST_Transform(r.ubicacion, 3857),
              ST_Transform(rb.ubicacion, 3857),
              radio_metros
          )
    )
    SELECT 
        c.id,
        CASE 
            WHEN c.categoria_id = (SELECT categoria_id FROM reporte_base) THEN 0.4
            ELSE 0.0
        END +
        CASE 
            WHEN c.distancia <= 50 THEN 0.3
            WHEN c.distancia <= 100 THEN 0.2
            WHEN c.distancia <= 250 THEN 0.1
            ELSE 0.0
        END +
        -- Similitud de texto básica (longitud de descripción similar)
        CASE 
            WHEN ABS(LENGTH(c.descripcion) - LENGTH((SELECT descripcion FROM reporte_base))) <= 50 THEN 0.3
            ELSE 0.0
        END as similitud_calculada,
        c.distancia
    FROM candidatos c
    WHERE (
        CASE 
            WHEN c.categoria_id = (SELECT categoria_id FROM reporte_base) THEN 0.4
            ELSE 0.0
        END +
        CASE 
            WHEN c.distancia <= 50 THEN 0.3
            WHEN c.distancia <= 100 THEN 0.2
            WHEN c.distancia <= 250 THEN 0.1
            ELSE 0.0
        END +
        CASE 
            WHEN ABS(LENGTH(c.descripcion) - LENGTH((SELECT descripcion FROM reporte_base))) <= 50 THEN 0.3
            ELSE 0.0
        END
    ) >= umbral_similitud
    ORDER BY similitud_calculada DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: actualizar_estadisticas_reporte
-- Actualiza contadores y métricas de un reporte
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_estadisticas_reporte(
    reporte_uuid UUID
) RETURNS VOID AS $$
DECLARE
    total_votos INTEGER;
    reportes_similares_count INTEGER;
BEGIN
    -- Actualizar conteo de votos
    SELECT COALESCE(SUM(valor), 0) INTO total_votos
    FROM votos_reportes
    WHERE reporte_id = reporte_uuid;
    
    -- Actualizar conteo de reportes similares
    SELECT COUNT(*) INTO reportes_similares_count
    FROM reportes_similares
    WHERE reporte_original_id = reporte_uuid
       OR reporte_similar_id = reporte_uuid;
    
    -- Actualizar el reporte
    UPDATE reportes
    SET 
        votos_ciudadanos = total_votos,
        reportes_similares = reportes_similares_count,
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = reporte_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: cambiar_estado_reporte
-- Maneja el cambio de estado con validaciones y auditoría
-- =====================================================
CREATE OR REPLACE FUNCTION cambiar_estado_reporte(
    reporte_uuid UUID,
    nuevo_estado estado_reporte,
    usuario_responsable_uuid UUID,
    comentario_cambio TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    estado_actual estado_reporte;
    cambio_valido BOOLEAN := TRUE;
BEGIN
    -- Obtener estado actual
    SELECT estado INTO estado_actual
    FROM reportes
    WHERE id = reporte_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reporte no encontrado: %', reporte_uuid;
    END IF;
    
    -- Validar transiciones de estado válidas
    IF estado_actual = nuevo_estado THEN
        RETURN FALSE; -- Sin cambios
    END IF;
    
    -- Reglas de transición de estados
    CASE estado_actual
        WHEN 'PENDIENTE' THEN
            cambio_valido := nuevo_estado IN ('EN_REVISION', 'RECHAZADO');
        WHEN 'EN_REVISION' THEN
            cambio_valido := nuevo_estado IN ('EN_PROCESO', 'PENDIENTE', 'RECHAZADO', 'DUPLICADO');
        WHEN 'EN_PROCESO' THEN
            cambio_valido := nuevo_estado IN ('RESUELTO', 'EN_REVISION');
        WHEN 'RESUELTO' THEN
            cambio_valido := nuevo_estado IN ('EN_PROCESO'); -- Reabrir caso
        WHEN 'RECHAZADO' THEN
            cambio_valido := nuevo_estado IN ('PENDIENTE'); -- Reconsiderar
        WHEN 'DUPLICADO' THEN
            cambio_valido := nuevo_estado IN ('PENDIENTE'); -- Reconsiderar
        ELSE
            cambio_valido := FALSE;
    END CASE;
    
    IF NOT cambio_valido THEN
        RAISE EXCEPTION 'Transición de estado no válida: % -> %', estado_actual, nuevo_estado;
    END IF;
    
    -- Actualizar el reporte
    UPDATE reportes
    SET 
        estado = nuevo_estado,
        fecha_actualizacion = CURRENT_TIMESTAMP,
        fecha_resolucion = CASE 
            WHEN nuevo_estado = 'RESUELTO' THEN CURRENT_TIMESTAMP
            ELSE NULL
        END
    WHERE id = reporte_uuid;
    
    -- Insertar en historial de estados
    INSERT INTO historial_estados (
        reporte_id,
        estado_anterior,
        estado_nuevo,
        usuario_responsable_id,
        comentario
    ) VALUES (
        reporte_uuid,
        estado_actual,
        nuevo_estado,
        usuario_responsable_uuid,
        comentario_cambio
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: limpiar_sesiones_expiradas
-- Limpia sesiones expiradas automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION limpiar_sesiones_expiradas()
RETURNS INTEGER AS $$
DECLARE
    sesiones_eliminadas INTEGER;
BEGIN
    -- Marcar sesiones expiradas como inactivas
    UPDATE sesiones_usuario
    SET activa = FALSE
    WHERE fecha_expiracion < CURRENT_TIMESTAMP
      AND activa = TRUE;
    
    GET DIAGNOSTICS sesiones_eliminadas = ROW_COUNT;
    
    -- Eliminar sesiones muy antiguas (más de 30 días)
    DELETE FROM sesiones_usuario
    WHERE fecha_expiracion < (CURRENT_TIMESTAMP - INTERVAL '30 days');
    
    RETURN sesiones_eliminadas;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: obtener_estadisticas_zona
-- Obtiene estadísticas de reportes por zona geográfica
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_estadisticas_zona(
    zona_uuid UUID,
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS TABLE(
    total_reportes INTEGER,
    reportes_pendientes INTEGER,
    reportes_en_proceso INTEGER,
    reportes_resueltos INTEGER,
    tiempo_promedio_resolucion INTERVAL,
    categoria_mas_reportada VARCHAR(100)
) AS $$
BEGIN
    -- Establecer fechas por defecto si no se proporcionan
    fecha_inicio := COALESCE(fecha_inicio, CURRENT_TIMESTAMP - INTERVAL '30 days');
    fecha_fin := COALESCE(fecha_fin, CURRENT_TIMESTAMP);
    
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE r.estado = 'PENDIENTE') as pendientes,
            COUNT(*) FILTER (WHERE r.estado = 'EN_PROCESO') as en_proceso,
            COUNT(*) FILTER (WHERE r.estado = 'RESUELTO') as resueltos,
            AVG(r.fecha_resolucion - r.fecha_creacion) FILTER (WHERE r.estado = 'RESUELTO') as tiempo_avg,
            MODE() WITHIN GROUP (ORDER BY cp.nombre) as categoria_top
        FROM reportes r
        JOIN categorias_problemas cp ON r.categoria_id = cp.id
        WHERE r.zona_geografica_id = zona_uuid
          AND r.fecha_creacion BETWEEN fecha_inicio AND fecha_fin
    )
    SELECT 
        total::INTEGER,
        pendientes::INTEGER,
        en_proceso::INTEGER,
        resueltos::INTEGER,
        tiempo_avg,
        categoria_top
    FROM stats;
END;
$$ LANGUAGE plpgsql;

-- Comentarios de funciones
COMMENT ON FUNCTION calcular_distancia_reportes IS 'Calcula distancia entre reportes en metros';
COMMENT ON FUNCTION obtener_zona_por_ubicacion IS 'Determina zona geográfica por coordenadas';
COMMENT ON FUNCTION validar_reporte_automatico IS 'Validación automática de reportes nuevos';
COMMENT ON FUNCTION detectar_reportes_similares IS 'Detección de reportes duplicados por proximidad';
COMMENT ON FUNCTION cambiar_estado_reporte IS 'Cambio controlado de estados con auditoría';
COMMENT ON FUNCTION limpiar_sesiones_expiradas IS 'Limpieza automática de sesiones';
COMMENT ON FUNCTION obtener_estadisticas_zona IS 'Estadísticas de reportes por zona';

COMMIT;
