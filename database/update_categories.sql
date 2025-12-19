-- =====================================================
-- ACTUALIZAR CATEGORIAS Y ESTRUCTURA DE TABLA
-- Eliminar campos innecesarios y actualizar categorías
-- =====================================================

SET search_path TO monitoreo_ciudadano, public;

-- IMPORTANTE: Esto eliminará todos los reportes existentes
-- Si deseas conservar reportes, comenta la siguiente línea
DELETE FROM monitoreo_ciudadano.reportes;

-- Borrar todas las categorías existentes
DELETE FROM monitoreo_ciudadano.categorias_problemas;

-- Eliminar columnas innecesarias de la tabla
ALTER TABLE monitoreo_ciudadano.categorias_problemas 
DROP COLUMN IF EXISTS categoria_padre_id,
DROP COLUMN IF EXISTS icono,
DROP COLUMN IF EXISTS color,
DROP COLUMN IF EXISTS tiempo_respuesta_esperado,
DROP COLUMN IF EXISTS orden_visualizacion;

-- Insertar nuevas categorías sin acentos
INSERT INTO categorias_problemas (nombre, descripcion, tipo_problema, prioridad_base) VALUES
('Colapso de alcantarillas', 'Hundimiento o daño en sistema de alcantarillado', 'AGUA', 'ALTA'),
('Acumulacion de basura', 'Acumulacion de residuos en espacios publicos', 'BASURA', 'MEDIA'),
('Poste caido', 'Poste de luz o telefono caido', 'LUZ', 'CRITICA'),
('Corte de alumbrado publico', 'Fallas en iluminacion de espacios publicos', 'ALUMBRADO_PUBLICO', 'MEDIA'),
('Corte de luz', 'Ausencia de energia electrica', 'LUZ', 'ALTA'),
('Fuga de gas', 'Escape de gas en tuberias o instalaciones', 'ALUMBRADO_PUBLICO', 'CRITICA'),
('Baches', 'Huecos o daños en calles y carreteras', 'BACHES', 'MEDIA'),
('Arbol caido', 'Arbol derribado obstruyendo vias o propiedades', 'BACHES', 'ALTA'),
('Calles intransitables', 'Vias bloqueadas o en mal estado', 'BACHES', 'ALTA'),
('Fuga de agua potable', 'Escape de agua en tuberias publicas', 'AGUA', 'ALTA'),
('Agua potable contaminada', 'Agua con calidad comprometida', 'AGUA', 'CRITICA');

-- Verificar estructura de la tabla actualizada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'monitoreo_ciudadano' 
  AND table_name = 'categorias_problemas'
ORDER BY ordinal_position;

-- Verificar categorías insertadas
SELECT id, nombre, tipo_problema, prioridad_base, activo
FROM categorias_problemas 
ORDER BY nombre;
