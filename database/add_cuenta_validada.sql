-- =====================================================
-- AGREGAR CAMPO PARA VALIDACIÓN DE CUENTAS
-- Este campo permite que el admin valide cuentas nuevas
-- =====================================================

-- Agregar columna cuenta_validada
ALTER TABLE monitoreo_ciudadano.usuarios 
ADD COLUMN IF NOT EXISTS cuenta_validada BOOLEAN DEFAULT FALSE;

-- Agregar campos para tracking de validación
ALTER TABLE monitoreo_ciudadano.usuarios 
ADD COLUMN IF NOT EXISTS validada_por UUID REFERENCES monitoreo_ciudadano.usuarios(id);

ALTER TABLE monitoreo_ciudadano.usuarios 
ADD COLUMN IF NOT EXISTS fecha_validacion TIMESTAMP WITH TIME ZONE;

ALTER TABLE monitoreo_ciudadano.usuarios 
ADD COLUMN IF NOT EXISTS comentarios_validacion TEXT;

-- Crear índice para búsquedas eficientes de cuentas pendientes
CREATE INDEX IF NOT EXISTS idx_usuarios_cuenta_validada 
ON monitoreo_ciudadano.usuarios(cuenta_validada) 
WHERE cuenta_validada = FALSE;

-- Validar todas las cuentas existentes (menos ciudadanos nuevos)
UPDATE monitoreo_ciudadano.usuarios 
SET cuenta_validada = TRUE 
WHERE tipo_usuario IN ('ADMINISTRADOR', 'MODERADOR') 
   OR fecha_registro < NOW() - INTERVAL '1 hour'; -- Cuentas antiguas se consideran válidas

-- Comentario sobre el cambio
COMMENT ON COLUMN monitoreo_ciudadano.usuarios.cuenta_validada IS 
'Indica si la cuenta fue validada por un administrador. Las cuentas nuevas requieren validación antes de poder usar la aplicación.';

COMMENT ON COLUMN monitoreo_ciudadano.usuarios.validada_por IS 
'ID del administrador que validó la cuenta';

COMMENT ON COLUMN monitoreo_ciudadano.usuarios.fecha_validacion IS 
'Fecha y hora en que la cuenta fue validada';

COMMENT ON COLUMN monitoreo_ciudadano.usuarios.comentarios_validacion IS 
'Comentarios del administrador sobre la validación o rechazo de la cuenta';
