-- Script para crear usuario administrador de prueba
-- IMPORTANTE: Este script es solo para desarrollo/testing

-- Crear usuario administrador de prueba
-- Password: admin123 (hashed con bcrypt)
DO $$
DECLARE
    admin_exists INTEGER;
BEGIN
    -- Verificar si ya existe un administrador con este email
    SELECT COUNT(*) INTO admin_exists
    FROM monitoreo_ciudadano.usuarios
    WHERE email = 'admin@test.com';
    
    IF admin_exists = 0 THEN
        INSERT INTO monitoreo_ciudadano.usuarios 
        (nombre, apellidos, email, telefono, password_hash, tipo_usuario, activo, email_verificado, metodo_auth)
        VALUES 
        (
            'Administrador',
            'Sistema',
            'admin@test.com',
            '+591 70000000',
            '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIxKzQu.v2', -- admin123
            'ADMINISTRADOR',
            true,
            true,
            'EMAIL'
        );
        
        RAISE NOTICE '✅ Usuario administrador creado exitosamente';
        RAISE NOTICE '📧 Email: admin@test.com';
        RAISE NOTICE '🔑 Password: admin123';
    ELSE
        RAISE NOTICE '⚠️  Ya existe un usuario con el email admin@test.com';
        
        -- Actualizar a administrador si existe pero no lo es
        UPDATE monitoreo_ciudadano.usuarios
        SET tipo_usuario = 'ADMINISTRADOR', activo = true
        WHERE email = 'admin@test.com' AND tipo_usuario != 'ADMINISTRADOR';
        
        IF FOUND THEN
            RAISE NOTICE '✅ Usuario actualizado a ADMINISTRADOR';
        END IF;
    END IF;
END $$;

-- Crear usuario moderador de prueba
DO $$
DECLARE
    mod_exists INTEGER;
BEGIN
    SELECT COUNT(*) INTO mod_exists
    FROM monitoreo_ciudadano.usuarios
    WHERE email = 'moderador@test.com';
    
    IF mod_exists = 0 THEN
        INSERT INTO monitoreo_ciudadano.usuarios 
        (nombre, apellidos, email, telefono, password_hash, tipo_usuario, activo, email_verificado, metodo_auth)
        VALUES 
        (
            'Moderador',
            'Prueba',
            'moderador@test.com',
            '+591 71111111',
            '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIxKzQu.v2', -- admin123
            'MODERADOR',
            true,
            true,
            'EMAIL'
        );
        
        RAISE NOTICE '✅ Usuario moderador creado exitosamente';
        RAISE NOTICE '📧 Email: moderador@test.com';
        RAISE NOTICE '🔑 Password: admin123';
    ELSE
        RAISE NOTICE '⚠️  Ya existe un usuario moderador';
    END IF;
END $$;

-- Mostrar resumen de usuarios administrativos
SELECT 
    nombre,
    apellidos,
    email,
    tipo_usuario,
    activo,
    fecha_registro
FROM monitoreo_ciudadano.usuarios
WHERE tipo_usuario IN ('ADMINISTRADOR', 'MODERADOR')
ORDER BY tipo_usuario, nombre;

-- Información de uso
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '           USUARIOS ADMINISTRATIVOS CREADOS';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '👤 Administrador:';
    RAISE NOTICE '   Email:    admin@test.com';
    RAISE NOTICE '   Password: admin123';
    RAISE NOTICE '';
    RAISE NOTICE '👤 Moderador:';
    RAISE NOTICE '   Email:    moderador@test.com';
    RAISE NOTICE '   Password: admin123';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANTE: Cambiar estas contraseñas en producción';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
