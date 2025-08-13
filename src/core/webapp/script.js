/**
 * Returns the JavaScript code for the PT Worker web app.
 * Note: This module currently contains a placeholder string.
 * Copy the actual script from worker.js into this function.
 */
export function getWebAppScript() {
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
            
            if (currentUser.rol === 'ADMIN') {
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
            const [parques, personal, actividades] = await Promise.all([
                ClientSecurity.makeSecureRequest('/parques'),
                ClientSecurity.makeSecureRequest('/personal'),
                ClientSecurity.makeSecureRequest('/actividades')
            ]);
            
            // Los datos ahora vienen directamente como arrays sin properties
            parquesData = parques.results || [];
            personalData = personal.results || [];
            actividadesData = actividades.results || [];
            // supervisoresData se cargará cuando se seleccione una planta
            supervisoresData = [];
            
            populateParques();
            // populateSupervisores se llamará cuando se seleccione una planta
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
    
    async function populateSupervisores(plantaNombre) {
        const supervisorParqueSelect = document.getElementById('supervisorParque');
        
        supervisorParqueSelect.innerHTML = '<option value="">Seleccionar supervisor Enel...</option>';
        
        if (!plantaNombre) {
            supervisoresData = [];
            return;
        }
        
        try {
            // Cargar supervisores filtrados por parque
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
            document.getElementById('supervisorParque').innerHTML = '<option value="">Seleccionar supervisor Enel...</option>';
            supervisoresData = [];
            return;
        }
        
        // Cargar aerogeneradores
        await loadAerogeneradores(plantaNombre);
        
        // Cargar supervisores Enel del parque
        await populateSupervisores(plantaNombre);
        
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
        const cardContainer = document.createElement('div');
        cardContainer.className = 'permiso-card-container';
        
        const card = document.createElement('div');
        card.className = 'permiso-card';
        card.dataset.permisoId = permiso.id;
        
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
        
        // Determinar texto de estado para usuarios no aprobadores
        let estadoTexto = permiso.estado;
        if (permiso.estado === 'CREADO' && !esEnel) {
            estadoTexto = 'PENDIENTE DE APROBACIÓN';
        }
        
        // Crear estructura de tarjeta con frente y reverso
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
                        
                        \${(permiso.estado === 'CERRADO' || permiso.actividades_detalle?.length > 0 || permiso.materiales_detalle?.length > 0 || permiso.matriz_riesgos_detalle?.length > 0) ? 
                            \`<button class="btn btn-info btn-small" onclick="flipCard(\${permiso.id})">VER DETALLES</button>\` : ''}
                        
                        \${permiso.estado === 'CERRADO' ? 
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
                                                <th style="width: 40px;">#</th>
                                                <th>Material/Herramienta</th>
                                                <th style="width: 60px;">Cant.</th>
                                                <th style="width: 80px;">Propietario</th>
                                                <th style="width: 70px;">Almacén</th>
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
                            \${permiso.estado === 'CERRADO' ? \`
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
                                    </div>
                                    
                                    <!-- Columna Derecha: Observaciones -->
                                    <div class="cierre-column">
                                        <div class="cierre-item observaciones">
                                            <div class="cierre-content-full">
                                                <div class="cierre-label">Observaciones</div>
                                                <div class="cierre-observaciones">\${permiso.observaciones_cierre || 'Sin observaciones registradas'}</div>
                                            </div>
                                        </div>
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
    
    // Función para voltear las tarjetas
    window.flipCard = function(permisoId) {
        const card = document.querySelector(\`.permiso-card[data-permiso-id="\${permisoId}"]\`);
        const container = card?.closest('.permiso-card-container');
        
        if (card && container) {
            const isFlipped = card.classList.contains('flipped');
            
            // Toggle flip
            card.classList.toggle('flipped');
            container.classList.toggle('flipped-container');
            
            // Resetear a la primera pestaña cuando se voltea hacia atrás
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
    
    // Función para cambiar pestañas dentro de la card
    window.showCardTab = function(permisoId, tabName) {
        const card = document.querySelector(\`.permiso-card[data-permiso-id="\${permisoId}"]\`);
        if (!card) return;
        
        // Actualizar botones de pestañas
        const tabs = card.querySelectorAll('.card-tab');
        tabs.forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Mostrar/ocultar contenido
        const panes = card.querySelectorAll('.tab-pane');
        panes.forEach(pane => {
            if (pane.dataset.tab === tabName) {
                pane.style.display = 'block';
            } else {
                pane.style.display = 'none';
            }
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
        
        if (tabName === 'datos' && currentUser?.rol === 'ADMIN') {
            loadDatosTab();
        }
    }
    
    async function loadDatosTab() {
        const parquesContainer = document.getElementById('parquesContainer');
        parquesContainer.innerHTML = \`<p>Total: \${parquesData.length} parques</p>\`;
        parquesData.forEach(parque => {
            parquesContainer.innerHTML += \`<div>• \${parque.nombre}</div>\`;
        });
        
        const personalContainer = document.getElementById('personalContainer');
        personalContainer.innerHTML = \`<p>Total: \${personalData.length} personas</p>\`;
        
        const supervisoresContainer = document.getElementById('supervisoresContainer');
        supervisoresContainer.innerHTML = \`<p>Total: \${supervisoresData.length} supervisores</p>\`;
        
        const actividadesContainer = document.getElementById('actividadesContainer');
        actividadesContainer.innerHTML = \`<p>Total: \${actividadesData.length} actividades</p>\`;
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
    
    let inactivityTimer;
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
    
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

export default getWebAppScript;
