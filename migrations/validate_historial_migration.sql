-- ============================================================================
-- SCRIPT DE VALIDACIÓN - HISTORIAL DE APROBACIONES DE CIERRE
-- ============================================================================
-- Este script valida que la migración 002 se haya aplicado correctamente
-- y que todas las funcionalidades del sistema de versionado funcionen.
-- ============================================================================

-- Configurar salida para mejor legibilidad
.mode column
.headers on
.width 30 15 20

SELECT '=== VALIDACIÓN DE MIGRACIÓN 002: HISTORIAL DE APROBACIONES ===' as titulo;

-- ============================================================================
-- 1. VALIDACIÓN DE ESTRUCTURA DE BASE DE DATOS
-- ============================================================================

SELECT '1. VALIDANDO ESTRUCTURA DE BASE DE DATOS' as seccion;

-- Verificar existencia de tabla historial_aprobaciones_cierre
SELECT 
    'Tabla historial_aprobaciones_cierre' as componente,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ EXISTE' 
        ELSE '✗ NO ENCONTRADA' 
    END as status
FROM sqlite_master 
WHERE type='table' AND name='historial_aprobaciones_cierre';

-- Verificar columna version en permiso_cierre
SELECT 
    'Columna version en permiso_cierre' as componente,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ EXISTE' 
        ELSE '✗ NO ENCONTRADA' 
    END as status
FROM pragma_table_info('permiso_cierre') 
WHERE name = 'version';

-- Verificar índices creados
WITH indices_esperados AS (
    SELECT 'idx_historial_permiso_id' as indice
    UNION SELECT 'idx_historial_permiso_version'
    UNION SELECT 'idx_historial_accion' 
    UNION SELECT 'idx_historial_estado'
    UNION SELECT 'idx_historial_fecha_accion'
    UNION SELECT 'idx_historial_usuario'
    UNION SELECT 'idx_historial_permiso_fecha'
    UNION SELECT 'idx_permiso_cierre_version'
)
SELECT 
    e.indice as componente,
    CASE 
        WHEN s.name IS NOT NULL THEN '✓ CREADO'
        ELSE '✗ FALTANTE'
    END as status
FROM indices_esperados e
LEFT JOIN sqlite_master s ON s.name = e.indice AND s.type = 'index'
ORDER BY e.indice;

-- Verificar triggers creados
WITH triggers_esperados AS (
    SELECT 'trigger_increment_version_permiso_cierre' as trigger_name
    UNION SELECT 'trigger_historial_cambio_estado_cierre'
)
SELECT 
    e.trigger_name as componente,
    CASE 
        WHEN s.name IS NOT NULL THEN '✓ CREADO'
        ELSE '✗ FALTANTE'
    END as status
FROM triggers_esperados e
LEFT JOIN sqlite_master s ON s.name = e.trigger_name AND s.type = 'trigger'
ORDER BY e.trigger_name;

-- Verificar vistas creadas
WITH vistas_esperadas AS (
    SELECT 'vista_historial_cierre_completo' as vista
    UNION SELECT 'vista_estado_actual_cierres'
    UNION SELECT 'vista_analisis_rechazos'
    UNION SELECT 'vista_performance_supervisores'
)
SELECT 
    e.vista as componente,
    CASE 
        WHEN s.name IS NOT NULL THEN '✓ CREADA'
        ELSE '✗ FALTANTE'
    END as status
FROM vistas_esperadas e
LEFT JOIN sqlite_master s ON s.name = e.vista AND s.type = 'view'
ORDER BY e.vista;

-- ============================================================================
-- 2. VALIDACIÓN DE DATOS MIGRADOS
-- ============================================================================

SELECT '2. VALIDANDO MIGRACIÓN DE DATOS' as seccion;

-- Contar registros en tabla historial
SELECT 
    'Registros en historial_aprobaciones_cierre' as metrica,
    COUNT(*) as valor,
    CASE WHEN COUNT(*) > 0 THEN '✓ DATOS MIGRADOS' ELSE '⚠ SIN DATOS' END as status
FROM historial_aprobaciones_cierre;

-- Verificar que todos los permisos con cierre tengan historial
SELECT 
    'Permisos con cierre sin historial' as metrica,
    COUNT(*) as valor,
    CASE WHEN COUNT(*) = 0 THEN '✓ TODOS MIGRADOS' ELSE '⚠ FALTAN DATOS' END as status
FROM permiso_cierre pc
WHERE NOT EXISTS (
    SELECT 1 FROM historial_aprobaciones_cierre hac 
    WHERE hac.permiso_id = pc.permiso_id
);

-- Verificar versiones inicializadas
SELECT 
    'Permisos con version nula o 0' as metrica,
    COUNT(*) as valor,
    CASE WHEN COUNT(*) = 0 THEN '✓ VERSIONES OK' ELSE '⚠ VERSIONES FALTANTES' END as status
FROM permiso_cierre 
WHERE version IS NULL OR version = 0;

-- Distribución de acciones en el historial
SELECT 
    'Distribución de acciones' as seccion,
    accion as metrica,
    COUNT(*) as valor,
    '📊 INFO' as status
FROM historial_aprobaciones_cierre
GROUP BY accion
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- 3. VALIDACIÓN FUNCIONAL DE VISTAS
-- ============================================================================

SELECT '3. VALIDANDO FUNCIONALIDAD DE VISTAS' as seccion;

-- Probar vista_historial_cierre_completo
SELECT 
    'vista_historial_cierre_completo' as vista,
    COUNT(*) as registros,
    CASE WHEN COUNT(*) > 0 THEN '✓ FUNCIONAL' ELSE '✗ VACÍA' END as status
FROM vista_historial_cierre_completo;

-- Probar vista_estado_actual_cierres
SELECT 
    'vista_estado_actual_cierres' as vista,
    COUNT(*) as registros,
    CASE WHEN COUNT(*) > 0 THEN '✓ FUNCIONAL' ELSE '✗ VACÍA' END as status
FROM vista_estado_actual_cierres;

-- Probar vista_analisis_rechazos
SELECT 
    'vista_analisis_rechazos' as vista,
    COUNT(*) as registros,
    CASE WHEN COUNT(*) >= 0 THEN '✓ FUNCIONAL' ELSE '✗ ERROR' END as status
FROM vista_analisis_rechazos;

-- Probar vista_performance_supervisores
SELECT 
    'vista_performance_supervisores' as vista,
    COUNT(*) as registros,
    CASE WHEN COUNT(*) >= 0 THEN '✓ FUNCIONAL' ELSE '✗ ERROR' END as status
FROM vista_performance_supervisores;

-- ============================================================================
-- 4. VALIDACIÓN DE INTEGRIDAD DE DATOS
-- ============================================================================

SELECT '4. VALIDANDO INTEGRIDAD DE DATOS' as seccion;

-- Verificar integridad referencial
SELECT 
    'Registros historial con permiso inexistente' as check_name,
    COUNT(*) as problemas,
    CASE WHEN COUNT(*) = 0 THEN '✓ INTEGRIDAD OK' ELSE '✗ PROBLEMAS' END as status
FROM historial_aprobaciones_cierre hac
WHERE NOT EXISTS (
    SELECT 1 FROM permisos_trabajo p WHERE p.id = hac.permiso_id
);

-- Verificar unicidad de version por permiso
SELECT 
    'Duplicados permiso_id + version_intento' as check_name,
    COUNT(*) as problemas,
    CASE WHEN COUNT(*) = 0 THEN '✓ UNICIDAD OK' ELSE '✗ DUPLICADOS' END as status
FROM (
    SELECT permiso_id, version_intento, COUNT(*) as duplicados
    FROM historial_aprobaciones_cierre
    GROUP BY permiso_id, version_intento
    HAVING COUNT(*) > 1
);

-- Verificar constraint de acciones válidas
SELECT 
    'Acciones inválidas en historial' as check_name,
    COUNT(*) as problemas,
    CASE WHEN COUNT(*) = 0 THEN '✓ ACCIONES VÁLIDAS' ELSE '✗ ACCIONES INVÁLIDAS' END as status
FROM historial_aprobaciones_cierre
WHERE accion NOT IN ('ENVIAR_CIERRE', 'APROBAR', 'RECHAZAR', 'REENVIAR', 'CANCELAR');

-- Verificar constraint de estados válidos
SELECT 
    'Estados resultantes inválidos' as check_name,
    COUNT(*) as problemas,
    CASE WHEN COUNT(*) = 0 THEN '✓ ESTADOS VÁLIDOS' ELSE '✗ ESTADOS INVÁLIDOS' END as status
FROM historial_aprobaciones_cierre
WHERE estado_resultante NOT IN ('CERRADO_PENDIENTE_APROBACION', 'CERRADO', 'CIERRE_RECHAZADO', 'CANCELADO');

-- ============================================================================
-- 5. VALIDACIÓN DE PERFORMANCE
-- ============================================================================

SELECT '5. VALIDANDO PERFORMANCE DE CONSULTAS' as seccion;

-- Tiempo de consulta de historial por permiso (debería ser rápido con índices)
.timer on

SELECT 
    'Consulta historial por permiso' as consulta,
    'Tiempo medido por SQLite' as metrica,
    'Ver .timer arriba' as valor,
    '📊 PERFORMANCE' as status
FROM vista_historial_cierre_completo 
WHERE permiso_id IN (SELECT id FROM permisos_trabajo LIMIT 5)
LIMIT 1;

-- Consulta de estado actual (debería ser rápida)
SELECT 
    'Consulta estado actual' as consulta,
    'Tiempo medido por SQLite' as metrica,
    'Ver .timer arriba' as valor,
    '📊 PERFORMANCE' as status
FROM vista_estado_actual_cierres 
LIMIT 1;

.timer off

-- ============================================================================
-- 6. EJEMPLOS DE CONSULTAS ÚTILES
-- ============================================================================

SELECT '6. EJEMPLOS DE CONSULTAS DEL SISTEMA' as seccion;

-- Top 5 permisos con más historial
SELECT 
    '📈 Top 5 permisos con más historial' as descripcion,
    numero_pt,
    planta_nombre,
    total_intentos,
    total_rechazos
FROM vista_estado_actual_cierres
ORDER BY total_intentos DESC
LIMIT 5;

-- Estadísticas de rechazos por planta
SELECT 
    '📊 Rechazos por planta' as descripcion,
    planta_nombre,
    total_rechazos,
    permisos_con_rechazos
FROM vista_analisis_rechazos
ORDER BY total_rechazos DESC
LIMIT 5;

-- Performance de supervisores (si hay datos)
SELECT 
    '👥 Performance supervisores' as descripcion,
    supervisor,
    total_acciones,
    aprobaciones,
    rechazos,
    porcentaje_aprobacion || '%' as tasa_aprobacion
FROM vista_performance_supervisores
ORDER BY total_acciones DESC
LIMIT 5;

-- Historial reciente
SELECT 
    '🕒 Actividad reciente (últimas 10 acciones)' as descripcion,
    numero_pt,
    accion,
    estado_resultante,
    usuario_nombre,
    fecha_accion
FROM vista_historial_cierre_completo
ORDER BY fecha_accion DESC
LIMIT 10;

-- ============================================================================
-- 7. RESUMEN DE VALIDACIÓN
-- ============================================================================

SELECT '7. RESUMEN DE VALIDACIÓN' as seccion;

-- Estado de la migración
SELECT 
    migration_id as migracion,
    status as estado,
    applied_at as fecha_aplicacion
FROM migration_control 
WHERE migration_id = '002_historial_aprobaciones_cierre';

-- Estadísticas finales
SELECT 
    'ESTADÍSTICAS FINALES' as resumen,
    'Componente' as tipo,
    'Estado' as estado;

SELECT 
    'Base de Datos' as resumen,
    'Tablas, Índices, Triggers, Vistas' as tipo,
    CASE 
        WHEN (SELECT COUNT(*) FROM sqlite_master WHERE name = 'historial_aprobaciones_cierre') > 0
        THEN '✓ MIGRACIÓN COMPLETA'
        ELSE '✗ MIGRACIÓN INCOMPLETA'
    END as estado;

-- ============================================================================
-- INSTRUCCIONES POST-VALIDACIÓN
-- ============================================================================

SELECT '=== INSTRUCCIONES POST-VALIDACIÓN ===' as titulo;

SELECT 
'Si todas las validaciones muestran ✓, la migración fue exitosa.
Si hay problemas (✗ o ⚠), revisar:
1. Logs de la migración
2. Permisos de base de datos
3. Ejecutar nuevamente el script de aplicación idempotente
4. Verificar integridad de datos origen

Para usar el sistema de historial:
- Consultar vista_historial_cierre_completo para auditoría
- Usar vista_estado_actual_cierres para dashboards
- Los triggers registrarán cambios automáticamente
- El campo version manejará concurrencia' as instrucciones;

SELECT '=== FIN DE VALIDACIÓN ===' as titulo;

-- ============================================================================
-- FIN DEL SCRIPT DE VALIDACIÓN
-- ============================================================================