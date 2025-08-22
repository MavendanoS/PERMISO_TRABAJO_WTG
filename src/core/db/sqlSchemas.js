/**
 * SQL schema definitions for the PT Wind application.
 * These schemas mirror the table definitions from the original worker.js.
 */

export const SQL_SCHEMAS = {
  permisos_trabajo: `
    CREATE TABLE IF NOT EXISTS permisos_trabajo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_pt TEXT UNIQUE NOT NULL,
      numero_correlativo INTEGER,
      planta_id TEXT NOT NULL,
      planta_nombre TEXT NOT NULL,
      aerogenerador_id TEXT,
      aerogenerador_nombre TEXT,
      descripcion TEXT NOT NULL,
      jefe_faena_id TEXT NOT NULL,
      jefe_faena_nombre TEXT NOT NULL,
      supervisor_parque_id TEXT,
      supervisor_parque_nombre TEXT,
      tipo_mantenimiento TEXT NOT NULL,
      tipo_mantenimiento_otros TEXT,
      usuario_creador TEXT NOT NULL,
      usuario_creador_id INTEGER,
      fecha_inicio DATETIME,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      estado TEXT DEFAULT 'CREADO',
      observaciones TEXT,
      usuario_aprobador TEXT,
      usuario_aprobador_apertura_id TEXT,
      usuario_aprobador_apertura_nombre TEXT,
      fecha_aprobacion DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,
  permiso_personal: `
    CREATE TABLE IF NOT EXISTS permiso_personal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permiso_id INTEGER NOT NULL,
      personal_id TEXT NOT NULL,
      personal_nombre TEXT NOT NULL,
      personal_empresa TEXT NOT NULL,
      personal_rol TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (permiso_id) REFERENCES permisos_trabajo(id)
    );
  `,
  permiso_actividades: `
    CREATE TABLE IF NOT EXISTS permiso_actividades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permiso_id INTEGER NOT NULL,
      actividad_id TEXT NOT NULL,
      actividad_nombre TEXT NOT NULL,
      tipo_actividad TEXT DEFAULT 'RUTINARIA',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (permiso_id) REFERENCES permisos_trabajo(id)
    );
  `,
  permiso_matriz_riesgos: `
    CREATE TABLE IF NOT EXISTS permiso_matriz_riesgos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permiso_id INTEGER NOT NULL,
      riesgo_id TEXT NOT NULL,
      riesgo_nombre TEXT NOT NULL,
      probabilidad INTEGER NOT NULL,
      severidad INTEGER NOT NULL,
      nivel_riesgo TEXT NOT NULL,
      medidas_control TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (permiso_id) REFERENCES permisos_trabajo(id)
    );
  `,
  permiso_cierre: `
    CREATE TABLE IF NOT EXISTS permiso_cierre (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permiso_id INTEGER NOT NULL UNIQUE,
      fecha_inicio_trabajos DATETIME,
      fecha_fin_trabajos DATETIME NOT NULL,
      fecha_parada_turbina DATETIME,
      fecha_puesta_marcha_turbina DATETIME,
      observaciones_cierre TEXT,
      usuario_cierre TEXT NOT NULL,
      fecha_cierre DATETIME NOT NULL,
      usuario_aprobador_cierre_id TEXT,
      usuario_aprobador_cierre_nombre TEXT,
      fecha_aprobacion_cierre DATETIME,
      estado_aprobacion_cierre TEXT DEFAULT 'PENDIENTE',
      requiere_aprobacion INTEGER DEFAULT 1,
      supervisor_aprobacion_id INTEGER,
      supervisor_aprobacion_nombre TEXT,
      usuario_aprobacion_cierre TEXT,
      estado_aprobacion TEXT DEFAULT 'PENDIENTE',
      observaciones_aprobacion TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (permiso_id) REFERENCES permisos_trabajo(id)
    );
  `,
  permiso_materiales: `
    CREATE TABLE IF NOT EXISTS permiso_materiales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permiso_id INTEGER NOT NULL,
      cantidad INTEGER DEFAULT 1,
      descripcion TEXT NOT NULL,
      propietario TEXT,
      almacen TEXT,
      fecha_uso DATETIME,
      numero_item TEXT,
      numero_serie TEXT,
      observaciones_material TEXT,
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (permiso_id) REFERENCES permisos_trabajo(id)
    );
  `,
  audit_log: `
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      user_id INTEGER,
      user_email TEXT,
      action TEXT NOT NULL,
      resource TEXT,
      resource_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      success INTEGER NOT NULL,
      error_message TEXT,
      metadata TEXT
    );
  `
};

export default SQL_SCHEMAS;
