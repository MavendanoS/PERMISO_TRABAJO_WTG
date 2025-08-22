-- ============================================================================
-- MIGRACIONES DE BASE DE DATOS - PERMISO TRABAJO WTG
-- ============================================================================
-- Estas migraciones implementan los campos faltantes para:
-- 1. Campo supervisor de planta responsable (ya existe como supervisor_parque_*)
-- 2. Campos de aprobación de cierre en tabla permiso_cierre  
-- 3. Campos de timestamps para horarios de aprobación y cierre
-- 4. Integridad referencial mejorada
-- ============================================================================

-- MIGRACIÓN 1: Actualizar tabla permisos_trabajo
-- ============================================================================

-- Agregar campos faltantes en permisos_trabajo
ALTER TABLE permisos_trabajo ADD COLUMN usuario_creador_id INTEGER;
ALTER TABLE permisos_trabajo ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE permisos_trabajo ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_permisos_usuario_creador ON permisos_trabajo(usuario_creador_id);
CREATE INDEX IF NOT EXISTS idx_permisos_planta ON permisos_trabajo(planta_id);
CREATE INDEX IF NOT EXISTS idx_permisos_estado ON permisos_trabajo(estado);
CREATE INDEX IF NOT EXISTS idx_permisos_fecha_creacion ON permisos_trabajo(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_permisos_supervisor_parque ON permisos_trabajo(supervisor_parque_id);

-- MIGRACIÓN 2: Actualizar tabla permiso_cierre
-- ============================================================================

-- Agregar campos de aprobación y timestamps en permiso_cierre
ALTER TABLE permiso_cierre ADD COLUMN supervisor_aprobacion_id INTEGER;
ALTER TABLE permiso_cierre ADD COLUMN supervisor_aprobacion_nombre TEXT;
ALTER TABLE permiso_cierre ADD COLUMN fecha_aprobacion_cierre DATETIME;
ALTER TABLE permiso_cierre ADD COLUMN usuario_aprobacion_cierre TEXT;
ALTER TABLE permiso_cierre ADD COLUMN estado_aprobacion TEXT DEFAULT 'PENDIENTE';
ALTER TABLE permiso_cierre ADD COLUMN observaciones_aprobacion TEXT;
ALTER TABLE permiso_cierre ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE permiso_cierre ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Crear índices para campos de aprobación
CREATE INDEX IF NOT EXISTS idx_cierre_supervisor_aprobacion ON permiso_cierre(supervisor_aprobacion_id);
CREATE INDEX IF NOT EXISTS idx_cierre_estado_aprobacion ON permiso_cierre(estado_aprobacion);
CREATE INDEX IF NOT EXISTS idx_cierre_fecha_aprobacion ON permiso_cierre(fecha_aprobacion_cierre);
CREATE INDEX IF NOT EXISTS idx_cierre_permiso_id ON permiso_cierre(permiso_id);

-- MIGRACIÓN 3: Triggers para actualizar updated_at automáticamente
-- ============================================================================

-- Trigger para permisos_trabajo
CREATE TRIGGER IF NOT EXISTS trigger_permisos_trabajo_updated_at 
  AFTER UPDATE ON permisos_trabajo
  FOR EACH ROW
BEGIN
  UPDATE permisos_trabajo SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger para permiso_cierre  
CREATE TRIGGER IF NOT EXISTS trigger_permiso_cierre_updated_at 
  AFTER UPDATE ON permiso_cierre
  FOR EACH ROW
BEGIN
  UPDATE permiso_cierre SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- MIGRACIÓN 4: Migrar datos existentes
-- ============================================================================

-- Establecer created_at para registros existentes sin timestamp
UPDATE permisos_trabajo 
SET created_at = COALESCE(fecha_creacion, CURRENT_TIMESTAMP)
WHERE created_at IS NULL;

-- Establecer updated_at para registros existentes
UPDATE permisos_trabajo 
SET updated_at = COALESCE(fecha_aprobacion, fecha_creacion, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;

-- Establecer timestamps para registros de cierre existentes
UPDATE permiso_cierre 
SET created_at = COALESCE(fecha_cierre, CURRENT_TIMESTAMP),
    updated_at = COALESCE(fecha_cierre, CURRENT_TIMESTAMP)
WHERE created_at IS NULL OR updated_at IS NULL;

-- MIGRACIÓN 5: Índices adicionales para optimización
-- ============================================================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_permisos_planta_estado ON permisos_trabajo(planta_id, estado);
CREATE INDEX IF NOT EXISTS idx_permisos_usuario_fecha ON permisos_trabajo(usuario_creador_id, fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_cierre_estado_fecha ON permiso_cierre(estado_aprobacion, fecha_aprobacion_cierre);

-- Índice para búsquedas por número de PT
CREATE INDEX IF NOT EXISTS idx_permisos_numero_pt ON permisos_trabajo(numero_pt);
CREATE INDEX IF NOT EXISTS idx_permisos_correlativo ON permisos_trabajo(planta_id, numero_correlativo);

-- MIGRACIÓN 6: Validaciones de integridad (constraints adicionales)
-- ============================================================================

-- Nota: SQLite no soporta ADD CONSTRAINT en ALTER TABLE,
-- por lo que estas validaciones se implementarán a nivel de aplicación

-- Estados válidos para permisos_trabajo:
-- 'CREADO', 'APROBADO', 'EN_EJECUCION', 'CERRADO', 'CANCELADO'

-- Estados válidos para estado_aprobacion en permiso_cierre:
-- 'PENDIENTE', 'APROBADO', 'RECHAZADO'

-- MIGRACIÓN 7: Vistas para consultas optimizadas
-- ============================================================================

-- Vista para permisos con información de cierre
CREATE VIEW IF NOT EXISTS vista_permisos_completos AS
SELECT 
    p.id,
    p.numero_pt,
    p.planta_nombre,
    p.aerogenerador_nombre,
    p.descripcion,
    p.jefe_faena_nombre,
    p.supervisor_parque_nombre,
    p.estado,
    p.fecha_creacion,
    p.usuario_creador,
    pc.fecha_fin_trabajos,
    pc.estado_aprobacion,
    pc.fecha_aprobacion_cierre,
    pc.supervisor_aprobacion_nombre
FROM permisos_trabajo p
LEFT JOIN permiso_cierre pc ON p.id = pc.permiso_id;

-- Vista para seguimiento de aprobaciones
CREATE VIEW IF NOT EXISTS vista_aprobaciones_pendientes AS
SELECT 
    p.id,
    p.numero_pt,
    p.planta_nombre,
    p.descripcion,
    p.jefe_faena_nombre,
    p.supervisor_parque_nombre,
    p.fecha_creacion,
    pc.fecha_cierre,
    pc.estado_aprobacion,
    CASE 
        WHEN pc.estado_aprobacion = 'PENDIENTE' THEN 
            CAST((julianday('now') - julianday(pc.fecha_cierre)) AS INTEGER)
        ELSE NULL
    END as dias_pendiente
FROM permisos_trabajo p
INNER JOIN permiso_cierre pc ON p.id = pc.permiso_id
WHERE pc.estado_aprobacion = 'PENDIENTE'
ORDER BY pc.fecha_cierre ASC;

-- ============================================================================
-- FIN DE MIGRACIONES
-- ============================================================================

-- Para ejecutar estas migraciones, ejecutar cada sección en orden
-- Verificar que no haya errores antes de continuar con la siguiente sección
-- Hacer backup de la base de datos antes de ejecutar las migraciones