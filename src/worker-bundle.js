/**
 * PT_Wind - PWA para Permisos de Trabajo en Parques Eólicos
 * Versión 19.0 - MODULAR BUNDLED EDITION
 * 
 * Worker con módulos integrados sin ES6 imports para compatibilidad con Cloudflare
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
};

// ============================================================================
// CLASES DE SEGURIDAD
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
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function getSecurityHeaders() {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self'",
      "manifest-src 'self' data:",
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
// VISTA COMPLETA (HTML + CSS + JS)
// ============================================================================

function getCompleteApp() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PT Wind - Sistema de Gestión de Permisos</title>
    <link rel="manifest" href="data:application/json;base64,eyJuYW1lIjoiUFQgV2luZCAtIFBlcm1pc29zIGRlIFRyYWJham8iLCJzaG9ydF9uYW1lIjoiUFQgV2luZCIsInN0YXJ0X3VybCI6Ii8iLCJkaXNwbGF5Ijoic3RhbmRhbG9uZSIsImJhY2tncm91bmRfY29sb3IiOiIjZmZmZmZmIiwidGhlbWVfY29sb3IiOiIjMWExZjJlIiwiaWNvbnMiOlt7InNyYyI6ImRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QjNhV1IwYUQwaU1USTRJaUJvWldsbmFIUTlJakV5T0NJZ2RtbGxkMEp2ZUQwaU1DQXdJREV5T0NBeU9EZ2lJSGh0Ykc1elBTSm9kSFJ3T2k4dmQzZDNMbmN6TG05eVp5OHlNREF3TDNOMlp5SStQSEpsWTNRZ2VEMGlOQ0lnZVQwaU5DSWdkMmxrZEdnOUlqRXlNQ0lnYUdWcFoyaDBQU0l4TWpBaUlHWnBiR3c5SWlNeFlURm1NbVVpTHo0OEwzTjJaejQ9IiwidHlwZSI6ImltYWdlL3N2Zyt4bWwiLCJzaXplcyI6IjEyOHgxMjgifV19">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --primary-color: #1a1f2e;
            --secondary-color: #2c3e50;
            --accent-color: #3498db;
            --success-color: #27ae60;
            --warning-color: #f39c12;
            --danger-color: #e74c3c;
            --text-primary: #2c3e50;
            --text-secondary: #7f8c8d;
            --bg-primary: #ffffff;
            --bg-secondary: #f8f9fa;
            --border-color: #dfe6e9;
            --shadow-lg: 0 8px 24px rgba(0,0,0,0.15);
            --radius-lg: 8px;
        }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-primary);
        }
        .container { width: 100%; max-width: 1400px; margin: 0 auto; padding: 20px; }
        .login-container {
            background: var(--bg-primary);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            padding: 48px;
            max-width: 420px;
            margin: 0 auto;
            border-top: 4px solid var(--primary-color);
        }
        .logo { text-align: center; margin-bottom: 36px; }
        .logo h1 { color: var(--primary-color); font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .logo p { color: var(--text-secondary); font-size: 14px; }
        .form-group { margin-bottom: 20px; }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--text-primary);
            font-size: 13px;
            text-transform: uppercase;
        }
        .form-group input {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.2s ease;
        }
        .form-group input:focus {
            outline: none;
            border-color: var(--accent-color);
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }
        .btn {
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 100%;
            text-transform: uppercase;
        }
        .btn:hover:not(:disabled) {
            background: var(--secondary-color);
            transform: translateY(-1px);
        }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .error {
            background: rgba(231, 76, 60, 0.1);
            color: var(--danger-color);
            padding: 16px 20px;
            border-radius: 6px;
            border: 1px solid rgba(231, 76, 60, 0.2);
            font-size: 14px;
        }
        .status-indicator {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
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
    </style>
</head>
<body>
    <div class="container">
        <div id="loginScreen" class="login-container">
            <div class="logo">
                <h1>PT WIND</h1>
                <p>Sistema de Gestión de Permisos de Trabajo</p>
                <p style="margin-top: 16px; font-size: 12px; color: var(--accent-color);">
                    ✅ Arquitectura Modular v19.0
                </p>
            </div>
            
            <form id="loginForm">
                <div class="form-group">
                    <label for="usuario">Usuario / Email</label>
                    <input type="text" id="usuario" required placeholder="Ingrese su usuario o email">
                </div>
                
                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <input type="password" id="password" required placeholder="Ingrese su contraseña">
                </div>
                
                <button type="submit" class="btn" id="loginBtn">Iniciar Sesión</button>
                
                <div id="loginError" class="error" style="display: none; margin-top: 16px;"></div>
            </form>
            
            <div id="connectionStatus" class="status-indicator status-offline" style="margin-top: 24px; text-align: center;">
                Verificando conexión...
            </div>
        </div>
    </div>
    
    <script>
        console.log('PT Wind v19.0 - Modular Bundle Edition');
        
        const API_BASE = window.location.origin + '/api';
        let authToken = null;
        
        async function checkConnectivity() {
            const statusEl = document.getElementById('connectionStatus');
            
            try {
                const response = await fetch(API_BASE + '/health');
                const data = await response.json();
                
                if (data.status === 'ok') {
                    statusEl.textContent = '✅ Conectado - Sistema operativo';
                    statusEl.className = 'status-indicator status-online';
                } else {
                    throw new Error('Sistema no disponible');
                }
            } catch (error) {
                statusEl.textContent = '❌ Sin conexión - Verificando...';
                statusEl.className = 'status-indicator status-offline';
                console.error('Health check failed:', error);
            }
        }
        
        async function handleLogin(event) {
            event.preventDefault();
            
            const loginBtn = document.getElementById('loginBtn');
            const errorDiv = document.getElementById('loginError');
            
            loginBtn.disabled = true;
            loginBtn.textContent = 'Verificando...';
            errorDiv.style.display = 'none';
            
            try {
                const usuario = document.getElementById('usuario').value.trim();
                const password = document.getElementById('password').value;
                
                if (!usuario || !password) {
                    throw new Error('Usuario y contraseña son requeridos');
                }
                
                const response = await fetch(API_BASE + '/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    authToken = data.token;
                    showApp(data.user);
                } else {
                    throw new Error(data.error || 'Error de autenticación');
                }
                
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Iniciar Sesión';
            }
        }
        
        function showApp(user) {
            // Ocultar login y mostrar app
            document.getElementById('loginScreen').style.display = 'none';
            
            // Crear la interfaz principal de la aplicación
            document.body.innerHTML = \`
                <div class="container">
                    <div class="app-container">
                        <div class="header">
                            <div>
                                <h1>PT WIND</h1>
                                <p>Sistema de Gestión de Permisos de Trabajo</p>
                                <small style="color: rgba(255,255,255,0.7);">v19.0 Modular</small>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <span style="color: white;">\${user.nombre} (\${user.rol})</span>
                                <button id="logoutBtn" class="btn btn-secondary btn-small">CERRAR SESIÓN</button>
                            </div>
                        </div>
                        
                        <div class="tabs">
                            <button class="tab active" data-tab="nuevo">Nuevo Permiso</button>
                            <button class="tab" data-tab="consultar">Consultar Permisos</button>
                            <button class="tab" data-tab="datos">Datos del Sistema</button>
                        </div>
                        
                        <div id="tab-nuevo" class="tab-content active">
                            <h3 style="color: var(--primary-color); margin-bottom: 24px;">Crear Nuevo Permiso de Trabajo</h3>
                            
                            <div class="grid-container">
                                <div class="card">
                                    <h4>Antecedentes Generales</h4>
                                    <div class="form-group">
                                        <label>Planta</label>
                                        <select>
                                            <option>Seleccionar planta...</option>
                                            <option>Parque Los Cururos</option>
                                            <option>Parque La Estrella</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Aerogenerador</label>
                                        <select>
                                            <option>Seleccionar aerogenerador...</option>
                                            <option>WTG-001</option>
                                            <option>WTG-002</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Descripción</label>
                                        <textarea rows="3" placeholder="Describa las actividades a realizar..."></textarea>
                                    </div>
                                </div>
                                
                                <div class="card">
                                    <h4>Responsables</h4>
                                    <div class="form-group">
                                        <label>Jefe de Faena</label>
                                        <select>
                                            <option>Seleccionar jefe de faena...</option>
                                            <option>Juan Pérez - Contratista A</option>
                                            <option>María González - Contratista B</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Tipo de Mantenimiento</label>
                                        <select>
                                            <option>Mantenimiento Preventivo</option>
                                            <option>Mantenimiento Correctivo</option>
                                            <option>Inspección Técnica</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="margin-top: 32px;">
                                <button class="btn" onclick="createPermiso()">CREAR PERMISO DE TRABAJO</button>
                            </div>
                        </div>
                        
                        <div id="tab-consultar" class="tab-content">
                            <h3 style="color: var(--primary-color); margin-bottom: 24px;">Consultar Permisos</h3>
                            <div class="search-container">
                                <input type="text" placeholder="Buscar permisos..." class="search-input">
                                <button class="btn btn-secondary">BUSCAR</button>
                            </div>
                            <div class="permisos-list">
                                <div class="permiso-item">
                                    <strong>PT-2024-001</strong> - Mantenimiento Preventivo WTG-001
                                    <br><small>Los Cururos - Estado: ACTIVO</small>
                                </div>
                                <div class="permiso-item">
                                    <strong>PT-2024-002</strong> - Inspección Técnica WTG-002  
                                    <br><small>La Estrella - Estado: CERRADO</small>
                                </div>
                            </div>
                        </div>
                        
                        <div id="tab-datos" class="tab-content">
                            <h3 style="color: var(--primary-color); margin-bottom: 24px;">Datos del Sistema</h3>
                            <div class="system-info">
                                <div class="card">
                                    <h4>Estado del Sistema</h4>
                                    <p>✅ Conexión a base de datos: OK</p>
                                    <p>✅ Servicios API: Funcionando</p>
                                    <p>✅ Arquitectura: Modular v19.0</p>
                                </div>
                                <div class="card">
                                    <h4>Estadísticas</h4>
                                    <p>📊 Permisos activos: 15</p>
                                    <p>📈 Permisos este mes: 45</p>
                                    <p>👥 Usuarios conectados: 8</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <style>
                    .app-container {
                        background: var(--bg-primary);
                        border-radius: var(--radius-lg);
                        box-shadow: var(--shadow-lg);
                        overflow: hidden;
                    }
                    .header {
                        background: var(--primary-color);
                        color: white;
                        padding: 24px 32px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .tabs {
                        background: var(--bg-secondary);
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
                        color: var(--text-secondary);
                    }
                    .tab:hover {
                        background: var(--bg-primary);
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
                    }
                    .tab-content.active {
                        display: block;
                    }
                    .grid-container {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 24px;
                        margin-bottom: 24px;
                    }
                    .card {
                        background: var(--bg-secondary);
                        padding: 20px;
                        border-radius: 8px;
                        border: 1px solid var(--border-color);
                    }
                    .card h4 {
                        color: var(--primary-color);
                        margin-bottom: 16px;
                        font-size: 16px;
                    }
                    .form-group select, .form-group textarea {
                        width: 100%;
                        padding: 8px 12px;
                        border: 1px solid var(--border-color);
                        border-radius: 4px;
                        font-size: 14px;
                    }
                    .btn-secondary {
                        background: var(--secondary-color);
                        color: white;
                    }
                    .btn-small {
                        padding: 8px 16px;
                        font-size: 12px;
                        width: auto;
                    }
                    .search-container {
                        display: flex;
                        gap: 12px;
                        margin-bottom: 24px;
                    }
                    .search-input {
                        flex: 1;
                        padding: 10px 16px;
                        border: 1px solid var(--border-color);
                        border-radius: 6px;
                    }
                    .permisos-list {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .permiso-item {
                        background: var(--bg-secondary);
                        padding: 16px;
                        border-radius: 6px;
                        border: 1px solid var(--border-color);
                    }
                    .system-info {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 24px;
                    }
                </style>
            \`;
            
            // Configurar event listeners
            setupAppEventListeners();
        }
        
        function setupAppEventListeners() {
            // Tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    // Remover active de todos los tabs
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
                    
                    // Activar el tab clickeado
                    e.target.classList.add('active');
                    const tabName = e.target.dataset.tab;
                    document.getElementById(\`tab-\${tabName}\`).classList.add('active');
                });
            });
            
            // Logout
            document.getElementById('logoutBtn').addEventListener('click', () => {
                authToken = null;
                location.reload();
            });
        }
        
        function createPermiso() {
            alert('✅ Función crear permiso - Se conectaría con la API completa');
        }
        
        document.addEventListener('DOMContentLoaded', async function() {
            await checkConnectivity();
            
            document.getElementById('loginForm').addEventListener('submit', handleLogin);
            
            // Verificar conectividad cada 30 segundos
            setInterval(checkConnectivity, 30000);
            
            console.log('PT Wind modular inicializado correctamente');
        });
    </script>
</body>
</html>`;
}

// ============================================================================
// MANEJO DE API SIMPLE
// ============================================================================

async function handleApiRequest(request, corsHeaders, env, services) {
  const { rateLimiter, authService } = services;
  const url = new URL(request.url);
  const endpoint = url.pathname.replace('/api/', '');
  
  try {
    switch (endpoint) {
      case 'health':
        return new Response(JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          version: '19.0-modular'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
        
      case 'login':
        if (request.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        // Simulación básica de login para testing
        try {
          const data = await request.json();
          const { usuario, password } = InputSanitizer.sanitizeObject(data);
          
          // Login básico para testing
          if (usuario && password) {
            return new Response(JSON.stringify({
              success: true,
              message: 'Login exitoso',
              token: 'demo-token-123',
              user: { nombre: usuario, rol: 'USER' }
            }), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          } else {
            throw new Error('Credenciales inválidas');
          }
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Credenciales inválidas'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
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
// WORKER PRINCIPAL
// ============================================================================

const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Inicializar servicios de seguridad
    const rateLimiter = new RateLimiter(env);
    const authService = new AuthService(env);
    
    const corsHeaders = getCorsHeaders(env, request);
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Rate limiting global
      const clientIp = request.headers.get('CF-Connecting-IP') || 
                      request.headers.get('X-Forwarded-For') || 
                      'unknown';
      
      await rateLimiter.check(clientIp, 'api');
      
      // Manejar API
      if (path.startsWith('/api/')) {
        return await handleApiRequest(request, corsHeaders, env, {
          rateLimiter,
          authService
        });
      }
      
      // Servir app
      return new Response(getCompleteApp(), {
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
            ...corsHeaders
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
          ...corsHeaders
        }
      });
    }
  }
};

export default worker;