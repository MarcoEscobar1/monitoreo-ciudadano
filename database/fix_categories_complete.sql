-- Corrección completa de todas las categorías con encoding UTF-8
UPDATE monitoreo_ciudadano.categorias_problemas SET nombre = 'Alumbrado Público', descripcion = 'Problemas con la iluminación pública' WHERE id = 'd79c5189-aebf-44fa-8dc1-0ad568d36b8e';
UPDATE monitoreo_ciudadano.categorias_problemas SET nombre = 'Apagón Total', descripcion = 'Ausencia completa de energía eléctrica' WHERE id = 'f7f5f251-1704-4488-b9b3-12f97424eeb2';
UPDATE monitoreo_ciudadano.categorias_problemas SET nombre = 'Baja Presión', descripcion = 'Presión insuficiente en el suministro' WHERE id = '2ecec13f-8f42-4e63-90e8-38c6468aa955';
UPDATE monitoreo_ciudadano.categorias_problemas SET nombre = 'Cable Caído', descripcion = 'Cables eléctricos en el suelo' WHERE id = 'b820558e-3e5f-4ff0-930f-4c7f76a20778';
UPDATE monitoreo_ciudadano.categorias_problemas SET nombre = 'Energía Eléctrica', descripcion = 'Problemas relacionados con el servicio de electricidad' WHERE id = 'f6a936a0-ce73-4ce3-be9a-4fe4c5a4d28a';
UPDATE monitoreo_ciudadano.categorias_problemas SET nombre = 'Fuga en Tubería', descripcion = 'Escape de agua en tuberías públicas' WHERE id = '78e1b1ca-c18a-46e5-bbdb-30cc338dc9a2';
UPDATE monitoreo_ciudadano.categorias_problemas SET nombre = 'Recolección de Basura', descripcion = 'Problemas con la recolección de residuos' WHERE id = '053219b4-a133-4ed4-ad30-dd27a8d539dd';
UPDATE monitoreo_ciudadano.categorias_problemas SET nombre = 'Vías y Baches', descripcion = 'Problemas en calles, avenidas y baches' WHERE id = 'b91566f8-afd3-46e0-8749-82fb57e58bb3';

-- Verificar los cambios
SELECT id, nombre, descripcion FROM monitoreo_ciudadano.categorias_problemas ORDER BY nombre;
