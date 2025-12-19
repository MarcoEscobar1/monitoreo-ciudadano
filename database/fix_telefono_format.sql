-- =============================================
-- Limpiar telefonos y actualizar constraint
-- =============================================

-- Actualizar telefono valido de Bolivia (quitar +591)
UPDATE monitoreo_ciudadano.usuarios 
SET telefono = '33333333'
WHERE telefono = '+591 33333333';

-- Limpiar telefonos invalidos (no son de Bolivia)
UPDATE monitoreo_ciudadano.usuarios 
SET telefono = NULL
WHERE telefono LIKE '+57%';

-- Eliminar constraint anterior
ALTER TABLE monitoreo_ciudadano.usuarios 
DROP CONSTRAINT IF EXISTS chk_telefono_format;

-- Agregar nuevo constraint para 8 digitos
ALTER TABLE monitoreo_ciudadano.usuarios 
ADD CONSTRAINT chk_telefono_format CHECK (telefono IS NULL OR telefono ~ '^[0-9]{8}$');

-- Verificar telefonos actualizados
SELECT id, nombre, telefono 
FROM monitoreo_ciudadano.usuarios 
WHERE telefono IS NOT NULL;
