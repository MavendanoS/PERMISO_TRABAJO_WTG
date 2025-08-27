-- Migration script to synchronize permiso_cierre table schema
-- This script is idempotent and safe to run multiple times
-- Target: Align local DB with remote production DB structure

-- Step 1: Add missing fields that exist in remote but not local
-- These fields are needed for rejection handling
ALTER TABLE permiso_cierre ADD COLUMN motivo_rechazo TEXT;
ALTER TABLE permiso_cierre ADD COLUMN fecha_rechazo DATETIME;

-- Step 2: Drop problematic duplicate fields that don't exist in remote
-- These will be dropped if they exist to match remote schema
ALTER TABLE permiso_cierre DROP COLUMN IF EXISTS requiere_aprobacion;
ALTER TABLE permiso_cierre DROP COLUMN IF EXISTS supervisor_aprobacion_id;
ALTER TABLE permiso_cierre DROP COLUMN IF EXISTS supervisor_aprobacion_nombre;
ALTER TABLE permiso_cierre DROP COLUMN IF EXISTS usuario_aprobacion_cierre;
ALTER TABLE permiso_cierre DROP COLUMN IF EXISTS estado_aprobacion;

-- Note: Keep estado_aprobacion_cierre as the single source of truth for approval status
-- Note: observaciones_aprobacion is kept as it exists in both schemas