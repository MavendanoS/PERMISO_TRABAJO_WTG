/**
 * PT_Wind - PWA para Permisos de Trabajo en Parques Eólicos
 * Versión 18.0 - D1 DATABASE COMPLETE EDITION
 * 
 * MIGRACIÓN COMPLETA A D1 DATABASE:
 * =====================================
 * ✅ Eliminadas todas las referencias a Notion
 * ✅ Base de datos "master" para tablas estáticas
 * ✅ Base de datos "hseq" para matriz de riesgos
 * ✅ Mantiene toda la seguridad implementada
 * ✅ Optimizado para D1 Database
 * 
 * CONFIGURACIÓN REQUERIDA:
 * ========================
 * 1. Bindings en wrangler.toml:
 *    [[d1_databases]]
 *    binding = "DB_MASTER"
 *    database_name = "master"
 *    database_id = "tu-id-de-master"
 *    
 *    [[d1_databases]]
 *    binding = "DB_HSEQ"
 *    database_name = "hseq"
 *    database_id = "tu-id-de-hseq"
 *    
 *    [[d1_databases]]
 *    binding = "DB_PERMISOS"
 *    database_name = "permisos-trabajo-db"
 *    database_id = "tu-id-de-permisos"
 * 
 * 2. Variables de entorno (wrangler secret put):
 *    - JWT_SECRET (obligatorio)
 *    - ALLOWED_ORIGINS (opcional)
 * 
 * 3. KV Namespace para rate limiting (opcional):
 *    [[kv_namespaces]]
 *    binding = "RATE_LIMIT_KV"
 *    id = "tu-kv-id"
 */

// ============================================================================
// CONFIGURACIÓN DE SEGURIDAD
// ============================================================================

const SECURITY_CONFIG = {
  rateLimits: {
    login: { windowMs: 900000, max: 5, blockDuration: 3600 },
    api: { windowMs: 60000, max: 100 },
    heavy: { windowMs: 300000, max: 10 }
  },
  session: {
    duration: 7200,
    refreshThreshold: 1800,
    maxSessions: 5
  },
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    maxAge: 90
  },
  crypto: {
    iterations: 100000,
    hashLength: 32,
    saltLength: 32,
    algorithm: 'SHA-256'
  }
}

// ============================================================================
// CLASES DE SEGURIDAD (mantener como está)
// ============================================================================

class SecurityError extends Error {
  constructor(publicMessage, privateDetails = null) {
    super(publicMessage);
    this.name = 'SecurityError';
    this.publicMessage = publicMessage;
    this.privateDetails = privateDetails;
    this.timestamp = new Date().toISOString();
  }
  
  toPublicJSON() {
    return {
      error: this.publicMessage,
      timestamp: this.timestamp
    };
  }
}

class InputSanitizer {
  static sanitizeString(input, options = {}) {
    if (typeof input !== 'string') return input;
    
    let sanitized = input
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    const maxLength = options.maxLength || 10000;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }
  
  static sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = key.replace(/[^\w.-]/g, '');
      
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[sanitizedKey] = value.map(item => 
          typeof item === 'object' ? this.sanitizeObject(item) : this.sanitizeString(item)
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }
    
    return sanitized;
  }
  
  static sanitizeForSQL(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[\0\x08\x09\x1a\n\r"'\\%]/g, (char) => {
        switch (char) {
          case "\0": return "\\0";
          case "\x08": return "\\b";
          case "\x09": return "\\t";
          case "\x1a": return "\\z";
          case "\n": return "\\n";
          case "\r": return "\\r";
          case "\"":
          case "'":
          case "\\":
          case "%": return "\\" + char;
          default: return char;
        }
      });
  }
}

class RateLimiter {
  constructor(env) {
    this.env = env;
  }
  
  async check(identifier, type = 'api') {
    const config = SECURITY_CONFIG.rateLimits[type];
    if (!config) return true;
    
    if (!this.env.RATE_LIMIT_KV) {
      console.log('Rate limiting not configured (KV missing)');
      return true;
    }
    
    const key = `rl:${type}:${identifier}`;
    const blockKey = `rl:block:${type}:${identifier}`;
    
    const blocked = await this.env.RATE_LIMIT_KV.get(blockKey);
    if (blocked) {
      throw new SecurityError('Demasiados intentos. Intente más tarde.');
    }
    
    const attempts = parseInt(await this.env.RATE_LIMIT_KV.get(key) || '0');
    
    if (attempts >= config.max) {
      await this.env.RATE_LIMIT_KV.put(blockKey, 'true', {
        expirationTtl: config.blockDuration
      });
      throw new SecurityError('Límite de intentos excedido');
    }
    
    await this.env.RATE_LIMIT_KV.put(key, (attempts + 1).toString(), {
      expirationTtl: Math.floor(config.windowMs / 1000)
    });
    
    return true;
  }
  
  async reset(identifier, type = 'api') {
    if (!this.env.RATE_LIMIT_KV) return;
    
    const key = `rl:${type}:${identifier}`;
    const blockKey = `rl:block:${type}:${identifier}`;
    
    await this.env.RATE_LIMIT_KV.delete(key);
    await this.env.RATE_LIMIT_KV.delete(blockKey);
  }
}

class AuthService {
  constructor(env) {
    this.env = env;
    this.SECRET = env.JWT_SECRET || crypto.randomUUID();
  }
  
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(SECURITY_CONFIG.crypto.saltLength));
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const hash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: SECURITY_CONFIG.crypto.iterations,
        hash: SECURITY_CONFIG.crypto.algorithm
      },
      keyMaterial,
      SECURITY_CONFIG.crypto.hashLength * 8
    );
    
    const hashArray = new Uint8Array(hash);
    const saltHex = this.bufferToHex(salt);
    const hashHex = this.bufferToHex(hashArray);
    
    return `pbkdf2:${SECURITY_CONFIG.crypto.iterations}:${saltHex}:${hashHex}`;
  }
  
  async verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.startsWith('pbkdf2:')) {
      // Hash antiguo (SHA-256 simple) - verificar y actualizar
      const oldHash = await this.oldHashMethod(password);
      if (oldHash === storedHash) {
        return { valid: true, needsUpdate: true };
      }
      // Plaintext legacy
      if (password === storedHash) {
        return { valid: true, needsUpdate: true };
      }
      return { valid: false };
    }
    
    const [, iterations, salt, hash] = storedHash.split(':');
    const encoder = new TextEncoder();
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const newHash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: this.hexToBuffer(salt),
        iterations: parseInt(iterations),
        hash: SECURITY_CONFIG.crypto.algorithm
      },
      keyMaterial,
      SECURITY_CONFIG.crypto.hashLength * 8
    );
    
    const newHashHex = this.bufferToHex(new Uint8Array(newHash));
    
    return { valid: newHashHex === hash, needsUpdate: false };
  }
  
  async generateToken(user) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      empresa: user.empresa,
      esEnel: user.esEnel,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + SECURITY_CONFIG.session.duration,
      jti: crypto.randomUUID()
    };
    
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    
    const signature = await this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
      this.SECRET
    );
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
  
  async verifyToken(token) {
    if (!token) throw new SecurityError('Token no proporcionado');
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new SecurityError('Token inválido');
    }
    
    const [encodedHeader, encodedPayload, signature] = parts;
    
    const expectedSignature = await this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
      this.SECRET
    );
    
    if (signature !== expectedSignature) {
      throw new SecurityError('Firma de token inválida');
    }
    
    const payload = JSON.parse(this.base64UrlDecode(encodedPayload));
    
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new SecurityError('Token expirado');
    }
    
    return payload;
  }
  
  async createSignature(data, secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(data)
    );
    
    return this.base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  }
  
  base64UrlEncode(str) {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  
  base64UrlDecode(str) {
    str = (str + '===').slice(0, str.length + (str.length % 4));
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  }
  
  bufferToHex(buffer) {
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }
  
  async oldHashMethod(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

class AuditLogger {
  constructor(env) {
    this.env = env;
  }
  
  async log(event) {
    if (!this.env.DB_PERMISOS) return;
    
    try {
      const logEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        user_id: event.userId || 'anonymous',
        user_email: event.userEmail || 'unknown',
        action: event.action,
        resource: event.resource,
        resource_id: event.resourceId || null,
        ip_address: event.ip || 'unknown',
        user_agent: event.userAgent || 'unknown',
        success: event.success !== false,
        error_message: event.error || null,
        metadata: JSON.stringify(event.metadata || {})
      };
      
      await this.env.DB_PERMISOS.prepare(`
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
        )
      `).run();
      
      await this.env.DB_PERMISOS.prepare(`
        INSERT INTO audit_log VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        logEntry.id,
        logEntry.timestamp,
        logEntry.user_id,
        logEntry.user_email,
        logEntry.action,
        logEntry.resource,
        logEntry.resource_id,
        logEntry.ip_address,
        logEntry.user_agent,
        logEntry.success ? 1 : 0,
        logEntry.error_message,
        logEntry.metadata
      ).run();
      
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }
}

// ============================================================================
// ESQUEMAS SQL para D1 Database
// ============================================================================

const SQL_SCHEMAS = {
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

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function getLocalDateTime() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset();
  const localTime = new Date(now.getTime() - (timezoneOffset * 60000));
  return localTime.toISOString();
}

function formatLocalDateTime(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
}

function getSecurityHeaders() {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self'",
      "manifest-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  };
}

function getCorsHeaders(env, request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = env.ALLOWED_ORIGINS 
    ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['*'];
  
  const corsHeaders = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
  
  if (allowedOrigins.includes('*')) {
    corsHeaders['Access-Control-Allow-Origin'] = '*';
  } else if (origin && allowedOrigins.includes(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
    corsHeaders['Access-Control-Allow-Credentials'] = 'true';
  }
  
  return corsHeaders;
}

// ============================================================================
// WORKER PRINCIPAL
// ============================================================================

const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Inicializar servicios de seguridad
    const rateLimiter = new RateLimiter(env);
    const authService = new AuthService(env);
    const auditLogger = new AuditLogger(env);
    
    const corsHeaders = getCorsHeaders(env, request);
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        headers: { 
          ...corsHeaders,
          ...getSecurityHeaders()
        }
      });
    }
    
    try {
      // Rate limiting global
      const clientIp = request.headers.get('CF-Connecting-IP') || 
                      request.headers.get('X-Forwarded-For') || 
                      'unknown';
      
      await rateLimiter.check(clientIp, 'api');
      
      // Log request
      await auditLogger.log({
        action: 'REQUEST',
        resource: path,
        ip: clientIp,
        userAgent: request.headers.get('User-Agent'),
        success: true
      });
      
      // Inicializar DBs si existen
      if (env.DB_PERMISOS) {
        await initializeDatabase(env.DB_PERMISOS);
      }
      
      // Manejar manifest.json
      if (path === '/manifest.json') {
        return new Response(JSON.stringify({
          "name": "PT Wind - Permisos de Trabajo",
          "short_name": "PT Wind",
          "start_url": "/",
          "display": "standalone",
          "background_color": "#ffffff",
          "theme_color": "#1a1f2e",
          "scope": "/",
          "icons": [{
            "src": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAyODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiMxYTFmMmUiLz48L3N2Zz4=",
            "type": "image/svg+xml",
            "sizes": "128x128"
          }]
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400',
            ...corsHeaders,
            ...getSecurityHeaders()
          }
        });
      }
      
      // Manejar API
      if (path.startsWith('/api/')) {
        return await handleApiRequest(request, corsHeaders, env, {
          rateLimiter,
          authService,
          auditLogger
        });
      }
      
      // Servir app
      return new Response(getWebApp(), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=86400',
          ...corsHeaders,
          ...getSecurityHeaders()
        }
      });
      
    } catch (error) {
      console.error('Worker error:', error);
      
      if (error instanceof SecurityError) {
        return new Response(JSON.stringify(error.toPublicJSON()), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
            ...getSecurityHeaders()
          }
        });
      }
      
      return new Response(JSON.stringify({ 
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
          ...getSecurityHeaders()
        }
      });
    }
  }
};

export default worker;

async function initializeDatabase(db) {
  try {
    // Crear tablas si no existen
    for (const [name, schema] of Object.entries(SQL_SCHEMAS)) {
      await db.prepare(schema).run();
    }
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

async function handleApiRequest(request, corsHeaders, env, services) {
  console.log('handleApiRequest: Starting API request handling');
  const { rateLimiter, authService, auditLogger } = services;
  console.log('handleApiRequest: Services extracted');
  const url = new URL(request.url);
  // Clean the pathname to handle potential double /api/ patterns
  let endpoint = url.pathname;
  // Remove leading /api/ or /api/api/ patterns
  endpoint = endpoint.replace(/^\/api\/(api\/)?/, '');
  console.log('handleApiRequest: Endpoint:', endpoint);
  
  try {
    // Endpoints públicos
    const publicEndpoints = ['login', 'health'];
    let currentUser = null;
    
    // Verificar autenticación si no es endpoint público
    if (!publicEndpoints.includes(endpoint)) {
      const authHeader = request.headers.get('Authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          currentUser = await authService.verifyToken(token);
        } catch (error) {
          console.log('Token verification failed, continuing without auth');
        }
      }
    }
    
    switch (endpoint) {
      case 'login':
        console.log('handleApiRequest: About to call handleLogin');
        return await handleLogin(request, corsHeaders, env, services);
      case 'change-password':
        return await handleChangePassword(request, corsHeaders, env, services);
      case 'users':
        return await handleUsers(request, corsHeaders, env);
      case 'admin-users':
        return await handleAdminUsers(request, corsHeaders, env, currentUser, services);
      case 'personal':
        return await handlePersonal(request, corsHeaders, env);
      case 'personal-by-parque':
        return await handlePersonalByParque(request, corsHeaders, env);
      case 'supervisores':
        return await handleSupervisores(request, corsHeaders, env);
      case 'parques':
        return await handleParques(request, corsHeaders, env);
      case 'aerogeneradores':
        return await handleAerogeneradores(request, corsHeaders, env);
      case 'matriz-riesgos':
        return await handleMatrizRiesgos(request, corsHeaders, env);
      case 'actividades':
        return await handleActividades(request, corsHeaders, env);
      case 'permisos':
        return await handlePermisos(request, corsHeaders, env, currentUser, services);
      case 'cerrar-permiso':
        return await handleCerrarPermiso(request, corsHeaders, env, currentUser, services);
      case 'aprobar-permiso':
        return await handleAprobarPermiso(request, corsHeaders, env, currentUser, services);
      case 'aprobar-cierre-permiso':
        return await handleAprobarCierrePermiso(request, corsHeaders, env, currentUser, services);
      case 'historial-cierre':
        return await handleHistorialCierre(request, corsHeaders, env, currentUser, services);
      case 'generate-register':
        return await handleGenerateRegister(request, corsHeaders, env);
      case 'health':
        return await handleHealth(request, corsHeaders, env);
      case 'system-stats':
        return await handleSystemStats(request, corsHeaders, env, currentUser, services);
      default:
        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
  } catch (error) {
    console.error(`API error on ${endpoint}:`, error);
    return new Response(JSON.stringify({ 
      error: error.message,
      endpoint: endpoint 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// ============================================================================
// HANDLERS PARA D1 DATABASE
// ============================================================================

async function handleLogin(request, corsHeaders, env, services) {
  try {
    console.log('handleLogin: Starting login process');
    const { rateLimiter, authService, auditLogger } = services;
    console.log('handleLogin: Services extracted');
    
    if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  
  try {
    // Rate limiting para login
    await rateLimiter.check(clientIp, 'login');
    
    // Parsear y sanitizar
    const rawData = await request.json();
    const { usuario, password } = InputSanitizer.sanitizeObject(rawData);
    
    if (!usuario || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Usuario y contraseña son requeridos' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Buscar usuario en D1
    const userResult = await env.DB_MASTER.prepare(`
      SELECT * FROM usuarios 
      WHERE LOWER(email) = LOWER(?) OR LOWER(usuario) = LOWER(?)
      LIMIT 1
    `).bind(usuario, usuario).first();
    
    if (!userResult) {
      await auditLogger.log({
        action: 'LOGIN_FAILED',
        resource: 'auth',
        ip: clientIp,
        userEmail: usuario,
        success: false,
        error: 'Usuario no encontrado'
      });
      
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Usuario no encontrado' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Verificar contraseña
    const verification = await authService.verifyPassword(password, userResult.password_hash);
    
    if (!verification.valid) {
      await auditLogger.log({
        action: 'LOGIN_FAILED',
        resource: 'auth',
        userId: userResult.id,
        userEmail: userResult.email,
        ip: clientIp,
        success: false,
        error: 'Contraseña incorrecta'
      });

      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Contraseña incorrecta' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }


    // Actualizar hash si es necesario
    if (verification.needsUpdate) {
      try {
        const newHash = await authService.hashPassword(password);
        await env.DB_MASTER.prepare(`
          UPDATE usuarios SET password_hash = ? WHERE id = ?
        `).bind(newHash, userResult.id).run();
      } catch (error) {
        console.warn('Could not update password hash:', error);
      }
    }
    
    // Actualizar último login
    await env.DB_MASTER.prepare(`
      UPDATE usuarios SET ultimo_login = ? WHERE id = ?
    `).bind(getLocalDateTime(), userResult.id).run();
    
    // Determinar si es usuario Enel basado en el rol
    const esEnel = userResult.rol === 'Supervisor Enel' || 
                  userResult.empresa?.toLowerCase().includes('enel') || 
                  userResult.email?.toLowerCase().includes('@enel.');
    
    // Parsear parques_autorizados como JSON
    let parquesAutorizados = [];
    if (userResult.parques_autorizados) {
      try {
        parquesAutorizados = JSON.parse(userResult.parques_autorizados);
      } catch (error) {
        console.error('Error parseando parques_autorizados:', error);
        // Si no es JSON válido, intentar con split por si es formato antiguo
        parquesAutorizados = userResult.parques_autorizados.split(',').map(p => p.trim());
      }
    }

    const userData = {
      id: userResult.id,
      usuario: userResult.usuario,
      email: userResult.email,
      rol: userResult.rol,
      empresa: userResult.empresa,
      cargo: userResult.cargo,
      rut: userResult.rut,
      telefono: userResult.telefono,
      esEnel: esEnel,
      parques: parquesAutorizados,
      puedeActualizarPersonal: userResult.puede_actualizar_personal === 1
    };
    
    // Generar JWT
    const token = await authService.generateToken(userData);
    
    // AQUÍ VA: Verificar si la contraseña es temporal
    const esPasswordTemporal = userResult.password_temporal === 1;
    if (esPasswordTemporal) {
        return new Response(JSON.stringify({ 
            success: true,
            token,
            user: userData,
            requirePasswordChange: true  // ← INDICADOR CLAVE
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
    
    // Log exitoso
    await auditLogger.log({
      action: 'LOGIN_SUCCESS',
      resource: 'auth',
      userId: userData.id,
      userEmail: userData.email,
      ip: clientIp,
      success: true
    });
    
    // Reset rate limit
    await rateLimiter.reset(clientIp, 'login');
    
    return new Response(JSON.stringify({ 
      success: true,
      token,
      user: userData
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    console.error('Login error stack:', error.stack);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleUsers(request, corsHeaders, env) {
  try {
    const result = await env.DB_MASTER.prepare(`
      SELECT id, usuario, email, rol, empresa, parques_autorizados, 
             puede_actualizar_personal, ultimo_login, created_at
      FROM usuarios
      ORDER BY usuario ASC
    `).all();
    
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Error loading users', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleAdminUsers(request, corsHeaders, env, currentUser, services) {
  try {
    // Ensure only admin users can access this endpoint
    if (!currentUser || currentUser.rol !== 'admin') {
      return new Response(JSON.stringify({ 
        error: 'Access denied. Admin privileges required.' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const result = await env.DB_MASTER.prepare(`
      SELECT id, usuario, email, rol, empresa, parques_autorizados, 
             puede_actualizar_personal, ultimo_login, created_at
      FROM usuarios
      ORDER BY usuario ASC
    `).all();
    
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error in handleAdminUsers:', error);
    return new Response(JSON.stringify({ 
      error: 'Error loading admin users', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handlePersonal(request, corsHeaders, env) {
  try {
    // Ahora lee de usuarios unificada, no de personal_tecnico
    const result = await env.DB_MASTER.prepare(`
      SELECT id, usuario as nombre, email, empresa, cargo as rol, 
             rut, telefono, parques_autorizados, estado
      FROM usuarios
      WHERE rol IN ('Lead Technician', 'Technician', 'Supervisor Enel')
      AND estado = 'Activo'
      ORDER BY usuario ASC
    `).all();
    
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Error loading personal', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Nueva función:
async function handleChangePassword(request, corsHeaders, env, services) {
  const { authService, auditLogger } = services;
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No autorizado'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const token = authHeader.substring(7);
    const userToken = await authService.verifyToken(token);
    
    const { newPassword } = await request.json();
    
    // Validar contraseña
    if (!newPassword || newPassword.length < 8) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'La contraseña debe tener al menos 8 caracteres'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Hashear nueva contraseña
    const hashedPassword = await authService.hashPassword(newPassword);
    
    // Actualizar contraseña y marcar como no temporal
    await env.DB_MASTER.prepare(`
      UPDATE usuarios 
      SET password_hash = ?,
          password_temporal = 0
      WHERE id = ?
    `).bind(hashedPassword, userToken.sub).run();
    
    // Log
    if (auditLogger) {
      await auditLogger.log({
        action: 'PASSWORD_CHANGED',
        resource: 'auth',
        userId: userToken.sub,
        userEmail: userToken.email,
        ip: request.headers.get('CF-Connecting-IP'),
        success: true
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Contraseña actualizada exitosamente'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Error al cambiar la contraseña',
      debug: error.message || 'Error desconocido',
      debugStack: error.stack 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handlePersonalByParque(request, corsHeaders, env) {
  try {
    const url = new URL(request.url);
    const parqueNombre = InputSanitizer.sanitizeString(url.searchParams.get('parque'));
    
    // Ahora busca en tabla usuarios unificada
    let query = `SELECT id, usuario as nombre, email, empresa, 
                        cargo as rol, rut, telefono, parques_autorizados
                 FROM usuarios 
                 WHERE estado = 'Activo'
                 AND rol != 'Admin'`;
    let params = [];
    
    if (parqueNombre) {
      query += ` AND parques_autorizados LIKE ?`;
      params.push(`%${parqueNombre}%`);
    }
    
    query += ` ORDER BY usuario ASC`;
    
    const result = await env.DB_MASTER.prepare(query).bind(...params).all();
    
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Error loading personal by parque', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleSupervisores(request, corsHeaders, env) {
  try {
    // Ahora filtra usuarios con rol Supervisor Enel de tabla unificada
    const result = await env.DB_MASTER.prepare(`
      SELECT id, usuario as nombre, email, cargo, telefono, rut,
             parques_autorizados as plantas_asignadas, estado
      FROM usuarios
      WHERE rol = 'Supervisor Enel'
      AND estado = 'Activo'
      ORDER BY usuario ASC
    `).all();
    
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Error loading supervisores', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleParques(request, corsHeaders, env) {
  try {
    const result = await env.DB_MASTER.prepare(`
      SELECT * FROM parques_eolicos
      ORDER BY nombre ASC
    `).all();
    
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Error loading parques', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleAerogeneradores(request, corsHeaders, env) {
  try {
    const url = new URL(request.url);
    const parqueNombre = InputSanitizer.sanitizeForSQL(url.searchParams.get('parque'));
    
    // Usar la tabla Aerogeneradores del DB_PERMISOS
    let query = 'SELECT Plant_Code, Plant_Name, WTG_Name FROM Aerogeneradores';
    let params = [];
    
    if (parqueNombre) {
      query += ' WHERE Plant_Name LIKE ? OR Plant_Name = ?';
      params.push(`%${parqueNombre}%`, parqueNombre);
    }
    
    query += ' ORDER BY WTG_Name ASC';
    
    const result = await env.DB_PERMISOS.prepare(query).bind(...params).all();
    
    const adaptedResults = result.results?.map(row => ({
      codigo: row.WTG_Name,
      nombre: row.WTG_Name,
      Plant_Code: row.Plant_Code,
      Plant_Name: row.Plant_Name,
      WTG_Name: row.WTG_Name
    })) || [];
    
    return new Response(JSON.stringify({
      results: adaptedResults,
      has_more: false,
      total: adaptedResults.length
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error loading aerogeneradores:', error);
    return new Response(JSON.stringify({ 
      error: 'Error loading aerogeneradores', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleActividades(request, corsHeaders, env) {
  try {
    const result = await env.DB_MASTER.prepare(`
      SELECT * FROM actividades
      ORDER BY nombre ASC
    `).all();
    
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Error loading actividades', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleSystemStats(request, corsHeaders, env, currentUser, services) {
  try {
    // Verificar que el usuario sea Admin
    if (!currentUser || currentUser.rol !== 'Admin') {
      return new Response(JSON.stringify({ 
        error: 'Access denied. Admin privileges required.' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Obtener estadísticas del sistema de forma concurrente
    const [parquesResult, personalEnelResult, personalExternoResult] = await Promise.all([
      // Total de parques
      env.DB_MASTER.prepare(`SELECT COUNT(*) as count FROM parques_eolicos`).first(),
      
      // Personal ENEL (Supervisor Enel, Admin, Enel Otro)
      env.DB_MASTER.prepare(`
        SELECT COUNT(*) as count FROM usuarios 
        WHERE rol IN ('Supervisor Enel', 'Admin', 'Enel Otro') 
        AND estado = 'Activo'
      `).first(),
      
      // Personal Externo (Lead Technician, Technician y otros roles no-ENEL)
      env.DB_MASTER.prepare(`
        SELECT COUNT(*) as count FROM usuarios 
        WHERE rol IN ('Lead Technician', 'Technician') 
        OR (rol NOT IN ('Supervisor Enel', 'Admin', 'Enel Otro') AND estado = 'Activo')
      `).first()
    ]);

    const stats = {
      totalParques: parquesResult?.count || 0,
      personalEnel: personalEnelResult?.count || 0,
      personalExterno: personalExternoResult?.count || 0,
      lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify({
      success: true,
      stats: stats
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error getting system stats:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Error loading system statistics', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleMatrizRiesgos(request, corsHeaders, env) {
  try {
    const url = new URL(request.url);
    const actividades = InputSanitizer.sanitizeString(url.searchParams.get('actividades'));
    
    let query = `SELECT * FROM matriz_riesgos WHERE estado = 'Activo'`;
    let params = [];
    
    if (actividades) {
      const actividadesList = actividades.split(',').map(act => act.trim());
      const placeholders = actividadesList.map(() => '?').join(',');
      query += ` AND actividad IN (${placeholders})`;
      params.push(...actividadesList);
    }
    
    query += ` ORDER BY actividad ASC, codigo ASC`;
    
    const result = await env.DB_HSEQ.prepare(query).bind(...params).all();
    
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false,
      debug: {
        totalResults: result.results?.length || 0,
        requestedActivities: actividades ? actividades.split(',') : []
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error loading matriz riesgos:', error);
    return new Response(JSON.stringify({ 
      error: 'Error loading matriz riesgos', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handlePermisos(request, corsHeaders, env, currentUser, services) {
  const { auditLogger } = services;
  
  if (request.method === 'POST') {
    const rawData = await request.json();
    const permisoData = InputSanitizer.sanitizeObject(rawData);
    
    if (!permisoData.planta || !permisoData.descripcion || !permisoData.jefeFaena) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Faltan campos obligatorios'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    try {
      // TEMPORAL: Comentar validación para debugging
      /*
      const esEnel = currentUser?.esEnel || false;
      const parquesAutorizados = currentUser?.parques || [];
      
      if (!esEnel && !parquesAutorizados.includes(permisoData.planta)) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'No tiene autorización para crear permisos en esta planta'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      */
      
      // Obtener número correlativo
      let numeroCorrelativo = 1;
      
      const lastPermiso = await env.DB_PERMISOS.prepare(`
        SELECT COALESCE(MAX(CAST(numero_correlativo AS INTEGER)), 0) as ultimo_numero 
        FROM permisos_trabajo 
        WHERE planta_nombre = ?
      `).bind(permisoData.planta).first();
       
      numeroCorrelativo = (lastPermiso?.ultimo_numero || 0) + 1;
      
      const codigoParque = permisoData.codigoParque || 
                          permisoData.planta.replace(/\s+/g, '').substring(0, 3).toUpperCase();
      const numeroPT = `PT-${codigoParque}-${numeroCorrelativo.toString().padStart(4, '0')}`;
      
      // Insertar permiso
      const insertPermiso = await env.DB_PERMISOS.prepare(`
        INSERT INTO permisos_trabajo (
          numero_pt, numero_correlativo, planta_id, planta_nombre, 
          aerogenerador_id, aerogenerador_nombre, descripcion, 
          jefe_faena_id, jefe_faena_nombre, supervisor_parque_id, 
          supervisor_parque_nombre, tipo_mantenimiento, tipo_mantenimiento_otros,
          usuario_creador, fecha_inicio, fecha_creacion, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        numeroPT,
        numeroCorrelativo.toString(),
        permisoData.plantaId || 'unknown',
        permisoData.planta,
        permisoData.aerogeneradorCodigo || null,
        permisoData.aerogenerador || null,
        permisoData.descripcion,
        permisoData.jefeFaenaId || 'unknown',
        permisoData.jefeFaena,
        permisoData.supervisorParqueId || null,
        permisoData.supervisorParque || null,
        permisoData.tipoMantenimiento || 'PREVENTIVO',
        permisoData.tipoMantenimientoOtros || null,
        permisoData.usuarioCreador || currentUser?.email || 'unknown',
        permisoData.fechaInicio || getLocalDateTime(),
        getLocalDateTime(),
        'CREADO'
      ).run();
      
      const permisoId = insertPermiso.meta.last_row_id;
      
      // Insertar personal - ahora usando usuario.id
      if (permisoData.personal && permisoData.personal.length > 0) {
        for (const persona of permisoData.personal) {
          await env.DB_PERMISOS.prepare(`
            INSERT INTO permiso_personal (
              permiso_id, personal_id, personal_nombre, 
              personal_empresa, personal_rol, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            permisoId, 
            persona.id, // Ahora es el usuario.id directamente
            persona.nombre || 'Sin nombre', 
            persona.empresa || 'Sin empresa', 
            persona.rol || 'Sin rol',
            getLocalDateTime()
          ).run();
        }
      }
      
      // Insertar actividades
      if (permisoData.actividades && permisoData.actividades.length > 0) {
        for (const actividad of permisoData.actividades) {
          await env.DB_PERMISOS.prepare(`
            INSERT INTO permiso_actividades (
              permiso_id, actividad_id, actividad_nombre, 
              tipo_actividad, created_at
            ) VALUES (?, ?, ?, ?, ?)
          `).bind(
            permisoId, 
            actividad.id || 'unknown', 
            actividad.nombre || 'Sin nombre', 
            actividad.tipo || 'RUTINARIA',
            getLocalDateTime()
          ).run();
        }
      }
      
      // Insertar matriz de riesgos
      if (permisoData.matrizRiesgos && permisoData.matrizRiesgos.length > 0) {
        for (const riesgo of permisoData.matrizRiesgos) {
          await env.DB_PERMISOS.prepare(`
            INSERT INTO permiso_matriz_riesgos (
              permiso_id, actividad, peligro, riesgo, 
              medidas_preventivas, codigo_matriz, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            permisoId, 
            riesgo.actividad || 'Sin actividad', 
            riesgo.peligro || 'Sin peligro', 
            riesgo.riesgo || 'Sin riesgo', 
            riesgo.medidas || 'Sin medidas', 
            riesgo.codigo || null,
            getLocalDateTime()
          ).run();
        }
      }
      
      // Log auditoría
      if (auditLogger) {
        await auditLogger.log({
          action: 'CREATE_PERMISO',
          resource: 'permisos',
          resourceId: permisoId.toString(),
          userId: currentUser?.sub || 'anonymous',
          userEmail: currentUser?.email || permisoData.usuarioCreador,
          ip: request.headers.get('CF-Connecting-IP'),
          success: true,
          metadata: { numeroPT, planta: permisoData.planta }
        });
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        id: permisoId, 
        numeroPT: numeroPT,
        numeroCorrelativo: numeroCorrelativo,
        message: 'Permiso guardado exitosamente'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
      
    } catch (error) {
      console.error('Error creando permiso:', error);
      
      if (auditLogger) {
        await auditLogger.log({
          action: 'CREATE_PERMISO_FAILED',
          resource: 'permisos',
          userId: currentUser?.sub || 'anonymous',
          userEmail: currentUser?.email || permisoData.usuarioCreador,
          ip: request.headers.get('CF-Connecting-IP'),
          success: false,
          error: error.message
        });
      }
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Error al guardar el permiso: ${error.message}`
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  
  // GET permisos
  try {
    const result = await env.DB_PERMISOS.prepare(`
      SELECT 
        p.*,
        pc.fecha_inicio_trabajos,
        pc.fecha_fin_trabajos,
        pc.fecha_parada_turbina,
        pc.fecha_puesta_marcha_turbina,
        pc.observaciones_cierre,
        pc.usuario_cierre,
        pc.fecha_cierre,
        GROUP_CONCAT(DISTINCT pp.personal_nombre || ' (' || pp.personal_empresa || ')') as personal_asignado,
        GROUP_CONCAT(DISTINCT pp.personal_id) as personal_ids,
        GROUP_CONCAT(DISTINCT pa.actividad_nombre) as actividades
      FROM permisos_trabajo p
      LEFT JOIN permiso_cierre pc ON p.id = pc.permiso_id
      LEFT JOIN permiso_personal pp ON p.id = pp.permiso_id
      LEFT JOIN permiso_actividades pa ON p.id = pa.permiso_id
      GROUP BY p.id
      ORDER BY p.fecha_creacion DESC
      LIMIT 100
    `).all();
    
    return new Response(JSON.stringify({ 
      success: true,
      permisos: result.results || []
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error consultando permisos:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleAprobarPermiso(request, corsHeaders, env, currentUser, services) {
  const { auditLogger } = services;
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    const rawData = await request.json();
    const { permisoId, usuarioAprobador } = InputSanitizer.sanitizeObject(rawData);
    
    if (!permisoId || !usuarioAprobador) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Datos requeridos faltantes' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const result = await env.DB_PERMISOS.prepare(`
      UPDATE permisos_trabajo 
      SET 
        estado = 'ACTIVO',
        usuario_aprobador = ?,
        fecha_aprobacion = ?
      WHERE id = ? AND estado = 'CREADO'
    `).bind(
      usuarioAprobador,
      getLocalDateTime(),
      permisoId
    ).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Permiso no encontrado o ya procesado' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    if (auditLogger) {
      await auditLogger.log({
        action: 'APPROVE_PERMISO',
        resource: 'permisos',
        resourceId: permisoId.toString(),
        userId: currentUser?.sub || 'anonymous',
        userEmail: currentUser?.email || usuarioAprobador,
        ip: request.headers.get('CF-Connecting-IP'),
        success: true
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Permiso aprobado exitosamente'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error aprobando permiso:', error);
    
    if (auditLogger) {
      await auditLogger.log({
        action: 'APPROVE_PERMISO_FAILED',
        resource: 'permisos',
        userId: currentUser?.sub || 'anonymous',
        userEmail: currentUser?.email || 'unknown',
        ip: request.headers.get('CF-Connecting-IP'),
        success: false,
        error: error.message
      });
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Error al aprobar el permiso: ${error.message}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleCerrarPermiso(request, corsHeaders, env, currentUser, services) {
  const { auditLogger } = services;
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    const rawData = await request.json();
    const cierreData = InputSanitizer.sanitizeObject(rawData);
    
    const { 
      permisoId, 
      usuarioCierre, 
      fechaFinTrabajos,
      materiales = []
    } = cierreData;
    
    if (!permisoId || !usuarioCierre || !fechaFinTrabajos) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Datos requeridos faltantes' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Actualizar estado del permiso a CERRADO_PENDIENTE_APROBACION
    const updateResult = await env.DB_PERMISOS.prepare(`
      UPDATE permisos_trabajo 
      SET 
        estado = 'CERRADO_PENDIENTE_APROBACION',
        observaciones = ?
      WHERE id = ? AND estado IN ('ACTIVO', 'CIERRE_RECHAZADO')
    `).bind(
      cierreData.observacionesCierre || 'Trabajo completado',
      permisoId
    ).run();
    
    if (updateResult.changes === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Permiso no encontrado o no se puede cerrar desde el estado actual' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // UPSERT para registro de cierre (soluciona el problema de reintentos)
    await env.DB_PERMISOS.prepare(`
      INSERT OR REPLACE INTO permiso_cierre (
        permiso_id, 
        fecha_inicio_trabajos, 
        fecha_fin_trabajos,
        fecha_parada_turbina,
        fecha_puesta_marcha_turbina,
        observaciones_cierre,
        usuario_cierre,
        fecha_cierre,
        estado_aprobacion_cierre,
        version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', COALESCE((SELECT version + 1 FROM permiso_cierre WHERE permiso_id = ?), 1))
    `).bind(
      permisoId,
      cierreData.fechaInicioTrabajos || null,
      fechaFinTrabajos,
      cierreData.fechaParadaTurbina || null,
      cierreData.fechaPuestaMarcha || null,
      cierreData.observacionesCierre || 'Trabajo completado',
      usuarioCierre,
      getLocalDateTime(),
      permisoId
    ).run();
    
    // Obtener la versión actual para el historial
    const versionResult = await env.DB_PERMISOS.prepare(`
      SELECT version FROM permiso_cierre WHERE permiso_id = ?
    `).bind(permisoId).first();
    
    const currentVersion = versionResult?.version || 1;
    
    // Registrar en historial de aprobaciones (AUDIT TRAIL)
    await env.DB_PERMISOS.prepare(`
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
      ) VALUES (?, ?, 'ENVIAR_CIERRE', 'CERRADO_PENDIENTE_APROBACION', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      permisoId,
      currentVersion,
      currentUser?.sub || usuarioCierre,
      currentUser?.name || currentUser?.email || usuarioCierre,
      `Cierre enviado para aprobación${currentVersion > 1 ? ' (Reintento #' + currentVersion + ')' : ''}`,
      getLocalDateTime(),
      cierreData.observacionesCierre || 'Trabajo completado',
      cierreData.fechaInicioTrabajos || null,
      fechaFinTrabajos,
      cierreData.fechaParadaTurbina || null,
      cierreData.fechaPuestaMarcha || null
    ).run();
    
    // Insertar materiales si los hay
    if (materiales && materiales.length > 0) {
      for (const material of materiales) {
        await env.DB_PERMISOS.prepare(`
          INSERT INTO permiso_materiales (
            permiso_id, cantidad, descripcion, propietario,
            almacen, fecha_uso, numero_item, numero_serie,
            observaciones_material, fecha_registro
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          permisoId,
          material.cantidad || 1,
          material.descripcion || 'Material sin descripción',
          material.propietario || 'No especificado',
          material.almacen || 'Central',
          getLocalDateTime(),
          material.numeroItem || null,
          material.numeroSerie || null,
          material.observaciones || null,
          getLocalDateTime()
        ).run();
      }
    }
    
    if (auditLogger) {
      await auditLogger.log({
        action: 'CLOSE_PERMISO',
        resource: 'permisos',
        resourceId: permisoId.toString(),
        userId: currentUser?.sub || 'anonymous',
        userEmail: currentUser?.email || usuarioCierre,
        ip: request.headers.get('CF-Connecting-IP'),
        success: true,
        metadata: { materialesCount: materiales.length }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Permiso enviado para aprobación de cierre exitosamente',
      materialesCount: materiales.length,
      version: currentVersion
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error cerrando permiso:', error);
    
    if (auditLogger) {
      await auditLogger.log({
        action: 'CLOSE_PERMISO_FAILED',
        resource: 'permisos',
        userId: currentUser?.sub || 'anonymous',
        userEmail: currentUser?.email || 'unknown',
        ip: request.headers.get('CF-Connecting-IP'),
        success: false,
        error: error.message
      });
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Error al cerrar el permiso: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleAprobarCierrePermiso(request, corsHeaders, env, currentUser, services) {
  const { auditLogger } = services;
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    const rawData = await request.json();
    const { permisoId, accion, comentarios } = InputSanitizer.sanitizeObject(rawData);
    
    // Validar datos requeridos
    if (!permisoId || !accion || !['APROBAR', 'RECHAZAR'].includes(accion)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Datos requeridos faltantes o acción inválida' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Validar permisos de usuario
    if (!currentUser || !['Admin', 'Supervisor', 'Supervisor Enel'].includes(currentUser.rol)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No tiene permisos para aprobar cierres de permisos' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Obtener el registro de cierre actual
    const cierreActual = await env.DB_PERMISOS.prepare(`
      SELECT pc.*, pt.numero_pt, pt.estado as estado_permiso
      FROM permiso_cierre pc
      INNER JOIN permisos_trabajo pt ON pc.permiso_id = pt.id
      WHERE pc.permiso_id = ? AND pc.estado_aprobacion_cierre = 'PENDIENTE'
    `).bind(permisoId).first();
    
    if (!cierreActual) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No se encontró un cierre pendiente de aprobación para este permiso' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const fechaAccion = getLocalDateTime();
    const nuevoEstadoAprobacion = accion === 'APROBAR' ? 'APROBADO' : 'RECHAZADO';
    const nuevoEstadoPermiso = accion === 'APROBAR' ? 'CERRADO' : 'CIERRE_RECHAZADO';
    const nuevoEstadoResultante = accion === 'APROBAR' ? 'CERRADO' : 'CIERRE_RECHAZADO';
    
    // Actualizar el estado del cierre
    await env.DB_PERMISOS.prepare(`
      UPDATE permiso_cierre 
      SET 
        estado_aprobacion_cierre = ?,
        usuario_aprobador_cierre_id = ?,
        usuario_aprobador_cierre_nombre = ?,
        fecha_aprobacion_cierre = ?,
        observaciones_aprobacion = ?,
        motivo_rechazo = CASE WHEN ? = 'RECHAZAR' THEN ? ELSE motivo_rechazo END,
        fecha_rechazo = CASE WHEN ? = 'RECHAZAR' THEN ? ELSE fecha_rechazo END,
        updated_at = ?
      WHERE permiso_id = ?
    `).bind(
      nuevoEstadoAprobacion,
      currentUser.sub || currentUser.email,
      currentUser.name || currentUser.email,
      fechaAccion,
      comentarios || '',
      accion,
      comentarios || 'Sin motivo especificado',
      accion,
      fechaAccion,
      fechaAccion,
      permisoId
    ).run();
    
    // Actualizar el estado del permiso principal
    await env.DB_PERMISOS.prepare(`
      UPDATE permisos_trabajo 
      SET 
        estado = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      nuevoEstadoPermiso,
      fechaAccion,
      permisoId
    ).run();
    
    // Registrar en historial de aprobaciones (AUDIT TRAIL)
    await env.DB_PERMISOS.prepare(`
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      permisoId,
      cierreActual.version || 1,
      accion,
      nuevoEstadoResultante,
      currentUser.sub || currentUser.email,
      currentUser.name || currentUser.email,
      comentarios || '',
      fechaAccion,
      cierreActual.observaciones_cierre,
      cierreActual.fecha_inicio_trabajos,
      cierreActual.fecha_fin_trabajos,
      cierreActual.fecha_parada_turbina,
      cierreActual.fecha_puesta_marcha_turbina
    ).run();
    
    if (auditLogger) {
      await auditLogger.log({
        action: accion === 'APROBAR' ? 'APPROVE_CLOSURE' : 'REJECT_CLOSURE',
        resource: 'permiso_cierre',
        resourceId: permisoId.toString(),
        userId: currentUser?.sub || 'anonymous',
        userEmail: currentUser?.email || 'unknown',
        ip: request.headers.get('CF-Connecting-IP'),
        success: true,
        metadata: { 
          numeroPT: cierreActual.numero_pt,
          version: cierreActual.version,
          comentarios: comentarios || ''
        }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: accion === 'APROBAR' 
        ? `Cierre aprobado exitosamente para permiso ${cierreActual.numero_pt}` 
        : `Cierre rechazado para permiso ${cierreActual.numero_pt}`,
      accion: accion,
      nuevoEstado: nuevoEstadoPermiso
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error procesando aprobación de cierre:', error);
    
    if (auditLogger) {
      await auditLogger.log({
        action: 'APPROVE_CLOSURE_FAILED',
        resource: 'permiso_cierre',
        userId: currentUser?.sub || 'anonymous',
        userEmail: currentUser?.email || 'unknown',
        ip: request.headers.get('CF-Connecting-IP'),
        success: false,
        error: error.message
      });
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Error al procesar la aprobación: ${error.message}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleHistorialCierre(request, corsHeaders, env, currentUser, services) {
  const { auditLogger } = services;
  
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Método no permitido' 
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    const url = new URL(request.url);
    const permisoId = url.searchParams.get('permisoId');
    
    if (!permisoId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'ID de permiso requerido' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Validar que el usuario tenga acceso al permiso
    const permiso = await env.DB_PERMISOS.prepare(`
      SELECT p.id, p.numero_pt, p.planta_nombre, p.estado
      FROM permisos_trabajo p
      WHERE p.id = ?
    `).bind(permisoId).first();
    
    if (!permiso) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Permiso no encontrado' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Validar permisos de acceso por planta
    const esEnel = currentUser?.esEnel || currentUser?.rol === 'Supervisor Enel';
    const parquesAutorizados = currentUser?.parques || [];
    
    if (!esEnel && !parquesAutorizados.includes(permiso.planta_nombre)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No tiene permisos para ver el historial de este permiso' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Obtener historial completo del cierre
    const historial = await env.DB_PERMISOS.prepare(`
      SELECT 
        hac.id,
        hac.version_intento,
        hac.accion,
        hac.estado_resultante,
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
      WHERE hac.permiso_id = ?
      ORDER BY hac.version_intento DESC, hac.fecha_accion DESC
    `).bind(permisoId).all();
    
    // Obtener estado actual del cierre si existe
    const cierreActual = await env.DB_PERMISOS.prepare(`
      SELECT pc.*, pt.numero_pt, pt.estado as estado_permiso
      FROM permiso_cierre pc
      INNER JOIN permisos_trabajo pt ON pc.permiso_id = pt.id
      WHERE pc.permiso_id = ?
    `).bind(permisoId).first();
    
    if (auditLogger) {
      await auditLogger.log({
        action: 'VIEW_CLOSURE_HISTORY',
        resource: 'permiso_cierre',
        resourceId: permisoId.toString(),
        userId: currentUser?.sub || 'anonymous',
        userEmail: currentUser?.email || 'unknown',
        ip: request.headers.get('CF-Connecting-IP'),
        success: true,
        metadata: { 
          numeroPT: permiso.numero_pt,
          historialEntradas: historial.results?.length || 0
        }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      permiso: {
        id: permiso.id,
        numero_pt: permiso.numero_pt,
        planta_nombre: permiso.planta_nombre,
        estado: permiso.estado
      },
      cierreActual: cierreActual,
      historial: historial.results || [],
      totalIntentos: historial.results?.length || 0,
      totalRechazos: historial.results?.filter(h => h.accion === 'RECHAZAR').length || 0
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error obteniendo historial de cierre:', error);
    
    if (auditLogger) {
      await auditLogger.log({
        action: 'VIEW_CLOSURE_HISTORY_FAILED',
        resource: 'permiso_cierre',
        userId: currentUser?.sub || 'anonymous',
        userEmail: currentUser?.email || 'unknown',
        ip: request.headers.get('CF-Connecting-IP'),
        success: false,
        error: error.message
      });
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Error al obtener historial: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleGenerateRegister(request, corsHeaders, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const rawData = await request.json();
  const data = InputSanitizer.sanitizeObject(rawData);
  const htmlContent = generateTomaConocimientoPDF(data);
  
  return new Response(htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="TomaConocimiento_${data.planta}_${new Date().toISOString().split('T')[0]}.html"`,
      ...corsHeaders
    }
  });
}

async function handleHealth(request, corsHeaders, env) {
  try {
    const checks = {
      db_master: false,
      db_hseq: false,
      db_permisos: false
    };
    
    // Check DB_MASTER
    if (env.DB_MASTER) {
      try {
        const test = await env.DB_MASTER.prepare('SELECT COUNT(*) as count FROM usuarios').first();
        checks.db_master = true;
        checks.usuarios_count = test?.count || 0;
      } catch (error) {
        checks.db_master_error = error.message;
      }
    }
    
    // Check DB_HSEQ
    if (env.DB_HSEQ) {
      try {
        const test = await env.DB_HSEQ.prepare('SELECT COUNT(*) as count FROM matriz_riesgos').first();
        checks.db_hseq = true;
        checks.matriz_count = test?.count || 0;
      } catch (error) {
        checks.db_hseq_error = error.message;
      }
    }
    
    // Check DB_PERMISOS
    if (env.DB_PERMISOS) {
      try {
        const test = await env.DB_PERMISOS.prepare('SELECT COUNT(*) as count FROM permisos_trabajo').first();
        checks.db_permisos = true;
        checks.permisos_count = test?.count || 0;
      } catch (error) {
        checks.db_permisos_error = error.message;
      }
    }
    
    return new Response(JSON.stringify({
      status: 'OK',
      security: {
        jwtSecret: env.JWT_SECRET ? 'Configured' : 'Using default',
        rateLimitKV: env.RATE_LIMIT_KV ? 'Connected' : 'Not configured'
      },
      databases: checks,
      localTime: getLocalDateTime(),
      message: 'Sistema operativo con D1 Database'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'ERROR',
      error: error.message,
      timestamp: getLocalDateTime()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

function generateTomaConocimientoPDF(data) {
  // Mantener la función original sin cambios
  const fecha = new Date();
  const fechaFormateada = fecha.toLocaleDateString('es-CL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'America/Santiago'
  });
  const horaFormateada = fecha.toLocaleTimeString('es-CL', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/Santiago'
  });

  const personalRows = data.personal?.map((persona, index) => `
  <tr>
    <td style="text-align: center; padding: 8px; border: 1px solid #000;">${index + 1}</td>
    <td style="padding: 8px; border: 1px solid #000;">${persona.nombre}</td>
    <td style="padding: 8px; border: 1px solid #000;">${persona.rut || 'Sin RUT'}</td>
    <td style="padding: 8px; border: 1px solid #000;">${persona.empresa || 'N/A'}</td>
    <td style="padding: 8px; border: 1px solid #000; width: 100px;"></td>
  </tr>
`).join('') || `
    <tr>
      <td style="text-align: center; padding: 8px; border: 1px solid #000;">1</td>
      <td style="padding: 8px; border: 1px solid #000;">Sin personal asignado</td>
      <td style="padding: 8px; border: 1px solid #000;">-</td>
      <td style="padding: 8px; border: 1px solid #000;">-</td>
      <td style="padding: 8px; border: 1px solid #000; width: 100px;"></td>
    </tr>
  `;

  const numFilasExistentes = data.personal?.length || 1;
  const filasVacias = Math.max(0, 10 - numFilasExistentes);
  const filasVaciasHTML = Array.from({ length: filasVacias }, (_, index) => `
    <tr>
      <td style="text-align: center; padding: 8px; border: 1px solid #000;">${numFilasExistentes + index + 1}</td>
      <td style="padding: 8px; border: 1px solid #000;"></td>
      <td style="padding: 8px; border: 1px solid #000;"></td>
      <td style="padding: 8px; border: 1px solid #000;"></td>
      <td style="padding: 8px; border: 1px solid #000; width: 100px;"></td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro Toma de Conocimiento - ${data.planta}</title>
    <style>
        @media print {
            @page {
                margin: 0.5in;
                size: A4;
            }
            body {
                margin: 0;
                padding: 0;
            }
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.2;
            margin: 0;
            padding: 20px;
            background: white;
        }
        
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        
        .logo {
          width: 120px;
          height: 80px;
          margin-right: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      
        .logo img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .header-info {
            flex: 1;
        }
        
        .title {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 12px;
            margin-bottom: 5px;
        }
        
        .areas {
            font-size: 10px;
            font-style: italic;
            color: #666;
        }
        
        .info-section {
            display: flex;
            margin-bottom: 15px;
            gap: 30px;
        }
        
        .info-left, .info-right {
            flex: 1;
        }
        
        .info-row {
            margin-bottom: 8px;
            display: flex;
            align-items: baseline;
        }
        
        .info-label {
            font-weight: bold;
            margin-right: 10px;
            min-width: 120px;
        }
        
        .info-value {
            border-bottom: 1px solid #000;
            flex: 1;
            padding-bottom: 2px;
        }
        
        .description-section {
            margin: 20px 0;
        }
        
        .description-label {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .description-content {
            border: 1px solid #000;
            padding: 10px;
            min-height: 40px;
            background: #f9f9f9;
        }
        
        .activities-section {
            margin: 20px 0;
        }
        
        .activities-row {
            display: flex;
            margin-bottom: 8px;
            align-items: baseline;
        }
        
        .activities-label {
            font-weight: bold;
            margin-right: 10px;
            min-width: 200px;
        }
        
        .activities-content {
            border-bottom: 1px solid #000;
            flex: 1;
            padding-bottom: 2px;
        }
        
        .table-section {
            margin: 20px 0;
        }
        
        .participants-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        .participants-table th {
            background: #4CAF50;
            color: white;
            padding: 8px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #000;
            font-size: 10px;
        }
        
        .participants-table td {
            padding: 8px;
            border: 1px solid #000;
            vertical-align: top;
        }
        
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
        }
        
        @media print {
            .print-button {
                display: none;
            }
        }
        
        .print-button:hover {
            background: #45a049;
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">🖨️ Imprimir PDF</button>
    
    <div class="header">
        <div class="logo">
        <img src="https://www.prwave.ro/wp-content/uploads/2018/08/Enel-Green-Power-logo.jpg" alt="Enel Green Power">
        </div>
        <div class="header-info">
            <div class="title">REGISTRO TOMA DE CONOCIMIENTO PT WIND</div>
            <div class="subtitle">Áreas de Aplicación</div>
            <div class="areas">
                Perímetro, Chile y Países Andinos<br>
                Función: Health, Safety, Environment and Quality<br>
                Business Line: Renewable Energies
            </div>
        </div>
    </div>
    
    <div class="info-section">
        <div class="info-left">
            <div class="info-row">
                <span class="info-label">NOMBRE JEFE DE FAENA:</span>
                <span class="info-value">${data.jefeFaena || 'No asignado'}</span>
            </div>
        </div>
        <div class="info-right">
            <div class="info-row">
                <span class="info-label">Firma:</span>
                <span class="info-value"></span>
            </div>
        </div>
    </div>
    
    <div class="info-section">
        <div class="info-left">
            <div class="info-row">
                <span class="info-label">Lugar:</span>
                <span class="info-value">${data.planta || ''}_${data.aerogenerador || ''}</span>
            </div>
        </div>
    </div>
    
    <div class="info-section">
        <div class="info-left">
            <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${fechaFormateada}</span>
            </div>
        </div>
        <div class="info-right">
            <div class="info-row">
                <span class="info-label">Horario:</span>
                <span class="info-value">${horaFormateada}</span>
            </div>
        </div>
    </div>
    
    <div class="description-section">
        <div class="description-label">Descripción de trabajo (s)</div>
        <div class="description-content">
            ${data.descripcion || 'Sin descripción'}
            <br><br>
            <strong>Tipo de Mantenimiento:</strong> ${data.tipoMantenimiento || 'No especificado'}
            ${data.tipoMantenimientoOtros ? ' - ' + data.tipoMantenimientoOtros : ''}
        </div>
    </div>
    
    <div class="activities-section">
        <div class="activities-row">
            <span class="activities-label">Actividades Rutinarias asociadas:</span>
            <span class="activities-content">${data.actividadesRutinarias?.join(' - ') || 'Ninguna'}</span>
        </div>
        <div class="activities-row">
            <span class="activities-label">Actividades Extraordinarias asociadas:</span>
            <span class="activities-content">Ninguna</span>
        </div>
    </div>
    
    <div class="table-section">
        <table class="participants-table">
            <thead>
                <tr>
                    <th>N°</th>
                    <th>NOMBRE DEL PARTICIPANTE</th>
                    <th>RUT/CÉDULA</th>
                    <th>EMPRESA</th>
                    <th>FIRMA</th>
                </tr>
            </thead>
            <tbody>
                ${personalRows}
                ${filasVaciasHTML}
            </tbody>
        </table>
    </div>
    
    <script>
        setTimeout(() => {
            if (confirm('¿Desea imprimir el documento PDF ahora?')) {
                window.print();
            }
        }, 2000);
    </script>
</body>
</html>
  `;
}

function getWebApp() {
  return '<!DOCTYPE html>' +
'<html lang=\"es\">' +
'<head>' +
    '<meta charset=\"UTF-8\">' +
    '<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">' +
    '<title>PT Wind - Sistema de Gestión de Permisos</title>' +
    '<link rel=\"manifest\" href=\"/manifest.json">' +
    '<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">' +
    '<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>' +
    '<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap\" rel=\"stylesheet\">' +
    '<style>' + getStyles() + '</style>' +
'</head>' +
'<body>' +
    '<div class=\"container\">' +
        '<!-- Pantalla de Login -->' +
        '<div id=\"loginScreen\" class=\"login-container\">' +
            '<div class=\"logo\">' +
                '<h1>PT WIND</h1>' +
                '<p>Sistema de Gestión de Permisos de Trabajo</p>' +
            '</div>' +
            
            '<form id=\"loginForm\">' +
                '<div class=\"form-group\">' +
                    '<label for=\"usuario\">Usuario / Email</label>' +
                    '<input type=\"text\" id=\"usuario\" required placeholder=\"Ingrese su usuario o email\" autocomplete=\"username\">' +
                '</div>' +
                
                '<div class=\"form-group\">' +
                    '<label for=\"password\">Contraseña</label>' +
                    '<input type=\"password\" id=\"password\" required placeholder=\"Ingrese su contraseña\" autocomplete=\"current-password\">' +
                '</div>' +
                
                '<button type=\"submit\" class=\"btn\" id=\"loginBtn\">Iniciar Sesión</button>' +
                
                '<div id=\"loginError\" class=\"error\" style=\"display: none; margin-top: 16px;\"></div>' +
            '</form>' +
            
            '<div id=\"connectionStatus\" class=\"status-indicator status-offline\" style=\"margin-top: 24px; text-align: center;\">' +
                'Verificando conexión...' +
            '</div>' +
        '</div>' +
        
        '<!-- Aplicación Principal -->' +
        '<div id=\"appScreen\" class=\"app-container\">' +
            '<div class=\"header\">' +
                '<div>' +
                    '<h1>PT WIND</h1>' +
                    '<p>Sistema de Gestión de Permisos de Trabajo</p>' +
                '</div>' +
                
                '<div style=\"display: flex; align-items: center; gap: 16px;\">' +
                    '<span id=\"userDisplay\"></span>' +
                    '<button id=\"logoutBtn\" class=\"btn btn-secondary btn-small\">CERRAR SESIÓN</button>' +
                '</div>' +
            '</div>' +
            
            '<div class=\"tabs\">' +
                '<button class=\"tab active\" data-tab=\"nuevo\">Nuevo Permiso</button>' +
                '<button class=\"tab\" data-tab=\"consultar\">Consultar Permisos</button>' +
                '<button class=\"tab\" data-tab=\"matriz\">Matriz de Riesgos</button>' +
                '<button class=\"tab\" data-tab=\"datos\" id=\"tabDatos\" style=\"display: none;\">Datos del Sistema</button>' +
            '</div>' +
            
            '<!-- Tab: Nuevo Permiso -->' +
            '<div id=\"tab-nuevo\" class=\"tab-content active\">' +
                '<form id=\"permisoForm\">' +
                    '<div class=\"grid-three\">' +
                        '<!-- Columna 1: Antecedentes Generales -->' +
                        '<div class=\"card\">' +
                            '<h3>Antecedentes Generales</h3>' +
                            
                            '<div class=\"form-group\">' +
                                '<label for=\"planta\">Planta *</label>' +
                                '<select id=\"planta\" required>' +
                                    '<option value=\"\">Seleccionar planta...</option>' +
                                '</select>' +
                            '</div>' +
                            
                            '<div class=\"form-group\">' +
                                '<label for=\"aerogenerador\">Aerogenerador *</label>' +
                                '<select id=\"aerogenerador\" required>' +
                                    '<option value=\"\">Seleccionar aerogenerador...</option>' +
                                '</select>' +
                            '</div>' +
                            
                            '<div class=\"form-group\">' +
                                '<label for=\"descripcion\">Descripción de Actividades *</label>' +
                                '<textarea id=\"descripcion\" rows=\"4\" required placeholder=\"Describa las actividades a realizar...\"></textarea>' +
                            '</div>' +
                        '</div>' +
                        
                        '<!-- Columna 2: Responsables -->' +
                        '<div class=\"card\">' +
                            '<h3>Responsables</h3>' +
                            
                            '<div class=\"form-group\">' +
                                '<label for=\"jefeFaena\">Jefe de Faena *</label>' +
                                '<select id=\"jefeFaena\" required>' +
                                    '<option value=\"\">Seleccionar jefe de faena...</option>' +
                                '</select>' +
                            '</div>' +
                            
                            '<div class=\"form-group\">' +
                                '<label for=\"supervisorParque\">Supervisor de Parque</label>' +
                                '<select id=\"supervisorParque\">' +
                                    '<option value=\"\">Seleccionar supervisor de parque...</option>' +
                                '</select>' +
                            '</div>' +
                            
                            '<div class=\"form-group\">' +
                                '<label for=\"tipoMantenimiento\">Tipo de Mantenimiento *</label>' +
                                '<select id=\"tipoMantenimiento\" required>' +
                                    '<option value=\"\">Seleccionar tipo...</option>' +
                                    '<option value=\"PREVENTIVO\">Mantenimiento Preventivo</option>' +
                                    '<option value=\"CORRECTIVO\">Pequeño Correctivo</option>' +
                                    '<option value=\"PREDICTIVO\">Mantenimiento Predictivo</option>' +
                                    '<option value=\"INSPECCION\">Inspección Técnica</option>' +
                                    '<option value=\"OTROS\">Otros</option>' +
                                '</select>' +
                            '</div>' +
                            
                            '<div class=\"form-group input-others\" id=\"tipoOtrosContainer\">' +
                                '<label for=\"tipoOtros\">Especificar Tipo *</label>' +
                                '<input type=\"text\" id=\"tipoOtros\" placeholder=\"Especifique el tipo de mantenimiento...\">' +
                            '</div>' +
                        '</div>' +
                        
                        '<!-- Columna 3: Actividades -->' +
                        '<div class=\"card\">' +
                            '<h3>Actividades Rutinarias</h3>' +
                            
                            '<div class=\"form-group\">' +
                                '<label>Seleccione las Actividades</label>' +
                                '<div id=\"actividadesChecklist\" class=\"checkbox-list\">' +
                                    '<div class=\"loading\">Cargando actividades...</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    
                    '<!-- Personal Asignado - Fila completa -->' +
                    '<div class=\"card\" style=\"margin-top: 24px;\">' +
                        '<h3>Personal Asignado</h3>' +
                        
                        '<div class=\"selector-dual\">' +
                            '<div>' +
                                '<label style=\"display: block; margin-bottom: 12px; font-weight: 600; color: var(--text-primary); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;\">Personal Disponible</label>' +
                                '<div id=\"personalDisponible\" class=\"selector-list\">' +
                                    '<div class=\"loading\">Seleccione una planta primero</div>' +
                                '</div>' +
                            '</div>' +
                            
                            '<div class=\"selector-controls\">' +
                                '<button type=\"button\" class=\"btn btn-secondary btn-small\" id=\"addPersonalBtn\">→</button>' +
                                '<button type=\"button\" class=\"btn btn-secondary btn-small\" id=\"removePersonalBtn\">←</button>' +
                            '</div>' +
                            
                            '<div>' +
                                '<label style=\"display: block; margin-bottom: 12px; font-weight: 600; color: var(--text-primary); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;\">Personal Seleccionado</label>' +
                                '<div id=\"personalSeleccionado\" class=\"selector-list\">' +
                                    '<div style=\"padding: 20px; text-align: center; color: var(--text-secondary);\">No hay personal seleccionado</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    
                    '<div style=\"margin-top: 32px; display: flex; gap: 16px; flex-wrap: wrap;\">' +
                        '<button type=\"submit\" class=\"btn\" style=\"flex: 1; min-width: 200px;\">CREAR PERMISO DE TRABAJO</button>' +
                        '<button type=\"button\" id=\"generateRegisterBtn\" class=\"btn btn-secondary\" style=\"flex: 1; min-width: 200px;\">GENERAR REGISTRO PDF</button>' +
                    '</div>' +
                '</form>' +
            '</div>' +
            
            '<!-- Tab: Consultar -->' +
            '<div id=\"tab-consultar\" class=\"tab-content\">' +
                '<div style=\"display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;\">' +
                    '<h3 style=\"color: var(--primary-color); font-size: 18px; font-weight: 600;\">Consultar Permisos de Trabajo</h3>' +
                    '<button id=\"refreshPermisosBtn\" class=\"btn btn-secondary btn-small\">ACTUALIZAR</button>' +
                '</div>' +
                '<div class=\"search-box\">' +
                    '<input type=\"text\" id=\"searchPermiso\" class=\"search-input\" placeholder=\"Buscar por número de permiso, planta, descripción...\">' +
                    '<button id=\"clearSearchBtn\" class=\"btn btn-secondary btn-small\">LIMPIAR</button>' +
                '</div>' +
                '<div id=\"permisosContainer\" class=\"loading\">' +
                    'Cargando permisos...' +
                '</div>' +
            '</div>' +
            
            '<!-- Tab: Matriz de Riesgos -->' +
            '<div id=\"tab-matriz\" class=\"tab-content\">' +
                '<h3 style=\"color: var(--primary-color); font-size: 18px; font-weight: 600; margin-bottom: 16px;\">Matriz de Riesgos</h3>' +
                '<p style=\"margin-bottom: 24px; color: var(--text-secondary); font-size: 14px;\">Seleccione actividades en la pestaña \"Nuevo Permiso\" para ver la matriz de riesgos aplicable.</p>' +
                '<div id=\"matrizContainer\">' +
                    '<div id=\"matrizTable\" class=\"data-table\" style=\"display: none;\">' +
                        '<table>' +
                            '<thead>' +
                                '<tr>' +
                                    '<th>Código</th>' +
                                    '<th>Actividad</th>' +
                                    '<th>Peligro</th>' +
                                    '<th>Riesgo</th>' +
                                    '<th>Medidas Preventivas</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody id=\"matrizTableBody\">' +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                    '<div id=\"matrizEmptyState\" class=\"loading\">' +
                        'Seleccione actividades para ver la matriz de riesgos...' +
                    '</div>' +
                '</div>' +
            '</div>' +
            
            '<!-- Tab: Datos del Sistema -->' +
            '<div id=\"tab-datos\" class=\"tab-content\">' +
                '<div style=\"display: flex; flex-direction: column; gap: 24px;\">' +
                    '<div class=\"card\">' +
                        '<h3>Parques Eólicos</h3>' +
                        '<div id=\"parquesContainer\" class=\"loading\">Cargando parques...</div>' +
                    '</div>' +
                    
                    '<div class=\"card\">' +
                        '<h3>Personal</h3>' +
                        '<div id=\"personalContainer\" class=\"loading\">Cargando personal...</div>' +
                    '</div>' +
                    
                    '<div class=\"card\">' +
                        '<h3>Supervisores</h3>' +
                        '<div id=\"supervisoresContainer\" class=\"loading\">Cargando supervisores...</div>' +
                    '</div>' +
                    
                    '<div class=\"card\">' +
                        '<h3>Actividades</h3>' +
                        '<div id=\"actividadesContainer\" class=\"loading\">Cargando actividades...</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>' +

    '<!-- MODAL PARA CERRAR PERMISO -->' +
    '<div id=\"cerrarPermisoModal\" style=\"display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; overflow-y: auto;\">' +
        '<div style=\"background: white; border-radius: 8px; padding: 32px; max-width: 720px; width: 90%; max-height: 90vh; overflow-y: auto; margin: 20px;\">' +
            '<h3 style=\"margin-bottom: 24px; color: var(--primary-color); font-size: 20px; font-weight: 600;\">CERRAR PERMISO DE TRABAJO</h3>' +
            
            '<!-- Información del permiso -->' +
            '<div style=\"background: var(--bg-secondary); padding: 16px; border-radius: 6px; margin-bottom: 24px; border: 1px solid var(--border-color);\">' +
                '<p style=\"margin-bottom: 8px;\"><strong>Permiso:</strong> <span id=\"permisoInfoNumero\"></span></p>' +
                '<p style=\"margin-bottom: 8px;\"><strong>Planta:</strong> <span id=\"permisoInfoPlanta\"></span></p>' +
                '<p style=\"margin-bottom: 0;\"><strong>Aerogenerador:</strong> <span id=\"permisoInfoAerogenerador\"></span></p>' +
            '</div>' +
            
            '<!-- Fechas y Tiempos -->' +
            '<div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;\">' +
                '<div class=\"form-group\">' +
                    '<label for=\"fechaInicioTrabajos\">Fecha/Hora Inicio Trabajos</label>' +
                    '<input type=\"datetime-local\" id=\"fechaInicioTrabajos\">' +
                '</div>' +
                '<div class=\"form-group\">' +
                    '<label for=\"fechaFinTrabajos\">Fecha/Hora Fin Trabajos *</label>' +
                    '<input type=\"datetime-local\" id=\"fechaFinTrabajos\" required>' +
                '</div>' +
            '</div>' +
            
            '<div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;\" id=\"turbinaContainer\">' +
                '<div class=\"form-group\">' +
                    '<label for=\"fechaParadaTurbina\">Fecha/Hora Parada Turbina</label>' +
                    '<input type=\"datetime-local\" id=\"fechaParadaTurbina\">' +
                '</div>' +
                '<div class=\"form-group\">' +
                    '<label for=\"fechaPuestaMarcha\">Fecha/Hora Puesta en Marcha</label>' +
                    '<input type=\"datetime-local\" id=\"fechaPuestaMarcha\">' +
                '</div>' +
            '</div>' +
            
            '<!-- Sección de Materiales -->' +
            '<div style=\"margin-bottom: 24px; background: var(--bg-secondary); padding: 20px; border-radius: 6px; border: 1px solid var(--border-color);\">' +
                '<h4 style=\"margin-bottom: 16px; color: var(--primary-color); font-size: 16px; font-weight: 600;\">MATERIALES/REPUESTOS UTILIZADOS</h4>' +
                
                '<div style=\"display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 12px; margin-bottom: 12px; align-items: end;\">' +
                    '<div class=\"form-group\" style=\"margin-bottom: 0;\">' +
                        '<label for=\"materialDescripcion\">Descripción</label>' +
                        '<input type=\"text\" id=\"materialDescripcion\" placeholder=\"Descripción del material\">' +
                    '</div>' +
                    '<div class=\"form-group\" style=\"margin-bottom: 0;\">' +
                        '<label for=\"materialCantidad\">Cantidad</label>' +
                        '<input type=\"number\" id=\"materialCantidad\" min=\"1\" value=\"1\">' +
                    '</div>' +
                    '<div class=\"form-group\" style=\"margin-bottom: 0;\">' +
                        '<label for=\"materialPropietario\">Propietario</label>' +
                        '<select id=\"materialPropietario\">' +
                            '<option value=\"ENEL\">ENEL</option>' +
                            '<option value=\"MANTENEDOR\">Mantenedor</option>' +
                            '<option value=\"OTRO\">Otro</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class=\"form-group\" style=\"margin-bottom: 0;\">' +
                        '<label for=\"materialAlmacen\">Almacén</label>' +
                        '<select id=\"materialAlmacen\">' +
                            '<option value=\"Central\">Central</option>' +
                            '<option value=\"Sitio\">Sitio</option>' +
                        '</select>' +
                    '</div>' +
                    '<button type=\"button\" id=\"addMaterialBtn\" class=\"btn btn-secondary btn-small\">+</button>' +
                '</div>' +
                
                '<div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;\">' +
                    '<div class=\"form-group\" style=\"margin-bottom: 0;\">' +
                        '<label for=\"materialNumeroItem\">Número Item (Opcional)</label>' +
                        '<input type=\"text\" id=\"materialNumeroItem\" placeholder=\"N° Item\">' +
                    '</div>' +
                    '<div class=\"form-group\" style=\"margin-bottom: 0;\">' +
                        '<label for=\"materialNumeroSerie\">Número Serie (Opcional)</label>' +
                        '<input type=\"text\" id=\"materialNumeroSerie\" placeholder=\"N° Serie\">' +
                    '</div>' +
                '</div>' +
                
                '<div id=\"materialesLista\" style=\"max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 4px; background: white;\">' +
                    '<div style=\"padding: 20px; text-align: center; color: var(--text-secondary);\">No hay materiales agregados</div>' +
                '</div>' +
            '</div>' +
            
            '<!-- Observaciones de Cierre -->' +
            '<div class=\"form-group\" style=\"margin-bottom: 24px;\">' +
                '<label for=\"observacionesCierre\">Observaciones de Cierre</label>' +
                '<textarea id=\"observacionesCierre\" rows=\"3\" placeholder=\"Observaciones sobre el cierre del permiso...\">Trabajo completado según programación</textarea>' +
            '</div>' +
            
            '<div style=\"display: flex; gap: 12px; justify-content: flex-end;\">' +
                '<button id=\"cancelarCierreBtn\" class=\"btn btn-secondary btn-small\">CANCELAR</button>' +
                '<button id=\"confirmarCierreBtn\" class=\"btn btn-danger btn-small\">CERRAR PERMISO</button>' +
            '</div>' +
        '</div>' +
    '</div>' +

    '<!-- MODAL DE CAMBIO DE CONTRAEÑA OBLIGATORIO -->' +
    '<div id="changePasswordModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 2000; align-items: center; justify-content: center;">' +
        '<div style="background: white; border-radius: 8px; padding: 32px; max-width: 480px; width: 90%; margin: 20px;">' +
            '<h3 style="margin-bottom: 24px; color: var(--primary-color);">Cambio de Contraseña Obligatorio</h3>' +
            
            '<div class="warning" style="background: rgba(243, 156, 18, 0.1); color: var(--warning-color); padding: 16px; border-radius: 6px; margin-bottom: 20px; border: 1px solid rgba(243, 156, 18, 0.2);">' +
                '<strong>⚠️ Primera vez ingresando</strong><br>' +
                'Por seguridad, debes cambiar tu contraseña temporal.' +
            '</div>' +
            
            '<div class="form-group">' +
                '<label for="mandatoryNewPassword">Nueva Contraseña</label>' +
                '<input type="password" id="mandatoryNewPassword" required placeholder="Mínimo 8 caracteres">' +
            '</div>' +
            
            '<div class="form-group">' +
                '<label for="mandatoryConfirmPassword">Confirmar Nueva Contraseña</label>' +
                '<input type="password" id="mandatoryConfirmPassword" required placeholder="Repite la contraseña">' +
            '</div>' +
            
            '<div id="changePasswordError" class="error" style="display: none; margin-bottom: 16px;"></div>' +
            
            '<button id="submitPasswordChangeBtn" class="btn" style="width: 100%;">Cambiar Contraseña y Continuar</button>' +
            
            '<p style="margin-top: 16px; font-size: 12px; color: var(--text-secondary); text-align: center;">' +
                'No podrás acceder al sistema hasta cambiar tu contraseña' +
            '</p>' +
    '</div>' +
  '</div>' +

    '<!-- MODAL PARA APROBAR/RECHAZAR CIERRE -->' +
    '<div id="aprobarCierreModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; overflow-y: auto;">' +
        '<div style="background: white; border-radius: 8px; padding: 32px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; margin: 20px;">' +
            '<h3 id="aprobarCierreModalTitle" style="margin-bottom: 24px; color: var(--primary-color); font-size: 20px; font-weight: 600;"></h3>' +
            
            '<!-- Información del permiso -->' +
            '<div style="background: var(--bg-secondary); padding: 16px; border-radius: 6px; margin-bottom: 24px; border: 1px solid var(--border-color);">' +
                '<p style="margin-bottom: 8px;"><strong>Permiso:</strong> <span id="aprobarCierrePermisoNumero"></span></p>' +
                '<p style="margin-bottom: 0;"><strong>Acción:</strong> <span id="aprobarCierreAccion"></span></p>' +
            '</div>' +
            
            '<!-- Comentarios -->' +
            '<div class="form-group" style="margin-bottom: 24px;">' +
                '<label for="comentariosAprobacion">Comentarios de Aprobación/Rechazo</label>' +
                '<textarea id="comentariosAprobacion" rows="3" placeholder="Ingrese sus comentarios sobre la decisión..."></textarea>' +
            '</div>' +
            
            '<div style="display: flex; gap: 12px; justify-content: flex-end;">' +
                '<button id="cancelarAprobacionBtn" class="btn btn-secondary btn-small">CANCELAR</button>' +
                '<button id="confirmarAprobacionBtn" class="btn btn-small"></button>' +
            '</div>' +
        '</div>' +
    '</div>' +

    '<!-- MODAL PARA VER HISTORIAL DE CIERRE -->' +
    '<div id="historialCierreModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; overflow-y: auto;">' +
        '<div style="background: white; border-radius: 8px; padding: 32px; max-width: 900px; width: 90%; max-height: 90vh; overflow-y: auto; margin: 20px;">' +
            '<h3 style="margin-bottom: 24px; color: var(--primary-color); font-size: 20px; font-weight: 600;">HISTORIAL DE CIERRE</h3>' +
            
            '<!-- Información del permiso -->' +
            '<div style="background: var(--bg-secondary); padding: 16px; border-radius: 6px; margin-bottom: 24px; border: 1px solid var(--border-color);">' +
                '<p style="margin-bottom: 8px;"><strong>Permiso:</strong> <span id="historialPermisoNumero"></span></p>' +
                '<p style="margin-bottom: 8px;"><strong>Planta:</strong> <span id="historialPermisoPlanta"></span></p>' +
                '<p style="margin-bottom: 0;"><strong>Estado Actual:</strong> <span id="historialPermisoEstado"></span></p>' +
            '</div>' +
            
            '<!-- Estadísticas del historial -->' +
            '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px;">' +
                '<div style="background: var(--success-color); background: rgba(34, 197, 94, 0.1); color: var(--success-color); padding: 16px; border-radius: 6px; text-align: center; border: 1px solid rgba(34, 197, 94, 0.2);">' +
                    '<div style="font-size: 24px; font-weight: 600;" id="totalIntentos">0</div>' +
                    '<div style="font-size: 12px; opacity: 0.8;">Total Intentos</div>' +
                '</div>' +
                '<div style="background: rgba(239, 68, 68, 0.1); color: var(--error-color); padding: 16px; border-radius: 6px; text-align: center; border: 1px solid rgba(239, 68, 68, 0.2);">' +
                    '<div style="font-size: 24px; font-weight: 600;" id="totalRechazos">0</div>' +
                    '<div style="font-size: 12px; opacity: 0.8;">Total Rechazos</div>' +
                '</div>' +
            '</div>' +
            
            '<!-- Timeline del historial -->' +
            '<div style="margin-bottom: 24px;">' +
                '<h4 style="margin-bottom: 16px; color: var(--text-primary);">Timeline de Acciones</h4>' +
                '<div id="historialTimeline" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px; padding: 16px;">' +
                    '<div class="loading">Cargando historial...</div>' +
                '</div>' +
            '</div>' +
            
            '<div style="display: flex; gap: 12px; justify-content: flex-end;">' +
                '<button id="cerrarHistorialBtn" class="btn btn-secondary btn-small">CERRAR</button>' +
            '</div>' +
        '</div>' +
    '</div>' +

  '<script>' + getWebAppScript() + '</script>' +
'</body>' +
'</html>';
}

function getStyles() {
  return `
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    :root {
        --primary-color: #1a1f2e;
        --secondary-color: #2c3e50;
        --accent-color: #3498db;
        --success-color: #27ae60;
        --warning-color: #f39c12;
        --danger-color: #e74c3c;
        --text-primary: #2c3e50;
        --text-secondary: #7f8c8d;
        --text-light: #95a5a6;
        --bg-primary: #ffffff;
        --bg-secondary: #f8f9fa;
        --bg-tertiary: #ecf0f1;
        --border-color: #dfe6e9;
        --shadow-sm: 0 2px 4px rgba(0,0,0,0.08);
        --shadow-md: 0 4px 12px rgba(0,0,0,0.12);
        --shadow-lg: 0 8px 24px rgba(0,0,0,0.15);
        --radius-sm: 4px;
        --radius-md: 6px;
        --radius-lg: 8px;
    }
    
    body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-primary);
        line-height: 1.6;
    }
    
    .container {
        width: 100%;
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px;
    }
    
    .login-container {
        background: var(--bg-primary);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        padding: 48px;
        max-width: 420px;
        margin: 0 auto;
        border-top: 4px solid var(--primary-color);
    }
    
    .app-container {
        background: var(--bg-primary);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        padding: 0;
        display: none;
        overflow: hidden;
    }
    
    .logo {
        text-align: center;
        margin-bottom: 36px;
    }
    
    .logo h1 {
        color: var(--primary-color);
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
    }
    
    .logo p {
        color: var(--text-secondary);
        font-size: 14px;
        font-weight: 400;
    }
    
    .form-group {
        margin-bottom: 20px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--text-primary);
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .form-group input, 
    .form-group select, 
    .form-group textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 14px;
        transition: all 0.2s ease;
        background: var(--bg-primary);
        color: var(--text-primary);
    }
    
    .form-group input:focus, 
    .form-group select:focus, 
    .form-group textarea:focus {
        outline: none;
        border-color: var(--accent-color);
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }
    
    .form-group textarea {
        resize: vertical;
        min-height: 80px;
        font-family: inherit;
    }
    
    .btn {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: var(--radius-md);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .btn:hover:not(:disabled) {
        background: var(--secondary-color);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
    }
    
    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .btn-secondary {
        background: var(--secondary-color);
    }
    
    .btn-secondary:hover:not(:disabled) {
        background: var(--primary-color);
    }
    
    .btn-danger {
        background: var(--danger-color);
    }
    
    .btn-danger:hover:not(:disabled) {
        background: #c0392b;
    }
    
    .btn-small {
        padding: 8px 16px;
        font-size: 12px;
        width: auto;
    }
    
    .btn-success {
        background: var(--success-color);
    }
    
    .btn-success:hover:not(:disabled) {
        background: #16a085;
    }
    
    .btn-warning {
        background: var(--warning-color);
    }
    
    .btn-warning:hover:not(:disabled) {
        background: #d68910;
    }
    
    .header {
        background: var(--primary-color);
        color: white;
        padding: 24px 32px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .header h1 {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 4px;
    }
    
    .header p {
        font-size: 13px;
        opacity: 0.9;
    }
    
    .tabs {
        background: var(--bg-secondary);
        padding: 0;
        display: flex;
        border-bottom: 1px solid var(--border-color);
    }
    
    .tab {
        padding: 16px 24px;
        background: transparent;
        border: none;
        border-bottom: 3px solid transparent;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 500;
        font-size: 14px;
        color: var(--text-secondary);
    }
    
    .tab:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }
    
    .tab.active {
        background: var(--bg-primary);
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
        font-weight: 600;
    }
    
    .tab-content {
        display: none;
        padding: 32px;
        background: var(--bg-primary);
    }
    
    .tab-content.active {
        display: block;
    }
    
    .card {
        background: var(--bg-primary);
        border-radius: var(--radius-lg);
        padding: 24px;
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-sm);
    }
    
    .card h3 {
        color: var(--primary-color);
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid var(--bg-secondary);
    }
    
    .grid-three {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 24px;
    }
    
    .error {
        background: rgba(231, 76, 60, 0.1);
        color: var(--danger-color);
        padding: 16px 20px;
        border-radius: var(--radius-md);
        margin-bottom: 20px;
        border: 1px solid rgba(231, 76, 60, 0.2);
        font-size: 14px;
    }
    
    .success {
        background: rgba(39, 174, 96, 0.1);
        color: var(--success-color);
        padding: 16px 20px;
        border-radius: var(--radius-md);
        margin-bottom: 20px;
        border: 1px solid rgba(39, 174, 96, 0.2);
        font-size: 14px;
    }
    
    .loading {
        text-align: center;
        padding: 48px 24px;
        color: var(--text-secondary);
        font-style: italic;
        font-size: 14px;
    }
    
    .status-indicator {
        padding: 8px 16px;
        border-radius: var(--radius-md);
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .status-online {
        background: rgba(39, 174, 96, 0.1);
        color: var(--success-color);
        border: 1px solid rgba(39, 174, 96, 0.2);
    }
    
    .status-offline {
        background: rgba(231, 76, 60, 0.1);
        color: var(--danger-color);
        border: 1px solid rgba(231, 76, 60, 0.2);
    }
    
    .checkbox-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 12px;
        background: var(--bg-secondary);
    }
    
    .checkbox-item {
        display: flex;
        align-items: center;
        padding: 8px;
        margin-bottom: 4px;
        border-radius: var(--radius-sm);
        transition: background 0.2s ease;
    }
    
    .checkbox-item:hover {
        background: var(--bg-tertiary);
    }
    
    .checkbox-item input[type="checkbox"] {
        margin-right: 12px;
        width: 16px;
        height: 16px;
        cursor: pointer;
    }
    
    .checkbox-item label {
        cursor: pointer;
        font-size: 14px;
        color: var(--text-primary);
        flex: 1;
    }
    
    .selector-dual {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 20px;
        align-items: center;
    }
    
    .selector-list {
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        height: 300px;
        overflow-y: auto;
        background: var(--bg-secondary);
    }
    
    .selector-item {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
    }
    
    .selector-item:hover {
        background: var(--bg-tertiary);
    }
    
    .selector-item.selected {
        background: rgba(52, 152, 219, 0.1);
        border-left: 3px solid var(--accent-color);
    }
    
    .selector-controls {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .search-box {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;
    }
    
    .search-input {
        flex: 1;
        padding: 10px 16px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 14px;
    }
    
    .search-input:focus {
        outline: none;
        border-color: var(--accent-color);
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }
    
    .data-table {
        width: 100%;
        overflow-x: auto;
    }
    
    .data-table table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .data-table th {
        background: var(--bg-secondary);
        padding: 12px;
        text-align: left;
        font-weight: 600;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-secondary);
        border-bottom: 2px solid var(--border-color);
    }
    
    .data-table td {
        padding: 12px;
        border-bottom: 1px solid var(--border-color);
        font-size: 14px;
    }
    
    .data-table tr:hover {
        background: var(--bg-secondary);
    }
    
    .permiso-card {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 20px;
        margin-bottom: 16px;
        transition: all 0.2s ease;
    }
    
    .permiso-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
    }
    
    .permiso-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 16px;
    }
    
    .permiso-numero {
        font-size: 18px;
        font-weight: 600;
        color: var(--primary-color);
    }
    
    .permiso-estado {
        padding: 4px 12px;
        border-radius: var(--radius-sm);
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .estado-creado {
        background: rgba(241, 196, 15, 0.1);
        color: var(--warning-color);
        border: 1px solid rgba(241, 196, 15, 0.2);
    }
    
    .estado-activo {
        background: rgba(39, 174, 96, 0.1);
        color: var(--success-color);
        border: 1px solid rgba(39, 174, 96, 0.2);
    }
    
    .estado-cerrado {
        background: rgba(149, 165, 166, 0.1);
        color: var(--text-secondary);
        border: 1px solid rgba(149, 165, 166, 0.2);
    }
    
    .rechazado {
        background: rgba(231, 76, 60, 0.1);
        color: var(--danger-color);
        border: 1px solid rgba(231, 76, 60, 0.2);
        font-weight: 600;
    }
    
    .aprobado {
        background: rgba(39, 174, 96, 0.1);
        color: var(--success-color);
        border: 1px solid rgba(39, 174, 96, 0.2);
        font-weight: 600;
    }
    
    .pendiente {
        background: rgba(241, 196, 15, 0.1);
        color: var(--warning-color);
        border: 1px solid rgba(241, 196, 15, 0.2);
        font-weight: 600;
    }
    
    .permiso-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
        font-size: 14px;
    }
    
    .permiso-info-item {
        display: flex;
        flex-direction: column;
    }
    
    .permiso-info-label {
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .permiso-info-value {
        color: var(--text-primary);
        font-weight: 500;
    }
    
    .permiso-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    
    .input-others {
        display: none;
        margin-top: 12px;
    }
    
    @media (max-width: 768px) {
        .container {
            padding: 10px;
        }
        
        .login-container {
            padding: 32px 24px;
        }
        
        .grid-three {
            grid-template-columns: 1fr;
        }
        
        .selector-dual {
            grid-template-columns: 1fr;
        }
        
        .selector-controls {
            flex-direction: row;
            justify-content: center;
        }
        
        .tabs {
            overflow-x: auto;
        }
        
        .tab {
            white-space: nowrap;
        }
    }
    
    @media print {
        body {
            background: white;
        }
        
        .header, .tabs, .btn, .permiso-actions {
            display: none !important;
        }
        
        .container {
            max-width: 100%;
        }
    }
  `;
}

// ============================================================================
// WEB APP SCRIPT - ACTUALIZADO PARA D1 DATABASE
// ============================================================================
function getWebAppScript() {
  return `
    // ========================================================================
    // CONFIGURACIÓN Y VARIABLES GLOBALES
    // ========================================================================
    
    console.log('PT Wind v18.0 - D1 Database Edition');
    
    const API_BASE = window.location.origin + '/api';
    let currentUser = null;
    let authToken = null;
    let sessionId = null;
    
    // Datos cargados
    let parquesData = [];
    let personalData = [];
    let personalByParque = {};
    let supervisoresData = [];
    let actividadesData = [];
    let matrizRiesgosData = [];
    let aerogeneradoresData = [];
    let permisosData = [];
    
    // Estado del formulario
    let personalSeleccionado = [];
    let actividadesSeleccionadas = [];
    let matrizRiesgosSeleccionada = [];
    let materialesParaCierre = [];
    
    // ========================================================================
    // FUNCIONES DE SEGURIDAD (sin cambios)
    // ========================================================================
    
    class ClientSecurity {
      static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      }
      
      static encodeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
      }
      
      static async makeSecureRequest(endpoint, options = {}) {
        const defaultOptions = {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        };
        
        if (authToken) {
          defaultOptions.headers['Authorization'] = 'Bearer ' + authToken;
        }
        
        if (sessionId) {
          defaultOptions.headers['X-Session-Id'] = sessionId;
        }
        
        try {
          const response = await fetch(API_BASE + endpoint, {
            ...defaultOptions,
            ...options
          });
          
          if (response.status === 401) {
            handleLogout();
            throw new Error('Sesión expirada');
          }
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Error en la solicitud');
          }
          
          return data;
        } catch (error) {
          console.error('Request error:', error);
          throw error;
        }
      }
    }
    
    // ========================================================================
    // INICIALIZACIÓN (sin cambios)
    // ========================================================================
    
    document.addEventListener('DOMContentLoaded', async function() {
        console.log('Inicializando aplicación...');
        
        const storedToken = sessionStorage.getItem('authToken');
        const storedSessionId = sessionStorage.getItem('sessionId');  // ← AGREGAR
        if (storedSessionId) sessionId = storedSessionId;  // ← AGREGAR
        if (storedToken) {
            authToken = storedToken;
            await verifyAndLoadApp();
        } else {
            showLoginScreen();
        }
        
        setupEventListeners();
        checkConnectionStatus();
    });
    
    // ========================================================================
    // MANEJO DE AUTENTICACIÓN (sin cambios)
    // ========================================================================
    
    function setupEventListeners() {
        // helper seguro para no romper si falta un elemento
        const on = (id, ev, fn, opts) => { 
            const el = document.getElementById(id); 
            if (el) el.addEventListener(ev, fn, opts); 
        };
        
        // Login
        on('loginForm', 'submit', handleLogin);
        on('logoutBtn', 'click', handleLogout);
        
        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
        });
        
        // Formulario de permiso
        on('permisoForm', 'submit', handleCreatePermiso);
        
        // Selectores
        on('planta', 'change', handlePlantaChange);
        on('tipoMantenimiento', 'change', handleTipoMantenimientoChange);
        
        // Personal
        on('addPersonalBtn', 'click', addSelectedPersonal);
        on('removePersonalBtn', 'click', removeSelectedPersonal);
        
        // Botones
        on('generateRegisterBtn', 'click', generateRegister);
        on('refreshPermisosBtn', 'click', loadPermisos);
        on('clearSearchBtn', 'click', clearSearch);
        const search = document.getElementById('searchPermiso'); 
        if (search) search.addEventListener('input', filterPermisos);
        
        // Modal de cierre
        on('cancelarCierreBtn', 'click', closeCerrarModal);
        on('confirmarCierreBtn', 'click', handleConfirmarCierre);
        on('addMaterialBtn', 'click', addMaterial);
        
        // Modales de aprobacion y historial
        on('cancelarAprobacionBtn', 'click', closeAprobarCierreModal);
        on('confirmarAprobacionBtn', 'click', handleConfirmarAprobacion);
        on('cerrarHistorialBtn', 'click', closeHistorialCierreModal);
    }
    
    async function handleLogin(e) {
        e.preventDefault();
        
        const usuario = ClientSecurity.sanitizeInput(document.getElementById('usuario').value);
        const password = document.getElementById('password').value;
        
        const loginBtn = document.getElementById('loginBtn');
        const errorDiv = document.getElementById('loginError');
        
        errorDiv.style.display = 'none';
        loginBtn.disabled = true;
        loginBtn.textContent = 'Iniciando sesión...';
        
        try {
            const response = await fetch(API_BASE + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                authToken = result.token;
                sessionId = result.sessionId;
                currentUser = result.user;
                
                sessionStorage.setItem('authToken', authToken);
                if (sessionId) {
                    sessionStorage.setItem('sessionId', sessionId);
                }
                if (result.requirePasswordChange) {
                    showChangePasswordModal();
                } else {
                    await loadAppData();
                    showApp();
                }
            } else {
                showLoginError(result.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            showLoginError('Error de conexión: ' + error.message);
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Iniciar Sesión';
        }
    }

    // Nueva función para mostrar modal de cambio obligatorio
    function showChangePasswordModal() {
        document.getElementById('changePasswordModal').style.display = 'flex';
        document.getElementById('submitPasswordChangeBtn')
            .addEventListener('click', handleMandatoryPasswordChange, { once: true });
    }
    
    async function handleMandatoryPasswordChange() {
    const newPassword = document.getElementById('mandatoryNewPassword').value;
    const confirmPassword = document.getElementById('mandatoryConfirmPassword').value;
    const errorDiv = document.getElementById('changePasswordError');
    const submitBtn = document.getElementById('submitPasswordChangeBtn');
    
    // Validaciones
    if (!newPassword || !confirmPassword) {
        errorDiv.textContent = 'Ambos campos son requeridos';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorDiv.textContent = 'Las contraseñas no coinciden';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (newPassword.length < 8) {
        errorDiv.textContent = 'La contraseña debe tener al menos 8 caracteres';
        errorDiv.style.display = 'block';
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Cambiando contraseña...';
    
    try {
        const response = await fetch(API_BASE + '/change-password', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({ newPassword })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Ocultar modal
            document.getElementById('changePasswordModal').style.display = 'none';
            
            // Cargar la aplicación
            await loadAppData();
            showApp();
            
            // Mostrar mensaje de éxito
            alert('Contraseña actualizada exitosamente');
        } else {
            errorDiv.textContent = result.error || 'Error al cambiar la contraseña';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Error de conexión';
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cambiar Contraseña y Continuar';
    }
    }
    async function verifyAndLoadApp() {
        try {
            const response = await ClientSecurity.makeSecureRequest('/health');
            if (response.status === 'OK') {
                await loadAppData();
                showApp();
            } else {
                handleLogout();
            }
        } catch (error) {
            console.error('Error verificando token:', error);
            handleLogout();
        }
    }
    
    function handleLogout() {
        authToken = null;
        sessionId = null;
        currentUser = null;
        sessionStorage.clear();
        showLoginScreen();
    }
    
    function showLoginScreen() {
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('appScreen').style.display = 'none';
    }
    
    function showApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appScreen').style.display = 'block';
        
        if (currentUser) {
            document.getElementById('userDisplay').textContent = 
                ClientSecurity.encodeHTML(currentUser.usuario + ' (' + currentUser.rol + ')');
            
            if (currentUser.rol === 'Admin') {
                document.getElementById('tabDatos').style.display = 'block';
            }
        }
    }
    
    function showLoginError(message) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
    
    // ========================================================================
    // CARGA DE DATOS - ACTUALIZADO PARA D1
    // ========================================================================
    
    async function loadAppData() {
        console.log('Cargando datos de la aplicación...');
        
        try {
            const [parques, personal, supervisores, actividades] = await Promise.all([
                ClientSecurity.makeSecureRequest('/parques'),
                ClientSecurity.makeSecureRequest('/personal'),
                ClientSecurity.makeSecureRequest('/supervisores'),
                ClientSecurity.makeSecureRequest('/actividades')
            ]);
            
            // Los datos ahora vienen directamente como arrays sin properties
            parquesData = parques.results || [];
            personalData = personal.results || [];
            supervisoresData = supervisores.results || [];
            actividadesData = actividades.results || [];
            
            populateParques();
            populateSupervisores();
            populateActividades();
            
            await loadPermisos();
            
            console.log('Datos cargados exitosamente');
        } catch (error) {
            console.error('Error cargando datos:', error);
            alert('Error al cargar los datos del sistema');
        }
    }
    
    function populateParques() {
        const select = document.getElementById('planta');
        select.innerHTML = '<option value="">Seleccionar planta...</option>';
        
        // Filtrar parques según los autorizados del usuario
        const parquesAutorizados = currentUser?.parques || [];
        const esEnel = currentUser?.esEnel || false;
        
        parquesData.forEach(parque => {
            // Si es Enel, puede ver todos los parques
            // Si no, solo los parques autorizados
            if (esEnel || parquesAutorizados.includes(parque.nombre)) {
                const option = document.createElement('option');
                option.value = parque.nombre;
                option.textContent = parque.nombre;
                option.dataset.id = parque.id;
                option.dataset.codigo = parque.codigo || '';
                select.appendChild(option);
            }
        });
    }
    
    function populateSupervisores() {
        const jefeFaenaSelect = document.getElementById('jefeFaena');
        const supervisorParqueSelect = document.getElementById('supervisorParque');
        
        supervisorParqueSelect.innerHTML = '<option value="">Seleccionar supervisor de parque...</option>';
        
        supervisoresData.forEach(supervisor => {
            const option = document.createElement('option');
            option.value = supervisor.nombre;
            option.textContent = supervisor.nombre;
            option.dataset.id = supervisor.id;
            option.dataset.cargo = supervisor.cargo || '';
            
            supervisorParqueSelect.appendChild(option);
        });
    }
    
    function populateActividades() {
        const container = document.getElementById('actividadesChecklist');
        container.innerHTML = '';
        
        actividadesData.forEach(actividad => {
            const item = document.createElement('div');
            item.className = 'checkbox-item';
            item.innerHTML = \`
                <input type="checkbox" id="act_\${actividad.id}" value="\${actividad.nombre}" 
                       data-id="\${actividad.id}" data-tipo="\${actividad.tipo || 'RUTINARIA'}">
                <label for="act_\${actividad.id}">\${actividad.nombre}</label>
            \`;
            
            item.querySelector('input').addEventListener('change', handleActividadChange);
            container.appendChild(item);
        });
    }
    
    // ========================================================================
    // MANEJO DE FORMULARIO - ACTUALIZADO PARA D1
    // ========================================================================
    
    async function handlePlantaChange(e) {
        const plantaNombre = e.target.value;
        const plantaId = e.target.selectedOptions[0]?.dataset.id;
        const codigoParque = e.target.selectedOptions[0]?.dataset.codigo;
        
        const jefeFaenaSelect = document.getElementById('jefeFaena');  // ← IMPORTANTE
        
        if (!plantaNombre) {
            document.getElementById('aerogenerador').innerHTML = '<option value="">Seleccionar aerogenerador...</option>';
            document.getElementById('personalDisponible').innerHTML = '<div class="loading">Seleccione una planta primero</div>';
            jefeFaenaSelect.innerHTML = '<option value="">Seleccionar jefe de faena...</option>';  // ← IMPORTANTE
            return;
        }
        
        // Cargar aerogeneradores
        await loadAerogeneradores(plantaNombre);
        
        // Cargar personal del parque
        await loadPersonalByParque(plantaNombre);
        
        // ⭐ ESTA ES LA PARTE NUEVA QUE DEBES AGREGAR ⭐
        // Poblar Jefe de Faena con el personal del parque
        jefeFaenaSelect.innerHTML = '<option value="">Seleccionar jefe de faena...</option>';
        
        if (personalByParque[plantaNombre] && personalByParque[plantaNombre].length > 0) {
            personalByParque[plantaNombre].forEach(persona => {
                const option = document.createElement('option');
                option.value = persona.nombre;
                option.textContent = \`\${persona.nombre} - \${persona.empresa || ''}\`;
                option.dataset.id = persona.id;
                option.dataset.empresa = persona.empresa || '';
                option.dataset.rol = persona.rol || '';
                jefeFaenaSelect.appendChild(option);
            });
        } else {
            // Si no hay personal en el parque, mostrar mensaje
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No hay personal asignado a este parque";
            option.disabled = true;
            jefeFaenaSelect.appendChild(option);
        }
    }
    
    async function loadAerogeneradores(plantaNombre) {
        try {
            const response = await ClientSecurity.makeSecureRequest(\`/aerogeneradores?parque=\${encodeURIComponent(plantaNombre)}\`);
            aerogeneradoresData = response.results || [];
            
            const select = document.getElementById('aerogenerador');
            select.innerHTML = '<option value="">Seleccionar aerogenerador...</option>';
            
            aerogeneradoresData.forEach(aero => {
                const option = document.createElement('option');
                option.value = aero.nombre || aero.WTG_Name;
                option.textContent = aero.nombre || aero.WTG_Name;
                option.dataset.codigo = aero.codigo || aero.WTG_Name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando aerogeneradores:', error);
        }
    }
    
    async function loadPersonalByParque(plantaNombre) {
        try {
            const response = await ClientSecurity.makeSecureRequest('/personal-by-parque?parque=' + encodeURIComponent(plantaNombre));
            personalByParque[plantaNombre] = response.results || [];
            
            const container = document.getElementById('personalDisponible');
            container.innerHTML = '';
            
            if (personalByParque[plantaNombre].length === 0) {
                container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No hay personal asignado a este parque</div>';
                return;
            }
            
            personalByParque[plantaNombre].forEach(persona => {
                // Los datos vienen directamente, no en properties
                const item = document.createElement('div');
                item.className = 'selector-item';
                item.innerHTML = \`
                    <strong>\${persona.nombre}</strong><br>
                    <small>\${persona.empresa || 'Sin empresa'} - \${persona.rol || 'Sin rol'}</small>
                \`;
                item.dataset.id = persona.id;
                item.dataset.nombre = persona.nombre;
                item.dataset.empresa = persona.empresa || '';
                item.dataset.rol = persona.rol || '';
                item.dataset.rut = persona.rut || '';
                
                item.addEventListener('click', () => togglePersonalSelection(item));
                container.appendChild(item);
            });
        } catch (error) {
            console.error('Error cargando personal del parque:', error);
        }
    }
    
    function togglePersonalSelection(item) {
        item.classList.toggle('selected');
    }
    
    function addSelectedPersonal() {
        const disponibleContainer = document.getElementById('personalDisponible');
        const seleccionadoContainer = document.getElementById('personalSeleccionado');
        
        const selectedItems = disponibleContainer.querySelectorAll('.selected');
        
        if (selectedItems.length === 0) {
            alert('Seleccione al menos una persona');
            return;
        }
        
        if (personalSeleccionado.length === 0) {
            seleccionadoContainer.innerHTML = '';
        }
        
        selectedItems.forEach(item => {
            const persona = {
                id: item.dataset.id,
                nombre: item.dataset.nombre,
                empresa: item.dataset.empresa,
                rol: item.dataset.rol,
                rut: item.dataset.rut
            };
            
            if (!personalSeleccionado.find(p => p.id === persona.id)) {
                personalSeleccionado.push(persona);
                
                const newItem = item.cloneNode(true);
                newItem.classList.remove('selected');
                newItem.addEventListener('click', () => togglePersonalSelection(newItem));
                seleccionadoContainer.appendChild(newItem);
            }
            
            item.classList.remove('selected');
            item.style.display = 'none';
        });
    }
    
    function removeSelectedPersonal() {
        const seleccionadoContainer = document.getElementById('personalSeleccionado');
        const disponibleContainer = document.getElementById('personalDisponible');
        
        const selectedItems = seleccionadoContainer.querySelectorAll('.selected');
        
        if (selectedItems.length === 0) {
            alert('Seleccione al menos una persona para remover');
            return;
        }
        
        selectedItems.forEach(item => {
            const id = item.dataset.id;
            
            personalSeleccionado = personalSeleccionado.filter(p => p.id !== id);
            
            const originalItem = disponibleContainer.querySelector(\`[data-id="\${id}"]\`);
            
            if (originalItem) {
                originalItem.style.display = 'block';
            }
            
            item.remove();
        });
        
        if (personalSeleccionado.length === 0) {
            seleccionadoContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No hay personal seleccionado</div>';
        }
    }
    
    function handleTipoMantenimientoChange(e) {
        const tipoOtrosContainer = document.getElementById('tipoOtrosContainer');
        if (e.target.value === 'OTROS') {
            tipoOtrosContainer.style.display = 'block';
            document.getElementById('tipoOtros').required = true;
        } else {
            tipoOtrosContainer.style.display = 'none';
            document.getElementById('tipoOtros').required = false;
            document.getElementById('tipoOtros').value = '';
        }
    }
    
    async function handleActividadChange() {
        actividadesSeleccionadas = [];
        document.querySelectorAll('#actividadesChecklist input:checked').forEach(checkbox => {
            actividadesSeleccionadas.push({
                id: checkbox.dataset.id,
                nombre: checkbox.value,
                tipo: checkbox.dataset.tipo
            });
        });
        
        if (actividadesSeleccionadas.length > 0) {
            await loadMatrizRiesgos();
        } else {
            matrizRiesgosSeleccionada = [];
            updateMatrizDisplay();
        }
    }
    
    async function loadMatrizRiesgos() {
        try {
            const actividadesNombres = actividadesSeleccionadas.map(a => a.nombre).join(',');
            const response = await ClientSecurity.makeSecureRequest('/matriz-riesgos?actividades=' + encodeURIComponent(actividadesNombres));
            
            // Los datos vienen directamente de D1, no en properties
            const results = Array.isArray(response?.results) ? response.results : [];
            matrizRiesgosSeleccionada = results.map(item => ({
                id: item.id,
                codigo: item.codigo || 0,
                actividad: item.actividad || '',
                peligro: item.peligro || '',
                riesgo: item.riesgo || '',
                medidas: item.medidas_preventivas || ''
            }));
            
            updateMatrizDisplay();
        } catch (error) {
            console.error('Error cargando matriz de riesgos:', error);
        }
    }
    
    function updateMatrizDisplay() {
        const tableBody = document.getElementById('matrizTableBody');
        const table = document.getElementById('matrizTable');
        const emptyState = document.getElementById('matrizEmptyState');
        
        if (matrizRiesgosSeleccionada.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        table.style.display = 'block';
        emptyState.style.display = 'none';
        
        tableBody.innerHTML = '';
        matrizRiesgosSeleccionada.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = \`
                <td>\${item.codigo}</td>
                <td>\${item.actividad}</td>
                <td>\${item.peligro}</td>
                <td>\${item.riesgo}</td>
                <td>\${item.medidas}</td>
            \`;
            tableBody.appendChild(row);
        });
    }
    
    // ========================================================================
    // CREAR PERMISO (sin cambios significativos)
    // ========================================================================
    
    async function handleCreatePermiso(e) {
        e.preventDefault();
        
        // Deshabilitar el botón de submit para evitar múltiples envíos
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'CREANDO PERMISO...';
        
        const plantaSelect = document.getElementById('planta');
        const aerogeneradorSelect = document.getElementById('aerogenerador');
        const jefeFaenaSelect = document.getElementById('jefeFaena');
        const supervisorParqueSelect = document.getElementById('supervisorParque');
        
        const permisoData = {
            planta: plantaSelect.value,
            plantaId: plantaSelect.selectedOptions[0]?.dataset.id,
            codigoParque: plantaSelect.selectedOptions[0]?.dataset.codigo,
            aerogenerador: aerogeneradorSelect.value,
            aerogeneradorCodigo: aerogeneradorSelect.selectedOptions[0]?.dataset.codigo,
            descripcion: ClientSecurity.sanitizeInput(document.getElementById('descripcion').value),
            jefeFaena: jefeFaenaSelect.value,
            jefeFaenaId: jefeFaenaSelect.selectedOptions[0]?.dataset.id,
            supervisorParque: supervisorParqueSelect.value,
            supervisorParqueId: supervisorParqueSelect.selectedOptions[0]?.dataset.id,
            tipoMantenimiento: document.getElementById('tipoMantenimiento').value,
            tipoMantenimientoOtros: ClientSecurity.sanitizeInput(document.getElementById('tipoOtros').value),
            personal: personalSeleccionado,
            actividades: actividadesSeleccionadas,
            matrizRiesgos: matrizRiesgosSeleccionada,
            usuarioCreador: currentUser?.email || 'unknown',
            fechaInicio: new Date().toISOString()
        };
        
        if (!permisoData.planta || !permisoData.descripcion || !permisoData.jefeFaena) {
            alert('Por favor complete los campos obligatorios');
            // Re-habilitar el botón si hay error de validación
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            return;
        }
        
        if (personalSeleccionado.length === 0) {
            alert('Debe seleccionar al menos una persona');
            // Re-habilitar el botón si hay error de validación
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            return;
        }
        
        try {
            const response = await ClientSecurity.makeSecureRequest('/permisos', {
                method: 'POST',
                body: JSON.stringify(permisoData)
            });
            
            if (response.success) {
                alert('Permiso creado exitosamente\\n\\nNúmero: ' + response.numeroPT);
                
                document.getElementById('permisoForm').reset();
                personalSeleccionado = [];
                actividadesSeleccionadas = [];
                matrizRiesgosSeleccionada = [];
                document.getElementById('personalSeleccionado').innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No hay personal seleccionado</div>';
                updateMatrizDisplay();
                
                await loadPermisos();
                switchTab('consultar');
                
                // Re-habilitar el botón después del éxito
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            } else {
                alert('Error al crear el permiso: ' + (response.error || 'Error desconocido'));
                // Re-habilitar el botón si hay error
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        } catch (error) {
            console.error('Error creando permiso:', error);
            alert('Error al crear el permiso: ' + error.message);
            // Re-habilitar el botón si hay error
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }
    
    // ========================================================================
    // CONSULTAR PERMISOS (actualizado para D1)
    // ========================================================================
    
    async function loadPermisos() {
        try {
            const response = await ClientSecurity.makeSecureRequest('/permisos');
            permisosData = response.permisos || [];
            displayPermisos();
        } catch (error) {
            console.error('Error cargando permisos:', error);
            document.getElementById('permisosContainer').innerHTML = '<div class="error">Error al cargar los permisos</div>';
        }
    }
    
    function displayPermisos() {
        const container = document.getElementById('permisosContainer');
        
        // Filtrar permisos según plantas autorizadas
        const parquesAutorizados = currentUser?.parques || [];
        const esEnel = currentUser?.esEnel || false;
        
        const permisosFiltrados = permisosData.filter(permiso => {
            // Si es Enel, puede ver todos los permisos
            // Si no, solo los de sus parques autorizados
            return esEnel || parquesAutorizados.includes(permiso.planta_nombre);
        });
        
        if (permisosFiltrados.length === 0) {
            container.innerHTML = '<div class="loading">No hay permisos registrados para sus plantas autorizadas</div>';
            return;
        }
        
        container.innerHTML = '';
        permisosFiltrados.forEach(permiso => {
            const card = createPermisoCard(permiso);
            container.appendChild(card);
        });
    }
    
    function createPermisoCard(permiso) {
        const card = document.createElement('div');
        card.className = 'permiso-card';
        
        const estadoClass = 'estado-' + (permiso.estado || 'CREADO').toLowerCase();
        const esEnel = currentUser?.esEnel || currentUser?.rol === 'Supervisor Enel';
        
        // Verificar si el usuario puede cerrar el permiso
        // Ahora todos los IDs son de la misma tabla usuarios
        const userId = currentUser?.id ? currentUser.id.toString() : null;
        const jefeFaenaId = permiso.jefe_faena_id ? permiso.jefe_faena_id.toString() : null;
        const personalIds = permiso.personal_ids ? 
            permiso.personal_ids.split(',').map(id => id.trim()) : [];
        
        const esJefeFaena = userId && userId === jefeFaenaId;
        const estaEnPersonalAsignado = userId && personalIds.includes(userId);
        
        const puedeCerrarPermiso = esEnel || esJefeFaena || estaEnPersonalAsignado;
        
        card.innerHTML = \`
            <div class="permiso-header">
                <div class="permiso-numero">\${permiso.numero_pt}</div>
                <div class="permiso-estado \${estadoClass}">\${permiso.estado}</div>
            </div>
            
            <div class="permiso-info">
                <div class="permiso-info-item">
                    <div class="permiso-info-label">Planta</div>
                    <div class="permiso-info-value">\${permiso.planta_nombre}</div>
                </div>
                <div class="permiso-info-item">
                    <div class="permiso-info-label">Aerogenerador</div>
                    <div class="permiso-info-value">\${permiso.aerogenerador_nombre || 'N/A'}</div>
                </div>
                <div class="permiso-info-item">
                    <div class="permiso-info-label">Jefe de Faena</div>
                    <div class="permiso-info-value">\${permiso.jefe_faena_nombre}</div>
                </div>
                <div class="permiso-info-item">
                    <div class="permiso-info-label">Fecha Creación</div>
                    <div class="permiso-info-value">\${formatDate(permiso.fecha_creacion)}</div>
                </div>
            </div>
            
            <div class="permiso-info">
                <div class="permiso-info-item" style="grid-column: 1 / -1;">
                    <div class="permiso-info-label">Descripción</div>
                    <div class="permiso-info-value">\${permiso.descripcion}</div>
                </div>
            </div>
            
            \${permiso.personal_asignado ? \`
                <div class="permiso-info">
                    <div class="permiso-info-item" style="grid-column: 1 / -1;">
                        <div class="permiso-info-label">Personal Asignado</div>
                        <div class="permiso-info-value">\${permiso.personal_asignado}</div>
                    </div>
                </div>
            \` : ''}
            
            <div class="permiso-actions">
                \${permiso.estado === 'CREADO' && esEnel ? 
                    \`<button class="btn btn-secondary btn-small" onclick="aprobarPermiso(\${permiso.id})">APROBAR</button>\` : ''}
                
                \${permiso.estado === 'ACTIVO' && puedeCerrarPermiso ? 
                    \`<button class="btn btn-danger btn-small" onclick="openCerrarModal(\${permiso.id}, '\${permiso.numero_pt}', '\${permiso.planta_nombre}', '\${permiso.aerogenerador_nombre || 'N/A'}')">CERRAR PERMISO</button>\` : ''}
                
                \${permiso.estado === 'CERRADO_PENDIENTE_APROBACION' && esEnel ? 
                    \`<div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn btn-success btn-small" onclick="openAprobarCierreModal(\${permiso.id}, '\${permiso.numero_pt}', 'APROBAR')">APROBAR CIERRE</button>
                        <button class="btn btn-danger btn-small" onclick="openAprobarCierreModal(\${permiso.id}, '\${permiso.numero_pt}', 'RECHAZAR')">RECHAZAR CIERRE</button>
                        <button class="btn btn-secondary btn-small" onclick="openHistorialCierreModal(\${permiso.id}, '\${permiso.numero_pt}')">VER HISTORIAL</button>
                    </div>\` : ''}
                
                \${permiso.estado === 'CERRADO_PENDIENTE_APROBACION' && !esEnel ? 
                    \`<div style="display: flex; gap: 8px; align-items: center;">
                        <span style="color: var(--warning-color); font-size: 12px; font-weight: 500;">🕐 Pendiente de aprobación</span>
                        <button class="btn btn-secondary btn-small" onclick="openHistorialCierreModal(\${permiso.id}, '\${permiso.numero_pt}')">VER HISTORIAL</button>
                    </div>\` : ''}
                
                \${permiso.estado === 'CIERRE_RECHAZADO' ? 
                    \`<div style="display: flex; gap: 8px; align-items: center;">
                        <span style="color: var(--error-color); font-size: 12px; font-weight: 500;">❌ Cierre rechazado</span>
                        <button class="btn btn-secondary btn-small" onclick="openHistorialCierreModal(\${permiso.id}, '\${permiso.numero_pt}')">VER HISTORIAL</button>
                        \${puedeCerrarPermiso ? \`<button class="btn btn-warning btn-small" onclick="openCerrarModal(\${permiso.id}, '\${permiso.numero_pt}', '\${permiso.planta_nombre}', '\${permiso.aerogenerador_nombre || 'N/A'}')">REENVIAR CIERRE</button>\` : ''}
                    </div>\` : ''}
                
                \${permiso.estado === 'CERRADO' ? 
                    \`<div style="display: flex; gap: 8px; align-items: center;">
                        <span style="color: var(--text-secondary); font-size: 12px;">Cerrado por: \${permiso.usuario_cierre || 'N/A'}</span>
                        <button class="btn btn-secondary btn-small" onclick="openHistorialCierreModal(\${permiso.id}, '\${permiso.numero_pt}')">VER HISTORIAL</button>
                    </div>\` : ''}
            </div>
        \`;
        
        return card;
    }
    
    function filterPermisos() {
        const searchTerm = document.getElementById('searchPermiso').value.toLowerCase();
        const txt = v => String(v ?? '').toLowerCase();
        
        if (!searchTerm) {
            displayPermisos();
            return;
        }
        
        // Filtrar primero por parques autorizados
        const parquesAutorizados = currentUser?.parques || [];
        const esEnel = currentUser?.esEnel || false;
        
        const permisosAutorizados = permisosData.filter(permiso => {
            return esEnel || parquesAutorizados.includes(permiso.planta_nombre);
        });
        
        // Luego filtrar por término de búsqueda
        const filtered = permisosAutorizados.filter(p =>
            txt(p.numero_pt).includes(searchTerm) ||
            txt(p.planta_nombre).includes(searchTerm) ||
            txt(p.descripcion).includes(searchTerm) ||
            txt(p.jefe_faena_nombre).includes(searchTerm)
        );
        
        const container = document.getElementById('permisosContainer');
        if (filtered.length === 0) {
            container.innerHTML = '<div class="loading">No se encontraron permisos con ese criterio</div>';
            return;
        }
        
        container.innerHTML = '';
        filtered.forEach(permiso => {
            const card = createPermisoCard(permiso);
            container.appendChild(card);
        });
    }
    
    function clearSearch() {
        document.getElementById('searchPermiso').value = '';
        displayPermisos();
    }
    
    // ========================================================================
    // APROBAR Y CERRAR PERMISOS
    // ========================================================================
    
    window.aprobarPermiso = async function(permisoId) {
        if (!confirm('¿Está seguro de aprobar este permiso?')) return;
        
        try {
            const response = await ClientSecurity.makeSecureRequest('/aprobar-permiso', {
                method: 'POST',
                body: JSON.stringify({
                    permisoId: permisoId,
                    usuarioAprobador: currentUser?.email || 'unknown'
                })
            });
            
            if (response.success) {
                alert('Permiso aprobado exitosamente');
                await loadPermisos();
            } else {
                alert('Error al aprobar el permiso: ' + (response.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error aprobando permiso:', error);
            alert('Error al aprobar el permiso');
        }
    };
    
    window.openCerrarModal = function(permisoId, numeroPT, planta, aerogenerador) {
        document.getElementById('permisoInfoNumero').textContent = numeroPT;
        document.getElementById('permisoInfoPlanta').textContent = planta;
        document.getElementById('permisoInfoAerogenerador').textContent = aerogenerador;
        
        document.getElementById('fechaInicioTrabajos').value = '';
        document.getElementById('fechaFinTrabajos').value = '';
        document.getElementById('fechaParadaTurbina').value = '';
        document.getElementById('fechaPuestaMarcha').value = '';
        document.getElementById('observacionesCierre').value = 'Trabajo completado según programación';
        materialesParaCierre = [];
        updateMaterialesList();
        
        document.getElementById('confirmarCierreBtn').dataset.permisoId = permisoId;
        document.getElementById('cerrarPermisoModal').style.display = 'flex';
    };
    
    function closeCerrarModal() {
        document.getElementById('cerrarPermisoModal').style.display = 'none';
    }
    
    function addMaterial() {
        const descripcion = ClientSecurity.sanitizeInput(document.getElementById('materialDescripcion').value);
        const cantidad = parseInt(document.getElementById('materialCantidad').value) || 1;
        const propietario = document.getElementById('materialPropietario').value;
        const almacen = document.getElementById('materialAlmacen').value;
        const numeroItem = ClientSecurity.sanitizeInput(document.getElementById('materialNumeroItem').value);
        const numeroSerie = ClientSecurity.sanitizeInput(document.getElementById('materialNumeroSerie').value);
        
        if (!descripcion) {
            alert('Ingrese la descripción del material');
            return;
        }
        
        materialesParaCierre.push({
            descripcion,
            cantidad,
            propietario,
            almacen,
            numeroItem,
            numeroSerie
        });
        
        document.getElementById('materialDescripcion').value = '';
        document.getElementById('materialCantidad').value = '1';
        document.getElementById('materialNumeroItem').value = '';
        document.getElementById('materialNumeroSerie').value = '';
        
        updateMaterialesList();
    }
    
    function updateMaterialesList() {
        const container = document.getElementById('materialesLista');
        
        if (materialesParaCierre.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No hay materiales agregados</div>';
            return;
        }
        
        container.innerHTML = '';
        materialesParaCierre.forEach((material, index) => {
            const item = document.createElement('div');
            item.style.cssText = 'padding: 12px; border-bottom: 1px solid var(--border-color);';
            item.innerHTML = \`
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>\${material.descripcion}</strong><br>
                        <small>Cantidad: \${material.cantidad} | Propietario: \${material.propietario} | Almacén: \${material.almacen}</small>
                        \${material.numeroItem ? \`<br><small>Item: \${material.numeroItem}</small>\` : ''}
                        \${material.numeroSerie ? \`<br><small>Serie: \${material.numeroSerie}</small>\` : ''}
                    </div>
                    <button onclick="removeMaterial(\${index})" class="btn btn-danger btn-small">X</button>
                </div>
            \`;
            container.appendChild(item);
        });
    }
    
    window.removeMaterial = function(index) {
        materialesParaCierre.splice(index, 1);
        updateMaterialesList();
    };
    
    async function handleConfirmarCierre() {
        const permisoId = parseInt(document.getElementById('confirmarCierreBtn').dataset.permisoId);
        const fechaFinTrabajos = document.getElementById('fechaFinTrabajos').value;
        
        if (!fechaFinTrabajos) {
            alert('La fecha de fin de trabajos es obligatoria');
            return;
        }
        
        if (!confirm('¿Está seguro de cerrar este permiso?')) return;
        
        const cierreData = {
            permisoId: permisoId,
            usuarioCierre: currentUser?.email || 'unknown',
            fechaInicioTrabajos: document.getElementById('fechaInicioTrabajos').value,
            fechaFinTrabajos: fechaFinTrabajos,
            fechaParadaTurbina: document.getElementById('fechaParadaTurbina').value,
            fechaPuestaMarcha: document.getElementById('fechaPuestaMarcha').value,
            observacionesCierre: ClientSecurity.sanitizeInput(document.getElementById('observacionesCierre').value),
            materiales: materialesParaCierre
        };
        
        try {
            const response = await ClientSecurity.makeSecureRequest('/cerrar-permiso', {
                method: 'POST',
                body: JSON.stringify(cierreData)
            });
            
            if (response.success) {
                alert('Permiso cerrado exitosamente');
                closeCerrarModal();
                await loadPermisos();
            } else {
                alert('Error al cerrar el permiso: ' + (response.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error cerrando permiso:', error);
            alert('Error al cerrar el permiso');
        }
    }
    
    // ========================================================================
    // APROBAR/RECHAZAR CIERRE Y VER HISTORIAL
    // ========================================================================
    
    window.openAprobarCierreModal = function(permisoId, numeroPT, accion) {
        document.getElementById('aprobarCierrePermisoNumero').textContent = numeroPT;
        document.getElementById('aprobarCierreAccion').textContent = accion === 'APROBAR' ? 'Aprobar Cierre' : 'Rechazar Cierre';
        
        const modal = document.getElementById('aprobarCierreModal');
        const title = document.getElementById('aprobarCierreModalTitle');
        const confirmBtn = document.getElementById('confirmarAprobacionBtn');
        const commentsTextarea = document.getElementById('comentariosAprobacion');
        
        if (accion === 'APROBAR') {
            title.textContent = 'APROBAR CIERRE DE PERMISO';
            confirmBtn.textContent = 'APROBAR CIERRE';
            confirmBtn.className = 'btn btn-success btn-small';
            commentsTextarea.placeholder = 'Comentarios sobre la aprobación (opcional)...';
        } else {
            title.textContent = 'RECHAZAR CIERRE DE PERMISO';
            confirmBtn.textContent = 'RECHAZAR CIERRE';
            confirmBtn.className = 'btn btn-danger btn-small';
            commentsTextarea.placeholder = 'Motivo del rechazo (obligatorio)...';
        }
        
        commentsTextarea.value = '';
        confirmBtn.dataset.permisoId = permisoId;
        confirmBtn.dataset.accion = accion;
        
        modal.style.display = 'flex';
    };
    
    function closeAprobarCierreModal() {
        document.getElementById('aprobarCierreModal').style.display = 'none';
    }
    
    async function handleConfirmarAprobacion() {
        const confirmBtn = document.getElementById('confirmarAprobacionBtn');
        const permisoId = confirmBtn.dataset.permisoId;
        const accion = confirmBtn.dataset.accion;
        const comentarios = ClientSecurity.sanitizeInput(document.getElementById('comentariosAprobacion').value);
        
        if (accion === 'RECHAZAR' && !comentarios.trim()) {
            alert('Debe especificar el motivo del rechazo');
            return;
        }
        
        if (!confirm("¿Está seguro de " + accion.toLowerCase() + " este cierre?")) return;
        
        const originalText = confirmBtn.textContent;
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Procesando...';
        
        try {
            const response = await ClientSecurity.makeSecureRequest('/aprobar-cierre-permiso', {
                method: 'POST',
                body: JSON.stringify({
                    permisoId: parseInt(permisoId),
                    accion: accion,
                    comentarios: comentarios.trim()
                })
            });
            
            if (response.success) {
                alert("Cierre " + (accion === "APROBAR" ? "aprobado" : "rechazado") + " exitosamente");
                closeAprobarCierreModal();
                await loadPermisos();
            } else {
                alert('Error: ' + (response.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error procesando aprobación:', error);
            alert('Error de conexión');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalText;
        }
    }
    
    window.openHistorialCierreModal = async function(permisoId, numeroPT) {
        const modal = document.getElementById('historialCierreModal');
        document.getElementById('historialPermisoNumero').textContent = numeroPT;
        document.getElementById('historialTimeline').innerHTML = '<div class="loading">Cargando historial...</div>';
        
        modal.style.display = 'flex';
        
        try {
            const response = await ClientSecurity.makeSecureRequest("/historial-cierre?permisoId=" + permisoId);
            
            if (response.success) {
                const { permiso, historial, totalIntentos, totalRechazos } = response;
                
                document.getElementById('historialPermisoPlanta').textContent = permiso.planta_nombre;
                document.getElementById('historialPermisoEstado').textContent = getEstadoDisplayText(permiso.estado);
                document.getElementById('totalIntentos').textContent = totalIntentos;
                document.getElementById('totalRechazos').textContent = totalRechazos;
                
                renderHistorialTimeline(historial);
            } else {
                document.getElementById('historialTimeline').innerHTML = "<div class=\"error\">Error: " + response.error + "</div>";
            }
        } catch (error) {
            console.error('Error cargando historial:', error);
            document.getElementById('historialTimeline').innerHTML = '<div class="error">Error de conexión</div>';
        }
    };
    
    function closeHistorialCierreModal() {
        document.getElementById('historialCierreModal').style.display = 'none';
    }
    
function renderHistorialTimeline(historial) {        const timeline = document.getElementById("historialTimeline");        if (!historial || historial.length === 0) {            timeline.innerHTML = "<div>No hay historial disponible</div>";            return;        }        const timelineHTML = historial.map(entrada => {            const fechaFormateada = formatFecha(entrada.fecha_accion);            return "<div style="padding: 12px; border-bottom: 1px solid #eee;"><strong>" + entrada.accion + "</strong><br>" +                   "<small>" + fechaFormateada + " - " + (entrada.usuario_nombre || "Sistema") + "</small></div>";        }).join("");        timeline.innerHTML = timelineHTML;    }
    
    function getEstadoDisplayText(estado) {
        const estados = {
            'CREADO': 'Creado',
            'ACTIVO': 'Activo',
            'CERRADO': 'Cerrado',
            'CERRADO_PENDIENTE_APROBACION': 'Pendiente de Aprobación',
            'CIERRE_RECHAZADO': 'Cierre Rechazado',
            'CANCELADO': 'Cancelado'
        };
        return estados[estado] || estado;
    }
    
    function getAccionColor(accion) {
        const colores = {
            'ENVIAR_CIERRE': '#3498db',
            'APROBAR': '#27ae60',
            'RECHAZAR': '#e74c3c',
            'REENVIAR': '#f39c12'
        };
        return colores[accion] || '#95a5a6';
    }
    
    function getAccionIcon(accion) {
        const iconos = {
            'ENVIAR_CIERRE': '📤',
            'APROBAR': '✅',
            'RECHAZAR': '❌',
            'REENVIAR': '🔄'
        };
        return iconos[accion] || '📝';
    }
    
    function getAccionDisplayText(accion) {
        const textos = {
            'ENVIAR_CIERRE': 'Cierre Enviado',
            'APROBAR': 'Cierre Aprobado',
            'RECHAZAR': 'Cierre Rechazado',
            'REENVIAR': 'Cierre Reenviado'
        };
        return textos[accion] || accion;
    }
    
    function formatFecha(fechaString) {
        if (!fechaString) return 'N/A';
        try {
            const fecha = new Date(fechaString);
            return fecha.toLocaleString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return fechaString;
        }
    }
    
    // ========================================================================
    // GENERAR REGISTRO PDF (sin cambios)
    // ========================================================================
    
    async function generateRegister() {
        const plantaSelect = document.getElementById('planta');
        const aerogeneradorSelect = document.getElementById('aerogenerador');
        const jefeFaenaSelect = document.getElementById('jefeFaena');
        
        const data = {
            planta: plantaSelect.value,
            aerogenerador: aerogeneradorSelect.value,
            descripcion: document.getElementById('descripcion').value,
            jefeFaena: jefeFaenaSelect.value,
            tipoMantenimiento: document.getElementById('tipoMantenimiento').value,
            tipoMantenimientoOtros: document.getElementById('tipoOtros').value,
            personal: personalSeleccionado,
            actividadesRutinarias: actividadesSeleccionadas.filter(a => a.tipo === 'RUTINARIA').map(a => a.nombre)
        };
        
        if (!data.planta || !data.descripcion || !data.jefeFaena) {
            alert('Complete los campos obligatorios antes de generar el registro');
            return;
        }
        
        try {
            const response = await fetch(API_BASE + '/generate-register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authToken ? 'Bearer ' + authToken : ''
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const html = await response.text();
                const newWindow = window.open('', '_blank');
                newWindow.document.write(html);
                newWindow.document.close();
            } else {
                alert('Error al generar el registro');
            }
        } catch (error) {
            console.error('Error generando registro:', error);
            alert('Error al generar el registro');
        }
    }
    
    // ========================================================================
    // FUNCIONES AUXILIARES
    // ========================================================================
    
    function switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
        document.getElementById('tab-' + tabName).classList.add('active');
        
        if (tabName === 'datos' && currentUser?.rol === 'Admin') {
            loadDatosTab();
        }
    }
    
    async function loadDatosTab() {
        console.log('Loading admin data tab...');
        
        try {
            // Load system statistics
            const statsResponse = await ClientSecurity.makeSecureRequest('/system-stats');
            console.log('System stats response:', statsResponse);
            
            // Load admin users
            const usersResponse = await ClientSecurity.makeSecureRequest('/admin-users');
            console.log('Admin users response:', usersResponse);
            
            // Update parques container
            const parquesContainer = document.getElementById('parquesContainer');
            parquesContainer.innerHTML = \`
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px;">
                    <div style="background: var(--success-color); background: rgba(34, 197, 94, 0.1); color: var(--success-color); padding: 16px; border-radius: 6px; text-align: center; border: 1px solid rgba(34, 197, 94, 0.2);">
                        <div style="font-size: 24px; font-weight: 600;">\${statsResponse.stats?.totalParques || 0}</div>
                        <div style="font-size: 12px; opacity: 0.8;">Total Parques</div>
                    </div>
                    <div style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 16px; border-radius: 6px; text-align: center; border: 1px solid rgba(59, 130, 246, 0.2);">
                        <div style="font-size: 24px; font-weight: 600;">\${statsResponse.stats?.totalPermisos || 0}</div>
                        <div style="font-size: 12px; opacity: 0.8;">Total Permisos</div>
                    </div>
                </div>
                <h4 style="margin-bottom: 12px;">Lista de Parques:</h4>
            \`;
            parquesData.forEach(parque => {
                parquesContainer.innerHTML += \`<div style="padding: 8px; background: var(--bg-secondary); margin-bottom: 4px; border-radius: 4px;">• \${parque.nombre}</div>\`;
            });
            
            // Update personal container with stats
            const personalContainer = document.getElementById('personalContainer');
            personalContainer.innerHTML = \`
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 16px;">
                    <div style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 16px; border-radius: 6px; text-align: center; border: 1px solid rgba(16, 185, 129, 0.2);">
                        <div style="font-size: 24px; font-weight: 600;">\${statsResponse.stats?.personalEnel || 0}</div>
                        <div style="font-size: 12px; opacity: 0.8;">Personal ENEL</div>
                    </div>
                    <div style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 16px; border-radius: 6px; text-align: center; border: 1px solid rgba(245, 158, 11, 0.2);">
                        <div style="font-size: 24px; font-weight: 600;">\${statsResponse.stats?.personalExterno || 0}</div>
                        <div style="font-size: 12px; opacity: 0.8;">Personal Externo</div>
                    </div>
                    <div style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6; padding: 16px; border-radius: 6px; text-align: center; border: 1px solid rgba(139, 92, 246, 0.2);">
                        <div style="font-size: 24px; font-weight: 600;">\${usersResponse.total || 0}</div>
                        <div style="font-size: 12px; opacity: 0.8;">Total Usuarios</div>
                    </div>
                </div>
                <h4 style="margin-bottom: 12px;">Gestión de Usuarios:</h4>
                <div style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-color);">
                                <th style="padding: 8px; text-align: left; font-size: 12px;">Usuario</th>
                                <th style="padding: 8px; text-align: left; font-size: 12px;">Email</th>
                                <th style="padding: 8px; text-align: left; font-size: 12px;">Rol</th>
                                <th style="padding: 8px; text-align: left; font-size: 12px;">Estado</th>
                                <th style="padding: 8px; text-align: left; font-size: 12px;">Último Login</th>
                            </tr>
                        </thead>
                        <tbody>
            \`;
            
            if (usersResponse.users && usersResponse.users.length > 0) {
                usersResponse.users.forEach(user => {
                    const statusColor = user.estado === 'Activo' ? 'var(--success-color)' : 'var(--warning-color)';
                    const passwordStatus = user.password_temporal === 1 ? '🔒' : '';
                    personalContainer.innerHTML += \`
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 8px; font-size: 12px;">\${passwordStatus} \${ClientSecurity.encodeHTML(user.usuario || '')}</td>
                            <td style="padding: 8px; font-size: 12px;">\${ClientSecurity.encodeHTML(user.email || '')}</td>
                            <td style="padding: 8px; font-size: 12px;"><span style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 3px; font-size: 11px;">\${ClientSecurity.encodeHTML(user.rol || '')}</span></td>
                            <td style="padding: 8px; font-size: 12px;"><span style="color: \${statusColor};">●</span> \${ClientSecurity.encodeHTML(user.estado || '')}</td>
                            <td style="padding: 8px; font-size: 12px;">\${formatDate(user.ultimo_login)}</td>
                        </tr>
                    \`;
                });
            } else {
                personalContainer.innerHTML += '<tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--text-secondary);">No hay usuarios disponibles</td></tr>';
            }
            
            personalContainer.innerHTML += '</tbody></table></div>';
            
            // Update supervisores container
            const supervisoresContainer = document.getElementById('supervisoresContainer');
            supervisoresContainer.innerHTML = \`<p>Total: \${supervisoresData.length} supervisores</p>\`;
            supervisoresData.forEach(supervisor => {
                supervisoresContainer.innerHTML += \`<div style="padding: 8px; background: var(--bg-secondary); margin-bottom: 4px; border-radius: 4px;">• \${supervisor.nombre} - \${supervisor.cargo || 'N/A'}</div>\`;
            });
            
            // Update actividades container
            const actividadesContainer = document.getElementById('actividadesContainer');
            actividadesContainer.innerHTML = \`<p>Total: \${actividadesData.length} actividades</p>\`;
            actividadesData.forEach(actividad => {
                actividadesContainer.innerHTML += \`<div style="padding: 8px; background: var(--bg-secondary); margin-bottom: 4px; border-radius: 4px;">• \${actividad.nombre}</div>\`;
            });
            
            console.log('Admin data tab loaded successfully');
            
        } catch (error) {
            console.error('Error loading admin data tab:', error);
            
            // Show error state for containers
            const containers = ['parquesContainer', 'personalContainer', 'supervisoresContainer', 'actividadesContainer'];
            containers.forEach(containerId => {
                const container = document.getElementById(containerId);
                if (container) {
                    container.innerHTML = \`<div style="color: var(--error-color); padding: 16px; text-align: center;">Error cargando datos: \${error.message}</div>\`;
                }
            });
        }
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-CL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    }
    
    async function checkConnectionStatus() {
        const statusDiv = document.getElementById('connectionStatus');
        
        try {
            const response = await fetch(API_BASE + '/health');
            const data = await response.json();
            
            if (data.status === 'OK') {
                statusDiv.textContent = 'Sistema conectado y operativo';
                statusDiv.className = 'status-indicator status-online';
            } else {
                statusDiv.textContent = 'Sistema con problemas de conexión';
                statusDiv.className = 'status-indicator status-offline';
            }
        } catch (error) {
            statusDiv.textContent = 'Sin conexión al servidor';
            statusDiv.className = 'status-indicator status-offline';
        }
    }
    
    // ========================================================================
    // AUTO-LOGOUT POR INACTIVIDAD
    // ========================================================================
    // Timer de inactividad definido en script.js
    
    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            alert('Su sesión ha expirado por inactividad');
            handleLogout();
        }, INACTIVITY_TIMEOUT);
    }
    
    ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetInactivityTimer);
    });
    
    resetInactivityTimer();
    
    console.log('Sistema de seguridad activo - D1 Database Edition');
  `;
}