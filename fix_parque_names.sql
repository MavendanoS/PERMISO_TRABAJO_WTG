-- ============================================================================
-- SCRIPT DE CORRECCIÓN: Estandarizar nombre "PARQUE EÓLICO LA CABAÑA"
-- ============================================================================
-- Este script corrige todas las variaciones del nombre del parque para usar
-- la forma estándar: "PARQUE EÓLICO LA CABAÑA"
-- ============================================================================

-- PASO 1: Ver todas las variaciones actuales del parque La Cabaña
-- ============================================================================

-- En tabla parques
SELECT DISTINCT nombre as variaciones_parques 
FROM parques 
WHERE UPPER(nombre) LIKE '%CABA%' OR UPPER(nombre) LIKE '%EOLIC%';

-- En tabla permisos_trabajo (si existe)
SELECT DISTINCT planta_nombre as variaciones_permisos
FROM permisos_trabajo 
WHERE UPPER(planta_nombre) LIKE '%CABA%' OR UPPER(planta_nombre) LIKE '%EOLIC%';

-- En tabla usuarios (parques_autorizados)
SELECT DISTINCT parques_autorizados 
FROM usuarios 
WHERE UPPER(parques_autorizados) LIKE '%CABA%' OR UPPER(parques_autorizados) LIKE '%EOLIC%';

-- ============================================================================
-- PASO 2: CORRECCIONES EN TABLA PARQUES
-- ============================================================================

-- Actualizar todas las variaciones a la forma estándar
UPDATE parques 
SET nombre = 'PARQUE EÓLICO LA CABAÑA'
WHERE UPPER(nombre) LIKE '%LA CABA%' 
   OR UPPER(nombre) LIKE '%EOLIC%CABA%'
   OR nombre LIKE 'PARQUE EOLICO LA CABAÑA'
   OR nombre LIKE 'parque eólico la cabaña'
   OR nombre LIKE 'Parque Eólico La Cabaña'
   OR nombre LIKE 'PARQUE EOLICO LA CABANA'
   OR nombre LIKE 'parque eolico la cabana';

-- ============================================================================
-- PASO 3: CORRECCIONES EN TABLA PERMISOS_TRABAJO (si existe)
-- ============================================================================

UPDATE permisos_trabajo 
SET planta_nombre = 'PARQUE EÓLICO LA CABAÑA'
WHERE UPPER(planta_nombre) LIKE '%LA CABA%' 
   OR UPPER(planta_nombre) LIKE '%EOLIC%CABA%'
   OR planta_nombre LIKE 'PARQUE EOLICO LA CABAÑA'
   OR planta_nombre LIKE 'parque eólico la cabaña'
   OR planta_nombre LIKE 'Parque Eólico La Cabaña'
   OR planta_nombre LIKE 'PARQUE EOLICO LA CABANA'
   OR planta_nombre LIKE 'parque eolico la cabana';

-- ============================================================================
-- PASO 4: CORRECCIONES EN PARQUES AUTORIZADOS DE USUARIOS
-- ============================================================================

-- Para usuarios con parques_autorizados como JSON array
UPDATE usuarios 
SET parques_autorizados = REPLACE(
    REPLACE(
        REPLACE(
            REPLACE(
                REPLACE(parques_autorizados, 'PARQUE EOLICO LA CABAÑA', 'PARQUE EÓLICO LA CABAÑA'),
                'parque eólico la cabaña', 'PARQUE EÓLICO LA CABAÑA'
            ),
            'Parque Eólico La Cabaña', 'PARQUE EÓLICO LA CABAÑA'
        ),
        'PARQUE EOLICO LA CABANA', 'PARQUE EÓLICO LA CABAÑA'
    ),
    'parque eolico la cabana', 'PARQUE EÓLICO LA CABAÑA'
)
WHERE parques_autorizados LIKE '%caba%' OR parques_autorizados LIKE '%CABA%';

-- ============================================================================
-- PASO 5: VERIFICACIÓN FINAL
-- ============================================================================

-- Verificar que todas las correcciones se aplicaron correctamente
SELECT 'TABLA PARQUES' as tabla, COUNT(*) as registros_corregidos
FROM parques 
WHERE nombre = 'PARQUE EÓLICO LA CABAÑA'

UNION ALL

SELECT 'TABLA PERMISOS' as tabla, COUNT(*) as registros_corregidos
FROM permisos_trabajo 
WHERE planta_nombre = 'PARQUE EÓLICO LA CABAÑA'

UNION ALL

SELECT 'USUARIOS CON PARQUE' as tabla, COUNT(*) as usuarios_con_parque
FROM usuarios 
WHERE parques_autorizados LIKE '%PARQUE EÓLICO LA CABAÑA%';

-- ============================================================================
-- PASO 6: LISTAR REGISTROS FINALES PARA CONFIRMACIÓN
-- ============================================================================

-- Ver todos los parques después de la corrección
SELECT 'PARQUES FINALES:' as info, nombre 
FROM parques 
WHERE UPPER(nombre) LIKE '%EOLIC%' OR UPPER(nombre) LIKE '%CABA%'
ORDER BY nombre;

-- Ver usuarios con el parque corregido
SELECT 'USUARIOS CON PARQUE:' as info, usuario, parques_autorizados 
FROM usuarios 
WHERE parques_autorizados LIKE '%EÓLICO LA CABAÑA%'
ORDER BY usuario;

-- ============================================================================
-- INSTRUCCIONES DE EJECUCIÓN:
-- ============================================================================
-- 1. Ve al dashboard de Cloudflare > D1 Database > tu base "master"
-- 2. Ejecuta primero las consultas SELECT del PASO 1 para ver las variaciones
-- 3. Ejecuta los UPDATE del PASO 2, 3 y 4 uno por uno
-- 4. Ejecuta las verificaciones del PASO 5 y 6 para confirmar
-- ============================================================================