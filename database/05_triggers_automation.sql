-- =====================================================
-- TRIGGERS Y AUTOMATIZACIÓN
-- App de Monitoreo Ciudadano
-- =====================================================

SET search_path TO monitoreo_ciudadano, public;

-- =====================================================
-- TRIGGER: trigger_actualizar_fecha_modificacion
-- Actualiza automáticamente fecha_actualizacion
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas relevantes
CREATE TRIGGER trg_reportes_fecha_modificacion
    BEFORE UPDATE ON reportes
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trg_comentarios_fecha_modificacion
    BEFORE UPDATE ON comentarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trg_usuarios_fecha_modificacion
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- =====================================================
-- TRIGGER: trigger_auditoria_reportes
-- Auditoría automática de cambios en reportes
-- =====================================================
CREATE OR REPLACE FUNCTION auditoria_reportes()
RETURNS TRIGGER AS $$
DECLARE
    accion_realizada VARCHAR(50);
    datos_anteriores JSONB;
    datos_nuevos JSONB;
    usuario_sesion UUID;
BEGIN
    -- Determinar tipo de acción
    IF TG_OP = 'INSERT' THEN
        accion_realizada := 'CREATE_REPORT';
        datos_nuevos := to_jsonb(NEW);
        datos_anteriores := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        accion_realizada := 'UPDATE_REPORT';
        datos_anteriores := to_jsonb(OLD);
        datos_nuevos := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        accion_realizada := 'DELETE_REPORT';
        datos_anteriores := to_jsonb(OLD);
        datos_nuevos := NULL;
    END IF;
    
    -- Obtener usuario de la sesión actual (si existe)
    usuario_sesion := COALESCE(
        CASE TG_OP 
            WHEN 'INSERT' THEN NEW.usuario_id
            WHEN 'UPDATE' THEN NEW.usuario_id
            WHEN 'DELETE' THEN OLD.usuario_id
        END
    );
    
    -- Insertar log de auditoría
    INSERT INTO logs_auditoria (
        usuario_id,
        accion,
        entidad,
        entidad_id,
        datos_anteriores,
        datos_nuevos,
        nivel
    ) VALUES (
        usuario_sesion,
        accion_realizada,
        'REPORTE',
        COALESCE(NEW.id, OLD.id),
        datos_anteriores,
        datos_nuevos,
        CASE TG_OP 
            WHEN 'DELETE' THEN 'WARN'
            ELSE 'INFO'
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auditoria_reportes
    AFTER INSERT OR UPDATE OR DELETE ON reportes
    FOR EACH ROW
    EXECUTE FUNCTION auditoria_reportes();

-- =====================================================
-- TRIGGER: trigger_validacion_automatica
-- Validación automática de reportes nuevos
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_validacion_automatica()
RETURNS TRIGGER AS $$
DECLARE
    es_valido BOOLEAN;
    zona_id UUID;
BEGIN
    -- Solo procesar reportes nuevos
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    -- Determinar zona geográfica automáticamente
    zona_id := obtener_zona_por_ubicacion(
        ST_Y(NEW.ubicacion), 
        ST_X(NEW.ubicacion)
    );
    
    -- Actualizar zona si se encontró
    IF zona_id IS NOT NULL THEN
        NEW.zona_geografica_id := zona_id;
    END IF;
    
    -- Ejecutar validación automática
    es_valido := validar_reporte_automatico(NEW.id);
    
    -- Actualizar estado de validación
    NEW.validado := es_valido;
    
    IF es_valido THEN
        NEW.fecha_validacion := CURRENT_TIMESTAMP;
        NEW.comentarios_validacion := 'Validado automáticamente por el sistema';
    ELSE
        NEW.comentarios_validacion := 'Requiere validación manual - detectadas posibles inconsistencias';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validacion_automatica
    BEFORE INSERT ON reportes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validacion_automatica();

-- =====================================================
-- TRIGGER: trigger_detectar_similares
-- Detección automática de reportes similares
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_detectar_similares()
RETURNS TRIGGER AS $$
DECLARE
    reporte_similar RECORD;
BEGIN
    -- Solo procesar reportes nuevos
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    -- Buscar reportes similares
    FOR reporte_similar IN 
        SELECT * FROM detectar_reportes_similares(NEW.id, 500, 0.6)
    LOOP
        -- Insertar relación de similitud
        INSERT INTO reportes_similares (
            reporte_original_id,
            reporte_similar_id,
            similitud_total,
            similitud_ubicacion,
            similitud_categoria,
            fecha_deteccion
        ) VALUES (
            NEW.id,
            reporte_similar.reporte_similar_id,
            reporte_similar.similitud_total,
            CASE 
                WHEN reporte_similar.distancia_metros <= 100 THEN 0.9
                WHEN reporte_similar.distancia_metros <= 250 THEN 0.7
                ELSE 0.5
            END,
            TRUE, -- Asumimos que detectar_reportes_similares ya filtró por categoría
            CURRENT_TIMESTAMP
        ) ON CONFLICT (reporte_original_id, reporte_similar_id) DO NOTHING;
        
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detectar_similares
    AFTER INSERT ON reportes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_detectar_similares();

-- =====================================================
-- TRIGGER: trigger_notificacion_estado
-- Genera notificaciones automáticas al cambiar estados
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_notificacion_estado()
RETURNS TRIGGER AS $$
DECLARE
    titulo_notificacion VARCHAR(200);
    mensaje_notificacion TEXT;
    tipo_notificacion VARCHAR(50);
BEGIN
    -- Solo procesar cambios de estado
    IF TG_OP != 'UPDATE' OR OLD.estado = NEW.estado THEN
        RETURN NEW;
    END IF;
    
    -- Configurar notificación según el nuevo estado
    CASE NEW.estado
        WHEN 'EN_REVISION' THEN
            tipo_notificacion := 'REPORTE_EN_REVISION';
            titulo_notificacion := 'Tu reporte está en revisión';
            mensaje_notificacion := 'Hemos recibido tu reporte "' || NEW.titulo || '" y está siendo revisado por nuestro equipo.';
        
        WHEN 'EN_PROCESO' THEN
            tipo_notificacion := 'REPORTE_EN_PROCESO';
            titulo_notificacion := 'Tu reporte está siendo atendido';
            mensaje_notificacion := 'Nos complace informarte que tu reporte "' || NEW.titulo || '" está siendo atendido por las autoridades competentes.';
        
        WHEN 'RESUELTO' THEN
            tipo_notificacion := 'REPORTE_RESUELTO';
            titulo_notificacion := '¡Tu reporte ha sido resuelto!';
            mensaje_notificacion := 'Excelente noticia: tu reporte "' || NEW.titulo || '" ha sido marcado como resuelto. Gracias por contribuir a mejorar nuestra comunidad.';
        
        WHEN 'RECHAZADO' THEN
            tipo_notificacion := 'REPORTE_RECHAZADO';
            titulo_notificacion := 'Tu reporte ha sido rechazado';
            mensaje_notificacion := 'Lamentamos informarte que tu reporte "' || NEW.titulo || '" ha sido rechazado. Puedes contactar con soporte para más información.';
        
        WHEN 'DUPLICADO' THEN
            tipo_notificacion := 'REPORTE_DUPLICADO';
            titulo_notificacion := 'Tu reporte es un duplicado';
            mensaje_notificacion := 'Tu reporte "' || NEW.titulo || '" ha sido marcado como duplicado de otro reporte existente.';
        
        ELSE
            RETURN NEW; -- No generar notificación para otros estados
    END CASE;
    
    -- Insertar notificación
    INSERT INTO notificaciones (
        usuario_id,
        reporte_id,
        tipo,
        titulo,
        mensaje,
        accion_url,
        metadata
    ) VALUES (
        NEW.usuario_id,
        NEW.id,
        tipo_notificacion,
        titulo_notificacion,
        mensaje_notificacion,
        '/reportes/' || NEW.id::text,
        jsonb_build_object(
            'estado_anterior', OLD.estado,
            'estado_nuevo', NEW.estado,
            'fecha_cambio', CURRENT_TIMESTAMP
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notificacion_estado
    AFTER UPDATE ON reportes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_notificacion_estado();

-- =====================================================
-- TRIGGER: trigger_actualizar_ultimo_acceso
-- Actualiza fecha de último acceso del usuario
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_actualizar_ultimo_acceso()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar en operaciones de inserción de sesiones
    IF TG_OP = 'INSERT' THEN
        UPDATE usuarios 
        SET fecha_ultimo_acceso = CURRENT_TIMESTAMP
        WHERE id = NEW.usuario_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_ultimo_acceso
    AFTER INSERT ON sesiones_usuario
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_ultimo_acceso();

-- =====================================================
-- TRIGGER: trigger_estadisticas_reportes
-- Actualiza estadísticas automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_estadisticas_reportes()
RETURNS TRIGGER AS $$
DECLARE
    reporte_id_afectado UUID;
BEGIN
    -- Determinar qué reporte actualizar
    CASE TG_TABLE_NAME
        WHEN 'votos_reportes' THEN
            reporte_id_afectado := COALESCE(NEW.reporte_id, OLD.reporte_id);
        WHEN 'reportes_similares' THEN
            reporte_id_afectado := COALESCE(NEW.reporte_original_id, OLD.reporte_original_id);
        ELSE
            RETURN COALESCE(NEW, OLD);
    END CASE;
    
    -- Actualizar estadísticas de forma asíncrona
    PERFORM actualizar_estadisticas_reporte(reporte_id_afectado);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas que afectan estadísticas
CREATE TRIGGER trg_estadisticas_votos
    AFTER INSERT OR UPDATE OR DELETE ON votos_reportes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_estadisticas_reportes();

CREATE TRIGGER trg_estadisticas_similares
    AFTER INSERT OR UPDATE OR DELETE ON reportes_similares
    FOR EACH ROW
    EXECUTE FUNCTION trigger_estadisticas_reportes();

-- =====================================================
-- TRIGGER: trigger_validar_coordenadas
-- Valida que las coordenadas estén dentro de rangos válidos
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_validar_coordenadas()
RETURNS TRIGGER AS $$
DECLARE
    latitud DECIMAL;
    longitud DECIMAL;
BEGIN
    -- Extraer coordenadas
    latitud := ST_Y(NEW.ubicacion);
    longitud := ST_X(NEW.ubicacion);
    
    -- Validar rangos básicos
    IF latitud < -90 OR latitud > 90 THEN
        RAISE EXCEPTION 'Latitud fuera de rango válido: %', latitud;
    END IF;
    
    IF longitud < -180 OR longitud > 180 THEN
        RAISE EXCEPTION 'Longitud fuera de rango válido: %', longitud;
    END IF;
    
    -- Validar que no sean coordenadas nulas (0,0)
    IF latitud = 0 AND longitud = 0 THEN
        RAISE EXCEPTION 'Coordenadas no pueden ser (0,0) - ubicación no válida';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_coordenadas
    BEFORE INSERT OR UPDATE ON reportes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validar_coordenadas();

-- Comentarios de triggers
COMMENT ON FUNCTION actualizar_fecha_modificacion IS 'Actualiza automáticamente timestamp de modificación';
COMMENT ON FUNCTION auditoria_reportes IS 'Genera logs de auditoría para cambios en reportes';
COMMENT ON FUNCTION trigger_validacion_automatica IS 'Valida automáticamente reportes nuevos';
COMMENT ON FUNCTION trigger_detectar_similares IS 'Detecta reportes similares al crear nuevos';
COMMENT ON FUNCTION trigger_notificacion_estado IS 'Genera notificaciones automáticas por cambios de estado';
COMMENT ON FUNCTION trigger_actualizar_ultimo_acceso IS 'Actualiza fecha de último acceso del usuario';
COMMENT ON FUNCTION trigger_estadisticas_reportes IS 'Actualiza estadísticas de reportes automáticamente';
COMMENT ON FUNCTION trigger_validar_coordenadas IS 'Valida coordenadas GPS antes de insertar';

COMMIT;
