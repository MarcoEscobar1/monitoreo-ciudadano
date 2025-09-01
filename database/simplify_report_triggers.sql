-- Script para simplificar la inserción de reportes
-- Eliminamos los triggers problemáticos y manejamos la lógica en el backend

-- 1. Eliminar triggers problemáticos
DROP TRIGGER IF EXISTS trg_detectar_similares ON monitoreo_ciudadano.reportes;
DROP TRIGGER IF EXISTS trg_notificacion_estado ON monitoreo_ciudadano.reportes;
DROP TRIGGER IF EXISTS trg_validar_coordenadas ON monitoreo_ciudadano.reportes;

-- 2. Mantener solo los triggers esenciales para auditoría y timestamps
-- trg_auditoria_reportes - MANTENER (ya funciona)
-- trg_reportes_fecha_modificacion - MANTENER (esencial)

-- 3. Verificar que los triggers restantes funcionan
SELECT 
    tgname as trigger_name,
    tgfoid::regproc as function_name,
    tgenabled as enabled
FROM pg_trigger 
WHERE tgrelid = 'monitoreo_ciudadano.reportes'::regclass 
AND tgname NOT LIKE 'RI_Constraint%'
ORDER BY tgname;
