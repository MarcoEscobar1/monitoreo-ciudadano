-- Corregir categorías con acentos correctos
UPDATE monitoreo_ciudadano.categorias_problemas 
SET nombre = 'Energía Eléctrica', descripcion = 'Problemas relacionados con el servicio de electricidad'
WHERE nombre LIKE '%Energ%ctrica%';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET nombre = 'Recolección de Basura', descripcion = 'Problemas con la recolección de residuos'
WHERE nombre LIKE '%Recolecci%n de Basura%';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET nombre = 'Vías y Baches', descripcion = 'Problemas en calles, avenidas y baches'
WHERE nombre LIKE '%V%as y Baches%';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET nombre = 'Alumbrado Público', descripcion = 'Problemas con la iluminación pública'
WHERE nombre LIKE '%Alumbrado P%blico%';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET nombre = 'Alcantarillado y Drenaje', descripcion = 'Problemas con el sistema de alcantarillado'
WHERE nombre LIKE '%Alcantarillado%';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET nombre = 'Transporte Público', descripcion = 'Problemas con el servicio de transporte público'
WHERE nombre LIKE '%Transporte P%blico%';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET nombre = 'Contaminación Ambiental', descripcion = 'Problemas de contaminación del aire, ruido, etc.'
WHERE nombre LIKE '%Contaminaci%n%';

UPDATE monitoreo_ciudadano.categorias_problemas 
SET nombre = 'Seguridad Pública', descripcion = 'Problemas relacionados con la seguridad ciudadana'
WHERE nombre LIKE '%Seguridad P%blica%';

-- Verificar los cambios
SELECT id, nombre, descripcion FROM monitoreo_ciudadano.categorias_problemas ORDER BY nombre;
