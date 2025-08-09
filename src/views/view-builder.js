// ========================================================================
// VIEW BUILDER - MÓDULO PARA ENSAMBLAR VISTAS
// ========================================================================

import { getSecurityHeaders } from '../utils/helpers.js';

export class ViewBuilder {
  constructor() {
    this.htmlTemplate = null;
    this.cssContent = null;
    this.jsContent = null;
  }

  // Cargar template HTML
  getHTMLTemplate() {
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
    <style>{{CSS_CONTENT}}</style>
</head>
<body>
    <div class="container">
        <!-- Pantalla de Login -->
        <div id="loginScreen" class="login-container">
            <div class="logo">
                <h1>PT WIND</h1>
                <p>Sistema de Gestión de Permisos de Trabajo</p>
            </div>
            
            <form id="loginForm">
                <div class="form-group">
                    <label for="usuario">Usuario / Email</label>
                    <input type="text" id="usuario" required placeholder="Ingrese su usuario o email" autocomplete="username">
                </div>
                
                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <input type="password" id="password" required placeholder="Ingrese su contraseña" autocomplete="current-password">
                </div>
                
                <button type="submit" class="btn" id="loginBtn">Iniciar Sesión</button>
                
                <div id="loginError" class="error" style="display: none; margin-top: 16px;"></div>
            </form>
            
            <div id="connectionStatus" class="status-indicator status-offline" style="margin-top: 24px; text-align: center;">
                Verificando conexión...
            </div>
        </div>
        
        <!-- Aplicación Principal -->
        <div id="appScreen" class="app-container">
            <div class="header">
                <div>
                    <h1>PT WIND</h1>
                    <p>Sistema de Gestión de Permisos de Trabajo</p>
                </div>
                
                <div style="display: flex; align-items: center; gap: 16px;">
                    <span id="userDisplay"></span>
                    <button id="logoutBtn" class="btn btn-secondary btn-small">CERRAR SESIÓN</button>
                </div>
            </div>
            
            <div class="tabs">
                <button class="tab active" data-tab="nuevo">Nuevo Permiso</button>
                <button class="tab" data-tab="consultar">Consultar Permisos</button>
                <button class="tab" data-tab="matriz">Matriz de Riesgos</button>
                <button class="tab" data-tab="datos" id="tabDatos" style="display: none;">Datos del Sistema</button>
            </div>
            
            <!-- Tab: Nuevo Permiso -->
            <div id="tab-nuevo" class="tab-content active">
                <form id="permisoForm">
                    <div class="grid-three">
                        <!-- Columna 1: Antecedentes Generales -->
                        <div class="card">
                            <h3>Antecedentes Generales</h3>
                            
                            <div class="form-group">
                                <label for="planta">Planta *</label>
                                <select id="planta" required>
                                    <option value="">Seleccionar planta...</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="aerogenerador">Aerogenerador *</label>
                                <select id="aerogenerador" required>
                                    <option value="">Seleccionar aerogenerador...</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="descripcion">Descripción de Actividades *</label>
                                <textarea id="descripcion" rows="4" required placeholder="Describa las actividades a realizar..."></textarea>
                            </div>
                        </div>
                        
                        <!-- Columna 2: Responsables -->
                        <div class="card">
                            <h3>Responsables</h3>
                            
                            <div class="form-group">
                                <label for="jefeFaena">Jefe de Faena *</label>
                                <select id="jefeFaena" required>
                                    <option value="">Seleccionar jefe de faena...</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="supervisorParque">Supervisor de Parque</label>
                                <select id="supervisorParque">
                                    <option value="">Seleccionar supervisor de parque...</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="tipoMantenimiento">Tipo de Mantenimiento *</label>
                                <select id="tipoMantenimiento" required>
                                    <option value="">Seleccionar tipo...</option>
                                    <option value="PREVENTIVO">Mantenimiento Preventivo</option>
                                    <option value="CORRECTIVO">Pequeño Correctivo</option>
                                    <option value="GRAN_CORRECTIVO">Gran Correctivo</option>
                                    <option value="PREDICTIVO">Mantenimiento Predictivo</option>
                                    <option value="INSPECCION">Inspección Técnica</option>
                                    <option value="OTROS">Otros</option>
                                </select>
                            </div>
                            
                            <div class="form-group input-others" id="tipoOtrosContainer">
                                <label for="tipoOtros">Especificar Tipo *</label>
                                <input type="text" id="tipoOtros" placeholder="Especifique el tipo de mantenimiento...">
                            </div>
                        </div>
                        
                        <!-- Columna 3: Actividades -->
                        <div class="card">
                            <h3>Actividades Rutinarias</h3>
                            
                            <div class="form-group">
                                <label>Seleccione las Actividades</label>
                                <div id="actividadesChecklist" class="checkbox-list">
                                    <div class="loading">Cargando actividades...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Personal Asignado - Fila completa -->
                    <div class="card" style="margin-top: 24px;">
                        <h3>Personal Asignado</h3>
                        
                        <div class="selector-dual">
                            <div>
                                <label style="display: block; margin-bottom: 12px; font-weight: 600; color: var(--text-primary); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Personal Disponible</label>
                                <div id="personalDisponible" class="selector-list">
                                    <div class="loading">Seleccione una planta primero</div>
                                </div>
                            </div>
                            
                            <div class="selector-controls">
                                <button type="button" class="btn btn-secondary btn-small" id="addPersonalBtn">→</button>
                                <button type="button" class="btn btn-secondary btn-small" id="removePersonalBtn">←</button>
                            </div>
                            
                            <div>
                                <label style="display: block; margin-bottom: 12px; font-weight: 600; color: var(--text-primary); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Personal Seleccionado</label>
                                <div id="personalSeleccionado" class="selector-list">
                                    <div style="padding: 20px; text-align: center; color: var(--text-secondary);">No hay personal seleccionado</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 32px; display: flex; gap: 16px; flex-wrap: wrap;">
                        <button type="submit" class="btn" style="flex: 1; min-width: 200px;">CREAR PERMISO DE TRABAJO</button>
                        <button type="button" id="generateRegisterBtn" class="btn btn-secondary" style="flex: 1; min-width: 200px;">GENERAR REGISTRO PDF</button>
                    </div>
                </form>
            </div>
            
            <!-- Tab: Consultar -->
            <div id="tab-consultar" class="tab-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h3 style="color: var(--primary-color); font-size: 18px; font-weight: 600;">Consultar Permisos de Trabajo</h3>
                    <button id="refreshPermisosBtn" class="btn btn-secondary btn-small">ACTUALIZAR</button>
                </div>
                <div class="search-box">
                    <input type="text" id="searchPermiso" class="search-input" placeholder="Buscar por número de permiso, planta, descripción...">
                    <button id="clearSearchBtn" class="btn btn-secondary btn-small">LIMPIAR</button>
                </div>
                <div id="permisosContainer" class="loading">
                    Cargando permisos...
                </div>
            </div>
            
            <!-- Tab: Matriz de Riesgos -->
            <div id="tab-matriz" class="tab-content">
                <h3 style="color: var(--primary-color); font-size: 18px; font-weight: 600; margin-bottom: 16px;">Matriz de Riesgos</h3>
                <p style="margin-bottom: 24px; color: var(--text-secondary); font-size: 14px;">Seleccione actividades en la pestaña "Nuevo Permiso" para ver la matriz de riesgos aplicable.</p>
                <div id="matrizContainer">
                    <div id="matrizTable" class="data-table" style="display: none;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Actividad</th>
                                    <th>Peligro</th>
                                    <th>Riesgo</th>
                                    <th>Medidas Preventivas</th>
                                </tr>
                            </thead>
                            <tbody id="matrizTableBody">
                            </tbody>
                        </table>
                    </div>
                    <div id="matrizEmptyState" class="loading">
                        Seleccione actividades para ver la matriz de riesgos...
                    </div>
                </div>
            </div>
            
            <!-- Tab: Datos del Sistema -->
            <div id="tab-datos" class="tab-content">
                <div style="display: flex; flex-direction: column; gap: 24px;">
                    <div class="card">
                        <h3>Parques Eólicos</h3>
                        <div id="parquesContainer" class="loading">Cargando parques...</div>
                    </div>
                    
                    <div class="card">
                        <h3>Personal</h3>
                        <div id="personalContainer" class="loading">Cargando personal...</div>
                    </div>
                    
                    <div class="card">
                        <h3>Supervisores</h3>
                        <div id="supervisoresContainer" class="loading">Cargando supervisores...</div>
                    </div>
                    
                    <div class="card">
                        <h3>Actividades</h3>
                        <div id="actividadesContainer" class="loading">Cargando actividades...</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>{{JS_CONTENT}}</script>
</body>
</html>`;
  }

  // Cargar CSS
  getCSSContent() {
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

  // Cargar JavaScript
  getJSContent() {
    return `
console.log('PT Wind v19.0 - Modular Architecture Edition');

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

class ClientSecurity {
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\\w+\\s*=/gi, '')
      .trim();
  }
  
  static encodeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  static async makeSecureRequest(endpoint, options = {}) {
    const url = API_BASE + '/' + endpoint;
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': crypto.randomUUID(),
        ...options.headers
      },
      ...options
    };
    
    if (authToken) {
      config.headers['Authorization'] = \`Bearer \${authToken}\`;
    }
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(\`Request to \${endpoint} failed:\`, error);
      throw error;
    }
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
    const usuario = ClientSecurity.sanitizeInput(document.getElementById('usuario').value);
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
      currentUser = data.user;
      
      if (data.requirePasswordChange) {
        showChangePasswordModal();
      } else {
        showApp();
        await loadInitialData();
      }
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

function showChangePasswordModal() {
  console.log('Cambio de contraseña requerido');
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'block';
  
  const userDisplay = document.getElementById('userDisplay');
  userDisplay.textContent = \`\${currentUser.nombre} (\${currentUser.empresa})\`;
  
  if (currentUser.rol === 'ADMIN') {
    document.getElementById('tabDatos').style.display = 'block';
  }
}

function logout() {
  authToken = null;
  currentUser = null;
  sessionId = null;
  
  document.getElementById('appScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'block';
  
  document.getElementById('loginForm').reset();
  
  parquesData = [];
  personalData = [];
  personalByParque = {};
  personalSeleccionado = [];
  actividadesSeleccionadas = [];
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  document.getElementById(\`tab-\${tabName}\`).classList.add('active');
  document.querySelector(\`[data-tab="\${tabName}"]\`).classList.add('active');
  
  if (tabName === 'consultar') {
    loadPermisos();
  } else if (tabName === 'datos') {
    loadSystemData();
  }
}

async function loadInitialData() {
  try {
    await Promise.all([
      loadParques(),
      loadActividades(),
      loadMatrizRiesgos()
    ]);
    
    console.log('Datos iniciales cargados correctamente');
  } catch (error) {
    console.error('Error cargando datos iniciales:', error);
    showError('Error cargando datos del sistema');
  }
}

async function loadParques() {
  try {
    const response = await ClientSecurity.makeSecureRequest('parques');
    parquesData = response.data || [];
    
    const plantaSelect = document.getElementById('planta');
    plantaSelect.innerHTML = '<option value="">Seleccionar planta...</option>';
    
    parquesData.forEach(parque => {
      const option = document.createElement('option');
      option.value = parque.id;
      option.textContent = parque.nombre;
      plantaSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error cargando parques:', error);
  }
}

async function loadAerogeneradores(parqueId) {
  try {
    const response = await ClientSecurity.makeSecureRequest(\`aerogeneradores?parque_id=\${parqueId}\`);
    aerogeneradoresData = response.data || [];
    
    const aerogeneradorSelect = document.getElementById('aerogenerador');
    aerogeneradorSelect.innerHTML = '<option value="">Seleccionar aerogenerador...</option>';
    
    aerogeneradoresData.forEach(aero => {
      const option = document.createElement('option');
      option.value = aero.id;
      option.textContent = aero.nombre;
      aerogeneradorSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error cargando aerogeneradores:', error);
  }
}

async function loadActividades() {
  try {
    const response = await ClientSecurity.makeSecureRequest('actividades');
    actividadesData = response.data || [];
    
    const container = document.getElementById('actividadesChecklist');
    container.innerHTML = '';
    
    actividadesData.forEach(actividad => {
      const item = document.createElement('div');
      item.className = 'checkbox-item';
      item.innerHTML = \`
        <input type="checkbox" id="actividad_\${actividad.id}" value="\${actividad.id}">
        <label for="actividad_\${actividad.id}">\${ClientSecurity.encodeHTML(actividad.nombre)}</label>
      \`;
      
      item.querySelector('input').addEventListener('change', handleActividadChange);
      container.appendChild(item);
    });
  } catch (error) {
    console.error('Error cargando actividades:', error);
    document.getElementById('actividadesChecklist').innerHTML = 
      '<div class="loading">Error cargando actividades</div>';
  }
}

async function loadMatrizRiesgos() {
  try {
    const response = await ClientSecurity.makeSecureRequest('matriz-riesgos');
    matrizRiesgosData = response.data || [];
  } catch (error) {
    console.error('Error cargando matriz de riesgos:', error);
  }
}

function handleActividadChange(event) {
  const actividadId = event.target.value;
  
  if (event.target.checked) {
    if (!actividadesSeleccionadas.includes(actividadId)) {
      actividadesSeleccionadas.push(actividadId);
    }
  } else {
    const index = actividadesSeleccionadas.indexOf(actividadId);
    if (index > -1) {
      actividadesSeleccionadas.splice(index, 1);
    }
  }
  
  updateMatrizRiesgos();
}

function updateMatrizRiesgos() {
  matrizRiesgosSeleccionada = matrizRiesgosData.filter(riesgo => 
    actividadesSeleccionadas.includes(riesgo.actividad_id)
  );
  
  const matrizTable = document.getElementById('matrizTable');
  const matrizEmpty = document.getElementById('matrizEmptyState');
  const tbody = document.getElementById('matrizTableBody');
  
  if (matrizRiesgosSeleccionada.length > 0) {
    tbody.innerHTML = '';
    
    matrizRiesgosSeleccionada.forEach(riesgo => {
      const row = document.createElement('tr');
      row.innerHTML = \`
        <td>\${ClientSecurity.encodeHTML(riesgo.codigo || 'N/A')}</td>
        <td>\${ClientSecurity.encodeHTML(riesgo.actividad)}</td>
        <td>\${ClientSecurity.encodeHTML(riesgo.peligro)}</td>
        <td>\${ClientSecurity.encodeHTML(riesgo.riesgo)}</td>
        <td>\${ClientSecurity.encodeHTML(riesgo.medidas_preventivas)}</td>
      \`;
      tbody.appendChild(row);
    });
    
    matrizTable.style.display = 'block';
    matrizEmpty.style.display = 'none';
  } else {
    matrizTable.style.display = 'none';
    matrizEmpty.style.display = 'block';
  }
}

function showError(message) {
  let errorDiv = document.querySelector('.global-error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'error global-error';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.right = '20px';
    errorDiv.style.zIndex = '9999';
    errorDiv.style.maxWidth = '400px';
    document.body.appendChild(errorDiv);
  }
  
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

function showSuccess(message) {
  let successDiv = document.querySelector('.global-success');
  if (!successDiv) {
    successDiv = document.createElement('div');
    successDiv.className = 'success global-success';
    successDiv.style.position = 'fixed';
    successDiv.style.top = '20px';
    successDiv.style.right = '20px';
    successDiv.style.zIndex = '9999';
    successDiv.style.maxWidth = '400px';
    document.body.appendChild(successDiv);
  }
  
  successDiv.textContent = message;
  successDiv.style.display = 'block';
  
  setTimeout(() => {
    successDiv.style.display = 'none';
  }, 3000);
}

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
    statusEl.textContent = '❌ Sin conexión - Modo offline';
    statusEl.className = 'status-indicator status-offline';
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Inicializando PT Wind...');
  
  await checkConnectivity();
  
  const addListener = (id, ev, fn, opts) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(ev, fn, opts); 
  };
  
  addListener('loginForm', 'submit', handleLogin);
  
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
  });
  
  addListener('logoutBtn', 'click', logout);
  
  addListener('planta', 'change', (e) => {
    if (e.target.value) {
      loadAerogeneradores(e.target.value);
    }
  });
  
  const search = document.getElementById('searchPermiso');
  if (search) search.addEventListener('input', filterPermisos);
  
  setInterval(checkConnectivity, 30000);
  
  console.log('PT Wind inicializado correctamente');
});

async function loadPermisos() {
  console.log('Cargando permisos...');
}

async function loadSystemData() {
  console.log('Cargando datos del sistema...');
}

function filterPermisos() {
  console.log('Filtrando permisos...');
}
`;
  }

  // Ensamblar la aplicación completa
  buildApp() {
    const template = this.getHTMLTemplate();
    const css = this.getCSSContent();
    const js = this.getJSContent();

    return template
      .replace('{{CSS_CONTENT}}', css)
      .replace('{{JS_CONTENT}}', js);
  }

  // Crear respuesta HTTP con headers de seguridad
  createResponse(corsHeaders) {
    const html = this.buildApp();
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=86400',
        ...corsHeaders,
        ...getSecurityHeaders()
      }
    });
  }
}