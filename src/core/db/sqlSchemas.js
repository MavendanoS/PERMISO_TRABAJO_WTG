/**
 * SQL schema definitions for the PT Wind application.
 * These schemas mirror the table definitions from the original worker.js.
 */

export const SQL_SCHEMAS = {
  permisos_trabajo: `
    CREATE TABLE IF NOT EXISTS permisos_trabajo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      personal_id INTEGER NOT NULL,
      supervisor_id INTEGER NOT NULL,
      parque_id INTEGER NOT NULL,
      fecha DATE NOT NULL,
      hora_inicio TEXT NOT NULL,
      hora_fin TEXT NOT NULL,
      trabajos_a_realizar TEXT NOT NULL,
      area TEXT NOT NULL,
      riesgos_asociados TEXT NOT NULL,
      firma_solicitante TEXT,
      firma_supervisor TEXT,
      firma_autorizador TEXT,
      estado TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (personal_id) REFERENCES permiso_personal(id),
      FOREIGN KEY (supervisor_id) REFERENCES permiso_personal(id)
    );
  `,
  permiso_personal: `
    CREATE TABLE IF NOT EXISTS permiso_personal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permiso_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      rut TEXT NOT NULL,
      cargo TEXT NOT NULL,
      empresa TEXT NOT NULL,
      tipo_persona TEXT NOT NULL,
      personal_id_supervisor INTEGER,
      UNIQUE(rut, permiso_id),
      FOREIGN KEY (permiso_id) REFERENCES permisos_trabajo(id)
    );
  `,
  permiso_actividades: `
    CREATE TABLE IF NOT EXISTS permiso_actividades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permiso_id INTEGER NOT NULL,
      actividad TEXT NOT NULL,
      tiene_planificacion BOOLEAN NOT NULL,
      riesgo TEXT NOT NULL,
      medidas_seguridad TEXT NOT NULL,
      FOREIGN KEY (permiso_id) REFERENCES permisos_trabajo(id)
    );
  `,
  permiso_matriz_riesgos: `
    CREATE TABLE IF NOT EXISTS permiso_matriz_riesgos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permiso_id INTEGER NOT NULL,
      riesgo TEXT NOT NULL,
      probabilidad INTEGER NOT NULL,
      severidad INTEGER NOT NULL,
      medidas TEXT NOT NULL,
      resultado INTEGER NOT NULL,
      FOREIGN KEY (permiso_id) REFERENCES permisos_trabajo(id)
    );
  `,
  permiso_cierre: `
    CREATE TABLE IF NOT EXISTS permiso_cierre (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permiso_id INTEGER NOT NULL,
      hora_cierre TEXT NOT NULL,
      trabajo_realizado TEXT NOT NULL,
      trabajo_estado TEXT NOT NULL,
      personal_firma TEXT,
      supervisor_firma TEXT,
      observaciones TEXT,
      FOREIGN KEY (permiso_id) REFERENCES permisos_trabajo(id)
    );
  `,
  permiso_materiales: `
    CREATE TABLE IF NOT EXISTS permiso_materiales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permiso_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      tipo TEXT NOT NULL,
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
