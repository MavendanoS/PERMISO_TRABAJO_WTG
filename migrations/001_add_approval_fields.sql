-- Migración 001: Agregar campos de aprobación específicos
-- Fecha: 2025-01-21
-- Descripción: Agrega campos para distinguir entre aprobadores de apertura y cierre

-- 1. Agregar campos específicos de aprobación de apertura en permisos_trabajo
-- Nota: Mantenemos usuario_aprobador existente por compatibilidad
ALTER TABLE permisos_trabajo ADD COLUMN usuario_aprobador_apertura_id TEXT;
ALTER TABLE permisos_trabajo ADD COLUMN usuario_aprobador_apertura_nombre TEXT;

-- 2. Migrar datos existentes de usuario_aprobador a los nuevos campos
UPDATE permisos_trabajo 
SET usuario_aprobador_apertura_nombre = usuario_aprobador
WHERE usuario_aprobador IS NOT NULL;

-- 3. Agregar campos de aprobación de cierre en permiso_cierre
ALTER TABLE permiso_cierre ADD COLUMN usuario_aprobador_cierre_id TEXT;
ALTER TABLE permiso_cierre ADD COLUMN usuario_aprobador_cierre_nombre TEXT;
ALTER TABLE permiso_cierre ADD COLUMN fecha_aprobacion_cierre DATETIME;
ALTER TABLE permiso_cierre ADD COLUMN estado_aprobacion_cierre TEXT DEFAULT 'PENDIENTE';
ALTER TABLE permiso_cierre ADD COLUMN requiere_aprobacion INTEGER DEFAULT 1;

-- 4. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_permisos_aprobador_apertura ON permisos_trabajo(usuario_aprobador_apertura_id);
CREATE INDEX IF NOT EXISTS idx_cierre_aprobador ON permiso_cierre(usuario_aprobador_cierre_id);
CREATE INDEX IF NOT EXISTS idx_cierre_estado_aprobacion ON permiso_cierre(estado_aprobacion_cierre);

-- 5. Vista para permisos pendientes de aprobación de cierre
CREATE VIEW IF NOT EXISTS vista_cierres_pendientes_aprobacion AS
SELECT 
    pc.id as cierre_id,
    pc.permiso_id,
    pt.numero_pt,
    pt.planta_nombre,
    pt.aerogenerador_nombre,
    pc.usuario_cierre,
    pc.fecha_cierre,
    pc.estado_aprobacion_cierre,
    pt.supervisor_parque_nombre as supervisor_responsable
FROM permiso_cierre pc
JOIN permisos_trabajo pt ON pc.permiso_id = pt.id
WHERE pc.estado_aprobacion_cierre = 'PENDIENTE'
  AND pc.requiere_aprobacion = 1;