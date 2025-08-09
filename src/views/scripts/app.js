// ========================================================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ========================================================================

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

// ========================================================================
// FUNCIONES DE SEGURIDAD
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
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Request to ${endpoint} failed:`, error);
      throw error;
    }
  }
}

// ========================================================================
// GESTIÓN DE AUTENTICACIÓN
// ========================================================================

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
  document.getElementById('changePasswordModal').style.display = 'flex';
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'block';
  
  // Mostrar información del usuario
  const userDisplay = document.getElementById('userDisplay');
  userDisplay.textContent = `${currentUser.nombre} (${currentUser.empresa})`;
  
  // Mostrar tab de datos si es admin
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
  
  // Limpiar formularios
  document.getElementById('loginForm').reset();
  
  // Limpiar datos
  parquesData = [];
  personalData = [];
  personalByParque = {};
  personalSeleccionado = [];
  actividadesSeleccionadas = [];
}

// ========================================================================
// GESTIÓN DE TABS
// ========================================================================

function switchTab(tabName) {
  // Ocultar todos los tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Mostrar tab seleccionado
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  // Cargar datos específicos del tab
  if (tabName === 'consultar') {
    loadPermisos();
  } else if (tabName === 'datos') {
    loadSystemData();
  }
}

// ========================================================================
// CARGA DE DATOS INICIALES
// ========================================================================

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
    const response = await ClientSecurity.makeSecureRequest(`aerogeneradores?parque_id=${parqueId}`);
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
      item.innerHTML = `
        <input type="checkbox" id="actividad_${actividad.id}" value="${actividad.id}">
        <label for="actividad_${actividad.id}">${ClientSecurity.encodeHTML(actividad.nombre)}</label>
      `;
      
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

// ========================================================================
// GESTIÓN DE FORMULARIO
// ========================================================================

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
  // Filtrar riesgos según actividades seleccionadas
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
      row.innerHTML = `
        <td>${ClientSecurity.encodeHTML(riesgo.codigo || 'N/A')}</td>
        <td>${ClientSecurity.encodeHTML(riesgo.actividad)}</td>
        <td>${ClientSecurity.encodeHTML(riesgo.peligro)}</td>
        <td>${ClientSecurity.encodeHTML(riesgo.riesgo)}</td>
        <td>${ClientSecurity.encodeHTML(riesgo.medidas_preventivas)}</td>
      `;
      tbody.appendChild(row);
    });
    
    matrizTable.style.display = 'block';
    matrizEmpty.style.display = 'none';
  } else {
    matrizTable.style.display = 'none';
    matrizEmpty.style.display = 'block';
  }
}

// ========================================================================
// FUNCIONES AUXILIARES
// ========================================================================

function showError(message) {
  // Crear o mostrar elemento de error
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

// ========================================================================
// VERIFICACIÓN DE CONECTIVIDAD
// ========================================================================

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

// ========================================================================
// INICIALIZACIÓN
// ========================================================================

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Inicializando PT Wind...');
  
  // Verificar conectividad inicial
  await checkConnectivity();
  
  // Event listeners básicos
  const addListener = (id, ev, fn, opts) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(ev, fn, opts); 
  };
  
  // Login
  addListener('loginForm', 'submit', handleLogin);
  
  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
  });
  
  // Logout
  addListener('logoutBtn', 'click', logout);
  
  // Selección de planta
  addListener('planta', 'change', (e) => {
    if (e.target.value) {
      loadAerogeneradores(e.target.value);
    }
  });
  
  // Búsqueda de permisos
  const search = document.getElementById('searchPermiso');
  if (search) search.addEventListener('input', filterPermisos);
  
  // Verificar conectividad cada 30 segundos
  setInterval(checkConnectivity, 30000);
  
  console.log('PT Wind inicializado correctamente');
});

// Placeholder functions para funcionalidades avanzadas
async function loadPermisos() {
  console.log('Cargando permisos...');
  // Implementación pendiente
}

async function loadSystemData() {
  console.log('Cargando datos del sistema...');
  // Implementación pendiente
}

function filterPermisos() {
  console.log('Filtrando permisos...');
  // Implementación pendiente
}