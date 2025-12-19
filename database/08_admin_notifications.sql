-- Script para agregar notificaciones automáticas a administradores
-- cuando se crea un nuevo reporte

-- Función para notificar a administradores sobre nuevos reportes
CREATE OR REPLACE FUNCTION monitoreo_ciudadano.notificar_nuevo_reporte_admin()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar notificación para todos los administradores y moderadores
    INSERT INTO monitoreo_ciudadano.notificaciones (
        usuario_id,
        tipo_notificacion,
        titulo,
        mensaje,
        reporte_id,
        leida
    )
    SELECT 
        u.id,
        'NUEVO_REPORTE',
        'Nuevo reporte pendiente de validación',
        CONCAT('El usuario ha creado un reporte: "', NEW.titulo, '". Requiere validación.'),
        NEW.id,
        false
    FROM monitoreo_ciudadano.usuarios u
    WHERE u.tipo_usuario IN ('ADMINISTRADOR', 'MODERADOR')
        AND u.activo = true;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta después de insertar un reporte
DROP TRIGGER IF EXISTS trigger_notificar_admin_nuevo_reporte ON monitoreo_ciudadano.reportes;

CREATE TRIGGER trigger_notificar_admin_nuevo_reporte
AFTER INSERT ON monitoreo_ciudadano.reportes
FOR EACH ROW
EXECUTE FUNCTION monitoreo_ciudadano.notificar_nuevo_reporte_admin();

-- Función para notificar al usuario cuando su reporte es validado
CREATE OR REPLACE FUNCTION monitoreo_ciudadano.notificar_reporte_validado()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo notificar si el reporte cambió de no validado a validado
    IF (OLD.validado = false AND NEW.validado = true) THEN
        INSERT INTO monitoreo_ciudadano.notificaciones (
            usuario_id,
            tipo_notificacion,
            titulo,
            mensaje,
            reporte_id,
            leida
        )
        VALUES (
            NEW.usuario_id,
            'REPORTE_VALIDADO',
            '¡Tu reporte ha sido validado!',
            CONCAT('Tu reporte "', NEW.titulo, '" ha sido validado y ahora es visible públicamente.'),
            NEW.id,
            false
        );
    END IF;
    
    -- Notificar si el reporte fue rechazado
    IF (OLD.estado != 'RECHAZADO' AND NEW.estado = 'RECHAZADO') THEN
        INSERT INTO monitoreo_ciudadano.notificaciones (
            usuario_id,
            tipo_notificacion,
            titulo,
            mensaje,
            reporte_id,
            leida
        )
        VALUES (
            NEW.usuario_id,
            'REPORTE_RECHAZADO',
            'Tu reporte fue rechazado',
            CONCAT('Tu reporte "', NEW.titulo, '" fue rechazado. Motivo: ', COALESCE(NEW.comentarios_validacion, 'No especificado')),
            NEW.id,
            false
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta después de actualizar un reporte
DROP TRIGGER IF EXISTS trigger_notificar_reporte_validado ON monitoreo_ciudadano.reportes;

CREATE TRIGGER trigger_notificar_reporte_validado
AFTER UPDATE ON monitoreo_ciudadano.reportes
FOR EACH ROW
EXECUTE FUNCTION monitoreo_ciudadano.notificar_reporte_validado();

-- Verificar que los triggers se crearon correctamente
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'monitoreo_ciudadano'
    AND trigger_name IN ('trigger_notificar_admin_nuevo_reporte', 'trigger_notificar_reporte_validado');

-- Comentarios informativos
COMMENT ON FUNCTION monitoreo_ciudadano.notificar_nuevo_reporte_admin() IS 
'Función que notifica a todos los administradores y moderadores cuando se crea un nuevo reporte';

COMMENT ON FUNCTION monitoreo_ciudadano.notificar_reporte_validado() IS 
'Función que notifica al usuario cuando su reporte es validado o rechazado';

COMMENT ON TRIGGER trigger_notificar_admin_nuevo_reporte ON monitoreo_ciudadano.reportes IS 
'Trigger que ejecuta notificación a admins después de insertar un reporte';

COMMENT ON TRIGGER trigger_notificar_reporte_validado ON monitoreo_ciudadano.reportes IS 
'Trigger que ejecuta notificación al usuario después de validar/rechazar su reporte';
