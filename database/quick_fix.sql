-- =====================================================
-- SCRIPT DE CORRECCIÓN RÁPIDA
-- Solo los fixes necesarios
-- =====================================================

-- Conectar al esquema correcto
\c monitoreo_ciudadano;
SET search_path TO monitoreo_ciudadano, public;

-- 1. Corregir función de zona
CREATE OR REPLACE FUNCTION obtener_zona_por_ubicacion(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION
) RETURNS UUID AS $$
DECLARE
    zona_id UUID;
    punto GEOMETRY;
BEGIN
    punto := ST_SetSRID(ST_MakePoint(lng, lat), 4326);
    
    SELECT id INTO zona_id
    FROM zonas_geograficas
    WHERE ST_Contains(poligono, punto)
      AND activo = TRUE
    ORDER BY area_km2 ASC
    LIMIT 1;
    
    RETURN zona_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Insertar usuario de prueba básico (sin OAuth por ahora)
INSERT INTO usuarios (email, nombre, apellidos, telefono, password_hash, tipo_usuario, email_verificado, metodo_auth) 
VALUES ('test@email.com', 'Usuario', 'Prueba', '+57 300 000 0000', crypt('test123', gen_salt('bf', 12)), 'CIUDADANO', true, 'EMAIL')
ON CONFLICT (email) DO NOTHING;

-- 3. Insertar un reporte básico de prueba
DO $$
DECLARE
    usuario_test UUID;
    categoria_agua UUID;
    zona_chapinero UUID;
BEGIN
    -- Obtener IDs
    SELECT id INTO usuario_test FROM usuarios WHERE email = 'test@email.com';
    SELECT id INTO categoria_agua FROM categorias_problemas WHERE tipo_problema = 'AGUA' LIMIT 1;
    SELECT id INTO zona_chapinero FROM zonas_geograficas WHERE nombre = 'Chapinero';
    
    -- Insertar reporte solo si tenemos los datos
    IF usuario_test IS NOT NULL AND categoria_agua IS NOT NULL THEN
        INSERT INTO reportes (
            usuario_id, categoria_id, zona_geografica_id, titulo, descripcion, 
            ubicacion, direccion, estado, prioridad, validado
        ) VALUES (
            usuario_test,
            categoria_agua,
            zona_chapinero,
            'Reporte de prueba - Sin agua',
            'Reporte de prueba para verificar funcionamiento del sistema',
            ST_GeomFromText('POINT(-74.0589 4.6535)', 4326),
            'Dirección de prueba, Chapinero',
            'PENDIENTE',
            'MEDIA',
            true
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Verificar resultados
SELECT 'VERIFICACIÓN FINAL' as status;
SELECT COUNT(*) as usuarios FROM usuarios;
SELECT COUNT(*) as reportes FROM reportes;
SELECT COUNT(*) as zonas FROM zonas_geograficas;
SELECT COUNT(*) as categorias FROM categorias_problemas WHERE activo = true;
