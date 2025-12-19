-- ============================================
-- FIX: Corregir campo validado para reportes pendientes
-- ============================================
-- Los reportes con estado='PENDIENTE' deben tener validado=NULL
-- no validado=false (que indica rechazado)
-- ============================================

-- Ver reportes afectados antes de la corrección
SELECT 
    id,
    titulo,
    estado,
    validado,
    fecha_creacion
FROM monitoreo_ciudadano.reportes
WHERE estado = 'PENDIENTE' AND validado = false
ORDER BY fecha_creacion DESC;

-- Corregir reportes pendientes
UPDATE monitoreo_ciudadano.reportes
SET validado = NULL
WHERE estado = 'PENDIENTE' AND validado = false;

-- Verificar la corrección
SELECT 
    id,
    titulo,
    estado,
    validado,
    fecha_creacion
FROM monitoreo_ciudadano.reportes
WHERE estado = 'PENDIENTE'
ORDER BY fecha_creacion DESC;

-- Resumen de estados
SELECT 
    estado,
    validado,
    COUNT(*) as cantidad
FROM monitoreo_ciudadano.reportes
GROUP BY estado, validado
ORDER BY estado, validado;
