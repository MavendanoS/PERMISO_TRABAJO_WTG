export const SQL_SCHEMAS = {
  // Esquemas para DB_PERMISOS (permisos-trabajo-db)
  PERMISOS_TRABAJO: `
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
      fecha_inicio DATETIME,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      estado TEXT DEFAULT 'CREADO',
      observaciones TEXT,
      usuario_aprobador TEXT,
      fecha_aprobacion DATETIME
    );
  `,
  PERMISO_PERSONAL: `
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
  PERMISO_ACTIVIDADES: `
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
  PERMISO_MATRIZ_RIESGOS: `
    CREATE TABLE IF NOT EXISTS permiso_matriz_riesgos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permiso_id INTEGER NOT NULL,
      actividad TEXT NOT NULL,
      peligro TEXT NOT NULL,
      riesgo TEXT NOT NULL,
      medidas_preventivas TEXT NOT NULL,
      codigo_matriz TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (permiso_id) REFERENCES permisos_trabajo(id)
    );
  `,
  PERMISO_CIERRE: `
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
      FOREIGN KEY (permiso_id) REFERENCES permisos_trabajo(id)
    );
  `,
  PERMISO_MATERIALES: `
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
  AUDIT_LOG: `
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      timestamp DATETIME,
      user_id TEXT,
      user_email TEXT,
      action TEXT,
      resource TEXT,
      resource_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      success BOOLEAN,
      error_message TEXT,
      metadata TEXT
    );
  `
};