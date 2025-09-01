-- =====================================================
-- DATOS DE PRUEBA Y SEEDERS
-- App de Monitoreo Ciudadano
-- =====================================================

SET search_path TO monitoreo_ciudadano, public;

-- Limpiar datos existentes (CUIDADO en producción)
-- TRUNCATE TABLE logs_auditoria CASCADE;
-- TRUNCATE TABLE sesiones_usuario CASCADE;
-- TRUNCATE TABLE reportes_similares CASCADE;
-- TRUNCATE TABLE votos_reportes CASCADE;
-- TRUNCATE TABLE comentarios CASCADE;
-- TRUNCATE TABLE notificaciones CASCADE;
-- TRUNCATE TABLE historial_estados CASCADE;
-- TRUNCATE TABLE reportes CASCADE;
-- TRUNCATE TABLE categorias_problemas CASCADE;
-- TRUNCATE TABLE zonas_geograficas CASCADE;
-- TRUNCATE TABLE usuarios CASCADE;

-- =====================================================
-- DATOS: configuracion_sistema
-- Configuraciones básicas del sistema
-- =====================================================
INSERT INTO configuracion_sistema (clave, valor, tipo, descripcion, categoria) VALUES
('max_reportes_por_usuario_dia', '10', 'number', 'Máximo de reportes que un usuario puede crear por día', 'LIMITES'),
('radio_deteccion_duplicados_metros', '500', 'number', 'Radio en metros para detectar reportes duplicados', 'DETECCION'),
('tiempo_expiracion_sesion_horas', '24', 'number', 'Tiempo de expiración de sesiones en horas', 'SEGURIDAD'),
('umbral_similitud_reportes', '0.7', 'number', 'Umbral de similitud para detectar reportes duplicados (0.0-1.0)', 'DETECCION'),
('validacion_automatica_habilitada', 'true', 'boolean', 'Habilitar validación automática de reportes', 'VALIDACION'),
('notificaciones_push_habilitadas', 'true', 'boolean', 'Habilitar notificaciones push', 'NOTIFICACIONES'),
('email_soporte', 'soporte@monitoreo.gov.co', 'string', 'Email de soporte técnico', 'CONTACTO'),
('url_base_imagenes', 'https://storage.monitoreo.gov.co/imagenes/', 'string', 'URL base para almacenamiento de imágenes', 'STORAGE');

-- =====================================================
-- DATOS: zonas_geograficas
-- Zonas geográficas de ejemplo (Bogotá, Colombia)
-- =====================================================
INSERT INTO zonas_geograficas (id, nombre, codigo, tipo, poligono, centro, poblacion, area_km2) VALUES
(
    uuid_generate_v4(),
    'Bogotá D.C.',
    'BOG-DC',
    'DISTRITO',
    ST_GeomFromText('POLYGON((-74.3 4.4, -74.0 4.4, -74.0 4.8, -74.3 4.8, -74.3 4.4))', 4326),
    ST_GeomFromText('POINT(-74.0721 4.6097)', 4326),
    8000000,
    1775.98
),
(
    uuid_generate_v4(),
    'Chapinero',
    'BOG-CHA',
    'LOCALIDAD',
    ST_GeomFromText('POLYGON((-74.08 4.58, -74.03 4.58, -74.03 4.68, -74.08 4.68, -74.08 4.58))', 4326),
    ST_GeomFromText('POINT(-74.055 4.63)', 4326),
    140000,
    38.15
),
(
    uuid_generate_v4(),
    'Zona Rosa',
    'BOG-CHA-ZR',
    'BARRIO',
    ST_GeomFromText('POLYGON((-74.065 4.65, -74.055 4.65, -74.055 4.67, -74.065 4.67, -74.065 4.65))', 4326),
    ST_GeomFromText('POINT(-74.06 4.66)', 4326),
    15000,
    2.5
),
(
    uuid_generate_v4(),
    'Kennedy',
    'BOG-KEN',
    'LOCALIDAD',
    ST_GeomFromText('POLYGON((-74.18 4.58, -74.13 4.58, -74.13 4.63, -74.18 4.63, -74.18 4.58))', 4326),
    ST_GeomFromText('POINT(-74.155 4.605)', 4326),
    1200000,
    38.59
),
(
    uuid_generate_v4(),
    'Suba',
    'BOG-SUB',
    'LOCALIDAD',
    ST_GeomFromText('POLYGON((-74.15 4.70, -74.08 4.70, -74.08 4.78, -74.15 4.78, -74.15 4.70))', 4326),
    ST_GeomFromText('POINT(-74.115 4.74)', 4326),
    1300000,
    100.56
);

-- =====================================================
-- DATOS: categorias_problemas
-- Categorías jerárquicas de problemas
-- =====================================================

-- Categorías principales
INSERT INTO categorias_problemas (id, nombre, descripcion, tipo_problema, icono, color, prioridad_base, tiempo_respuesta_esperado, orden_visualizacion) VALUES
(uuid_generate_v4(), 'Servicio de Agua', 'Problemas relacionados con el suministro de agua potable', 'AGUA', 'water-drop', '#2196F3', 'ALTA', '2 days', 1),
(uuid_generate_v4(), 'Energía Eléctrica', 'Fallas en el suministro eléctrico', 'LUZ', 'flash', '#FF9800', 'ALTA', '1 day', 2),
(uuid_generate_v4(), 'Recolección de Basura', 'Problemas con la recolección de residuos', 'BASURA', 'trash-can', '#4CAF50', 'MEDIA', '3 days', 3),
(uuid_generate_v4(), 'Vías y Baches', 'Daños en calles y carreteras', 'BACHES', 'road-variant', '#795548', 'MEDIA', '7 days', 4),
(uuid_generate_v4(), 'Alumbrado Público', 'Fallas en la iluminación de espacios públicos', 'ALUMBRADO_PUBLICO', 'lightbulb', '#FFC107', 'MEDIA', '5 days', 5);

-- Subcategorías de agua
INSERT INTO categorias_problemas (nombre, descripcion, tipo_problema, categoria_padre_id, icono, color, prioridad_base, tiempo_respuesta_esperado) 
SELECT 
    subcategoria.nombre,
    subcategoria.descripcion,
    'AGUA',
    cp.id,
    subcategoria.icono,
    subcategoria.color,
    subcategoria.prioridad::prioridad_reporte,
    subcategoria.tiempo::INTERVAL
FROM categorias_problemas cp,
(VALUES 
    ('Sin Agua', 'Ausencia total del servicio de agua', 'water-off', '#F44336', 'CRITICA', '6 hours'),
    ('Baja Presión', 'Presión insuficiente en el suministro', 'water-pump', '#FF5722', 'ALTA', '1 day'),
    ('Agua Turbia', 'Calidad del agua comprometida', 'water-alert', '#FF9800', 'ALTA', '12 hours'),
    ('Fuga en Tubería', 'Escape de agua en tuberías públicas', 'pipe-leak', '#2196F3', 'MEDIA', '2 days')
) AS subcategoria(nombre, descripcion, icono, color, prioridad, tiempo)
WHERE cp.tipo_problema = 'AGUA' AND cp.categoria_padre_id IS NULL;

-- Subcategorías de luz
INSERT INTO categorias_problemas (nombre, descripcion, tipo_problema, categoria_padre_id, icono, color, prioridad_base, tiempo_respuesta_esperado)
SELECT 
    subcategoria.nombre,
    subcategoria.descripcion,
    'LUZ',
    cp.id,
    subcategoria.icono,
    subcategoria.color,
    subcategoria.prioridad::prioridad_reporte,
    subcategoria.tiempo::INTERVAL
FROM categorias_problemas cp,
(VALUES 
    ('Apagón Total', 'Ausencia completa de energía eléctrica', 'power-off', '#F44336', 'CRITICA', '2 hours'),
    ('Cortes Intermitentes', 'Interrupciones frecuentes del servicio', 'power', '#FF5722', 'ALTA', '4 hours'),
    ('Voltaje Irregular', 'Fluctuaciones en el voltaje', 'sine-wave', '#FF9800', 'MEDIA', '1 day'),
    ('Cable Caído', 'Cables eléctricos en el suelo', 'power-socket', '#F44336', 'CRITICA', '30 minutes')
) AS subcategoria(nombre, descripcion, icono, color, prioridad, tiempo)
WHERE cp.tipo_problema = 'LUZ' AND cp.categoria_padre_id IS NULL;

-- =====================================================
-- DATOS: usuarios
-- Usuarios de prueba con diferentes roles
-- =====================================================
INSERT INTO usuarios (id, email, nombre, apellidos, telefono, password_hash, tipo_usuario, email_verificado, metodo_auth, oauth_id) VALUES
(uuid_generate_v4(), 'admin@monitoreo.gov.co', 'Administrador', 'Sistema', '+57 300 123 4567', crypt('admin123', gen_salt('bf', 12)), 'ADMINISTRADOR', true, 'EMAIL', NULL),
(uuid_generate_v4(), 'moderador@monitoreo.gov.co', 'Juan Carlos', 'Pérez Moderador', '+57 310 234 5678', crypt('mod123', gen_salt('bf', 12)), 'MODERADOR', true, 'EMAIL', NULL),
(uuid_generate_v4(), 'ciudadano1@email.com', 'María', 'González Ciudadana', '+57 320 345 6789', crypt('user123', gen_salt('bf', 12)), 'CIUDADANO', true, 'EMAIL', NULL),
(uuid_generate_v4(), 'ciudadano2@email.com', 'Carlos', 'Rodríguez López', '+57 330 456 7890', crypt('user123', gen_salt('bf', 12)), 'CIUDADANO', true, 'EMAIL', NULL),
(uuid_generate_v4(), 'ciudadano3@email.com', 'Ana', 'Martínez Silva', '+57 340 567 8901', crypt('user123', gen_salt('bf', 12)), 'CIUDADANO', false, 'EMAIL', NULL),
-- Usuario OAuth de prueba
(uuid_generate_v4(), 'usuario.google@gmail.com', 'Pedro', 'Google User', '+57 350 678 9012', NULL, 'CIUDADANO', true, 'GOOGLE', 'google_123456789');

-- =====================================================
-- DATOS: reportes
-- Reportes de ejemplo con ubicaciones reales en Bogotá
-- =====================================================

-- Obtener IDs necesarios para los reportes
DO $$
DECLARE
    usuario_maria UUID;
    usuario_carlos UUID;
    usuario_ana UUID;
    categoria_agua UUID;
    categoria_luz UUID;
    categoria_basura UUID;
    categoria_baches UUID;
    zona_chapinero UUID;
    zona_kennedy UUID;
    zona_suba UUID;
BEGIN
    -- Obtener IDs de usuarios
    SELECT id INTO usuario_maria FROM usuarios WHERE email = 'ciudadano1@email.com';
    SELECT id INTO usuario_carlos FROM usuarios WHERE email = 'ciudadano2@email.com';
    SELECT id INTO usuario_ana FROM usuarios WHERE email = 'ciudadano3@email.com';
    
    -- Obtener IDs de categorías principales
    SELECT id INTO categoria_agua FROM categorias_problemas WHERE tipo_problema = 'AGUA' AND categoria_padre_id IS NULL;
    SELECT id INTO categoria_luz FROM categorias_problemas WHERE tipo_problema = 'LUZ' AND categoria_padre_id IS NULL;
    SELECT id INTO categoria_basura FROM categorias_problemas WHERE tipo_problema = 'BASURA' AND categoria_padre_id IS NULL;
    SELECT id INTO categoria_baches FROM categorias_problemas WHERE tipo_problema = 'BACHES' AND categoria_padre_id IS NULL;
    
    -- Obtener IDs de zonas
    SELECT id INTO zona_chapinero FROM zonas_geograficas WHERE codigo = 'BOG-CHA';
    SELECT id INTO zona_kennedy FROM zonas_geograficas WHERE codigo = 'BOG-KEN';
    SELECT id INTO zona_suba FROM zonas_geograficas WHERE codigo = 'BOG-SUB';
    
    -- Insertar reportes de prueba
    INSERT INTO reportes (
        id, usuario_id, categoria_id, zona_geografica_id, titulo, descripcion, 
        ubicacion, direccion, estado, prioridad, imagen_principal, 
        fecha_creacion, validado
    ) VALUES
    -- Reporte 1: Sin agua en Chapinero (RESUELTO)
    (
        uuid_generate_v4(),
        usuario_maria,
        categoria_agua,
        zona_chapinero,
        'Sin agua en edificio residencial',
        'Llevamos 3 días sin agua en el edificio. Afecta a más de 50 familias. La administración reportó que es un problema de la red principal.',
        ST_GeomFromText('POINT(-74.0589 4.6535)', 4326),
        'Carrera 13 #63-45, Chapinero',
        'RESUELTO',
        'ALTA',
        'https://storage.monitoreo.gov.co/imagenes/reporte_001.jpg',
        CURRENT_TIMESTAMP - INTERVAL '5 days',
        true
    ),
    -- Reporte 2: Apagón en Kennedy (EN_PROCESO)
    (
        uuid_generate_v4(),
        usuario_carlos,
        categoria_luz,
        zona_kennedy,
        'Apagón en sector comercial',
        'Apagón desde ayer en la noche que afecta todo el sector comercial de la Avenida Primero de Mayo. Los comerciantes están perdiendo mercancía.',
        ST_GeomFromText('POINT(-74.1553 4.6028)', 4326),
        'Avenida Primero de Mayo #45-12, Kennedy',
        'EN_PROCESO',
        'CRITICA',
        'https://storage.monitoreo.gov.co/imagenes/reporte_002.jpg',
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        true
    ),
    -- Reporte 3: Basura acumulada en Suba (PENDIENTE)
    (
        uuid_generate_v4(),
        usuario_ana,
        categoria_basura,
        zona_suba,
        'Basura acumulada hace una semana',
        'La basura no ha sido recogida en una semana. Se está generando mal olor y posibles problemas de salud. Hay ratas y moscas.',
        ST_GeomFromText('POINT(-74.1124 4.7389)', 4326),
        'Calle 140 #91-23, Suba',
        'PENDIENTE',
        'MEDIA',
        'https://storage.monitoreo.gov.co/imagenes/reporte_003.jpg',
        CURRENT_TIMESTAMP - INTERVAL '2 days',
        false
    ),
    -- Reporte 4: Bache peligroso en Chapinero (EN_REVISION)
    (
        uuid_generate_v4(),
        usuario_maria,
        categoria_baches,
        zona_chapinero,
        'Bache gigante en vía principal',
        'Bache de aproximadamente 2 metros de diámetro en la Carrera 7ma. Ya han ocurrido varios accidentes menores. Es muy peligroso especialmente en la noche.',
        ST_GeomFromText('POINT(-74.0607 4.6589)', 4326),
        'Carrera 7 #65-23, Chapinero',
        'EN_REVISION',
        'ALTA',
        'https://storage.monitoreo.gov.co/imagenes/reporte_004.jpg',
        CURRENT_TIMESTAMP - INTERVAL '3 days',
        true
    ),
    -- Reporte 5: Fuga de agua en Kennedy (EN_PROCESO)
    (
        uuid_generate_v4(),
        usuario_carlos,
        categoria_agua,
        zona_kennedy,
        'Fuga masiva de agua en tubería principal',
        'Fuga muy grande en la tubería principal que está inundando la calle. El agua está corriendo hacia las casas vecinas.',
        ST_GeomFromText('POINT(-74.1489 4.6156)', 4326),
        'Calle 38 Sur #78-45, Kennedy',
        'EN_PROCESO',
        'CRITICA',
        'https://storage.monitoreo.gov.co/imagenes/reporte_005.jpg',
        CURRENT_TIMESTAMP - INTERVAL '6 hours',
        true
    );
    
    -- Actualizar fecha de resolución para reportes resueltos
    UPDATE reportes 
    SET fecha_resolucion = fecha_creacion + INTERVAL '3 days'
    WHERE estado = 'RESUELTO';
    
END $$;

-- =====================================================
-- DATOS: comentarios
-- Comentarios en los reportes
-- =====================================================
DO $$
DECLARE
    usuario_moderador UUID;
    usuario_admin UUID;
    reporte_agua UUID;
    reporte_luz UUID;
    reporte_basura UUID;
BEGIN
    SELECT id INTO usuario_moderador FROM usuarios WHERE email = 'moderador@monitoreo.gov.co';
    SELECT id INTO usuario_admin FROM usuarios WHERE email = 'admin@monitoreo.gov.co';
    
    -- Obtener algunos reportes
    SELECT id INTO reporte_agua FROM reportes WHERE titulo LIKE '%Sin agua%' LIMIT 1;
    SELECT id INTO reporte_luz FROM reportes WHERE titulo LIKE '%Apagón%' LIMIT 1;
    SELECT id INTO reporte_basura FROM reportes WHERE titulo LIKE '%Basura%' LIMIT 1;
    
    INSERT INTO comentarios (reporte_id, usuario_id, contenido, es_oficial, fecha_creacion) VALUES
    (reporte_agua, usuario_moderador, 'Hemos contactado a la empresa de acueducto. Están trabajando en la reparación de la tubería principal.', true, CURRENT_TIMESTAMP - INTERVAL '4 days'),
    (reporte_agua, usuario_admin, 'Problema resuelto. Se reparó la tubería principal y se restableció el servicio.', true, CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (reporte_luz, usuario_moderador, 'Reporte escalado a la empresa de energía. Están despachando una cuadrilla técnica.', true, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
    (reporte_basura, usuario_moderador, 'Pendiente de validación. Necesitamos verificar la programación de recolección en esa zona.', true, CURRENT_TIMESTAMP - INTERVAL '1 day');
    
END $$;

-- =====================================================
-- DATOS: votos_reportes
-- Votos ciudadanos en reportes
-- =====================================================
DO $$
DECLARE
    usuarios_cursor CURSOR FOR SELECT id FROM usuarios WHERE tipo_usuario = 'CIUDADANO';
    reportes_cursor CURSOR FOR SELECT id FROM reportes;
    usuario_rec RECORD;
    reporte_rec RECORD;
    voto_valor INTEGER;
BEGIN
    -- Generar votos aleatorios
    FOR usuario_rec IN usuarios_cursor LOOP
        FOR reporte_rec IN reportes_cursor LOOP
            -- 70% probabilidad de votar
            IF random() < 0.7 THEN
                -- 80% votos positivos, 15% neutrales, 5% negativos
                CASE 
                    WHEN random() < 0.8 THEN voto_valor := 1;
                    WHEN random() < 0.95 THEN voto_valor := 0;
                    ELSE voto_valor := -1;
                END CASE;
                
                INSERT INTO votos_reportes (reporte_id, usuario_id, valor) 
                VALUES (reporte_rec.id, usuario_rec.id, voto_valor)
                ON CONFLICT (reporte_id, usuario_id) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- DATOS: historial_estados
-- Historial de cambios de estado en reportes
-- =====================================================
DO $$
DECLARE
    usuario_moderador UUID;
    reporte_resuelto UUID;
    reporte_proceso UUID;
    reporte_revision UUID;
BEGIN
    SELECT id INTO usuario_moderador FROM usuarios WHERE email = 'moderador@monitoreo.gov.co';
    
    SELECT id INTO reporte_resuelto FROM reportes WHERE estado = 'RESUELTO' LIMIT 1;
    SELECT id INTO reporte_proceso FROM reportes WHERE estado = 'EN_PROCESO' LIMIT 1;
    SELECT id INTO reporte_revision FROM reportes WHERE estado = 'EN_REVISION' LIMIT 1;
    
    -- Historial para reporte resuelto
    INSERT INTO historial_estados (reporte_id, estado_anterior, estado_nuevo, usuario_responsable_id, comentario, fecha_cambio) VALUES
    (reporte_resuelto, 'PENDIENTE', 'EN_REVISION', usuario_moderador, 'Reporte validado y enviado a revisión técnica', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    (reporte_resuelto, 'EN_REVISION', 'EN_PROCESO', usuario_moderador, 'Cuadrilla técnica asignada', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    (reporte_resuelto, 'EN_PROCESO', 'RESUELTO', usuario_moderador, 'Reparación completada y servicio restablecido', CURRENT_TIMESTAMP - INTERVAL '2 days');
    
    -- Historial para reporte en proceso
    INSERT INTO historial_estados (reporte_id, estado_anterior, estado_nuevo, usuario_responsable_id, comentario, fecha_cambio) VALUES
    (reporte_proceso, 'PENDIENTE', 'EN_REVISION', usuario_moderador, 'Reporte validado', CURRENT_TIMESTAMP - INTERVAL '20 hours'),
    (reporte_proceso, 'EN_REVISION', 'EN_PROCESO', usuario_moderador, 'Cuadrilla despachada al sitio', CURRENT_TIMESTAMP - INTERVAL '10 hours');
    
    -- Historial para reporte en revisión
    INSERT INTO historial_estados (reporte_id, estado_anterior, estado_nuevo, usuario_responsable_id, comentario, fecha_cambio) VALUES
    (reporte_revision, 'PENDIENTE', 'EN_REVISION', usuario_moderador, 'Validación inicial completada', CURRENT_TIMESTAMP - INTERVAL '2 days');
    
END $$;

-- =====================================================
-- ACTUALIZAR ESTADÍSTICAS
-- Ejecutar funciones para actualizar contadores
-- =====================================================
DO $$
DECLARE
    reporte_rec RECORD;
BEGIN
    -- Actualizar estadísticas para todos los reportes
    FOR reporte_rec IN SELECT id FROM reportes LOOP
        PERFORM actualizar_estadisticas_reporte(reporte_rec.id);
    END LOOP;
    
    -- Limpiar sesiones expiradas
    PERFORM limpiar_sesiones_expiradas();
END $$;

-- Mostrar resumen de datos insertados
SELECT 
    'USUARIOS' as tabla, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'ZONAS_GEOGRAFICAS', COUNT(*) FROM zonas_geograficas
UNION ALL
SELECT 'CATEGORIAS_PROBLEMAS', COUNT(*) FROM categorias_problemas
UNION ALL
SELECT 'REPORTES', COUNT(*) FROM reportes
UNION ALL
SELECT 'COMENTARIOS', COUNT(*) FROM comentarios
UNION ALL
SELECT 'VOTOS_REPORTES', COUNT(*) FROM votos_reportes
UNION ALL
SELECT 'HISTORIAL_ESTADOS', COUNT(*) FROM historial_estados
UNION ALL
SELECT 'CONFIGURACION_SISTEMA', COUNT(*) FROM configuracion_sistema
ORDER BY tabla;

COMMIT;
