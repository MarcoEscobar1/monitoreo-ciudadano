-- Actualizar password del administrador
-- Password: admin123

ALTER TABLE monitoreo_ciudadano.usuarios DISABLE TRIGGER trg_usuarios_fecha_modificacion;

UPDATE monitoreo_ciudadano.usuarios
SET password_hash = '$2a$12$yV46UDqp3Tzyd6jLeNbYV.onangi8Ywq81WBTd3bl2xWh.IwP510O'
WHERE email = 'admin@monitoreo.gov.co';

UPDATE monitoreo_ciudadano.usuarios
SET password_hash = '$2a$12$yV46UDqp3Tzyd6jLeNbYV.onangi8Ywq81WBTd3bl2xWh.IwP510O'
WHERE email = 'moderador@monitoreo.gov.co';

ALTER TABLE monitoreo_ciudadano.usuarios ENABLE TRIGGER trg_usuarios_fecha_modificacion;

-- Verificar
SELECT 
    nombre, 
    email, 
    tipo_usuario,
    SUBSTRING(password_hash, 1, 10) as hash_inicio
FROM monitoreo_ciudadano.usuarios
WHERE tipo_usuario IN ('ADMINISTRADOR', 'MODERADOR');
