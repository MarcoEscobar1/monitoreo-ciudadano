-- Script para corregir la codificación de caracteres en las categorías de problemas
-- Fecha: 1 de septiembre de 2025

-- Corregir nombres con problemas de encoding
UPDATE monitoreo_ciudadano.categorias_problemas 
SET nombre = 'Recolección de Basura' 
WHERE nombre = 'Recolecci├│n de Basura';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET nombre = 'Baja Presión' 
WHERE nombre = 'Baja Presi├│n';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET nombre = 'Fuga en Tubería' 
WHERE nombre = 'Fuga en Tuber├¡a';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET nombre = 'Cable Caído' 
WHERE nombre = 'Cable Ca├¡do';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET nombre = 'Vías y Baches' 
WHERE nombre = 'V├¡as y Baches';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET nombre = 'Alumbrado Público' 
WHERE nombre = 'Alumbrado P├║blico';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET nombre = 'Energía Eléctrica' 
WHERE nombre = 'Energ├¡a El├®ctrica';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET nombre = 'Apagón Total' 
WHERE nombre = 'Apag├│n Total';

-- Corregir descripciones con problemas de encoding
UPDATE monitoreo_ciudadano.categorias_problemas 
SET descripcion = 'Problemas con la recolección de residuos' 
WHERE descripcion = 'Problemas con la recolecci├│n de residuos';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET descripcion = 'Presión insuficiente en el suministro' 
WHERE descripcion = 'Presi├│n insuficiente en el suministro';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET descripcion = 'Escape de agua en tuberías públicas' 
WHERE descripcion = 'Escape de agua en tuber├¡as p├║blicas';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET descripcion = 'Cables eléctricos en el suelo' 
WHERE descripcion = 'Cables el├®ctricos en el suelo';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET descripcion = 'Problemas con la iluminación pública' 
WHERE descripcion = 'Problemas con la iluminaci├│n p├║blica';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET descripcion = 'Ausencia completa de energía eléctrica' 
WHERE descripcion = 'Ausencia completa de energ├¡a el├®ctrica';

-- Verificar los cambios
SELECT id, nombre, descripcion 
FROM monitoreo_ciudadano.categorias_problemas 
ORDER BY nombre;

COMMIT;
