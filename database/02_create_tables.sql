-- =====================================================
-- CREACIÓN DE TABLAS PRINCIPALES
-- App de Monitoreo Ciudadano
-- =====================================================

SET search_path TO monitoreo_ciudadano, public;

-- =====================================================
-- TABLA: usuarios
-- Almacena información de todos los usuarios del sistema
-- =====================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    password_hash VARCHAR(255), -- NULL para usuarios OAuth
    metodo_auth metodo_autenticacion NOT NULL DEFAULT 'EMAIL',
    oauth_id VARCHAR(255), -- ID del proveedor OAuth
    tipo_usuario tipo_usuario NOT NULL DEFAULT 'CIUDADANO',
    avatar_url TEXT,
    email_verificado BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_ultimo_acceso TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT chk_oauth_email CHECK (
        (metodo_auth = 'EMAIL' AND password_hash IS NOT NULL) OR
        (metodo_auth IN ('GOOGLE', 'FACEBOOK') AND oauth_id IS NOT NULL)
    ),
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_telefono_format CHECK (telefono IS NULL OR telefono ~ '^[0-9]{8}$')
);

-- Índices para usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX idx_usuarios_metodo_auth ON usuarios(metodo_auth);
CREATE INDEX idx_usuarios_oauth_id ON usuarios(oauth_id) WHERE oauth_id IS NOT NULL;
CREATE INDEX idx_usuarios_fecha_registro ON usuarios(fecha_registro);

-- =====================================================
-- TABLA: zonas_geograficas
-- Define zonas administrativas para agrupar reportes
-- =====================================================
CREATE TABLE zonas_geograficas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'MUNICIPIO', 'BARRIO', 'COMUNA', etc.
    zona_padre_id UUID REFERENCES zonas_geograficas(id),
    poligono GEOMETRY(POLYGON, 4326), -- Límites geográficos
    centro GEOMETRY(POINT, 4326), -- Punto central
    poblacion INTEGER,
    area_km2 DECIMAL(10,4),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Índices geoespaciales para zonas
CREATE INDEX idx_zonas_poligono ON zonas_geograficas USING GIST(poligono);
CREATE INDEX idx_zonas_centro ON zonas_geograficas USING GIST(centro);
CREATE INDEX idx_zonas_codigo ON zonas_geograficas(codigo);
CREATE INDEX idx_zonas_tipo ON zonas_geograficas(tipo);
CREATE INDEX idx_zonas_padre ON zonas_geograficas(zona_padre_id);

-- =====================================================
-- TABLA: categorias_problemas
-- Categorías dinámicas y jerarquía de problemas
-- =====================================================
CREATE TABLE categorias_problemas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo_problema tipo_problema NOT NULL,
    categoria_padre_id UUID REFERENCES categorias_problemas(id),
    icono VARCHAR(50), -- Nombre del icono para UI
    color VARCHAR(7), -- Color hexadecimal para UI
    prioridad_base prioridad_reporte DEFAULT 'MEDIA',
    tiempo_respuesta_esperado INTERVAL, -- Tiempo estimado de resolución
    requiere_validacion BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    orden_visualizacion INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para categorías
CREATE INDEX idx_categorias_tipo ON categorias_problemas(tipo_problema);
CREATE INDEX idx_categorias_padre ON categorias_problemas(categoria_padre_id);
CREATE INDEX idx_categorias_activo ON categorias_problemas(activo);
CREATE INDEX idx_categorias_orden ON categorias_problemas(orden_visualizacion);

-- =====================================================
-- TABLA: reportes
-- Tabla principal de reportes ciudadanos
-- =====================================================
CREATE TABLE reportes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES categorias_problemas(id),
    zona_geografica_id UUID REFERENCES zonas_geograficas(id),
    
    -- Información del reporte
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    estado estado_reporte DEFAULT 'PENDIENTE',
    prioridad prioridad_reporte DEFAULT 'MEDIA',
    
    -- Información geográfica
    ubicacion GEOMETRY(POINT, 4326) NOT NULL,
    direccion TEXT,
    direccion_calculada TEXT, -- Resultado de geocodificación inversa
    precision_gps DECIMAL(8,2), -- Precisión en metros
    
    -- Multimedia
    imagen_principal TEXT, -- URL de la imagen principal
    imagenes_adicionales TEXT[], -- Array de URLs
    
    -- Timestamps y seguimiento
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_estimada_resolucion TIMESTAMP WITH TIME ZONE,
    fecha_resolucion TIMESTAMP WITH TIME ZONE,
    
    -- Validación y moderación
    validado BOOLEAN DEFAULT FALSE,
    validado_por UUID REFERENCES usuarios(id),
    fecha_validacion TIMESTAMP WITH TIME ZONE,
    comentarios_validacion TEXT,
    
    -- Métricas y análisis
    vistas INTEGER DEFAULT 0,
    reportes_similares INTEGER DEFAULT 0,
    votos_ciudadanos INTEGER DEFAULT 0,
    
    -- Información adicional
    es_anonimo BOOLEAN DEFAULT FALSE,
    visible_publicamente BOOLEAN DEFAULT TRUE,
    metadatos JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT chk_coordenadas_validas CHECK (
        ST_X(ubicacion) BETWEEN -180 AND 180 AND 
        ST_Y(ubicacion) BETWEEN -90 AND 90
    ),
    CONSTRAINT chk_fecha_coherente CHECK (
        fecha_resolucion IS NULL OR fecha_resolucion >= fecha_creacion
    ),
    CONSTRAINT chk_estado_resolucion CHECK (
        (estado = 'RESUELTO' AND fecha_resolucion IS NOT NULL) OR
        (estado != 'RESUELTO' AND fecha_resolucion IS NULL)
    )
);

-- Índices principales para reportes
CREATE INDEX idx_reportes_usuario ON reportes(usuario_id);
CREATE INDEX idx_reportes_categoria ON reportes(categoria_id);
CREATE INDEX idx_reportes_zona ON reportes(zona_geografica_id);
CREATE INDEX idx_reportes_estado ON reportes(estado);
CREATE INDEX idx_reportes_prioridad ON reportes(prioridad);
CREATE INDEX idx_reportes_fecha_creacion ON reportes(fecha_creacion);
CREATE INDEX idx_reportes_ubicacion ON reportes USING GIST(ubicacion);
CREATE INDEX idx_reportes_validado ON reportes(validado);
CREATE INDEX idx_reportes_visible ON reportes(visible_publicamente);

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_reportes_estado_fecha ON reportes(estado, fecha_creacion);
CREATE INDEX idx_reportes_zona_estado ON reportes(zona_geografica_id, estado);
CREATE INDEX idx_reportes_categoria_estado ON reportes(categoria_id, estado);

-- =====================================================
-- TABLA: historial_estados
-- Seguimiento de cambios de estado en reportes
-- =====================================================
CREATE TABLE historial_estados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporte_id UUID NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
    estado_anterior estado_reporte,
    estado_nuevo estado_reporte NOT NULL,
    usuario_responsable_id UUID REFERENCES usuarios(id),
    comentario TEXT,
    fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Índices para historial de estados
CREATE INDEX idx_historial_reporte ON historial_estados(reporte_id);
CREATE INDEX idx_historial_fecha ON historial_estados(fecha_cambio);
CREATE INDEX idx_historial_usuario ON historial_estados(usuario_responsable_id);
CREATE INDEX idx_historial_estado_nuevo ON historial_estados(estado_nuevo);

COMMENT ON TABLE usuarios IS 'Usuarios del sistema con autenticación múltiple';
COMMENT ON TABLE zonas_geograficas IS 'Zonas administrativas con límites geográficos';
COMMENT ON TABLE categorias_problemas IS 'Categorías jerárquicas de problemas reportables';
COMMENT ON TABLE reportes IS 'Reportes ciudadanos con información geoespacial';
COMMENT ON TABLE historial_estados IS 'Auditoría de cambios de estado en reportes';

COMMIT;
