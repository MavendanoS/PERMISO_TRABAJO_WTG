-- Migration: Add new fields to usuarios table
-- Date: 2025-01-26
-- Description: Adds RUT/DNI, phone, and job position fields for enhanced user administration

-- Add columns if they don't exist (SQLite doesn't have ADD COLUMN IF NOT EXISTS)
-- We'll use try-catch approach in the code

-- Add rut_dni column
ALTER TABLE usuarios ADD COLUMN rut_dni TEXT DEFAULT '';

-- Add telefono column  
ALTER TABLE usuarios ADD COLUMN telefono TEXT DEFAULT '';

-- Add cargo column
ALTER TABLE usuarios ADD COLUMN cargo TEXT DEFAULT '';

-- Update existing users to have empty strings instead of NULL for better frontend handling
UPDATE usuarios SET rut_dni = '' WHERE rut_dni IS NULL;
UPDATE usuarios SET telefono = '' WHERE telefono IS NULL;  
UPDATE usuarios SET cargo = '' WHERE cargo IS NULL;

-- Create indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_usuarios_rut_dni ON usuarios(rut_dni);
CREATE INDEX IF NOT EXISTS idx_usuarios_telefono ON usuarios(telefono);