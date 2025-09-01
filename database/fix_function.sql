SET search_path TO monitoreo_ciudadano, public;

CREATE OR REPLACE FUNCTION obtener_zona_por_ubicacion(
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
    FROM zonas_geograficas
    WHERE ST_Contains(poligono, punto)
      AND activo = TRUE
    ORDER BY area_km2 ASC -- Zona más pequeña = más específica
    LIMIT 1;
    
    RETURN zona_id;
END;
$$ LANGUAGE plpgsql;
