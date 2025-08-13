-- Script para marcar usuarios con contraseñas en texto plano como temporales
-- Ejecutar este script en D1 para marcar usuarios que tienen contraseñas no hasheadas

UPDATE usuarios 
SET password_temporal = 1
WHERE password_hash NOT LIKE 'pbkdf2:%'  -- No es formato pbkdf2 moderno
  AND password_hash NOT LIKE '%:%'       -- No es formato legacy salt:hash
  AND LENGTH(password_hash) < 40;        -- No es hash SHA-1 (40 chars) o SHA-256 (64 chars)

-- Consulta para verificar qué usuarios serán marcados como temporales
SELECT 
    id, 
    usuario, 
    email, 
    password_hash,
    password_temporal,
    CASE 
        WHEN password_hash LIKE 'pbkdf2:%' THEN 'Moderna PBKDF2'
        WHEN password_hash LIKE '%:%' THEN 'Legacy salt:hash'
        WHEN LENGTH(password_hash) = 64 THEN 'SHA-256 hash'
        WHEN LENGTH(password_hash) = 40 THEN 'SHA-1 hash'
        ELSE 'Texto plano (temporal)'
    END as tipo_password
FROM usuarios
ORDER BY password_temporal DESC, usuario;