-- =====================================================
-- TABLAS SECUNDARIAS Y RELACIONES
-- App de Monitoreo Ciudadano
-- =====================================================

SET search_path TO monitoreo_ciudadano, public;

-- =====================================================
-- TABLA: notificaciones
-- Sistema de notificaciones para usuarios
-- =====================================================
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    reporte_id UUID REFERENCES reportes(id) ON DELETE CASCADE,
    
    -- Contenido de la notificación
    tipo VARCHAR(50) NOT NULL, -- 'REPORTE_CREADO', 'ESTADO_CAMBIADO', 'COMENTARIO_AGREGADO', etc.
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    
    -- Estado y entrega
    leida BOOLEAN DEFAULT FALSE,
    enviada_push BOOLEAN DEFAULT FALSE,
    fecha_envio_push TIMESTAMP WITH TIME ZONE,
    
    -- Datos adicionales
    accion_url TEXT, -- Deep link para abrir en app
    icono VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_leida TIMESTAMP WITH TIME ZONE
);

-- Índices para notificaciones
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_reporte ON notificaciones(reporte_id);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(tipo);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_fecha ON notificaciones(fecha_creacion);

-- =====================================================
-- TABLA: comentarios
-- Comentarios y actualizaciones en reportes
-- =====================================================
CREATE TABLE comentarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporte_id UUID NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    comentario_padre_id UUID REFERENCES comentarios(id), -- Para respuestas
    
    -- Contenido
    contenido TEXT NOT NULL,
    es_oficial BOOLEAN DEFAULT FALSE, -- Comentario de entidad oficial
    es_publico BOOLEAN DEFAULT TRUE,
    
    -- Multimedia
    imagenes TEXT[], -- URLs de imágenes adjuntas
    
    -- Moderación
    moderado BOOLEAN DEFAULT FALSE,
    moderado_por UUID REFERENCES usuarios(id),
    fecha_moderacion TIMESTAMP WITH TIME ZONE,
    razon_moderacion TEXT,
    
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_contenido_no_vacio CHECK (LENGTH(TRIM(contenido)) > 0)
);

-- Índices para comentarios
CREATE INDEX idx_comentarios_reporte ON comentarios(reporte_id);
CREATE INDEX idx_comentarios_usuario ON comentarios(usuario_id);
CREATE INDEX idx_comentarios_padre ON comentarios(comentario_padre_id);
CREATE INDEX idx_comentarios_oficial ON comentarios(es_oficial);
CREATE INDEX idx_comentarios_fecha ON comentarios(fecha_creacion);

-- =====================================================
-- TABLA: votos_reportes
-- Sistema de votación ciudadana para reportes
-- =====================================================
CREATE TABLE votos_reportes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporte_id UUID NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Tipo de voto: +1 (importante), 0 (neutral), -1 (no relevante)
    valor INTEGER NOT NULL CHECK (valor IN (-1, 0, 1)),
    
    fecha_voto TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Un usuario solo puede votar una vez por reporte
    UNIQUE(reporte_id, usuario_id)
);

-- Índices para votos
CREATE INDEX idx_votos_reporte ON votos_reportes(reporte_id);
CREATE INDEX idx_votos_usuario ON votos_reportes(usuario_id);
CREATE INDEX idx_votos_valor ON votos_reportes(valor);

-- =====================================================
-- TABLA: reportes_similares
-- Detección automática de reportes duplicados/similares
-- =====================================================
CREATE TABLE reportes_similares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporte_original_id UUID NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
    reporte_similar_id UUID NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
    
    -- Métricas de similitud
    similitud_ubicacion DECIMAL(5,4), -- 0.0 a 1.0
    similitud_texto DECIMAL(5,4), -- 0.0 a 1.0
    similitud_categoria BOOLEAN DEFAULT FALSE,
    similitud_total DECIMAL(5,4), -- Puntuación combinada
    
    -- Validación manual
    confirmado_por_usuario BOOLEAN,
    validado_por UUID REFERENCES usuarios(id),
    fecha_validacion TIMESTAMP WITH TIME ZONE,
    
    fecha_deteccion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- No puede haber reportes similares a sí mismos
    CONSTRAINT chk_reportes_diferentes CHECK (reporte_original_id != reporte_similar_id),
    -- Evitar duplicados (A->B y B->A)
    UNIQUE(reporte_original_id, reporte_similar_id)
);

-- Índices para reportes similares
CREATE INDEX idx_similares_original ON reportes_similares(reporte_original_id);
CREATE INDEX idx_similares_similar ON reportes_similares(reporte_similar_id);
CREATE INDEX idx_similares_total ON reportes_similares(similitud_total);
CREATE INDEX idx_similares_confirmado ON reportes_similares(confirmado_por_usuario);

-- =====================================================
-- TABLA: sesiones_usuario
-- Manejo de sesiones y tokens JWT
-- =====================================================
CREATE TABLE sesiones_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Información de la sesión
    token_hash VARCHAR(255) NOT NULL, -- Hash del JWT token
    refresh_token_hash VARCHAR(255),
    
    -- Información del dispositivo
    dispositivo_info JSONB, -- User agent, OS, etc.
    ip_address INET,
    ubicacion_aproximada GEOMETRY(POINT, 4326),
    
    -- Estado de la sesión
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_ultimo_uso TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_fecha_expiracion CHECK (fecha_expiracion > fecha_creacion)
);

-- Índices para sesiones
CREATE INDEX idx_sesiones_usuario ON sesiones_usuario(usuario_id);
CREATE INDEX idx_sesiones_token ON sesiones_usuario(token_hash);
CREATE INDEX idx_sesiones_activa ON sesiones_usuario(activa);
CREATE INDEX idx_sesiones_expiracion ON sesiones_usuario(fecha_expiracion);

-- =====================================================
-- TABLA: configuracion_sistema
-- Configuraciones dinámicas del sistema
-- =====================================================
CREATE TABLE configuracion_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    descripcion TEXT,
    categoria VARCHAR(50),
    
    -- Validación
    valor_minimo DECIMAL,
    valor_maximo DECIMAL,
    patron_validacion VARCHAR(255),
    
    -- Control de cambios
    modificable BOOLEAN DEFAULT TRUE,
    modificado_por UUID REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para configuración
CREATE INDEX idx_config_clave ON configuracion_sistema(clave);
CREATE INDEX idx_config_categoria ON configuracion_sistema(categoria);
CREATE INDEX idx_config_modificable ON configuracion_sistema(modificable);

-- =====================================================
-- TABLA: logs_auditoria
-- Registro de auditoría para acciones importantes
-- =====================================================
CREATE TABLE logs_auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Actor de la acción
    usuario_id UUID REFERENCES usuarios(id),
    sesion_id UUID REFERENCES sesiones_usuario(id),
    
    -- Información de la acción
    accion VARCHAR(100) NOT NULL, -- 'CREATE_REPORT', 'UPDATE_STATUS', etc.
    entidad VARCHAR(50) NOT NULL, -- 'REPORTE', 'USUARIO', etc.
    entidad_id UUID NOT NULL,
    
    -- Datos del cambio
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    cambios_detectados TEXT[],
    
    -- Contexto
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    
    fecha_accion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Nivel de importancia
    nivel VARCHAR(20) DEFAULT 'INFO' -- 'DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'
);

-- Índices para auditoría
CREATE INDEX idx_auditoria_usuario ON logs_auditoria(usuario_id);
CREATE INDEX idx_auditoria_accion ON logs_auditoria(accion);
CREATE INDEX idx_auditoria_entidad ON logs_auditoria(entidad, entidad_id);
CREATE INDEX idx_auditoria_fecha ON logs_auditoria(fecha_accion);
CREATE INDEX idx_auditoria_nivel ON logs_auditoria(nivel);

-- Comentarios de tablas
COMMENT ON TABLE notificaciones IS 'Sistema de notificaciones push y en app';
COMMENT ON TABLE comentarios IS 'Comentarios jerárquicos en reportes';
COMMENT ON TABLE votos_reportes IS 'Sistema de votación ciudadana';
COMMENT ON TABLE reportes_similares IS 'Detección automática de reportes duplicados';
COMMENT ON TABLE sesiones_usuario IS 'Manejo de sesiones JWT y seguridad';
COMMENT ON TABLE configuracion_sistema IS 'Configuraciones dinámicas del sistema';
COMMENT ON TABLE logs_auditoria IS 'Auditoría completa de acciones del sistema';

COMMIT;
