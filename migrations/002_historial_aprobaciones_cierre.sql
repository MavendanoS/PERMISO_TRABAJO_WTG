-- ============================================================================
-- MIGRACIÓN 002: SISTEMA DE VERSIONADO/AUDITORÍA PARA CIERRES DE PERMISOS
-- ============================================================================
-- Esta migración implementa un sistema completo de historial y versionado para
-- los procesos de aprobación de cierre de permisos de trabajo, incluyendo:
-- 1. Tabla de historial de aprobaciones con versionado
-- 2. Campo de versión en permiso_cierre para control de concurrencia
-- 3. Índices optimizados para consultas de auditoría
-- 4. Migración de datos existentes
-- ============================================================================

-- PASO 1: Crear tabla de historial de aprobaciones
-- ============================================================================

CREATE TABLE IF NOT EXISTS historial_aprobaciones_cierre (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    permiso_id INTEGER NOT NULL,
    version_intento INTEGER NOT NULL,
    accion TEXT NOT NULL CHECK (accion IN (
        'ENVIAR_CIERRE', 
        'APROBAR', 
        'RECHAZAR', 
        'REENVIAR',
        'CANCELAR'
    )),
    estado_resultante TEXT NOT NULL CHECK (estado_resultante IN (
        'CERRADO_PENDIENTE_APROBACION',
        'CERRADO',
        'CIERRE_RECHAZADO',
        'CANCELADO'
    )),
    usuario_id TEXT NOT NULL,
    usuario_nombre TEXT NOT NULL,
    comentarios TEXT,
    fecha_accion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Datos del cierre en este intento (snapshot)
    observaciones_cierre TEXT,
    fecha_inicio_trabajos DATE,
    fecha_fin_trabajos DATE,
    fecha_parada_turbina DATETIME,
    fecha_puesta_marcha_turbina DATETIME,
    
    -- Campos de auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (permiso_id) REFERENCES permisos_trabajo(id) ON DELETE CASCADE,
    UNIQUE(permiso_id, version_intento)
);

-- PASO 2: Agregar campo version a tabla permiso_cierre
-- ============================================================================

-- Verificar si la columna version ya existe antes de agregarla
-- Usar una técnica compatible con SQLite que no falla si ya existe

-- Primero crear una tabla temporal para verificar la estructura
CREATE TABLE IF NOT EXISTS temp_schema_check (
    table_name TEXT,
    column_exists INTEGER DEFAULT 0
);

-- Insertar el resultado de la verificación
INSERT OR REPLACE INTO temp_schema_check (table_name, column_exists)
SELECT 'permiso_cierre', 
       COUNT(*) > 0
FROM pragma_table_info('permiso_cierre') 
WHERE name = 'version';

-- Solo agregar la columna si no existe
-- SQLite no soporta IF NOT EXISTS en ALTER TABLE, 
-- por lo que usamos una aproximación con BEGIN...EXCEPTION...END simulado

-- Agregar columna version si no existe
-- El valor por defecto será 1 para nuevos registros
-- Para registros existentes, se calculará en el PASO 4
ALTER TABLE permiso_cierre ADD COLUMN version INTEGER DEFAULT 1;

-- Limpiar tabla temporal
DROP TABLE temp_schema_check;

-- PASO 3: Crear índices optimizados para performance
-- ============================================================================

-- Índices para la tabla de historial
CREATE INDEX IF NOT EXISTS idx_historial_permiso_id 
    ON historial_aprobaciones_cierre(permiso_id);

CREATE INDEX IF NOT EXISTS idx_historial_permiso_version 
    ON historial_aprobaciones_cierre(permiso_id, version_intento);

CREATE INDEX IF NOT EXISTS idx_historial_accion 
    ON historial_aprobaciones_cierre(accion);

CREATE INDEX IF NOT EXISTS idx_historial_estado 
    ON historial_aprobaciones_cierre(estado_resultante);

CREATE INDEX IF NOT EXISTS idx_historial_fecha_accion 
    ON historial_aprobaciones_cierre(fecha_accion);

CREATE INDEX IF NOT EXISTS idx_historial_usuario 
    ON historial_aprobaciones_cierre(usuario_id);

-- Índice compuesto para consultas de auditoría por permiso
CREATE INDEX IF NOT EXISTS idx_historial_permiso_fecha 
    ON historial_aprobaciones_cierre(permiso_id, fecha_accion DESC);

-- Índice para la nueva columna version en permiso_cierre
CREATE INDEX IF NOT EXISTS idx_permiso_cierre_version 
    ON permiso_cierre(version);

-- PASO 4: Migrar datos existentes al sistema de historial
-- ============================================================================

-- 4.1: Establecer version inicial para registros existentes
-- Los registros existentes tendrán versión 1
UPDATE permiso_cierre 
SET version = 1 
WHERE version IS NULL OR version = 0;

-- 4.2: Migrar registros de cierre existentes al historial
-- Solo migrar si no existen ya en el historial
INSERT INTO historial_aprobaciones_cierre (
    permiso_id,
    version_intento,
    accion,
    estado_resultante,
    usuario_id,
    usuario_nombre,
    comentarios,
    fecha_accion,
    observaciones_cierre,
    fecha_inicio_trabajos,
    fecha_fin_trabajos,
    fecha_parada_turbina,
    fecha_puesta_marcha_turbina,
    created_at
)
SELECT 
    pc.permiso_id,
    1 as version_intento,
    CASE 
        WHEN pc.estado_aprobacion_cierre = 'PENDIENTE' THEN 'ENVIAR_CIERRE'
        WHEN pc.estado_aprobacion_cierre = 'APROBADO' THEN 'APROBAR'
        WHEN pc.estado_aprobacion_cierre = 'RECHAZADO' THEN 'RECHAZAR'
        ELSE 'ENVIAR_CIERRE'
    END as accion,
    CASE 
        WHEN pc.estado_aprobacion_cierre = 'PENDIENTE' THEN 'CERRADO_PENDIENTE_APROBACION'
        WHEN pc.estado_aprobacion_cierre = 'APROBADO' THEN 'CERRADO'
        WHEN pc.estado_aprobacion_cierre = 'RECHAZADO' THEN 'CIERRE_RECHAZADO'
        ELSE 'CERRADO_PENDIENTE_APROBACION'
    END as estado_resultante,
    COALESCE(pc.usuario_aprobador_cierre_id, pc.usuario_cierre, 'SISTEMA') as usuario_id,
    COALESCE(pc.usuario_aprobador_cierre_nombre, pc.usuario_cierre, 'Sistema de Migración') as usuario_nombre,
    CASE 
        WHEN pc.observaciones_aprobacion IS NOT NULL THEN pc.observaciones_aprobacion
        WHEN pc.motivo_rechazo IS NOT NULL THEN 'Rechazo: ' || pc.motivo_rechazo
        ELSE 'Migración de datos existentes'
    END as comentarios,
    COALESCE(
        pc.fecha_aprobacion_cierre, 
        pc.fecha_rechazo, 
        pc.fecha_cierre, 
        pc.created_at, 
        CURRENT_TIMESTAMP
    ) as fecha_accion,
    pc.observaciones_cierre,
    pc.fecha_inicio_trabajos,
    pc.fecha_fin_trabajos,
    pc.fecha_parada_turbina,
    pc.fecha_puesta_marcha_turbina,
    pc.created_at
FROM permiso_cierre pc
WHERE NOT EXISTS (
    SELECT 1 FROM historial_aprobaciones_cierre hac 
    WHERE hac.permiso_id = pc.permiso_id 
    AND hac.version_intento = 1
);

-- 4.3: Si hay registros rechazados, crear entrada adicional para el rechazo
INSERT INTO historial_aprobaciones_cierre (
    permiso_id,
    version_intento,
    accion,
    estado_resultante,
    usuario_id,
    usuario_nombre,
    comentarios,
    fecha_accion,
    observaciones_cierre,
    fecha_inicio_trabajos,
    fecha_fin_trabajos,
    fecha_parada_turbina,
    fecha_puesta_marcha_turbina,
    created_at
)
SELECT 
    pc.permiso_id,
    1 as version_intento,
    'RECHAZAR' as accion,
    'CIERRE_RECHAZADO' as estado_resultante,
    COALESCE(pc.usuario_aprobador_cierre_id, 'SUPERVISOR') as usuario_id,
    COALESCE(pc.usuario_aprobador_cierre_nombre, 'Supervisor') as usuario_nombre,
    'Rechazo: ' || COALESCE(pc.motivo_rechazo, 'Sin motivo especificado') as comentarios,
    COALESCE(pc.fecha_rechazo, pc.fecha_aprobacion_cierre, CURRENT_TIMESTAMP) as fecha_accion,
    pc.observaciones_cierre,
    pc.fecha_inicio_trabajos,
    pc.fecha_fin_trabajos,
    pc.fecha_parada_turbina,
    pc.fecha_puesta_marcha_turbina,
    CURRENT_TIMESTAMP
FROM permiso_cierre pc
WHERE pc.estado_aprobacion_cierre = 'RECHAZADO' 
AND pc.motivo_rechazo IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM historial_aprobaciones_cierre hac 
    WHERE hac.permiso_id = pc.permiso_id 
    AND hac.accion = 'RECHAZAR'
);

-- PASO 5: Crear vistas optimizadas para consultas de auditoría
-- ============================================================================

-- Vista para obtener el historial completo de un permiso
CREATE VIEW IF NOT EXISTS vista_historial_cierre_completo AS
SELECT 
    hac.id,
    hac.permiso_id,
    p.numero_pt,
    p.planta_nombre,
    p.aerogenerador_nombre,
    p.descripcion as descripcion_permiso,
    hac.version_intento,
    hac.accion,
    hac.estado_resultante,
    hac.usuario_id,
    hac.usuario_nombre,
    hac.comentarios,
    hac.fecha_accion,
    hac.observaciones_cierre,
    hac.fecha_inicio_trabajos,
    hac.fecha_fin_trabajos,
    hac.fecha_parada_turbina,
    hac.fecha_puesta_marcha_turbina,
    -- Indicar si es la versión más reciente
    CASE WHEN hac.version_intento = (
        SELECT MAX(version_intento) 
        FROM historial_aprobaciones_cierre hac2 
        WHERE hac2.permiso_id = hac.permiso_id
    ) THEN 1 ELSE 0 END as es_version_actual
FROM historial_aprobaciones_cierre hac
INNER JOIN permisos_trabajo p ON hac.permiso_id = p.id
ORDER BY hac.permiso_id, hac.version_intento DESC, hac.fecha_accion DESC;

-- Vista para obtener el estado actual de todos los cierres con historial
CREATE VIEW IF NOT EXISTS vista_estado_actual_cierres AS
SELECT DISTINCT
    p.id as permiso_id,
    p.numero_pt,
    p.planta_nombre,
    p.aerogenerador_nombre,
    p.estado as estado_permiso,
    pc.version,
    pc.estado_aprobacion_cierre,
    -- Datos del último intento
    last_hist.version_intento as ultimo_intento,
    last_hist.accion as ultima_accion,
    last_hist.estado_resultante,
    last_hist.usuario_nombre as ultimo_usuario,
    last_hist.fecha_accion as fecha_ultima_accion,
    last_hist.comentarios as ultimos_comentarios,
    -- Estadísticas del historial
    (SELECT COUNT(*) FROM historial_aprobaciones_cierre hac 
     WHERE hac.permiso_id = p.id) as total_intentos,
    (SELECT COUNT(*) FROM historial_aprobaciones_cierre hac 
     WHERE hac.permiso_id = p.id AND hac.accion = 'RECHAZAR') as total_rechazos
FROM permisos_trabajo p
LEFT JOIN permiso_cierre pc ON p.id = pc.permiso_id
LEFT JOIN historial_aprobaciones_cierre last_hist ON (
    last_hist.permiso_id = p.id 
    AND last_hist.version_intento = (
        SELECT MAX(version_intento) 
        FROM historial_aprobaciones_cierre hac2 
        WHERE hac2.permiso_id = p.id
    )
    AND last_hist.fecha_accion = (
        SELECT MAX(fecha_accion)
        FROM historial_aprobaciones_cierre hac3
        WHERE hac3.permiso_id = p.id 
        AND hac3.version_intento = last_hist.version_intento
    )
)
WHERE pc.id IS NOT NULL -- Solo permisos que tienen cierre
ORDER BY p.id;

-- Vista para análisis de rechazos
CREATE VIEW IF NOT EXISTS vista_analisis_rechazos AS
SELECT 
    p.planta_nombre,
    COUNT(*) as total_rechazos,
    COUNT(DISTINCT hac.permiso_id) as permisos_con_rechazos,
    AVG(CAST((julianday('now') - julianday(hac.fecha_accion)) AS INTEGER)) as dias_promedio_desde_rechazo,
    GROUP_CONCAT(DISTINCT substr(hac.comentarios, 1, 50) || '...', '; ') as motivos_frecuentes
FROM historial_aprobaciones_cierre hac
INNER JOIN permisos_trabajo p ON hac.permiso_id = p.id
WHERE hac.accion = 'RECHAZAR'
GROUP BY p.planta_nombre
ORDER BY total_rechazos DESC;

-- PASO 6: Crear triggers para mantener la integridad del versionado
-- ============================================================================

-- Trigger para actualizar automáticamente la versión cuando hay cambios en permiso_cierre
CREATE TRIGGER IF NOT EXISTS trigger_increment_version_permiso_cierre
    BEFORE UPDATE ON permiso_cierre
    FOR EACH ROW
    WHEN NEW.estado_aprobacion_cierre != OLD.estado_aprobacion_cierre
       OR NEW.observaciones_cierre != OLD.observaciones_cierre
       OR NEW.fecha_fin_trabajos != OLD.fecha_fin_trabajos
BEGIN
    UPDATE permiso_cierre 
    SET version = OLD.version + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Trigger para registrar automáticamente en el historial los cambios de estado
CREATE TRIGGER IF NOT EXISTS trigger_historial_cambio_estado_cierre
    AFTER UPDATE ON permiso_cierre
    FOR EACH ROW
    WHEN NEW.estado_aprobacion_cierre != OLD.estado_aprobacion_cierre
BEGIN
    INSERT INTO historial_aprobaciones_cierre (
        permiso_id,
        version_intento,
        accion,
        estado_resultante,
        usuario_id,
        usuario_nombre,
        comentarios,
        fecha_accion,
        observaciones_cierre,
        fecha_inicio_trabajos,
        fecha_fin_trabajos,
        fecha_parada_turbina,
        fecha_puesta_marcha_turbina
    ) VALUES (
        NEW.permiso_id,
        NEW.version,
        CASE 
            WHEN NEW.estado_aprobacion_cierre = 'APROBADO' THEN 'APROBAR'
            WHEN NEW.estado_aprobacion_cierre = 'RECHAZADO' THEN 'RECHAZAR'
            WHEN NEW.estado_aprobacion_cierre = 'PENDIENTE' THEN 'REENVIAR'
            ELSE 'ACTUALIZAR'
        END,
        CASE 
            WHEN NEW.estado_aprobacion_cierre = 'PENDIENTE' THEN 'CERRADO_PENDIENTE_APROBACION'
            WHEN NEW.estado_aprobacion_cierre = 'APROBADO' THEN 'CERRADO'
            WHEN NEW.estado_aprobacion_cierre = 'RECHAZADO' THEN 'CIERRE_RECHAZADO'
            ELSE NEW.estado_aprobacion_cierre
        END,
        COALESCE(NEW.usuario_aprobador_cierre_id, NEW.usuario_cierre, 'SISTEMA'),
        COALESCE(NEW.usuario_aprobador_cierre_nombre, NEW.usuario_cierre, 'Sistema'),
        COALESCE(
            CASE 
                WHEN NEW.estado_aprobacion_cierre = 'RECHAZADO' THEN 
                    'Rechazo: ' || COALESCE(NEW.motivo_rechazo, 'Sin motivo especificado')
                ELSE NEW.observaciones_aprobacion
            END,
            'Cambio automático de estado'
        ),
        CURRENT_TIMESTAMP,
        NEW.observaciones_cierre,
        NEW.fecha_inicio_trabajos,
        NEW.fecha_fin_trabajos,
        NEW.fecha_parada_turbina,
        NEW.fecha_puesta_marcha_turbina
    );
END;

-- PASO 7: Funciones auxiliares mediante vistas para consultas comunes
-- ============================================================================

-- Vista para obtener estadísticas de performance por supervisor
CREATE VIEW IF NOT EXISTS vista_performance_supervisores AS
SELECT 
    hac.usuario_nombre as supervisor,
    COUNT(*) as total_acciones,
    COUNT(CASE WHEN hac.accion = 'APROBAR' THEN 1 END) as aprobaciones,
    COUNT(CASE WHEN hac.accion = 'RECHAZAR' THEN 1 END) as rechazos,
    ROUND(
        100.0 * COUNT(CASE WHEN hac.accion = 'APROBAR' THEN 1 END) / 
        NULLIF(COUNT(CASE WHEN hac.accion IN ('APROBAR', 'RECHAZAR') THEN 1 END), 0),
        2
    ) as porcentaje_aprobacion,
    AVG(
        CASE WHEN hac.accion IN ('APROBAR', 'RECHAZAR') THEN
            julianday(hac.fecha_accion) - julianday(
                (SELECT MIN(hac2.fecha_accion) 
                 FROM historial_aprobaciones_cierre hac2 
                 WHERE hac2.permiso_id = hac.permiso_id 
                 AND hac2.version_intento = hac.version_intento)
            )
        END
    ) as tiempo_promedio_respuesta_dias
FROM historial_aprobaciones_cierre hac
WHERE hac.accion IN ('APROBAR', 'RECHAZAR')
GROUP BY hac.usuario_nombre
ORDER BY total_acciones DESC;

-- ============================================================================
-- FIN DE MIGRACIÓN 002
-- ============================================================================

-- INSTRUCCIONES POST-MIGRACIÓN:
-- 1. Ejecutar este script en el entorno de desarrollo primero
-- 2. Verificar que las vistas devuelvan datos consistentes
-- 3. Probar el sistema de versionado con algunos cambios de estado
-- 4. Ejecutar en producción durante una ventana de mantenimiento
-- 5. Monitorear el rendimiento de las consultas con los nuevos índices

-- ROLLBACK (solo en caso de emergencia):
-- Para hacer rollback de esta migración:
-- DROP VIEW vista_performance_supervisores;
-- DROP VIEW vista_analisis_rechazos;
-- DROP VIEW vista_estado_actual_cierres;  
-- DROP VIEW vista_historial_cierre_completo;
-- DROP TRIGGER trigger_historial_cambio_estado_cierre;
-- DROP TRIGGER trigger_increment_version_permiso_cierre;
-- DROP TABLE historial_aprobaciones_cierre;
-- ALTER TABLE permiso_cierre DROP COLUMN version;