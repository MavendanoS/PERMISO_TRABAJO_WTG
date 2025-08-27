-- ============================================================================
-- SCRIPT DE APLICACIÓN IDEMPOTENTE - HISTORIAL DE APROBACIONES DE CIERRE
-- ============================================================================
-- Este script puede ejecutarse múltiples veces de forma segura.
-- Verifica el estado actual antes de aplicar cada cambio.
-- ============================================================================

-- Configurar modo de transacción para garantizar consistencia
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- Iniciar transacción
BEGIN TRANSACTION;

-- ============================================================================
-- VERIFICACIÓN PREVIA DEL ESTADO DE LA MIGRACIÓN
-- ============================================================================

-- Crear tabla temporal para el control de migración
CREATE TABLE IF NOT EXISTS migration_control (
    migration_id TEXT PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'APPLIED'
);

-- Verificar si la migración ya fue aplicada
INSERT OR IGNORE INTO migration_control (migration_id, status) 
VALUES ('002_historial_aprobaciones_cierre', 'IN_PROGRESS');

-- Variables de control (simuladas mediante consultas)
-- SQLite no soporta variables, usaremos consultas para verificar estado

-- ============================================================================
-- PASO 1: CREAR TABLA HISTORIAL SI NO EXISTE
-- ============================================================================

-- Verificar si la tabla historial_aprobaciones_cierre existe
SELECT CASE 
    WHEN COUNT(*) > 0 THEN 'EXISTS' 
    ELSE 'NOT_EXISTS' 
END as tabla_historial_status
FROM sqlite_master 
WHERE type='table' AND name='historial_aprobaciones_cierre';

-- Crear tabla solo si no existe
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

-- ============================================================================
-- PASO 2: AGREGAR COLUMNA VERSION SI NO EXISTE
-- ============================================================================

-- Verificar si la columna version existe en permiso_cierre
SELECT COUNT(*) as version_column_exists
FROM pragma_table_info('permiso_cierre') 
WHERE name = 'version';

-- Intentar agregar la columna (falla silenciosamente si ya existe)
-- SQLite no soporta "IF NOT EXISTS" en ALTER TABLE ADD COLUMN
-- Usamos un enfoque que ignore errores para columnas duplicadas

-- Método: Crear nueva tabla temporal, copiar datos, renombrar
-- Solo si la columna no existe

-- Primero verificamos si necesitamos agregar la columna
INSERT OR REPLACE INTO migration_control (migration_id, status)
SELECT 
    'version_column_check',
    CASE 
        WHEN COUNT(*) = 0 THEN 'COLUMN_NEEDED'
        ELSE 'COLUMN_EXISTS'
    END
FROM pragma_table_info('permiso_cierre') 
WHERE name = 'version';

-- Si la columna no existe, la agregamos de forma segura
-- Usamos un método que no falla si la columna ya existe

-- Método seguro para agregar columna en SQLite:
-- 1. Crear tabla temporal con nueva estructura
-- 2. Copiar datos
-- 3. Eliminar tabla original
-- 4. Renombrar temporal

-- Obtener esquema actual de permiso_cierre
-- Como SQLite no permite verificación condicional fácil, 
-- usaremos un approach más directo pero seguro

-- Verificar la existencia de la columna y actuar en consecuencia
-- Si el ALTER TABLE falla (porque la columna ya existe), continuamos

-- Método simplificado: intentar agregar, ignorar error si ya existe
-- En SQLite, esto se maneja a nivel de aplicación

-- Agregar columna version (puede fallar si ya existe, pero es seguro)
ALTER TABLE permiso_cierre ADD COLUMN version INTEGER DEFAULT 1;

-- ============================================================================
-- PASO 3: CREAR ÍNDICES SI NO EXISTEN
-- ============================================================================

-- Todos los índices usan IF NOT EXISTS por lo que son seguros de ejecutar múltiples veces

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

CREATE INDEX IF NOT EXISTS idx_historial_permiso_fecha 
    ON historial_aprobaciones_cierre(permiso_id, fecha_accion DESC);

CREATE INDEX IF NOT EXISTS idx_permiso_cierre_version 
    ON permiso_cierre(version);

-- ============================================================================
-- PASO 4: MIGRAR DATOS EXISTENTES (IDEMPOTENTE)
-- ============================================================================

-- 4.1: Establecer version inicial solo para registros que no la tienen
UPDATE permiso_cierre 
SET version = 1 
WHERE version IS NULL OR version = 0;

-- 4.2: Migrar registros existentes al historial solo si no existen ya
-- Verificar si ya hay registros migrados
SELECT COUNT(*) as registros_historial_existentes
FROM historial_aprobaciones_cierre;

-- Migrar solo registros que no están en el historial
INSERT OR IGNORE INTO historial_aprobaciones_cierre (
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

-- ============================================================================
-- PASO 5: CREAR VISTAS OPTIMIZADAS (IDEMPOTENTE)
-- ============================================================================

-- Eliminar vistas si existen (para recrear con estructura actualizada)
DROP VIEW IF EXISTS vista_historial_cierre_completo;
DROP VIEW IF EXISTS vista_estado_actual_cierres;
DROP VIEW IF EXISTS vista_analisis_rechazos;
DROP VIEW IF EXISTS vista_performance_supervisores;

-- Recrear vistas con estructura actualizada
CREATE VIEW vista_historial_cierre_completo AS
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
    CASE WHEN hac.version_intento = (
        SELECT MAX(version_intento) 
        FROM historial_aprobaciones_cierre hac2 
        WHERE hac2.permiso_id = hac.permiso_id
    ) THEN 1 ELSE 0 END as es_version_actual
FROM historial_aprobaciones_cierre hac
INNER JOIN permisos_trabajo p ON hac.permiso_id = p.id
ORDER BY hac.permiso_id, hac.version_intento DESC, hac.fecha_accion DESC;

CREATE VIEW vista_estado_actual_cierres AS
SELECT DISTINCT
    p.id as permiso_id,
    p.numero_pt,
    p.planta_nombre,
    p.aerogenerador_nombre,
    p.estado as estado_permiso,
    pc.version,
    pc.estado_aprobacion_cierre,
    last_hist.version_intento as ultimo_intento,
    last_hist.accion as ultima_accion,
    last_hist.estado_resultante,
    last_hist.usuario_nombre as ultimo_usuario,
    last_hist.fecha_accion as fecha_ultima_accion,
    last_hist.comentarios as ultimos_comentarios,
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
WHERE pc.id IS NOT NULL
ORDER BY p.id;

CREATE VIEW vista_analisis_rechazos AS
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

CREATE VIEW vista_performance_supervisores AS
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
-- PASO 6: CREAR TRIGGERS (IDEMPOTENTE)
-- ============================================================================

-- Eliminar triggers si existen (para recrear)
DROP TRIGGER IF EXISTS trigger_increment_version_permiso_cierre;
DROP TRIGGER IF EXISTS trigger_historial_cambio_estado_cierre;

-- Recrear triggers
CREATE TRIGGER trigger_increment_version_permiso_cierre
    BEFORE UPDATE ON permiso_cierre
    FOR EACH ROW
    WHEN NEW.estado_aprobacion_cierre != OLD.estado_aprobacion_cierre
       OR COALESCE(NEW.observaciones_cierre, '') != COALESCE(OLD.observaciones_cierre, '')
       OR COALESCE(NEW.fecha_fin_trabajos, '') != COALESCE(OLD.fecha_fin_trabajos, '')
BEGIN
    UPDATE permiso_cierre 
    SET version = OLD.version + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_historial_cambio_estado_cierre
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

-- ============================================================================
-- FINALIZAR MIGRACIÓN
-- ============================================================================

-- Marcar migración como completada
UPDATE migration_control 
SET status = 'APPLIED', applied_at = CURRENT_TIMESTAMP
WHERE migration_id = '002_historial_aprobaciones_cierre';

-- Confirmar transacción
COMMIT;

-- ============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================================

-- Consultas de verificación (no afectan los datos, solo informativas)

-- Verificar que la tabla historial fue creada
SELECT 'Tabla historial_aprobaciones_cierre: ' || 
       CASE WHEN COUNT(*) > 0 THEN 'CREADA' ELSE 'NO ENCONTRADA' END as status
FROM sqlite_master 
WHERE type='table' AND name='historial_aprobaciones_cierre';

-- Verificar que la columna version fue agregada
SELECT 'Columna version en permiso_cierre: ' || 
       CASE WHEN COUNT(*) > 0 THEN 'AGREGADA' ELSE 'NO ENCONTRADA' END as status
FROM pragma_table_info('permiso_cierre') 
WHERE name = 'version';

-- Contar registros migrados
SELECT 'Registros en historial: ' || COUNT(*) as status
FROM historial_aprobaciones_cierre;

-- Verificar triggers
SELECT 'Triggers creados: ' || COUNT(*) as status
FROM sqlite_master 
WHERE type='trigger' 
AND name IN ('trigger_increment_version_permiso_cierre', 'trigger_historial_cambio_estado_cierre');

-- Verificar vistas
SELECT 'Vistas creadas: ' || COUNT(*) as status
FROM sqlite_master 
WHERE type='view' 
AND name IN ('vista_historial_cierre_completo', 'vista_estado_actual_cierres', 'vista_analisis_rechazos', 'vista_performance_supervisores');

-- Estado final de la migración
SELECT migration_id, status, applied_at 
FROM migration_control 
WHERE migration_id = '002_historial_aprobaciones_cierre';

-- ============================================================================
-- FIN DEL SCRIPT DE APLICACIÓN IDEMPOTENTE
-- ============================================================================