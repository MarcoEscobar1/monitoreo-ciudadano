-- =====================================================
-- FIX: Zona Geográfica y Triggers
-- Deshabilita trigger problemático y crea función correcta
-- =====================================================

-- Usar el esquema correcto
SET search_path TO monitoreo_ciudadano, public;

-- Deshabilitar el trigger que causa problemas
DROP TRIGGER IF EXISTS trg_validacion_automatica ON monitoreo_ciudadano.reportes;

-- Asegurarse de que la tabla zonas_geograficas esté en el esquema correcto
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'monitoreo_ciudadano' 
        AND table_name = 'zonas_geograficas'
    ) THEN
        -- Si la tabla existe sin esquema, moverla
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'zonas_geograficas'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.zonas_geograficas SET SCHEMA monitoreo_ciudadano;
        ELSE
            -- Crear la tabla si no existe
            CREATE TABLE monitoreo_ciudadano.zonas_geograficas (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                nombre VARCHAR(100) NOT NULL,
                codigo VARCHAR(20) UNIQUE NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                zona_padre_id UUID REFERENCES monitoreo_ciudadano.zonas_geograficas(id),
                poligono GEOMETRY(POLYGON, 4326),
                centro GEOMETRY(POINT, 4326),
                poblacion INTEGER,
                area_km2 DECIMAL(10,4),
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                metadata JSONB DEFAULT '{}'
            );

            -- Crear índices
            CREATE INDEX IF NOT EXISTS idx_zonas_poligono ON monitoreo_ciudadano.zonas_geograficas USING GIST(poligono);
            CREATE INDEX IF NOT EXISTS idx_zonas_centro ON monitoreo_ciudadano.zonas_geograficas USING GIST(centro);
            CREATE INDEX IF NOT EXISTS idx_zonas_codigo ON monitoreo_ciudadano.zonas_geograficas(codigo);
            CREATE INDEX IF NOT EXISTS idx_zonas_tipo ON monitoreo_ciudadano.zonas_geograficas(tipo);
            CREATE INDEX IF NOT EXISTS idx_zonas_padre ON monitoreo_ciudadano.zonas_geograficas(zona_padre_id);
        END IF;
    END IF;
END $$;

-- Crear o reemplazar la función obtener_zona_por_ubicacion
CREATE OR REPLACE FUNCTION monitoreo_ciudadano.obtener_zona_por_ubicacion(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION
) RETURNS UUID AS $$
DECLARE
    zona_id UUID;
    punto GEOMETRY;
BEGIN
    -- Crear punto geométrico
    punto := ST_SetSRID(ST_MakePoint(lng, lat), 4326);
    
    -- Buscar zona que contiene el punto (más específica primero)
    SELECT id INTO zona_id
    FROM monitoreo_ciudadano.zonas_geograficas
    WHERE ST_Contains(poligono, punto)
      AND activo = TRUE
    ORDER BY area_km2 ASC NULLS LAST
    LIMIT 1;
    
    -- Si no se encontró zona específica, buscar la más cercana
    IF zona_id IS NULL THEN
        SELECT id INTO zona_id
        FROM monitoreo_ciudadano.zonas_geograficas
        WHERE activo = TRUE
          AND centro IS NOT NULL
        ORDER BY ST_Distance(centro, punto) ASC
        LIMIT 1;
    END IF;
    
    RETURN zona_id;
END;
$$ LANGUAGE plpgsql;

-- Insertar zona por defecto si no existe ninguna
INSERT INTO monitoreo_ciudadano.zonas_geograficas (
    id,
    nombre, 
    codigo, 
    tipo,
    centro,
    poligono,
    area_km2,
    activo
) 
SELECT 
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Zona General',
    'ZONA-GEN',
    'GENERAL',
    ST_SetSRID(ST_MakePoint(-74.0817, 4.6097), 4326),
    ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(-74.2 4.5, -74.2 4.7, -73.9 4.7, -73.9 4.5, -74.2 4.5)')), 4326),
    100.0,
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM monitoreo_ciudadano.zonas_geograficas LIMIT 1
);

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Zona geográfica configurada correctamente';
END $$;
