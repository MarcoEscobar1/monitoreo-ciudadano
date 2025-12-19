-- =============================================
-- Agregar campo direccion a tabla usuarios
-- =============================================

DO $$ 
BEGIN
    -- Agregar columna direccion si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'monitoreo_ciudadano' 
        AND table_name = 'usuarios' 
        AND column_name = 'direccion'
    ) THEN
        ALTER TABLE monitoreo_ciudadano.usuarios 
        ADD COLUMN direccion TEXT;
        
        RAISE NOTICE 'Columna direccion agregada a tabla usuarios';
    ELSE
        RAISE NOTICE 'Columna direccion ya existe';
    END IF;
END $$;

-- Verificar estructura actualizada
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'monitoreo_ciudadano' 
  AND table_name = 'usuarios'
  AND column_name IN ('nombre', 'apellidos', 'telefono', 'direccion', 'avatar_url')
ORDER BY ordinal_position;
