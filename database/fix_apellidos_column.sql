-- Arreglo para hacer apellidos opcional
-- Ejecutar este SQL en la base de datos

-- Hacer la columna apellidos opcional (nullable)
ALTER TABLE monitoreo_ciudadano.usuarios 
ALTER COLUMN apellidos DROP NOT NULL;

-- Verificar el cambio
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_schema = 'monitoreo_ciudadano' 
  AND table_name = 'usuarios' 
  AND column_name IN ('nombre', 'apellidos');
