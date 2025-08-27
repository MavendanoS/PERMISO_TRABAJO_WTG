-- Migración selectiva para marcar contraseñas que necesitan actualización
-- Esta versión NO marca todas las contraseñas como temporales
-- Solo añade la columna para tracking futuro

-- Agregar columna si no existe para tracking de requisitos de contraseña
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_strength_validated INTEGER DEFAULT 0;

-- Opcional: Marcar solo usuarios específicos que sabemos que tienen contraseñas débiles
-- Por ejemplo, usuarios creados con contraseñas por defecto
-- UPDATE usuarios 
-- SET password_temporal = 1
-- WHERE email IN ('usuario1@example.com', 'usuario2@example.com');

-- Agregar índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_password_temporal ON usuarios(password_temporal);
CREATE INDEX IF NOT EXISTS idx_password_strength ON usuarios(password_strength_validated);