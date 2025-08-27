-- Add missing rejection fields to local DB to match remote schema
-- This migration is safe and idempotent

-- Add motivo_rechazo if it doesn't exist
ALTER TABLE permiso_cierre ADD COLUMN motivo_rechazo TEXT;

-- Add fecha_rechazo if it doesn't exist  
ALTER TABLE permiso_cierre ADD COLUMN fecha_rechazo DATETIME;