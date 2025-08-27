-- Migración para marcar contraseñas que necesitan actualización
-- Esta migración marca todas las contraseñas existentes como temporales
-- para forzar a los usuarios a crear contraseñas que cumplan con los nuevos requisitos

-- Agregar columna si no existe para tracking de requisitos de contraseña
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_strength_validated INTEGER DEFAULT 0;

-- Marcar todas las contraseñas existentes como temporales
-- Esto forzará a todos los usuarios a cambiar su contraseña en el próximo login
-- NOTA: Comentar esta línea si no se quiere forzar el cambio a TODOS los usuarios
UPDATE usuarios 
SET password_temporal = 1,
    password_strength_validated = 0
WHERE password_temporal = 0 OR password_temporal IS NULL;

-- Para ser más selectivo, se puede usar esta query alternativa que solo marca
-- las contraseñas que probablemente no cumplen los requisitos (creadas antes de la fecha de implementación)
-- UPDATE usuarios 
-- SET password_temporal = 1,
--     password_strength_validated = 0
-- WHERE created_at < '2024-01-26' 
-- AND (password_temporal = 0 OR password_temporal IS NULL);

-- Agregar índice para mejorar performance de queries
CREATE INDEX IF NOT EXISTS idx_password_temporal ON usuarios(password_temporal);
CREATE INDEX IF NOT EXISTS idx_password_strength ON usuarios(password_strength_validated);