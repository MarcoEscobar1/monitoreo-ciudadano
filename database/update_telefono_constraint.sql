-- =============================================
-- Actualizar constraint de telefono para 8 digitos
-- (Solo para Bolivia)
-- =============================================

-- Eliminar constraint anterior
ALTER TABLE monitoreo_ciudadano.usuarios 
DROP CONSTRAINT IF EXISTS chk_telefono_format;

-- Agregar nuevo constraint para 8 digitos
ALTER TABLE monitoreo_ciudadano.usuarios 
ADD CONSTRAINT chk_telefono_format CHECK (telefono IS NULL OR telefono ~ '^[0-9]{8}$');

-- Verificar constraint actualizado
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'chk_telefono_format';
