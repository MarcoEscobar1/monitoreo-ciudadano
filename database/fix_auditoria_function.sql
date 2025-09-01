-- Corregir función de auditoría para usar el esquema correcto
CREATE OR REPLACE FUNCTION monitoreo_ciudadano.auditoria_reportes()
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
    
    -- Insertar log de auditoría con esquema explícito
    INSERT INTO monitoreo_ciudadano.logs_auditoria (
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
