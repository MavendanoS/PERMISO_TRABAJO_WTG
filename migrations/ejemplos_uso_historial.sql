-- ============================================================================
-- EJEMPLOS DE USO - SISTEMA DE HISTORIAL DE APROBACIONES DE CIERRE
-- ============================================================================
-- Este archivo contiene ejemplos prácticos de cómo usar el sistema de 
-- versionado y auditoría para cierres de permisos de trabajo.
-- ============================================================================

-- CONFIGURACIÓN INICIAL
.mode column
.headers on
.width 15 25 20 15 25

-- ============================================================================
-- EJEMPLO 1: INSERTAR UN NUEVO REGISTRO DE HISTORIAL
-- ============================================================================

SELECT '=== EJEMPLO 1: REGISTRAR ENVÍO DE CIERRE ===' as titulo;

-- Simular el envío de un cierre por parte de un técnico
-- En la aplicación real, esto sería hecho automáticamente por los triggers
INSERT INTO historial_aprobaciones_cierre (
    permiso_id,
    version_intento,
    accion,
    estado_resultante,
    usuario_id,
    usuario_nombre,
    comentarios,
    observaciones_cierre,
    fecha_inicio_trabajos,
    fecha_fin_trabajos,
    fecha_parada_turbina,
    fecha_puesta_marcha_turbina
) VALUES (
    1, -- Assuming permiso_id 1 exists
    1, -- First attempt
    'ENVIAR_CIERRE',
    'CERRADO_PENDIENTE_APROBACION',
    'TEC001',
    'Juan Pérez - Técnico',
    'Cierre enviado para aprobación después de completar mantenimiento preventivo',
    'Trabajos completados según procedimiento. Todas las verificaciones OK.',
    '2024-01-15 08:00:00',
    '2024-01-15 16:30:00',
    '2024-01-15 08:15:00',
    '2024-01-15 16:45:00'
) ON CONFLICT(permiso_id, version_intento) DO NOTHING;

SELECT 'Registro de envío creado exitosamente' as resultado;

-- ============================================================================
-- EJEMPLO 2: REGISTRAR UN RECHAZO
-- ============================================================================

SELECT '=== EJEMPLO 2: REGISTRAR RECHAZO DE SUPERVISOR ===' as titulo;

-- Simular el rechazo por parte del supervisor
INSERT INTO historial_aprobaciones_cierre (
    permiso_id,
    version_intento,
    accion,
    estado_resultante,
    usuario_id,
    usuario_nombre,
    comentarios,
    observaciones_cierre,
    fecha_inicio_trabajos,
    fecha_fin_trabajos,
    fecha_parada_turbina,
    fecha_puesta_marcha_turbina
) VALUES (
    1,
    1, -- Same version, different action
    'RECHAZAR',
    'CIERRE_RECHAZADO',
    'SUP001',
    'María González - Supervisor',
    'Rechazo: Falta documentación fotográfica de las conexiones eléctricas verificadas. Por favor adjuntar fotos antes de reenviar.',
    'Trabajos completados según procedimiento. Todas las verificaciones OK.',
    '2024-01-15 08:00:00',
    '2024-01-15 16:30:00',
    '2024-01-15 08:15:00',
    '2024-01-15 16:45:00'
) ON CONFLICT(permiso_id, version_intento) DO NOTHING;

SELECT 'Registro de rechazo creado exitosamente' as resultado;

-- ============================================================================
-- EJEMPLO 3: REGISTRAR REENVÍO CON CORRECCIONES
-- ============================================================================

SELECT '=== EJEMPLO 3: REGISTRAR REENVÍO CON CORRECCIONES ===' as titulo;

-- Técnico corrige y reenvía (nueva versión)
INSERT INTO historial_aprobaciones_cierre (
    permiso_id,
    version_intento,
    accion,
    estado_resultante,
    usuario_id,
    usuario_nombre,
    comentarios,
    observaciones_cierre,
    fecha_inicio_trabajos,
    fecha_fin_trabajos,
    fecha_parada_turbina,
    fecha_puesta_marcha_turbina
) VALUES (
    1,
    2, -- New version
    'REENVIAR',
    'CERRADO_PENDIENTE_APROBACION',
    'TEC001',
    'Juan Pérez - Técnico',
    'Reenvío con documentación fotográfica completa según solicitud del supervisor',
    'Trabajos completados según procedimiento. Todas las verificaciones OK. Documentación fotográfica adjuntada.',
    '2024-01-15 08:00:00',
    '2024-01-15 16:30:00',
    '2024-01-15 08:15:00',
    '2024-01-15 16:45:00'
) ON CONFLICT(permiso_id, version_intento) DO NOTHING;

SELECT 'Registro de reenvío creado exitosamente' as resultado;

-- ============================================================================
-- EJEMPLO 4: REGISTRAR APROBACIÓN FINAL
-- ============================================================================

SELECT '=== EJEMPLO 4: REGISTRAR APROBACIÓN FINAL ===' as titulo;

-- Supervisor aprueba después de las correcciones
INSERT INTO historial_aprobaciones_cierre (
    permiso_id,
    version_intento,
    accion,
    estado_resultante,
    usuario_id,
    usuario_nombre,
    comentarios,
    observaciones_cierre,
    fecha_inicio_trabajos,
    fecha_fin_trabajos,
    fecha_parada_turbina,
    fecha_puesta_marcha_turbina
) VALUES (
    1,
    2,
    'APROBAR',
    'CERRADO',
    'SUP001',
    'María González - Supervisor',
    'Aprobado. Documentación completa y trabajos ejecutados correctamente según procedimiento.',
    'Trabajos completados según procedimiento. Todas las verificaciones OK. Documentación fotográfica adjuntada.',
    '2024-01-15 08:00:00',
    '2024-01-15 16:30:00',
    '2024-01-15 08:15:00',
    '2024-01-15 16:45:00'
) ON CONFLICT(permiso_id, version_intento) DO NOTHING;

SELECT 'Registro de aprobación creado exitosamente' as resultado;

-- ============================================================================
-- EJEMPLO 5: CONSULTAR HISTORIAL COMPLETO DE UN PERMISO
-- ============================================================================

SELECT '=== EJEMPLO 5: HISTORIAL COMPLETO DEL PERMISO ===' as titulo;

SELECT 
    version_intento as version,
    accion,
    estado_resultante as estado,
    usuario_nombre as usuario,
    fecha_accion,
    SUBSTR(comentarios, 1, 50) || '...' as comentarios
FROM vista_historial_cierre_completo
WHERE permiso_id = 1
ORDER BY version_intento ASC, fecha_accion ASC;

-- ============================================================================
-- EJEMPLO 6: CONSULTAS DE ANÁLISIS ÚTILES
-- ============================================================================

SELECT '=== EJEMPLO 6: ANÁLISIS DE RECHAZOS ===' as titulo;

-- Permisos con más rechazos
SELECT 
    permiso_id,
    COUNT(CASE WHEN accion = 'RECHAZAR' THEN 1 END) as total_rechazos,
    COUNT(DISTINCT version_intento) as intentos,
    MAX(fecha_accion) as ultima_actividad
FROM historial_aprobaciones_cierre
GROUP BY permiso_id
HAVING total_rechazos > 0
ORDER BY total_rechazos DESC, ultima_actividad DESC
LIMIT 5;

SELECT '=== EJEMPLO 7: TIEMPO PROMEDIO DE APROBACIÓN ===' as titulo;

-- Tiempo promedio entre envío y aprobación final
WITH tiempos_aprobacion AS (
    SELECT 
        h1.permiso_id,
        h1.version_intento,
        h1.fecha_accion as fecha_envio,
        h2.fecha_accion as fecha_aprobacion,
        CAST((julianday(h2.fecha_accion) - julianday(h1.fecha_accion)) * 24 AS INTEGER) as horas_transcurridas
    FROM historial_aprobaciones_cierre h1
    INNER JOIN historial_aprobaciones_cierre h2 ON (
        h1.permiso_id = h2.permiso_id 
        AND h1.version_intento = h2.version_intento
        AND h1.accion IN ('ENVIAR_CIERRE', 'REENVIAR')
        AND h2.accion = 'APROBAR'
        AND h2.fecha_accion > h1.fecha_accion
    )
)
SELECT 
    'Tiempo promedio de aprobación' as metrica,
    AVG(horas_transcurridas) as promedio_horas,
    MIN(horas_transcurridas) as minimo_horas,
    MAX(horas_transcurridas) as maximo_horas,
    COUNT(*) as total_aprobaciones
FROM tiempos_aprobacion;

SELECT '=== EJEMPLO 8: PERFORMANCE DE USUARIOS ===' as titulo;

-- Performance de usuarios (técnicos y supervisores)
SELECT 
    usuario_nombre,
    COUNT(*) as total_acciones,
    COUNT(CASE WHEN accion = 'ENVIAR_CIERRE' THEN 1 END) as envios,
    COUNT(CASE WHEN accion = 'REENVIAR' THEN 1 END) as reenvios,
    COUNT(CASE WHEN accion = 'APROBAR' THEN 1 END) as aprobaciones,
    COUNT(CASE WHEN accion = 'RECHAZAR' THEN 1 END) as rechazos,
    ROUND(
        100.0 * COUNT(CASE WHEN accion = 'APROBAR' THEN 1 END) / 
        NULLIF(COUNT(CASE WHEN accion IN ('APROBAR', 'RECHAZAR') THEN 1 END), 0),
        1
    ) as tasa_aprobacion_pct
FROM historial_aprobaciones_cierre
GROUP BY usuario_nombre
ORDER BY total_acciones DESC;

SELECT '=== EJEMPLO 9: ACTIVIDAD POR DÍAS ===' as titulo;

-- Actividad por día de la semana
SELECT 
    CASE strftime('%w', fecha_accion)
        WHEN '0' THEN 'Domingo'
        WHEN '1' THEN 'Lunes'
        WHEN '2' THEN 'Martes'
        WHEN '3' THEN 'Miércoles'
        WHEN '4' THEN 'Jueves'
        WHEN '5' THEN 'Viernes'
        WHEN '6' THEN 'Sábado'
    END as dia_semana,
    COUNT(*) as total_acciones,
    COUNT(CASE WHEN accion = 'ENVIAR_CIERRE' THEN 1 END) as envios,
    COUNT(CASE WHEN accion = 'APROBAR' THEN 1 END) as aprobaciones,
    COUNT(CASE WHEN accion = 'RECHAZAR' THEN 1 END) as rechazos
FROM historial_aprobaciones_cierre
GROUP BY strftime('%w', fecha_accion)
ORDER BY strftime('%w', fecha_accion);

SELECT '=== EJEMPLO 10: MOTIVOS DE RECHAZO FRECUENTES ===' as titulo;

-- Análisis de motivos de rechazo más frecuentes
WITH motivos_rechazo AS (
    SELECT 
        TRIM(comentarios) as motivo,
        COUNT(*) as frecuencia
    FROM historial_aprobaciones_cierre
    WHERE accion = 'RECHAZAR'
      AND comentarios IS NOT NULL
      AND comentarios != ''
    GROUP BY TRIM(comentarios)
)
SELECT 
    SUBSTR(motivo, 1, 60) || '...' as motivo_rechazo,
    frecuencia,
    ROUND(100.0 * frecuencia / SUM(frecuencia) OVER(), 1) as porcentaje
FROM motivos_rechazo
ORDER BY frecuencia DESC
LIMIT 10;

-- ============================================================================
-- EJEMPLO 11: CONTROL DE CONCURRENCIA (SIMULACIÓN)
-- ============================================================================

SELECT '=== EJEMPLO 11: CONTROL DE CONCURRENCIA ===' as titulo;

-- Ejemplo de cómo verificar la versión antes de actualizar
-- En una aplicación real, esto se haría en el código de la aplicación

-- 1. Obtener versión actual
SELECT 
    'Verificación de versión' as operacion,
    pc.permiso_id,
    pc.version as version_actual,
    pc.estado_aprobacion_cierre as estado_actual
FROM permiso_cierre pc
WHERE pc.permiso_id = 1;

-- 2. Simular actualización con versión correcta
-- UPDATE permiso_cierre 
-- SET estado_aprobacion_cierre = 'APROBADO',
--     usuario_aprobador_cierre_id = 'SUP001',
--     fecha_aprobacion_cierre = CURRENT_TIMESTAMP,
--     version = version + 1
-- WHERE permiso_id = 1 AND version = [version_obtenida_anteriormente];

-- 3. Verificar si la actualización fue exitosa
-- Si no se actualizó ninguna fila, significa que otro usuario modificó el registro

-- ============================================================================
-- EJEMPLO 12: CONSULTAS PARA DASHBOARDS
-- ============================================================================

SELECT '=== EJEMPLO 12: MÉTRICAS PARA DASHBOARD ===' as titulo;

-- Métricas resumen para dashboard ejecutivo
SELECT 
    'Métricas Generales' as categoria,
    COUNT(DISTINCT permiso_id) as permisos_con_historial,
    COUNT(*) as total_acciones,
    COUNT(CASE WHEN accion = 'APROBAR' THEN 1 END) as total_aprobaciones,
    COUNT(CASE WHEN accion = 'RECHAZAR' THEN 1 END) as total_rechazos,
    ROUND(
        100.0 * COUNT(CASE WHEN accion = 'APROBAR' THEN 1 END) / 
        NULLIF(COUNT(CASE WHEN accion IN ('APROBAR', 'RECHAZAR') THEN 1 END), 0),
        1
    ) as tasa_aprobacion_general
FROM historial_aprobaciones_cierre
WHERE fecha_accion >= DATE('now', '-30 days');

-- Tendencia de los últimos 7 días
SELECT 
    'Últimos 7 días' as categoria,
    DATE(fecha_accion) as fecha,
    COUNT(*) as acciones_del_dia,
    COUNT(CASE WHEN accion = 'ENVIAR_CIERRE' THEN 1 END) as envios,
    COUNT(CASE WHEN accion = 'APROBAR' THEN 1 END) as aprobaciones,
    COUNT(CASE WHEN accion = 'RECHAZAR' THEN 1 END) as rechazos
FROM historial_aprobaciones_cierre
WHERE fecha_accion >= DATE('now', '-7 days')
GROUP BY DATE(fecha_accion)
ORDER BY DATE(fecha_accion) DESC;

-- ============================================================================
-- NOTAS IMPORTANTES PARA EL DESARROLLO
-- ============================================================================

SELECT '=== NOTAS PARA DESARROLLADORES ===' as titulo;

SELECT 
'IMPORTANTE: En la aplicación real, estos registros del historial se crean:
1. Automáticamente via triggers cuando cambia el estado
2. Manualmente desde el código de la aplicación para acciones específicas
3. Durante migraciones de datos existentes

El campo version en permiso_cierre debe verificarse antes de cada actualización
para evitar conflictos de concurrencia (lost updates).

Ejemplo en JavaScript:
const currentVersion = await getCurrentVersion(permisoId);
const result = await updatePermiso(permisoId, data, currentVersion);
if (result.changes === 0) {
    throw new Error("El permiso fue modificado por otro usuario");
}' as notas_importantes;

-- ============================================================================
-- FIN DE EJEMPLOS DE USO
-- ============================================================================

SELECT '=== FIN DE EJEMPLOS - SISTEMA LISTO PARA USO ===' as titulo;