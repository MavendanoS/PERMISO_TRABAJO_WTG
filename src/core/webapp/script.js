
export function getWebAppScript() {
return `
function sanitizeInput(input) {
if (typeof input !== 'string') return input;
return input
.replace(/[<>]/g, '')
.replace(/javascript:/gi, '')
.replace(/on\w+\s*=/gi, '')
.trim();
}

function encodeHTML(str) {
const div = document.createElement('div');
div.textContent = str;
return div.innerHTML;
}

function decodeApiResponse(data) {
if (typeof data !== 'object' || data === null) return data;

const decoded = Array.isArray(data) ? [] : {};

for (const [key, value] of Object.entries(data)) {
if (typeof value === 'object' && value !== null) {
decoded[key] = decodeApiResponse(value);
} else if (typeof value === 'string' && value.length > 50 && isBase64(value)) {
try {
decoded[key] = atob(value);
} catch {
decoded[key] = value;
}
} else {
decoded[key] = value;
}
}

return decoded;
}

function isBase64(str) {
try {
return btoa(atob(str)) === str && /^[A-Za-z0-9+/]*={0,2}$/.test(str);
} catch {
return false;
}
}

function generateSessionId() {
return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

class CryptoManager {
static async generateKey() {
return await window.crypto.subtle.generateKey(
{
name: 'AES-GCM',
length: 256
},
true,
['encrypt', 'decrypt']
);
}

static async encryptData(data, key) {
const encoder = new TextEncoder();
const dataBuffer = encoder.encode(JSON.stringify(data));
const iv = window.crypto.getRandomValues(new Uint8Array(12));

const encryptedData = await window.crypto.subtle.encrypt(
{
name: 'AES-GCM',
iv: iv
},
key,
dataBuffer
);

return {
data: Array.from(new Uint8Array(encryptedData)),
iv: Array.from(iv)
};
}

static async decryptData(encryptedData, key) {
const iv = new Uint8Array(encryptedData.iv);
const data = new Uint8Array(encryptedData.data);

const decryptedData = await window.crypto.subtle.decrypt(
{
name: 'AES-GCM',
iv: iv
},
key,
data
);

const decoder = new TextDecoder();
return JSON.parse(decoder.decode(decryptedData));
}

static async exportKey(key) {
const exported = await window.crypto.subtle.exportKey('raw', key);
return Array.from(new Uint8Array(exported));
}

static async importKey(keyData) {
const keyBuffer = new Uint8Array(keyData);
return await window.crypto.subtle.importKey(
'raw',
keyBuffer,
{
name: 'AES-GCM',
length: 256
},
true,
['encrypt', 'decrypt']
);
}

static async hashPassword(password) {
const encoder = new TextEncoder();
const data = encoder.encode(password);
const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
return Array.from(new Uint8Array(hashBuffer));
}
}

const _b4 = window.location.origin + '/api';
let _u3 = null;
let _a1 = null;
let _s2 = null;

let parquesData = [];
let personalData = [];
let personalByParque = {};
let supervisoresData = [];
let actividadesData = [];
let matrizRiesgosData = [];
let aerogeneradoresData = [];
let permisosData = [];

let personalSeleccionado = [];
let actividadesSeleccionadas = [];
let matrizRiesgosSeleccionada = [];
let materialesParaCierre = [];

function getChileDateTime(offsetMinutes = 0) {
const now = new Date();

const year = now.getUTCFullYear();

const septemberSecondSunday = getSecondSunday(year, 8);

const aprilFirstSunday = getFirstSunday(year, 3);

const currentTime = now.getTime();
const isDST = currentTime >= septemberSecondSunday.getTime() || currentTime < aprilFirstSunday.getTime();

const chileOffsetMinutes = isDST ? -3 * 60 : -4 * 60;

return new Date(now.getTime() + (chileOffsetMinutes + offsetMinutes) * 60000);
}

function getSecondSunday(year, month) {
const date = new Date(Date.UTC(year, month, 1));
const firstSunday = 7 - date.getUTCDay();
return new Date(Date.UTC(year, month, firstSunday + 7));
}

function getFirstSunday(year, month) {
const date = new Date(Date.UTC(year, month, 1));
const firstSunday = 7 - date.getUTCDay();
return new Date(Date.UTC(year, month, firstSunday === 7 ? 7 : firstSunday));
}

function formatChileDateTime(date) {
const pad = (n) => String(n).padStart(2, '0');
return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' +
pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
}

function validatePasswordStrength(password) {
const minLength = 8;
const hasUppercase = /[A-Z]/.test(password);
const hasLowercase = /[a-z]/.test(password);
const hasNumbers = /[0-9]/.test(password);
const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

if (!password || password.length < minLength) {
return {
valid: false,
message: 'La contraseña debe tener al menos 8 caracteres'
};
}

if (!hasUppercase) {
return {
valid: false,
message: 'La contraseña debe contener al menos una letra mayúscula'
};
}

if (!hasLowercase) {
return {
valid: false,
message: 'La contraseña debe contener al menos una letra minúscula'
};
}

if (!hasNumbers) {
return {
valid: false,
message: 'La contraseña debe contener al menos un número'
};
}

if (!hasSpecialChar) {
return {
valid: false,
message: 'La contraseña debe contener al menos un carácter especial'
};
}

return { valid: true };
}

function formatRUTInput(input) {
let value = input.replace(/[^0-9kK]/g, '');

if (value.length > 1) {
const body = value.slice(0, -1);
const dv = value.slice(-1).toUpperCase();

value = body + '-' + dv;
}

return value;
}

function validateRUT(rut) {
// Validación deshabilitada - acepta cualquier entrada
if (!rut) return { valid: false, message: 'RUT/DNI es requerido' };
return { valid: true };
}

function validatePhone(phone) {
if (!phone) return { valid: true };

const cleanPhone = phone.replace(/[^+0-9]/g, '');

// Validación simplificada - solo verificar longitud
if (cleanPhone.length < 8 || cleanPhone.length > 15) {
return { valid: false, message: 'El teléfono debe tener entre 8 y 15 dígitos' };
}

return { valid: true };
}

function formatRUT(rut) {
const cleaned = rut.replace(/[^0-9kK]/g, '');
if (cleaned.length <= 1) return cleaned;

const body = cleaned.slice(0, -1);
const dv = cleaned.slice(-1);

const formattedBody = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');

return formattedBody + '-' + dv;
}

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
credentials: 'include', // Always send cookies with requests
headers: {
'Content-Type': 'application/json',
...options.headers
}
};

console.log('Making authenticated request to:', endpoint, '- auth via HttpOnly cookie');

if (_s2) {
defaultOptions.headers['X-Session-Id'] = _s2;
}

try {
const response = await fetch(_b4 + endpoint, {
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

document.addEventListener('DOMContentLoaded', async function() {

const storedSessionId = sessionStorage.getItem('_s2');
if (storedSessionId) {
_s2 = storedSessionId;
await verifyAndLoadApp();
} else {
showLoginScreen();
}

setupEventListeners();
checkConnectionStatus();
});

function setupEventListeners() {

const on = (id, ev, fn, opts) => {
const el = document.getElementById(id);
if (el) el.addEventListener(ev, fn, opts);
};

on('loginForm', 'submit', handleLogin);
on('logoutBtn', 'click', handleLogout);

document.querySelectorAll('.tab').forEach(tab => {
tab.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
});

on('permisoForm', 'submit', handleCreatePermiso);

on('planta', 'change', handlePlantaChange);
on('tipoMantenimiento', 'change', handleTipoMantenimientoChange);

on('addPersonalBtn', 'click', addSelectedPersonal);
on('removePersonalBtn', 'click', removeSelectedPersonal);

on('generateRegisterBtn', 'click', generateRegister);
on('refreshPermisosBtn', 'click', loadPermisos);
on('clearSearchBtn', 'click', clearSearch);
const search = document.getElementById('searchPermiso');
if (search) search.addEventListener('input', filterPermisos);
const filterEstado = document.getElementById('filterEstado');
if (filterEstado) filterEstado.addEventListener('change', filterPermisos);
const fechaDesde = document.getElementById('fechaDesde');
if (fechaDesde) fechaDesde.addEventListener('change', filterPermisos);
const fechaHasta = document.getElementById('fechaHasta');
if (fechaHasta) fechaHasta.addEventListener('change', filterPermisos);

on('cancelarCierreBtn', 'click', closeCerrarModal);
on('confirmarCierreBtn', 'click', handleConfirmarCierre);
on('addMaterialBtn', 'click', addMaterial);

on('btnNuevoUsuario', 'click', () => openNuevoUsuarioModal());
on('btnRefreshUsuarios', 'click', loadUsuarios);
on('usuarioForm', 'submit', handleGuardarUsuario);
on('cancelarUsuarioBtn', 'click', closeUsuarioModal);
on('cancelarEliminarUsuarioBtn', 'click', closeConfirmarEliminarModal);
on('confirmarEliminarUsuarioBtn', 'click', handleEliminarUsuario);

on('searchUsuarios', 'input', handleSearchUsuarios);
on('btnClearSearch', 'click', clearSearchUsuarios);

on('modalRut', 'input', handleRutInput);
on('modalRut', 'blur', validateRutOnBlur);

on('modalTelefono', 'input', handlePhoneInput);
}

async function handleLogin(e) {
e.preventDefault();

const usuario = ClientSecurity.sanitizeInput(sanitizeInput(document.getElementById('usuario').value));
const password = document.getElementById('password').value;

const _l5 = document.getElementById('loginBtn');
const loginBtnText = document.getElementById('loginBtnText');
const loginBtnSpinner = document.getElementById('loginBtnSpinner');
const errorDiv = document.getElementById('loginError');
const loginInputs = document.querySelectorAll('#loginForm input');

errorDiv.style.display = 'none';
_l5.disabled = true;
loginBtnText.style.display = 'none';
loginBtnSpinner.style.display = 'block';

// Deshabilitar campos de entrada
loginInputs.forEach(input => input.disabled = true);

let loginSuccess = false;

try {
// Generar clave de sesión y encriptar datos
const sessionKey = await CryptoManager.generateKey();
const keyData = await CryptoManager.exportKey(sessionKey);

// Encriptar la información del login
const encryptedPayload = await CryptoManager.encryptData({
usuario: usuario,
password: password,
timestamp: Date.now()
}, sessionKey);

const response = await fetch(_b4 + '/login', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
encrypted: encryptedPayload,
sessionKey: keyData
})
});

const result = await response.json();

if (result.success) {
loginSuccess = true;
_a1 = 'cookie'; // Token now stored in HttpOnly cookie
_s2 = result.sessionId || generateSessionId();
_u3 = result.user;

console.log('Login successful, auth method: HttpOnly cookie');
if (_s2) {
sessionStorage.setItem('_s2', _s2);
}
if (result.requirePasswordChange) {
showChangePasswordModal(result.changeReason);
} else {
await loadAppData();
showApp();

resetInactivityTimer();
}
} else {
showLoginError(result.message || 'Error al iniciar sesión');
}
} catch (error) {
showLoginError('Error de conexión: ' + error.message);
} finally {
// Solo restaurar si hubo error (no si fue exitoso)
if (!loginSuccess) {
_l5.disabled = false;
loginBtnText.style.display = 'block';
loginBtnSpinner.style.display = 'none';
loginInputs.forEach(input => input.disabled = false);
}
}
}

function showChangePasswordModal(reason) {
const modal = document.getElementById('changePasswordModal');
modal.style.display = 'flex';

const reasonDiv = document.getElementById('passwordChangeReason');
if (reasonDiv) {
reasonDiv.textContent = reason || 'Por razones de seguridad, debe cambiar su contraseña.';
reasonDiv.style.display = 'block';
}

const requirementsDiv = document.getElementById('passwordRequirements');
if (requirementsDiv) {
requirementsDiv.innerHTML = '<strong>La nueva contraseña debe cumplir con:</strong>' +
'<ul style="text-align: left; margin: 10px 0;">' +
'<li>Mínimo 8 caracteres</li>' +
'<li>Al menos una letra mayúscula</li>' +
'<li>Al menos una letra minúscula</li>' +
'<li>Al menos un número</li>' +
'<li>Al menos un carácter especial (!@#$%^&*()_+-=[]{};\\':\\"|,.<>/?)</li>' +
'</ul>';
requirementsDiv.style.display = 'block';
}

document.getElementById('submitPasswordChangeBtn')
.addEventListener('click', handleMandatoryPasswordChange, { once: true });
}

async function handleMandatoryPasswordChange() {
const newPassword = document.getElementById('mandatoryNewPassword').value;
const confirmPassword = document.getElementById('mandatoryConfirmPassword').value;
const errorDiv = document.getElementById('changePasswordError');
const successDiv = document.getElementById('changePasswordSuccess');
const submitBtn = document.getElementById('submitPasswordChangeBtn');
const submitText = document.getElementById('submitPasswordChangeText');
const submitSpinner = document.getElementById('submitPasswordChangeSpinner');
const passwordInputs = document.querySelectorAll('#changePasswordModal input');

// Limpiar mensajes anteriores
errorDiv.style.display = 'none';
successDiv.style.display = 'none';

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

const passwordValidation = validatePasswordStrength(newPassword);
if (!passwordValidation.valid) {
errorDiv.textContent = passwordValidation.message;
errorDiv.style.display = 'block';
return;
}

// Mostrar estado de carga
submitBtn.disabled = true;
submitText.style.display = 'none';
submitSpinner.style.display = 'block';

// Deshabilitar todos los campos del formulario
passwordInputs.forEach(input => input.disabled = true);

try {
const response = await fetch(_b4 + '/change-password', {
method: 'POST',
credentials: 'include',
headers: {
'Content-Type': 'application/json'
},
body: JSON.stringify({ newPassword })
});

const result = await response.json();

if (result.success) {
// Mostrar mensaje de éxito
successDiv.innerHTML = '✅ <strong>¡Contraseña actualizada exitosamente!</strong><br>Cargando aplicación...';
successDiv.style.display = 'block';

// Cambiar botón a estado de éxito
submitSpinner.style.display = 'none';
submitText.textContent = '✓ Contraseña Actualizada';
submitText.style.display = 'block';
submitBtn.style.background = 'var(--success-color)';

// Esperar 4.5 segundos para que el usuario vea claramente el mensaje de éxito
await new Promise(resolve => setTimeout(resolve, 4500));

document.getElementById('changePasswordModal').style.display = 'none';

await loadAppData();
showApp();
} else {
throw new Error(result.error || 'Error al cambiar la contraseña');
}
} catch (error) {
errorDiv.textContent = error.message || 'Error de conexión. Por favor, inténtalo de nuevo.';
errorDiv.style.display = 'block';
} finally {
// Restaurar estado del botón solo si hubo error
if (errorDiv.style.display === 'block') {
submitBtn.disabled = false;
submitSpinner.style.display = 'none';
submitText.textContent = 'Cambiar Contraseña y Continuar';
submitText.style.display = 'block';
submitBtn.style.background = '';
passwordInputs.forEach(input => input.disabled = false);
}
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

let inactivityTimer = null;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

function resetInactivityTimer() {
if (inactivityTimer) {
clearTimeout(inactivityTimer);
}

if (_a1) {
inactivityTimer = setTimeout(() => {
alert('Sesión expirada por inactividad. Debe iniciar sesión nuevamente.');
handleLogout();
}, INACTIVITY_TIMEOUT);
}
}

async function handleLogout() {
// Clear HttpOnly cookies by making logout request
try {
await fetch(_b4 + '/logout', {
method: 'POST',
credentials: 'include'
});
} catch (error) {
console.log('Logout request failed, but continuing with client cleanup');
}

_a1 = null;
_s2 = null;
_u3 = null;
sessionStorage.clear();

if (inactivityTimer) {
clearTimeout(inactivityTimer);
inactivityTimer = null;
}

showLoginScreen();
}

function showLoginScreen() {
document.getElementById('loginScreen').style.display = 'block';
document.getElementById('appScreen').style.display = 'none';

// Restaurar el estado del botón de login y los campos
const loginBtn = document.getElementById('loginBtn');
const loginBtnText = document.getElementById('loginBtnText');
const loginBtnSpinner = document.getElementById('loginBtnSpinner');
const loginInputs = document.querySelectorAll('#loginForm input');
const errorDiv = document.getElementById('loginError');

if (loginBtn) loginBtn.disabled = false;
if (loginBtnText) {
loginBtnText.style.display = 'block';
loginBtnText.textContent = 'Iniciar Sesión';
}
if (loginBtnSpinner) loginBtnSpinner.style.display = 'none';
if (errorDiv) errorDiv.style.display = 'none';

// Habilitar todos los campos de entrada
loginInputs.forEach(input => {
input.disabled = false;
input.value = ''; // Limpiar los campos
});
}

function showApp() {
document.getElementById('loginScreen').style.display = 'none';
document.getElementById('appScreen').style.display = 'block';

if (_u3) {
document.getElementById('userDisplay').textContent =
ClientSecurity.encodeHTML(_u3.usuario + ' (' + _u3.rol + ')');

if (_u3.rol === 'Admin') {
document.getElementById('tabAdminUsuarios').style.display = 'block';
}
}

// Siempre iniciar en la pestaña "Nuevo Permiso"
switchTab('nuevo');
}

function showLoginError(message) {
const errorDiv = document.getElementById('loginError');
errorDiv.textContent = message;
errorDiv.style.display = 'block';

setTimeout(() => {
errorDiv.style.display = 'none';
}, 5000);
}

async function loadAppData() {

try {
const [parques, personal, actividades] = await Promise.all([
ClientSecurity.makeSecureRequest('/parques'),
ClientSecurity.makeSecureRequest('/personal'),
ClientSecurity.makeSecureRequest('/actividades')
]);

parquesData = parques.results || [];
personalData = personal.results || [];
actividadesData = actividades.results || [];

supervisoresData = [];

populateParques();

populateActividades();

await loadPermisos();

} catch (error) {
console.error('Error cargando datos:', error);
alert('Error al cargar los datos del sistema');
}
}

function populateParques() {
const select = document.getElementById('planta');
select.innerHTML = '<option value="">Seleccionar planta...</option>';

const parquesAutorizados = _u3?.parques || [];
const esEnel = _u3?.esEnel || false;

parquesData.forEach(parque => {

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

async function populateSupervisores(plantaNombre) {
const supervisorParqueSelect = document.getElementById('supervisorParque');

supervisorParqueSelect.innerHTML = '<option value="">Seleccionar supervisor Enel...</option>';

if (!plantaNombre) {
supervisoresData = [];
return;
}

try {

const response = await ClientSecurity.makeSecureRequest(
'/supervisores?parque=' + encodeURIComponent(plantaNombre)
);
supervisoresData = response.results || [];

if (supervisoresData.length === 0) {
const option = document.createElement('option');
option.value = "";
option.textContent = "No hay supervisores Enel asignados a este parque";
option.disabled = true;
supervisorParqueSelect.appendChild(option);
} else {
supervisoresData.forEach(supervisor => {
const option = document.createElement('option');
option.value = supervisor.nombre;
option.textContent = supervisor.nombre;
option.dataset.id = supervisor.id;
option.dataset.cargo = supervisor.cargo || '';
option.dataset.telefono = supervisor.telefono || '';
option.dataset.rut = supervisor.rut || '';

supervisorParqueSelect.appendChild(option);
});
}
} catch (error) {
console.error('Error cargando supervisores:', error);
const option = document.createElement('option');
option.value = "";
option.textContent = "Error al cargar supervisores";
option.disabled = true;
supervisorParqueSelect.appendChild(option);
}
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

async function handlePlantaChange(e) {
const plantaNombre = e.target.value;
const plantaId = e.target.selectedOptions[0]?.dataset.id;
const codigoParque = e.target.selectedOptions[0]?.dataset.codigo;

const jefeFaenaSelect = document.getElementById('jefeFaena');

if (!plantaNombre) {
document.getElementById('aerogenerador').innerHTML = '<option value="">Seleccionar aerogenerador...</option>';
document.getElementById('personalDisponible').innerHTML = '<div class="loading">Seleccione una planta primero</div>';
jefeFaenaSelect.innerHTML = '<option value="">Seleccionar jefe de faena...</option>';
document.getElementById('supervisorParque').innerHTML = '<option value="">Seleccionar supervisor Enel...</option>';
supervisoresData = [];
return;
}

await loadAerogeneradores(plantaNombre);

await populateSupervisores(plantaNombre);

personalSeleccionado = [];
const personalSeleccionadoContainer = document.getElementById('personalSeleccionado');
personalSeleccionadoContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No hay personal seleccionado</div>';

await loadPersonalByParque(plantaNombre);

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

async function handleCreatePermiso(e) {
e.preventDefault();

const isEditing = window.permisoEditando !== undefined;

const submitButton = e.target.querySelector('button[type="submit"]');
const originalText = submitButton.textContent;
submitButton.disabled = true;
submitButton.textContent = isEditing ? 'ACTUALIZANDO PERMISO...' : 'CREANDO PERMISO...';

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
descripcion: ClientSecurity.sanitizeInput(sanitizeInput(document.getElementById('descripcion').value)),
jefeFaena: jefeFaenaSelect.value,
jefeFaenaId: jefeFaenaSelect.selectedOptions[0]?.dataset.id,
supervisorParque: supervisorParqueSelect.value,
supervisorParqueId: supervisorParqueSelect.selectedOptions[0]?.dataset.id,
tipoMantenimiento: document.getElementById('tipoMantenimiento').value,
tipoMantenimientoOtros: ClientSecurity.sanitizeInput(document.getElementById('tipoOtros').value),
personal: personalSeleccionado,
actividades: actividadesSeleccionadas,
matrizRiesgos: matrizRiesgosSeleccionada,
usuarioCreador: _u3?.email || 'unknown',
fechaInicio: formatChileDateTime(getChileDateTime())
};

if (!permisoData.planta || !permisoData.descripcion || !permisoData.jefeFaena) {
alert('Por favor complete los campos obligatorios');

submitButton.disabled = false;
submitButton.textContent = originalText;
return;
}

if (personalSeleccionado.length === 0) {
alert('Debe seleccionar al menos una persona');

submitButton.disabled = false;
submitButton.textContent = originalText;
return;
}

try {
let response;

if (isEditing) {

permisoData.permisoId = window.permisoEditando;
console.log('EDITANDO PERMISO - ID:', window.permisoEditando, 'Datos:', permisoData);

response = await ClientSecurity.makeSecureRequest('/permisos', {
method: 'PUT',
body: JSON.stringify(permisoData)
});
} else {
response = await ClientSecurity.makeSecureRequest('/permisos', {
method: 'POST',
body: JSON.stringify(permisoData)
});
}

if (response.success) {
const mensaje = isEditing ?
'Permiso actualizado exitosamente' :
'Permiso creado exitosamente\\n\\nNúmero: ' + response.numeroPT;

alert(mensaje);

document.getElementById('permisoForm').reset();
personalSeleccionado = [];
actividadesSeleccionadas = [];
matrizRiesgosSeleccionada = [];
document.getElementById('personalSeleccionado').innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No hay personal seleccionado</div>';
updateMatrizDisplay();

if (isEditing) {
window.permisoEditando = undefined;
submitButton.textContent = 'CREAR PERMISO DE TRABAJO';
}

await loadPermisos();
switchTab('consultar');

submitButton.disabled = false;
submitButton.textContent = isEditing ? 'CREAR PERMISO DE TRABAJO' : originalText;
} else {
const accion = isEditing ? 'actualizar' : 'crear';
alert(\`Error al \${accion} el permiso: \` + (response.error || 'Error desconocido'));

submitButton.disabled = false;
submitButton.textContent = originalText;
}
} catch (error) {
const accion = isEditing ? 'actualizando' : 'creando';
console.error(\`Error \${accion} permiso:\`, error);
alert(\`Error al \${accion} el permiso: \` + error.message);

submitButton.disabled = false;
submitButton.textContent = originalText;
}
}

async function loadPermisos() {
try {
const response = await ClientSecurity.makeSecureRequest('/permisos');
permisosData = response.permisos || [];

setupDateLimits();

displayPermisos();
} catch (error) {
console.error('Error cargando permisos:', error);
document.getElementById('permisosContainer').innerHTML = '<div class="error">Error al cargar los permisos</div>';
}
}

function displayPermisos() {
const container = document.getElementById('permisosContainer');

const parquesAutorizados = _u3?.parques || [];
const esEnel = _u3?.esEnel || false;

const permisosFiltrados = permisosData.filter(permiso => {

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
const cardContainer = document.createElement('div');
cardContainer.className = 'permiso-card-container';

const card = document.createElement('div');
card.className = 'permiso-card';
card.dataset.permisoId = permiso.id;

const estadoClass = 'estado-' + (permiso.estado || 'CREADO').toLowerCase();
const esEnel = _u3?.esEnel || _u3?.rol === 'Supervisor Enel';

const esCreador = _u3?.id && permiso.usuario_creador_id &&
_u3.id.toString() === permiso.usuario_creador_id.toString();

const userId = _u3?.id ? _u3.id.toString() : null;
const jefeFaenaId = permiso.jefe_faena_id ? permiso.jefe_faena_id.toString() : null;
const personalIds = permiso.personal_ids ?
permiso.personal_ids.split(',').map(id => id.trim()) : [];

const esJefeFaena = userId && userId === jefeFaenaId;
const estaEnPersonalAsignado = userId && personalIds.includes(userId);

const puedeCerrarPermiso = esEnel || esJefeFaena || estaEnPersonalAsignado;

let estadoTexto = permiso.estado;
if (permiso.estado === 'CREADO' && !esEnel) {
estadoTexto = 'PENDIENTE DE APROBACIÓN';
} else if (permiso.estado === 'CERRADO_PENDIENTE_APROBACION') {
estadoTexto = 'CERRADO - PENDIENTE APROBACIÓN';
} else if (permiso.estado === 'CIERRE_RECHAZADO') {
estadoTexto = 'CIERRE RECHAZADO';
}

card.innerHTML = \`
<div class="permiso-card-inner">
<!-- Frente de la tarjeta -->
<div class="permiso-card-front">
<div class="permiso-header">
<div class="permiso-numero">\${permiso.numero_pt}</div>
<div class="permiso-estado \${estadoClass}">\${estadoTexto}</div>
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
\${permiso.supervisor_parque_nombre ? \`
<div class="permiso-info-item">
<div class="permiso-info-label">Supervisor Responsable</div>
<div class="permiso-info-value">\${permiso.supervisor_parque_nombre}</div>
</div>
\` : ''}
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
\${permiso.estado === 'CREADO' && esCreador ?
\`<button class="btn btn-warning btn-small" onclick="editarPermiso(\${permiso.id})" style="margin-right: 8px;">✏️ EDITAR</button>\` : ''}

\${permiso.estado === 'CREADO' && esEnel ?
\`<button class="btn btn-secondary btn-small" onclick="aprobarPermiso(\${permiso.id})">APROBAR</button>\` : ''}

\${permiso.estado === 'ACTIVO' && puedeCerrarPermiso ?
\`<button class="btn btn-danger btn-small" onclick="openCerrarModal(\${permiso.id}, '\${permiso.numero_pt}', '\${permiso.planta_nombre}', '\${permiso.aerogenerador_nombre || \"N/A\"}')">CERRAR PERMISO</button>\` : ''}

\${permiso.estado === 'CIERRE_RECHAZADO' ? \`
<button class="btn btn-warning btn-small"
onclick="openReenviarCierreModal(\${permiso.id}, '\${(permiso.numero_pt || '').replace(/'/g, "\\\'")}', '\${(permiso.planta_nombre || '').replace(/'/g, "\\\'")}', '\${(permiso.aerogenerador_nombre || '').replace(/'/g, "\\\'")}')"
style="margin-right: 8px;">
🔄 REENVIAR CIERRE
</button>
\` : ''}

\${(permiso.estado === 'CERRADO' || permiso.estado === 'CERRADO_PENDIENTE_APROBACION' || permiso.estado === 'CIERRE_RECHAZADO' || permiso.actividades_detalle?.length > 0 || permiso.materiales_detalle?.length > 0 || permiso.matriz_riesgos_detalle?.length > 0) ?
\`<button class="btn btn-info btn-small" onclick="flipCard(\${permiso.id})">VER DETALLES</button>\` : ''}

\${(permiso.estado === 'CERRADO' || permiso.estado === 'CERRADO_PENDIENTE_APROBACION' || permiso.estado === 'CIERRE_RECHAZADO') ?
\`<button class="btn btn-success btn-small" onclick="openExportModal(\${permiso.id}, '\${permiso.numero_pt}')"" style="margin-left: 8px;">
📁 EXPORTAR
</button>\` : ''}

\${(permiso.estado === 'CERRADO' || permiso.estado === 'CERRADO_PENDIENTE_APROBACION' || permiso.estado === 'CIERRE_RECHAZADO') ?
\`<span style="color: var(--text-secondary); font-size: 12px;">Cerrado por: \${permiso.usuario_cierre || 'N/A'}</span>\` :
(permiso.estado === 'CREADO' && !esEnel ?
\`<span style="color: var(--warning); font-size: 12px; font-weight: 500;">⏳ Pendiente de aprobación</span>\` : '')
}
</div>
</div>

<!-- Reverso de la tarjeta -->
<div class="permiso-card-back">
<div class="permiso-header">
<div class="permiso-numero">\${permiso.numero_pt} - Detalles</div>
<button class="btn-flip" onclick="flipCard(\${permiso.id})">← Volver</button>
</div>

<!-- Pestañas internas -->
<div class="card-tabs">
<button class="card-tab active" onclick="showCardTab(\${permiso.id}, 'actividades')">Actividades</button>
<button class="card-tab" onclick="showCardTab(\${permiso.id}, 'tiempos')">Tiempos</button>
<button class="card-tab" onclick="showCardTab(\${permiso.id}, 'materiales')">Materiales</button>
<button class="card-tab" onclick="showCardTab(\${permiso.id}, 'cierre')">Cierre</button>
</div>

<!-- Contenido de las pestañas -->
<div class="card-tab-content" data-permiso-id="\${permiso.id}">

<!-- Tab: Actividades -->
<div class="tab-pane active" data-tab="actividades">
\${permiso.actividades_detalle && permiso.actividades_detalle.length > 0 ? \`
<div class="permiso-info">
<div class="permiso-info-item" style="grid-column: 1 / -1;">
<div class="permiso-info-label">Actividades Realizadas</div>
<div class="permiso-info-value" style="font-size: 13px;">
\${permiso.actividades_detalle.map(act => \`
<div style="margin: 6px 0; padding: 8px; background: var(--bg-secondary); border-radius: 4px;">
<strong>• \${act.actividad_nombre}</strong>
\${act.tipo_actividad ? \`<span style="color: var(--accent-color); font-size: 11px; margin-left: 8px;">(\${act.tipo_actividad})</span>\` : ''}
</div>
\`).join('')}
</div>
</div>
</div>
\${permiso.matriz_riesgos_detalle && permiso.matriz_riesgos_detalle.length > 0 ? \`
<div class="permiso-info" style="margin-top: 12px;">
<div class="permiso-info-item" style="grid-column: 1 / -1;">
<div class="permiso-info-label">Matriz de Riesgos</div>
<div class="permiso-info-value" style="font-size: 12px;">
\${permiso.matriz_riesgos_detalle.map(riesgo => \`
<div style="margin: 6px 0; padding: 8px; background: #fff3cd; border-left: 3px solid var(--warning-color); border-radius: 4px;">
<div style="color: var(--danger-color); font-weight: 500;">⚠ \${riesgo.riesgo_descripcion || 'Riesgo'}</div>
\${riesgo.medida_control ? \`<div style="color: var(--success-color); margin-top: 4px;">✓ \${riesgo.medida_control}</div>\` : ''}
</div>
\`).join('')}
</div>
</div>
</div>
\` : ''}
\` : \`
<div style="text-align: center; padding: 40px; color: var(--text-secondary);">
<p>No hay actividades registradas</p>
</div>
\`}
</div>

<!-- Tab: Tiempos -->
<div class="tab-pane" data-tab="tiempos" style="display: none;">
<div class="tiempos-grid">
<!-- Columna Izquierda: Trabajos -->
<div class="tiempos-column">
\${permiso.fecha_inicio_trabajos ? \`
<div class="tiempo-item trabajo">
<div class="tiempo-icon">🛠️</div>
<div class="tiempo-content">
<div class="tiempo-label">Inicio de Trabajos</div>
<div class="tiempo-value">\${formatDate(permiso.fecha_inicio_trabajos)}</div>
</div>
</div>
\` : \`
<div class="tiempo-item-empty">
<div class="tiempo-icon-empty">🛠️</div>
<div class="tiempo-content">
<div class="tiempo-label">Inicio de Trabajos</div>
<div class="tiempo-value-empty">No registrado</div>
</div>
</div>
\`}

\${permiso.fecha_fin_trabajos ? \`
<div class="tiempo-item trabajo">
<div class="tiempo-icon">✅</div>
<div class="tiempo-content">
<div class="tiempo-label">Fin de Trabajos</div>
<div class="tiempo-value">\${formatDate(permiso.fecha_fin_trabajos)}</div>
</div>
</div>
\` : \`
<div class="tiempo-item-empty">
<div class="tiempo-icon-empty">✅</div>
<div class="tiempo-content">
<div class="tiempo-label">Fin de Trabajos</div>
<div class="tiempo-value-empty">No registrado</div>
</div>
</div>
\`}
</div>

<!-- Columna Derecha: Turbina -->
<div class="tiempos-column">
\${permiso.fecha_parada_turbina ? \`
<div class="tiempo-item turbina">
<div class="tiempo-icon">⏸️</div>
<div class="tiempo-content">
<div class="tiempo-label">Parada de Turbina</div>
<div class="tiempo-value">\${formatDate(permiso.fecha_parada_turbina)}</div>
</div>
</div>
\` : \`
<div class="tiempo-item-empty">
<div class="tiempo-icon-empty">⏸️</div>
<div class="tiempo-content">
<div class="tiempo-label">Parada de Turbina</div>
<div class="tiempo-value-empty">No registrado</div>
</div>
</div>
\`}

\${permiso.fecha_puesta_marcha_turbina ? \`
<div class="tiempo-item turbina">
<div class="tiempo-icon">▶️</div>
<div class="tiempo-content">
<div class="tiempo-label">Puesta en Marcha</div>
<div class="tiempo-value">\${formatDate(permiso.fecha_puesta_marcha_turbina)}</div>
</div>
</div>
\` : \`
<div class="tiempo-item-empty">
<div class="tiempo-icon-empty">▶️</div>
<div class="tiempo-content">
<div class="tiempo-label">Puesta en Marcha</div>
<div class="tiempo-value-empty">No registrado</div>
</div>
</div>
\`}
</div>
</div>
</div>

<!-- Tab: Materiales -->
<div class="tab-pane" data-tab="materiales" style="display: none;">
\${permiso.materiales_detalle && permiso.materiales_detalle.length > 0 ? \`
<div class="materials-table-container">
<table class="materials-table">
<thead>
<tr>
<th style="width: 35px;">#</th>
<th style="width: 180px;">Nombre Material</th>
<th style="width: 50px;">Cant.</th>
<th style="width: 80px;">Propietario</th>
<th style="width: 70px;">Almacén</th>
<th style="width: 80px;">N° Serie</th>
<th style="width: 70px;">N° Item</th>
</tr>
</thead>
<tbody>
\${permiso.materiales_detalle.map((mat, index) => \`
<tr>
<td>\${index + 1}</td>
<td>\${mat.material_nombre || 'Sin descripción'}</td>
<td>\${mat.material_cantidad || 1}</td>
<td style="font-size: 11px;">\${mat.material_propietario || 'N/A'}</td>
<td style="font-size: 11px;">\${mat.material_almacen || 'N/A'}</td>
<td style="font-size: 11px;">\${mat.numero_serie || mat.material_serie || 'N/A'}</td>
<td style="font-size: 11px;">\${mat.numero_item || 'N/A'}</td>
</tr>
\`).join('')}
</tbody>
</table>
</div>
\` : \`
<div style="text-align: center; padding: 40px; color: var(--text-secondary);">
<p>📦 No hay materiales registrados</p>
<p style="font-size: 12px; margin-top: 8px;">Los materiales utilizados aparecerán aquí cuando se registren</p>
</div>
\`}
</div>

<!-- Tab: Cierre -->
<div class="tab-pane" data-tab="cierre" style="display: none;">
\${(permiso.estado === 'CERRADO' || permiso.estado === 'CERRADO_PENDIENTE_APROBACION' || permiso.estado === 'CIERRE_RECHAZADO') ? \`
<div class="cierre-grid">
<!-- Columna Izquierda: Responsable -->
<div class="cierre-column">
<div class="cierre-item responsable">
<div class="cierre-icon">👤</div>
<div class="cierre-content">
<div class="cierre-label">Responsable del Cierre</div>
<div class="cierre-value">\${permiso.usuario_cierre || 'No especificado'}</div>
</div>
</div>

<div class="cierre-item fecha">
<div class="cierre-icon">📅</div>
<div class="cierre-content">
<div class="cierre-label">Fecha de Cierre</div>
<div class="cierre-value">\${formatDate(permiso.fecha_cierre)}</div>
</div>
</div>

<!-- Estado de Aprobación del Cierre -->
<div class="cierre-item aprobacion">
<div class="cierre-icon">\${permiso.estado_aprobacion_cierre === 'APROBADO' ? '✅' : (permiso.estado_aprobacion_cierre === 'RECHAZADO' ? '❌' : '⏳')}</div>
<div class="cierre-content">
<div class="cierre-label">Estado Aprobación</div>
<div class="cierre-value \${permiso.estado_aprobacion_cierre === 'APROBADO' ? 'aprobado' : (permiso.estado_aprobacion_cierre === 'RECHAZADO' ? 'rechazado' : 'pendiente')}">
\${permiso.estado_aprobacion_cierre === 'APROBADO' ? 'APROBADO' : (permiso.estado_aprobacion_cierre === 'RECHAZADO' ? 'RECHAZADO' : 'PENDIENTE')}
</div>
\${permiso.usuario_aprobador_cierre_nombre ? \`
<div class="cierre-sub-info">Por: \${permiso.usuario_aprobador_cierre_nombre}</div>
<div class="cierre-sub-info">\${formatDate(permiso.fecha_aprobacion_cierre)}</div>
\` : ''}
\${permiso.estado_aprobacion_cierre === 'RECHAZADO' && permiso.motivo_rechazo ? \`
<div class="motivo-rechazo" style="
margin-top: 12px;
padding: 15px;
background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
border: 2px solid #e57373;
border-radius: 8px;
border-left: 5px solid #d32f2f;
box-shadow: 0 3px 10px rgba(211, 47, 47, 0.15);
animation: pulseRed 2s ease-in-out infinite alternate;
">
<div style="
color: #d32f2f;
font-weight: 700;
font-size: 14px;
margin-bottom: 8px;
display: flex;
align-items: center;
gap: 8px;
text-transform: uppercase;
letter-spacing: 0.5px;
">
🚫 MOTIVO DEL RECHAZO
</div>
<div style="
color: #424242;
font-size: 14px;
line-height: 1.5;
font-weight: 600;
background: rgba(255, 255, 255, 0.8);
padding: 10px;
border-radius: 4px;
border-left: 3px solid #ff5722;
">
"\${permiso.motivo_rechazo}"
</div>
<div style="
margin-top: 12px;
padding: 8px 12px;
background: rgba(255, 152, 0, 0.1);
border-radius: 4px;
border: 1px solid #ff9800;
color: #e65100;
font-size: 12px;
font-weight: 600;
text-align: center;
">
💡 Use el botón "REENVIAR CIERRE" para corregir y reenviar
</div>
</div>
\` : ''}
</div>
</div>
</div>

<!-- Columna Derecha: Observaciones -->
<div class="cierre-column">
<div class="cierre-item observaciones">
<div class="cierre-content-full">
<div class="cierre-label">Observaciones</div>
<div class="cierre-observaciones">\${permiso.observaciones_cierre || 'Sin observaciones registradas'}</div>
</div>
</div>

<!-- Botón de Aprobación si es necesario -->
\${permiso.estado === 'CERRADO_PENDIENTE_APROBACION' && (_u3.rol === 'Admin' || _u3.rol === 'Supervisor') ? \`
<div class="cierre-actions" style="margin-top: 15px;">
<button class="btn btn-success btn-small" onclick="openAprobarCierreModal(\${permiso.id}, '\${(permiso.numero_pt || '').replace(/'/g, "\\'")}')" >
✅ APROBAR CIERRE
</button>
</div>
\` : ''}
</div>
</div>
\` : \`
<div style="text-align: center; padding: 40px; color: var(--text-secondary);">
<p>🔓 Permiso aún activo</p>
<p style="font-size: 12px; margin-top: 8px;">La información de cierre estará disponible cuando se complete el permiso</p>
</div>
\`}
</div>
</div>
</div>
</div>
\`;

cardContainer.appendChild(card);
return cardContainer;
}

function filterPermisos() {
const searchTerm = sanitizeInput(document.getElementById('searchPermiso').value).toLowerCase();
const estadoFilter = document.getElementById('filterEstado').value;
const fechaDesde = document.getElementById('fechaDesde').value;
const fechaHasta = document.getElementById('fechaHasta').value;
const txt = v => String(v ?? '').toLowerCase();

const parquesAutorizados = _u3?.parques || [];
const esEnel = _u3?.esEnel || false;

const permisosAutorizados = permisosData.filter(permiso => {
return esEnel || parquesAutorizados.includes(permiso.planta_nombre);
});

let filtered = permisosAutorizados;
if (estadoFilter) {
filtered = filtered.filter(p => p.estado === estadoFilter);
}

if (fechaDesde || fechaHasta) {
filtered = filtered.filter(p => {
if (!p.fecha_creacion) return false;

const fechaPermiso = new Date(p.fecha_creacion);
if (isNaN(fechaPermiso.getTime())) return false;

const fechaPermisoStr = fechaPermiso.toISOString().split('T')[0];

let cumpleFechaDesde = true;
let cumpleFechaHasta = true;

if (fechaDesde) {
cumpleFechaDesde = fechaPermisoStr >= fechaDesde;
}

if (fechaHasta) {
cumpleFechaHasta = fechaPermisoStr <= fechaHasta;
}

return cumpleFechaDesde && cumpleFechaHasta;
});
}

if (searchTerm) {
filtered = filtered.filter(p =>
txt(p.numero_pt).includes(searchTerm) ||
txt(p.planta_nombre).includes(searchTerm) ||
txt(p.descripcion).includes(searchTerm) ||
txt(p.jefe_faena_nombre).includes(searchTerm)
);
}

if (!searchTerm && !estadoFilter && !fechaDesde && !fechaHasta) {
displayPermisos();
return;
}

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

window.flipCard = function(permisoId) {
const card = document.querySelector(\`.permiso-card[data-permiso-id="\${permisoId}"]\`);
const container = card?.closest('.permiso-card-container');

if (card && container) {
const isFlipped = card.classList.contains('flipped');

card.classList.toggle('flipped');
container.classList.toggle('flipped-container');

if (!isFlipped) {
const tabs = card.querySelectorAll('.card-tab');
const panes = card.querySelectorAll('.tab-pane');
tabs.forEach(t => t.classList.remove('active'));
panes.forEach(p => p.style.display = 'none');
if (tabs[0]) tabs[0].classList.add('active');
if (panes[0]) {
panes[0].style.display = 'block';
}
}
}
}

window.showCardTab = function(permisoId, tabName) {
const card = document.querySelector(\`.permiso-card[data-permiso-id="\${permisoId}"]\`);
if (!card) return;

const tabs = card.querySelectorAll('.card-tab');
tabs.forEach(tab => {
tab.classList.remove('active');
});
event.target.classList.add('active');

const panes = card.querySelectorAll('.tab-pane');
panes.forEach(pane => {
if (pane.dataset.tab === tabName) {
pane.style.display = 'block';
} else {
pane.style.display = 'none';
}
});
}

window.toggleExportMenu = function(permisoId) {

document.querySelectorAll('.dropdown-menu').forEach(menu => {
if (menu.id !== \`exportMenu_\${permisoId}\`) {
menu.style.display = 'none';
}
});

const menu = document.getElementById(\`exportMenu_\${permisoId}\`);
if (menu) {
menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}
}

window.exportarArchivo = async function(permisoId, numeroPT, tipo) {

const menu = document.getElementById(\`exportMenu_\${permisoId}\`);
if (menu) menu.style.display = 'none';

try {
const endpoint = tipo === 'excel' ? '/exportar-permiso-excel' : '/exportar-permiso-pdf';
const extension = tipo === 'excel' ? 'xlsx' : 'pdf';
const fechaActual = new Date().toISOString().split('T')[0].replace(/-/g, '');
const descripcion = '_' + fechaActual;

const response = await fetch(\`\${_b4}\${endpoint}?id=\${permisoId}\`, {
credentials: 'include',
headers: {
'X-Session-Id': _s2
}
});

if (!response.ok) {
throw new Error('Error al generar el archivo');
}

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = \`\${numeroPT}\${descripcion}.\${extension}\`;
document.body.appendChild(a);
a.click();
window.URL.revokeObjectURL(url);
document.body.removeChild(a);

} catch (error) {
console.error('Error exportando archivo:', error);
alert('Error al exportar archivo: ' + error.message);
}
}

document.addEventListener('click', function(event) {
if (!event.target.closest('.export-dropdown')) {
document.querySelectorAll('.dropdown-menu').forEach(menu => {
menu.style.display = 'none';
});
}
});

function setupDateLimits() {
if (!permisosData || permisosData.length === 0) return;

const fechas = permisosData
.map(p => p.fecha_creacion)
.filter(f => f)
.map(f => new Date(f))
.filter(d => !isNaN(d.getTime()));

if (fechas.length === 0) return;

const fechaMin = new Date(Math.min(...fechas));
const fechaMax = new Date(Math.max(...fechas));

const formatDate = (date) => {
return date.toISOString().split('T')[0];
};

const fechaDesde = document.getElementById('fechaDesde');
const fechaHasta = document.getElementById('fechaHasta');

if (fechaDesde) {
fechaDesde.min = formatDate(fechaMin);
fechaDesde.max = formatDate(fechaMax);
}

if (fechaHasta) {
fechaHasta.min = formatDate(fechaMin);
fechaHasta.max = formatDate(fechaMax);
}
}

function clearSearch() {
sanitizeInput(document.getElementById('searchPermiso').value) = '';
document.getElementById('filterEstado').value = '';
document.getElementById('fechaDesde').value = '';
document.getElementById('fechaHasta').value = '';
displayPermisos();
}

window.aprobarPermiso = async function(permisoId) {
if (!confirm('¿Está seguro de aprobar este permiso?')) return;

try {
const response = await ClientSecurity.makeSecureRequest('/aprobar-permiso', {
method: 'POST',
body: JSON.stringify({
permisoId: permisoId,
usuarioAprobador: _u3?.email || 'unknown'
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

window.openAprobarCierreModal = async function(permisoId, numeroPT) {
const decision = confirm('Desea APROBAR el cierre de este permiso?\\n\\nPermiso: ' + numeroPT + '\\n\\nOK = Aprobar\\nCancelar = Rechazar');
const accion = decision ? 'aprobar' : 'rechazar';
const observaciones = prompt('Observaciones del supervisor (opcional):') || '';

try {
const response = await ClientSecurity.makeSecureRequest('/aprobar-cierre-permiso', {
method: 'POST',
body: JSON.stringify({
permisoId: permisoId,
accion: accion,
observaciones: observaciones
})
});

if (response.success) {
alert('Decisión registrada exitosamente');
await loadPermisos();
} else {
alert('Error: ' + (response.error || 'Error desconocido'));
}
} catch (error) {
console.error('Error en aprobación:', error);
alert('Error de conexión');
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

function escapeJsString(str) {
return (str || '').replace(/'/g, '\\'');
}

window.openReenviarCierreModal = async function(permisoId, numeroPT, planta, aerogenerador) {
try {

const response = await ClientSecurity.makeSecureRequest('/permiso-detalle?id=' + permisoId);
if (!response.success) {
throw new Error('Error al obtener detalles del permiso: ' + (response.error || 'Error desconocido'));
}
const permiso = response.permiso;

if (permiso.motivo_rechazo) {
const confirmReenvio = confirm(
'ATENCION: Este permiso fue RECHAZADO\\n\\n' +
'MOTIVO DEL RECHAZO:\\n' + permiso.motivo_rechazo + '\\n\\n' +
'Desea corregir los errores y reenviar el cierre?'
);
if (!confirmReenvio) return;
}

document.querySelector('#cerrarPermisoModal h3').textContent = '🔄 REENVIAR CIERRE - ' + numeroPT;
document.getElementById('permisoInfoNumero').textContent = numeroPT;
document.getElementById('permisoInfoPlanta').textContent = planta;
document.getElementById('permisoInfoAerogenerador').textContent = aerogenerador;

const safeDateToISOString = (dateString) => {
if (!dateString || dateString === null) return '';
try {
const date = new Date(dateString + 'T00:00:00');
if (isNaN(date.getTime())) return '';
return date.toISOString().split('T')[0];
} catch (e) {
return '';
}
};

const fechaInicioEl = document.getElementById('fechaInicioTrabajos');
if (fechaInicioEl) fechaInicioEl.value = safeDateToISOString(permiso.fecha_inicio_trabajos);

const fechaFinEl = document.getElementById('fechaFinTrabajos');
if (fechaFinEl) fechaFinEl.value = safeDateToISOString(permiso.fecha_fin_trabajos);

const fechaParadaEl = document.getElementById('fechaParadaTurbina');
if (fechaParadaEl) fechaParadaEl.value = safeDateToISOString(permiso.fecha_parada_turbina);

const fechaPuestaEl = document.getElementById('fechaPuestaMarcha');
if (fechaPuestaEl) fechaPuestaEl.value = safeDateToISOString(permiso.fecha_puesta_marcha_turbina);

const observacionesEl = document.getElementById('observacionesCierre');
if (observacionesEl) {
const observacionesActuales = permiso.observaciones_cierre || 'Trabajo completado según programación';
const contextoReenvio = 'REENVIO - Correccion aplicada tras rechazo:\\n"' + (permiso.motivo_rechazo || 'Sin motivo especifico') + '"\\n\\n' + observacionesActuales;
observacionesEl.value = contextoReenvio;
}

materialesParaCierre = [];
if (permiso.materiales_detalle && permiso.materiales_detalle.length > 0) {
permiso.materiales_detalle.forEach(mat => {
materialesParaCierre.push({
descripcion: mat.material_nombre || '',
cantidad: mat.material_cantidad || 1,
propietario: mat.material_propietario || 'ENEL',
almacen: mat.material_almacen || 'PRINCIPAL',
numeroItem: mat.numero_item || '',
numeroSerie: mat.numero_serie || ''
});
});
}
updateMaterialesList();

const modal = document.getElementById('cerrarPermisoModal');
if (!modal) {
throw new Error('Modal de cierre no encontrado');
}
let banner = modal.querySelector('.reenvio-banner');
if (!banner) {
banner = document.createElement('div');
banner.className = 'reenvio-banner';
banner.style.cssText =
'background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); ' +
'border: 2px solid #ffc107; ' +
'border-radius: 8px; ' +
'padding: 15px; ' +
'margin: 0 0 20px 0; ' +
'color: #856404; ' +
'font-weight: 600; ' +
'box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);';
banner.innerHTML =
'<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">' +
'<span style="font-size: 20px;">🔄</span>' +
'<span style="font-size: 16px;">MODO REENVÍO - CIERRE RECHAZADO</span>' +
'</div>' +
'<div style="font-size: 13px; font-weight: 500; line-height: 1.4;">' +
'⚠️ Este permiso fue rechazado previamente. Revise y corrija los datos antes de reenviar.' +
'</div>';
const modalContent = modal.querySelector('.modal-content');
if (modalContent && modalContent.firstElementChild) {
const firstChild = modalContent.firstElementChild;
firstChild.parentNode.insertBefore(banner, firstChild.nextSibling);
} else {

modal.insertBefore(banner, modal.firstChild);
}
}

const confirmarBtn = document.getElementById('confirmarCierreBtn');
if (confirmarBtn) confirmarBtn.dataset.permisoId = permisoId;

if (modal) modal.style.display = 'flex';

} catch (error) {
console.error('Error al abrir modal de reenvío:', error);
alert('Error al cargar los datos del permiso. Intente nuevamente.');
}
};

function closeCerrarModal() {

const modal = document.getElementById('cerrarPermisoModal');
const banner = modal.querySelector('.reenvio-banner');
if (banner) {
banner.remove();
}

document.querySelector('#cerrarPermisoModal h3').textContent = 'CERRAR PERMISO DE TRABAJO';
document.getElementById('permisoInfoNumero').textContent = '';
document.getElementById('permisoInfoPlanta').textContent = '';
document.getElementById('permisoInfoAerogenerador').textContent = '';

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
usuarioCierre: _u3?.email || 'unknown',
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

async function generateRegister() {
const plantaSelect = document.getElementById('planta');
const aerogeneradorSelect = document.getElementById('aerogenerador');
const jefeFaenaSelect = document.getElementById('jefeFaena');

const data = {
planta: plantaSelect.value,
aerogenerador: aerogeneradorSelect.value,
descripcion: sanitizeInput(document.getElementById('descripcion').value),
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
const response = await fetch(_b4 + '/generate-register', {
method: 'POST',
credentials: 'include',
headers: {
'Content-Type': 'application/json'
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

function switchTab(tabName) {
document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
document.getElementById('tab-' + tabName).classList.add('active');

if (tabName === 'admin-usuarios' && _u3?.rol === 'Admin') {
loadSystemStats();
loadUsuarios();
}
}

async function loadSystemStats() {
try {

updateStatDisplay('stat-plantas', '...');
updateStatDisplay('stat-personal-enel', '...');
updateStatDisplay('stat-personal-externo', '...');

const response = await ClientSecurity.makeSecureRequest('/system-stats');

if (response.success) {
const stats = response.data;
updateStatDisplay('stat-plantas', stats.totalParques || stats.totalPlantas || 0);
updateStatDisplay('stat-personal-enel', stats.personalEnel || 0);
updateStatDisplay('stat-personal-externo', stats.personalExterno || 0);
} else {

const personalEnel = personalData?.filter(p => p.empresa === 'ENEL' || p.empresa?.toLowerCase().includes('enel'))?.length || 0;
const personalExterno = personalData?.filter(p => p.empresa !== 'ENEL' && !p.empresa?.toLowerCase().includes('enel'))?.length || 0;

updateStatDisplay('stat-plantas', parquesData?.length || 0);
updateStatDisplay('stat-personal-enel', personalEnel);
updateStatDisplay('stat-personal-externo', personalExterno);
}
} catch (error) {
console.error('Error cargando estadísticas:', error);

const personalEnel = personalData?.filter(p => p.empresa === 'ENEL' || p.empresa?.toLowerCase().includes('enel'))?.length || 0;
const personalExterno = personalData?.filter(p => p.empresa !== 'ENEL' && !p.empresa?.toLowerCase().includes('enel'))?.length || 0;

updateStatDisplay('stat-plantas', parquesData?.length || 0);
updateStatDisplay('stat-personal-enel', personalEnel);
updateStatDisplay('stat-personal-externo', personalExterno);
}
}

function updateStatDisplay(elementId, value) {
const element = document.getElementById(elementId);
if (element) {
element.textContent = value.toString();
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
const response = await fetch(_b4 + '/health');
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

let currentExportPermisoId = null;
let currentExportPermisoInfo = null;

window.openExportModal = function(permisoId, permisoInfo) {
currentExportPermisoId = permisoId;
currentExportPermisoInfo = permisoInfo;

document.getElementById('exportPermisoInfo').textContent = permisoInfo || \`ID: \${permisoId}\`;
document.getElementById('exportModal').style.display = 'flex';

document.getElementById('exportStatus').style.display = 'none';
document.getElementById('exportExcelBtn').disabled = false;
document.getElementById('exportPdfBtn').disabled = false;
};

window.closeExportModal = function() {
document.getElementById('exportModal').style.display = 'none';
currentExportPermisoId = null;
currentExportPermisoInfo = null;
};

async function executeExport(formato) {
if (!currentExportPermisoId) return;

try {

document.getElementById('exportStatus').style.display = 'block';
document.getElementById('exportStatusText').textContent = \`Generando \${formato.toUpperCase()}...\`;
document.getElementById('exportExcelBtn').disabled = true;
document.getElementById('exportPdfBtn').disabled = true;

const fechaActual = new Date().toISOString().split('T')[0].replace(/-/g, '');
let endpoint, filename;
if (formato === 'excel') {
endpoint = \`\${_b4}/exportar-permiso-excel?id=\${currentExportPermisoId}\`;
filename = \`\${currentExportPermisoInfo}_\${fechaActual}.csv\`;
} else {
endpoint = \`\${_b4}/exportar-permiso-pdf?id=\${currentExportPermisoId}\`;
filename = \`\${currentExportPermisoInfo}_\${fechaActual}.html\`;
}

const response = await fetch(endpoint, {
credentials: 'include' // Ensure cookies are sent
});

if (!response.ok) {
const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
throw new Error(errorData.error || \`Error HTTP: \${response.status}\`);
}

if (formato === 'pdf') {

document.getElementById('exportStatusText').textContent = 'Abriendo vista para imprimir...';

const html = await response.text();
const newWindow = window.open('', '_blank');
newWindow.document.write(html);
newWindow.document.close();

document.getElementById('exportStatus').style.display = 'none';
document.getElementById('exportExcelBtn').disabled = false;
document.getElementById('exportPdfBtn').disabled = false;
showMessage('PDF abierto para imprimir', 'success');
closeExportModal();

} else {

document.getElementById('exportStatusText').textContent = 'Descargando archivo...';

const blob = await response.blob();

if (blob.size === 0) {
throw new Error('El archivo generado está vacío');
}

const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = filename;
a.style.display = 'none';
document.body.appendChild(a);
a.click();

setTimeout(() => {
window.URL.revokeObjectURL(url);
document.body.removeChild(a);
}, 100);

document.getElementById('exportStatusText').textContent = 'Descarga completada';
setTimeout(() => {
document.getElementById('exportStatus').style.display = 'none';
document.getElementById('exportExcelBtn').disabled = false;
document.getElementById('exportPdfBtn').disabled = false;
showMessage(\`Archivo \${formato.toUpperCase()} descargado exitosamente\`, 'success');
closeExportModal();
}, 1500);
}

} catch (error) {
console.error('Error exportando:', error);
showMessage(\`Error al generar archivo \${formato.toUpperCase()}: \${error.message}\`, 'error');

document.getElementById('exportStatus').style.display = 'none';
document.getElementById('exportExcelBtn').disabled = false;
document.getElementById('exportPdfBtn').disabled = false;
}
}

function showMessage(message, type = 'info') {

alert(message);
}

document.addEventListener('DOMContentLoaded', function() {
const exportExcelBtn = document.getElementById('exportExcelBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const cancelExportBtn = document.getElementById('cancelExportBtn');

if (exportExcelBtn) {
exportExcelBtn.addEventListener('click', () => executeExport('excel'));
}

if (exportPdfBtn) {
exportPdfBtn.addEventListener('click', () => executeExport('pdf'));
}

if (cancelExportBtn) {
cancelExportBtn.addEventListener('click', closeExportModal);
}

const exportModal = document.getElementById('exportModal');
if (exportModal) {
exportModal.addEventListener('click', function(event) {
if (event.target === exportModal) {
closeExportModal();
}
});
}
});

window.editarPermiso = async function(permisoId) {
console.log('Iniciando edición de permiso ID:', permisoId);
try {

const response = await ClientSecurity.makeSecureRequest(\`/permiso-detalle?id=\${permisoId}\`);

if (!response.success) {
alert('Error al cargar los datos del permiso: ' + (response.error || 'Error desconocido'));
return;
}

const permiso = response.permiso;

if (permiso.estado !== 'CREADO') {
alert('Solo se pueden editar permisos en estado CREADO');
return;
}

const nuevoTab = document.querySelector('[data-tab="nuevo"]');
const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => tab.classList.remove('active'));
contents.forEach(content => content.classList.remove('active'));

nuevoTab.classList.add('active');
document.getElementById('tab-nuevo').classList.add('active');

await llenarFormularioEdicion(permiso);

window.permisoEditando = permisoId;
const submitBtn = document.querySelector('#permisoForm button[type="submit"]');
console.log('Botón encontrado:', submitBtn);
if (submitBtn) {
submitBtn.textContent = 'ACTUALIZAR PERMISO DE TRABAJO';
console.log('Texto del botón cambiado a:', submitBtn.textContent);
} else {
console.error('No se encontró el botón de submit');
}

alert('Permiso cargado para edición');

} catch (error) {
console.error('Error editando permiso:', error);
alert('Error al cargar el permiso para edición: ' + error.message);
}
};

async function llenarFormularioEdicion(permiso) {
console.log('Llenando formulario para edición con permiso:', permiso);

document.getElementById('planta').value = permiso.planta_id || '';
sanitizeInput(document.getElementById('descripcion').value) = permiso.descripcion || '';
document.getElementById('tipoMantenimiento').value = permiso.tipo_mantenimiento || '';

if (permiso.tipo_mantenimiento === 'OTROS' && permiso.tipo_otros) {
document.getElementById('tipoOtros').value = permiso.tipo_otros;
document.getElementById('tipoOtrosContainer').style.display = 'block';
}

if (permiso.planta_id) {

const plantaSelect = document.getElementById('planta');
const fakeEvent = { target: plantaSelect };
await handlePlantaChange(fakeEvent);

if (permiso.aerogenerador_id) {
document.getElementById('aerogenerador').value = permiso.aerogenerador_id;
}

if (permiso.jefe_faena_id) {
document.getElementById('jefeFaena').value = permiso.jefe_faena_id;
}

if (permiso.supervisor_parque_id) {
document.getElementById('supervisorParque').value = permiso.supervisor_parque_id;
}
}

if (permiso.actividades_ids) {
const actividadIds = permiso.actividades_ids.split(',').map(id => id.trim());
actividadIds.forEach(actividadId => {
const checkbox = document.querySelector(\`input[name="actividades"][value="\${actividadId}"]\`);
if (checkbox) {
checkbox.checked = true;
}
});

updateMatrizDisplay();
}

if (permiso.personal_ids) {
personalSeleccionado = [];
const personalIds = permiso.personal_ids.split(',').map(id => id.trim());

const plantaNombre = document.querySelector('#planta option:checked')?.textContent;
if (plantaNombre && personalByParque[plantaNombre]) {
personalIds.forEach(personalId => {
const persona = personalByParque[plantaNombre].find(p => p.id.toString() === personalId);
if (persona) {
personalSeleccionado.push(persona);
}
});

const seleccionadoContainer = document.getElementById('personalSeleccionado');
if (seleccionadoContainer && personalSeleccionado.length > 0) {
seleccionadoContainer.innerHTML = '';
personalSeleccionado.forEach(persona => {
const item = document.createElement('div');
item.className = 'selector-item';
item.innerHTML = '<strong>' + persona.nombre + '</strong><br><small>' + (persona.empresa || 'Sin empresa') + ' - ' + (persona.rol || 'Sin rol') + '</small>';
item.dataset.id = persona.id;
item.dataset.nombre = persona.nombre;
item.dataset.empresa = persona.empresa || '';
item.dataset.rol = persona.rol || '';
item.dataset.rut = persona.rut || '';
item.addEventListener('click', () => togglePersonalSelection(item));
seleccionadoContainer.appendChild(item);
});
}
}
}
}

const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

function setupActivityListeners() {
activityEvents.forEach(event => {
document.addEventListener(event, resetInactivityTimer, true);
});
}

if (typeof window !== 'undefined') {
setupActivityListeners();
}

function handleRutInput(e) {
const input = e.target;
const cursorPos = input.selectionStart;
const oldValue = input.value;
const newValue = formatRUT(input.value);

input.value = newValue;

if (newValue.length > oldValue.length) {
input.setSelectionRange(cursorPos + 1, cursorPos + 1);
} else {
input.setSelectionRange(cursorPos, cursorPos);
}
}

function validateRutOnBlur(e) {
const rut = e.target.value.trim();
const validation = validateRUT(rut);

const errorDiv = document.getElementById('usuarioError');
if (!validation.valid && rut) {
errorDiv.textContent = validation.message;
errorDiv.style.display = 'block';
e.target.classList.add('error');
} else {
e.target.classList.remove('error');
if (errorDiv.textContent === validation.message) {
errorDiv.style.display = 'none';
}
}
}

function handlePhoneInput(e) {
let phone = e.target.value.replace(/[^0-9+]/g, '');

if (phone.length > 15) {
phone = phone.substring(0, 15);
}

e.target.value = phone;
}

function formatParquesForDisplay(parques) {
if (!parques) return 'Ninguno';

try {

const parquesArray = JSON.parse(parques);
if (Array.isArray(parquesArray)) {
return parquesArray.length > 3
? parquesArray.slice(0, 3).join(', ') + '...'
: parquesArray.join(', ');
}
} catch (e) {

const parquesArray = parques.split(',').map(p => p.trim());
return parquesArray.length > 3
? parquesArray.slice(0, 3).join(', ') + '...'
: parquesArray.join(', ');
}

return parques;
}

function setupRUTFormatting() {
const rutInput = document.getElementById('modalRut');
const telefonoInput = document.getElementById('modalTelefono');

if (rutInput) {

rutInput.removeEventListener('input', handleRUTInput);
rutInput.removeEventListener('blur', validateRUTInput);

rutInput.addEventListener('input', handleRUTInput);
rutInput.addEventListener('blur', validateRUTInput);
}

if (telefonoInput) {

telefonoInput.removeEventListener('input', handlePhoneInput);
telefonoInput.removeEventListener('blur', validatePhoneInput);

telefonoInput.addEventListener('input', handlePhoneInput);
telefonoInput.addEventListener('blur', validatePhoneInput);
}
}

function handleRUTInput(e) {
const input = e.target;
const cursorPos = input.selectionStart;
const oldValue = input.value;
const newValue = formatRUTInput(oldValue);

if (newValue !== oldValue) {
input.value = newValue;

const diff = newValue.length - oldValue.length;
input.setSelectionRange(cursorPos + diff, cursorPos + diff);
}
}

function validateRUTInput(e) {
const input = e.target;
const rut = input.value.trim();

if (rut) {
const validation = validateRUT(rut);
if (!validation.valid) {
input.style.borderColor = 'var(--danger-color)';
input.title = validation.message;
input.classList.add('invalid');
input.classList.remove('valid');
} else {
input.style.borderColor = 'var(--success-color)';
input.title = 'RUT válido';
input.classList.add('valid');
input.classList.remove('invalid');
}
} else {
input.style.borderColor = '';
input.title = '';
input.classList.remove('valid', 'invalid');
}
}

function formatPhoneInput(input) {
let value = input.replace(/[^0-9+]/g, '');

if (value.startsWith('56') && !value.startsWith('+')) {
value = '+' + value;
}

if (value.startsWith('9') && value.length > 8) {
value = '+56' + value;
}

if (value.startsWith('2') && value.length > 8) {
value = '+56' + value;
}

return value;
}

function handlePhoneInput(e) {
const input = e.target;
const oldValue = input.value;
const newValue = formatPhoneInput(oldValue);

if (newValue !== oldValue) {
input.value = newValue;
}
}

function validatePhoneInput(e) {
const input = e.target;
const phone = input.value.trim();

if (phone) {
const validation = validatePhone(phone);
if (!validation.valid) {
input.style.borderColor = 'var(--danger-color)';
input.title = validation.message;
input.classList.add('invalid');
input.classList.remove('valid');
} else {
input.style.borderColor = 'var(--success-color)';
input.title = 'Teléfono válido';
input.classList.add('valid');
input.classList.remove('invalid');
}
} else {
input.style.borderColor = '';
input.title = '';
input.classList.remove('valid', 'invalid');
}
}

async function loadParquesForModal() {
const select = document.getElementById('modalParquesAutorizados');
if (!select) return;

try {
select.innerHTML = '<option value="">Cargando parques...</option>';

const response = await ClientSecurity.makeSecureRequest('/parques');

if (response.results && response.results.length > 0) {
select.innerHTML = '';
response.results.forEach(parque => {
const option = document.createElement('option');
option.value = parque.nombre;
option.textContent = parque.nombre;
select.appendChild(option);
});
} else {
select.innerHTML = '<option value="">No hay parques disponibles</option>';
}
} catch (error) {
console.error('Error cargando parques:', error);
select.innerHTML = '<option value="">Error cargando parques</option>';
}
}

let usuarioEditando = null;

async function loadUsuarios() {
const container = document.getElementById('usuariosContainer');
if (!container) return;

try {
container.innerHTML = '<div class="loading">Cargando usuarios...</div>';

const response = await ClientSecurity.makeSecureRequest('/admin-users');

if (!response.success) {
container.innerHTML = '<div class="error">Error al cargar usuarios: ' + (response.error || 'Error desconocido') + '</div>';
return;
}

allUsuarios = response.users || [];
filteredUsuarios = [...allUsuarios];

const searchInput = document.getElementById('searchUsuarios');
const clearButton = document.getElementById('btnClearSearch');
if (searchInput) {
searchInput.value = '';
}
if (clearButton) {
clearButton.classList.remove('visible');
}

renderUsuariosTable();

} catch (error) {
console.error('Error cargando usuarios:', error);
container.innerHTML = '<div class="error">Error de conexión al cargar usuarios</div>';
}
}

let allUsuarios = [];
let filteredUsuarios = [];

function handleSearchUsuarios() {
const searchInput = document.getElementById('searchUsuarios');
const clearButton = document.getElementById('btnClearSearch');
const searchTerm = searchInput.value.toLowerCase().trim();

if (searchTerm.length > 0) {
clearButton.classList.add('visible');
} else {
clearButton.classList.remove('visible');
}

if (searchTerm.length === 0) {
filteredUsuarios = [...allUsuarios];
} else {
filteredUsuarios = allUsuarios.filter(usuario => {
return (
(usuario.usuario || '').toLowerCase().includes(searchTerm) ||
(usuario.email || '').toLowerCase().includes(searchTerm) ||
(usuario.rut || '').toLowerCase().includes(searchTerm) ||
(usuario.telefono || '').toLowerCase().includes(searchTerm) ||
(usuario.cargo || '').toLowerCase().includes(searchTerm) ||
(usuario.rol || '').toLowerCase().includes(searchTerm) ||
(usuario.empresa || '').toLowerCase().includes(searchTerm) ||
(usuario.parques_autorizados || '').toLowerCase().includes(searchTerm) ||
(usuario.estado || '').toLowerCase().includes(searchTerm)
);
});
}

renderUsuariosTable();
}

function clearSearchUsuarios() {
const searchInput = document.getElementById('searchUsuarios');
const clearButton = document.getElementById('btnClearSearch');

searchInput.value = '';
clearButton.classList.remove('visible');
filteredUsuarios = [...allUsuarios];
renderUsuariosTable();
searchInput.focus();
}

function renderUsuariosTable() {
const container = document.getElementById('usuariosContainer');
if (!container) return;

const usuarios = filteredUsuarios;

if (usuarios.length === 0) {
const isSearching = sanitizeInput(document.getElementById('searchUsuarios').value).trim().length > 0;
const message = isSearching
? 'No se encontraron usuarios que coincidan con la búsqueda'
: 'No hay usuarios registrados';
container.innerHTML = '<div class="no-data">' + message + '</div>';
return;
}

let html = '<div class="users-grid">';

usuarios.forEach(usuario => {
html += '<div class="user-card">';

html += '<div class="user-card-header">';
html += '<div class="user-info">';
html += '<h3>' + ClientSecurity.encodeHTML(usuario.usuario || '') + '</h3>';
html += '<span class="user-email">' + ClientSecurity.encodeHTML(usuario.email || '') + '</span>';
html += '</div>';
html += '<div class="user-status">';
html += '<span class="badge badge-' + (usuario.estado === 'Activo' ? 'success' : 'danger') + '">' + ClientSecurity.encodeHTML(usuario.estado || '') + '</span>';
html += '</div>';
html += '</div>';

html += '<div class="user-card-body">';

html += '<div class="user-detail-row">';
html += '<span class="detail-label">RUT/DNI:</span>';
html += '<span class="detail-value">' + ClientSecurity.encodeHTML(usuario.rut || 'No especificado') + '</span>';
html += '</div>';

html += '<div class="user-detail-row">';
html += '<span class="detail-label">Teléfono:</span>';
html += '<span class="detail-value">' + ClientSecurity.encodeHTML(usuario.telefono || 'No especificado') + '</span>';
html += '</div>';

html += '<div class="user-detail-row">';
html += '<span class="detail-label">Cargo:</span>';
html += '<span class="detail-value">' + ClientSecurity.encodeHTML(usuario.cargo || 'No especificado') + '</span>';
html += '</div>';

html += '<div class="user-detail-row">';
html += '<span class="detail-label">Rol:</span>';
html += '<span class="detail-value"><span class="badge badge-' + getRoleBadgeClass(usuario.rol) + '">' + ClientSecurity.encodeHTML(usuario.rol || '') + '</span></span>';
html += '</div>';

html += '<div class="user-detail-row">';
html += '<span class="detail-label">Empresa:</span>';
html += '<span class="detail-value">' + ClientSecurity.encodeHTML(usuario.empresa || 'No especificada') + '</span>';
html += '</div>';

html += '<div class="user-detail-row">';
html += '<span class="detail-label">Password Temporal:</span>';
html += '<span class="detail-value"><span class="badge badge-' + (usuario.password_temporal ? 'warning' : 'success') + '">' + (usuario.password_temporal ? 'Sí' : 'No') + '</span></span>';
html += '</div>';

html += '<div class="user-detail-row parques-row">';
html += '<span class="detail-label">Parques Autorizados:</span>';
html += '<div class="detail-value parques-container">' + formatParquesForDisplay(usuario.parques_autorizados) + '</div>';
html += '</div>';

html += '</div>';

html += '<div class="user-card-footer">';
html += '<button class="btn btn-secondary" onclick="editarUsuario(' + usuario.id + ')" title="Editar">✏️ Editar</button>';
html += '<button class="btn btn-danger" onclick="confirmarEliminarUsuario(' + usuario.id + ', &#39;' + ClientSecurity.encodeHTML(usuario.usuario) + '&#39;)" title="Eliminar">🗑️ Eliminar</button>';
html += '</div>';

html += '</div>';
});

html += '</div>';
container.innerHTML = html;
}

function getRoleBadgeClass(rol) {
switch(rol?.toLowerCase()) {
case 'admin': return 'primary';
case 'supervisor': return 'warning';
case 'operador': return 'info';
default: return 'secondary';
}
}

async function openNuevoUsuarioModal() {
usuarioEditando = null;
document.getElementById('usuarioModalTitle').textContent = 'Nuevo Usuario';
document.getElementById('usuarioForm').reset();
document.getElementById('modalPassword').placeholder = 'Contraseña requerida';
document.getElementById('modalPassword').required = true;
document.getElementById('usuarioError').style.display = 'none';

await loadParquesForModal();

setupRUTFormatting();

document.getElementById('usuarioModal').style.display = 'flex';
}

async function editarUsuario(userId) {
try {
const response = await ClientSecurity.makeSecureRequest('/admin-users/' + userId);

if (!response.success) {
alert('Error al cargar datos del usuario: ' + (response.error || 'Error desconocido'));
return;
}

const usuario = response.user;
usuarioEditando = userId;

await loadParquesForModal();

setupRUTFormatting();

document.getElementById('usuarioModalTitle').textContent = 'Editar Usuario';
document.getElementById('modalUsuario').value = usuario.usuario || '';
document.getElementById('modalEmail').value = usuario.email || '';
document.getElementById('modalRut').value = usuario.rut || '';
document.getElementById('modalTelefono').value = usuario.telefono || '';
document.getElementById('modalCargo').value = usuario.cargo || '';
document.getElementById('modalPassword').value = '';
document.getElementById('modalPassword').placeholder = 'Dejar vacío para mantener actual';
document.getElementById('modalPassword').required = false;
document.getElementById('modalRol').value = usuario.rol || '';
document.getElementById('modalEmpresa').value = usuario.empresa || '';
document.getElementById('modalEstado').value = usuario.estado || 'Activo';
document.getElementById('modalPasswordTemporal').checked = usuario.password_temporal || false;

const parquesSelect = document.getElementById('modalParquesAutorizados');
if (parquesSelect && usuario.parques_autorizados) {
try {
const parquesUsuario = JSON.parse(usuario.parques_autorizados);
if (Array.isArray(parquesUsuario)) {

Array.from(parquesSelect.options).forEach(option => {
option.selected = parquesUsuario.includes(option.value);
});
}
} catch (e) {

const parquesArray = usuario.parques_autorizados.split(',').map(p => p.trim());
Array.from(parquesSelect.options).forEach(option => {
option.selected = parquesArray.includes(option.value);
});
}
}

document.getElementById('usuarioError').style.display = 'none';
document.getElementById('usuarioModal').style.display = 'flex';

} catch (error) {
console.error('Error cargando usuario:', error);
alert('Error de conexión al cargar usuario');
}
}

async function handleGuardarUsuario(e) {
e.preventDefault();

const errorDiv = document.getElementById('usuarioError');
const submitBtn = document.getElementById('guardarUsuarioBtn');

errorDiv.style.display = 'none';
submitBtn.disabled = true;
submitBtn.textContent = 'Guardando...';

try {
const formData = {
usuario: ClientSecurity.sanitizeInput(document.getElementById('modalUsuario').value),
email: ClientSecurity.sanitizeInput(document.getElementById('modalEmail').value),
rut: ClientSecurity.sanitizeInput(document.getElementById('modalRut').value),
telefono: ClientSecurity.sanitizeInput(document.getElementById('modalTelefono').value) || null,
cargo: ClientSecurity.sanitizeInput(document.getElementById('modalCargo').value) || null,
rol: document.getElementById('modalRol').value,
empresa: ClientSecurity.sanitizeInput(document.getElementById('modalEmpresa').value) || null,
estado: document.getElementById('modalEstado').value,
password_temporal: document.getElementById('modalPasswordTemporal').checked
};

const parquesSelect = document.getElementById('modalParquesAutorizados');
const selectedParques = Array.from(parquesSelect.selectedOptions).map(option => option.value);
formData.parques_autorizados = selectedParques.length > 0 ? JSON.stringify(selectedParques) : null;

const password = document.getElementById('modalPassword').value;
if (password) {
formData.password = password;
}

if (!formData.usuario || !formData.email || !formData.rol || !formData.rut) {
errorDiv.textContent = 'Los campos Usuario, Email, RUT y Rol son requeridos';
errorDiv.style.display = 'block';
return;
}

const rutValidation = validateRUT(formData.rut);
if (!rutValidation.valid) {
errorDiv.textContent = rutValidation.message;
errorDiv.style.display = 'block';
return;
}

if (formData.telefono) {
const phoneValidation = validatePhone(formData.telefono);
if (!phoneValidation.valid) {
errorDiv.textContent = phoneValidation.message;
errorDiv.style.display = 'block';
return;
}
}

if (!formData.parques_autorizados) {
errorDiv.textContent = 'Debe seleccionar al menos un parque autorizado';
errorDiv.style.display = 'block';
return;
}

if (!usuarioEditando && !password) {
errorDiv.textContent = 'La contraseña es requerida para nuevos usuarios';
errorDiv.style.display = 'block';
return;
}

const url = usuarioEditando ? '/admin-users/' + usuarioEditando : '/admin-users';
const method = usuarioEditando ? 'PUT' : 'POST';

const response = await ClientSecurity.makeSecureRequest(url, {
method,
body: JSON.stringify(formData)
});

if (!response.success) {
errorDiv.textContent = response.error || 'Error desconocido';
errorDiv.style.display = 'block';
return;
}

const isEditing = usuarioEditando !== null && usuarioEditando !== undefined;
const successMessage = isEditing ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente';

await loadUsuarios();
showSuccessMessage(successMessage);
closeUsuarioModal();

} catch (error) {
console.error('Error guardando usuario:', error);
errorDiv.textContent = 'Error de conexión';
errorDiv.style.display = 'block';
} finally {
submitBtn.disabled = false;
submitBtn.textContent = 'Guardar Usuario';
}
}

function closeUsuarioModal() {
document.getElementById('usuarioModal').style.display = 'none';
usuarioEditando = null;
}

let usuarioIdEliminar = null;

function confirmarEliminarUsuario(userId, userName) {
usuarioIdEliminar = userId;
document.getElementById('usuarioEliminarInfo').textContent = 'Usuario: ' + userName;
document.getElementById('confirmarEliminarUsuarioModal').style.display = 'flex';
}

async function handleEliminarUsuario() {
if (!usuarioIdEliminar) return;

const confirmarBtn = document.getElementById('confirmarEliminarUsuarioBtn');
confirmarBtn.disabled = true;
confirmarBtn.textContent = 'Eliminando...';

try {
const response = await ClientSecurity.makeSecureRequest('/admin-users/' + usuarioIdEliminar, {
method: 'DELETE'
});

if (!response.success) {
alert('Error al eliminar usuario: ' + (response.error || 'Error desconocido'));
return;
}

closeConfirmarEliminarModal();
await loadUsuarios();
showSuccessMessage('Usuario eliminado correctamente');

} catch (error) {
console.error('Error eliminando usuario:', error);
alert('Error de conexión al eliminar usuario');
} finally {
confirmarBtn.disabled = false;
confirmarBtn.textContent = 'Eliminar Usuario';
}
}

function closeConfirmarEliminarModal() {
document.getElementById('confirmarEliminarUsuarioModal').style.display = 'none';
usuarioIdEliminar = null;
}

function showSuccessMessage(message) {
const successDiv = document.createElement('div');
successDiv.style.position = 'fixed';
successDiv.style.top = '20px';
successDiv.style.right = '20px';
successDiv.style.background = 'var(--success-color)';
successDiv.style.color = 'white';
successDiv.style.padding = '16px 24px';
successDiv.style.borderRadius = '8px';
successDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
successDiv.style.zIndex = '9999';
successDiv.style.fontWeight = '500';
successDiv.style.fontSize = '14px';
successDiv.style.maxWidth = '400px';

successDiv.textContent = message;
document.body.appendChild(successDiv);

setTimeout(() => {
successDiv.remove();
}, 4500);
}

window.editarUsuario = editarUsuario;
window.confirmarEliminarUsuario = confirmarEliminarUsuario;

`;
}

export default getWebAppScript;
