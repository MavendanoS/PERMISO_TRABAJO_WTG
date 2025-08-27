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
    
    // PT Wind v18.0 - D1 Database Edition
    
    const API_BASE = window.location.origin + '/api';
    let currentUser = null;
    let authToken = null;
    let sessionId = null;
    
    // ========================================================================
    // ENDPOINT OBFUSCATOR - PROTECCIÓN DE NOMBRES DE ENDPOINTS
    // ========================================================================
    
    class EndpointObfuscator {
      constructor() {
        // Mapeo de endpoints reales a códigos ofuscados
        this.endpointMap = {
          // Endpoints públicos
          'login': 'a1b2c3',
          'health': 'h3a1th',
          'change-password': 'p4s5ch',
          
          // Endpoints de usuarios
          'users': 'u5r5d4',
          'personal': 'p3r5n1',
          'personal-by-parque': 'pbp789',
          'supervisores': 's9p3r5',
          'admin-users': 'a9u5r5',
          
          // Endpoints de catálogo
          'parques': 'p4rq35',
          'aerogeneradores': 'a3r0g5',
          'actividades': 'ac7v15',
          'matriz-riesgos': 'm4tr1x',
          
          // Endpoints de permisos
          'permisos': 'pr3m15',
          'permiso-detalle': 'pd3t41',
          'cerrar-permiso': 'cp3rm0',
          'aprobar-permiso': 'ap9r0v',
          'detalle-aprobacion': 'd4pr0b',
          'aprobar-cierre-permiso': 'acp9r0',
          
          // Endpoints de generación
          'generate-register': 'g3nr3g',
          'exportar-permiso-excel': 'epx3xc',
          'exportar-permiso-pdf': 'eppdf9'
        };
      }
      
      /**
       * Genera la URL ofuscada completa para un endpoint
       */
      getObfuscatedUrl(endpoint) {
        // Si tiene parámetros adicionales (como IDs), separarlos
        const parts = endpoint.split('/');
        const base = parts[0];
        const rest = parts.slice(1).join('/');
        
        const obfuscated = this.endpointMap[base];
        if (obfuscated) {
          const obfuscatedEndpoint = rest ? obfuscated + '/' + rest : obfuscated;
          return API_BASE + '/v/' + obfuscatedEndpoint;
        }
        
        // Si no está mapeado, usar ruta normal (fallback)
        return API_BASE + '/' + endpoint;
      }
    }
    
    // Instancia global del ofuscador
    const endpointObfuscator = new EndpointObfuscator();
    
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
    // FUNCIONES DE TIEMPO - ZONA HORARIA CHILE
    // ========================================================================
    
    function getChileDateTime(offsetMinutes = 0) {
      const now = new Date();
      
      // Determinar si estamos en horario de verano chileno (DST)
      const year = now.getUTCFullYear();
      
      // Segundo domingo de septiembre (inicio DST)
      const septemberSecondSunday = getSecondSunday(year, 8);
      // Primer domingo de abril (fin DST)
      const aprilFirstSunday = getFirstSunday(year, 3);
      
      const currentTime = now.getTime();
      const isDST = currentTime >= septemberSecondSunday.getTime() || currentTime < aprilFirstSunday.getTime();
      
      // UTC-3 durante DST, UTC-4 durante horario estándar
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
    
    // ========================================================================
    // FUNCIONES DE SEGURIDAD
    // ========================================================================
    
    // Función para hash seguro de contraseñas antes del envío
    async function hashPasswordForTransmission(password) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + '_pt_salt_2024'); // Salt adicional
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error('Error hasheando contraseña:', error);
            throw new Error('Error de seguridad al procesar contraseña');
        }
    }
    
    // Función para limpiar datos sensibles de memoria
    function clearSensitiveData(password, hashedPassword) {
        if (password) password = null;
        if (hashedPassword) hashedPassword = null;
        
        // Forzar garbage collection si está disponible
        if (window.gc) {
            window.gc();
        }
    }
    
    // Función para forzar HTTPS en producción
    function enforceHTTPS() {
        if (location.protocol !== 'https:' && 
            location.hostname !== 'localhost' && 
            location.hostname !== '127.0.0.1' &&
            !location.hostname.includes('.dev') &&
            !location.hostname.includes('workers.dev')) {
            location.replace('https:' + location.href.substring(location.protocol.length));
        }
    }
    
    // Validación adicional de contraseñas en el cliente
    function validatePasswordClient(password) {
        if (!password || password.length < 8) {
            throw new Error('Contraseña debe tener al menos 8 caracteres');
        }
        
        if (!/[A-Z]/.test(password)) {
            throw new Error('Contraseña debe contener al menos una letra mayúscula');
        }
        
        if (!/[a-z]/.test(password)) {
            throw new Error('Contraseña debe contener al menos una letra minúscula');
        }
        
        if (!/[0-9]/.test(password)) {
            throw new Error('Contraseña debe contener al menos un número');
        }
        
        if (!/[^a-zA-Z0-9]/.test(password)) {
            throw new Error('Contraseña debe contener al menos un carácter especial');
        }
        
        return true;
    }
    
    // Función para validar la fortaleza de contraseñas
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
          // Extraer endpoint base y parámetros de query
          const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
          const [baseEndpoint, queryParams] = cleanEndpoint.split('?');
          
          // Ofuscar solo la parte del endpoint, mantener parámetros
          const obfuscatedUrl = endpointObfuscator.getObfuscatedUrl(baseEndpoint);
          const url = queryParams ? obfuscatedUrl + '?' + queryParams : obfuscatedUrl;
          // Solo mostrar URL para requests que NO contengan datos sensibles
          if (!endpoint.includes('login') && !endpoint.includes('change-password')) {
            console.log('Making request to:', url);
          }
          
          const response = await fetch(url, {
            ...defaultOptions,
            ...options
          });
          
          // Solo mostrar status para requests que NO sean login/password
          if (!endpoint.includes('login') && !endpoint.includes('change-password')) {
            console.log('Response status:', response.status, response.statusText);
          }
          
          if (response.status === 401) {
            console.log('401 - Token expired, logging out');
            handleLogout();
            throw new Error('Sesión expirada');
          }
          
          let data;
          try {
            data = await processAPIResponse(response);
          } catch (jsonError) {
            console.error('Error parsing JSON response:', jsonError);
            console.log('Response text:', await response.text());
            throw new Error('Respuesta del servidor inválida');
          }
          
          if (!response.ok) {
            console.error('Request failed:', response.status, data);
            throw new Error(data.error || 'Error ' + response.status + ': ' + response.statusText);
          }
          
          return data;
        } catch (error) {
          console.error('Request error for', endpoint, ':', error);
          console.error('Error details:', error.message);
          throw error;
        }
      }
    }
    
    // ========================================================================
    // INICIALIZACIÓN (sin cambios)
    // ========================================================================
    
    document.addEventListener('DOMContentLoaded', async function() {
        // 🔐 SEGURIDAD: Forzar HTTPS en producción
        enforceHTTPS();
        // Inicializando aplicación...
        
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
    // FUNCIONES DE SEGURIDAD DE DATOS
    // ========================================================================
    
    class DataDeobfuscator {
      async deobfuscate(obfuscatedData) {
        try {
          if (!obfuscatedData || !obfuscatedData._) {
            return obfuscatedData;
          }

          const base64 = obfuscatedData._;
          
          if (obfuscatedData.v === 1) {
            // Versión con compresión
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Descomprimir
            const blob = new Blob([bytes]);
            const stream = blob.stream();
            const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
            const decompressedBlob = await new Response(decompressedStream).blob();
            const text = await decompressedBlob.text();
            
            return JSON.parse(text);
          } else {
            // Versión sin compresión (fallback)
            return JSON.parse(decodeURIComponent(escape(atob(base64))));
          }
        } catch (error) {
          console.error('Deobfuscation failed:', error);
          // Si falla, intentar parsear como JSON normal
          if (typeof obfuscatedData === 'string') {
            try {
              return JSON.parse(obfuscatedData);
            } catch {
              return obfuscatedData;
            }
          }
          return obfuscatedData;
        }
      }
      
      static isObfuscated(data) {
        return data && data._ && (data.v === 0 || data.v === 1);
      }
    }
    
    // Instancia global del deobfuscator
    const dataDeobfuscator = new DataDeobfuscator();
    
    // Función para procesar respuestas (desofuscar si es necesario)
    async function processAPIResponse(response) {
      try {
        const data = await response.json();
        
        // Si la respuesta está ofuscada, desofuscarla
        if (DataDeobfuscator.isObfuscated(data)) {
          return await dataDeobfuscator.deobfuscate(data);
        }
        
        // Si no está ofuscada, retornar tal como está
        return data;
      } catch (error) {
        console.error('Error processing API response:', error);
        // En caso de error, intentar devolver los datos sin procesar
        return null;
      }
    }
    
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
        const filterEstado = document.getElementById('filterEstado');
        if (filterEstado) filterEstado.addEventListener('change', filterPermisos);
        const fechaDesde = document.getElementById('fechaDesde');
        if (fechaDesde) fechaDesde.addEventListener('change', filterPermisos);
        const fechaHasta = document.getElementById('fechaHasta');
        if (fechaHasta) fechaHasta.addEventListener('change', filterPermisos);
        
        // Modal de cierre
        on('cancelarCierreBtn', 'click', closeCerrarModal);
        on('confirmarCierreBtn', 'click', handleConfirmarCierre);
        on('addMaterialBtn', 'click', addMaterial);
        
        // Administración de usuarios - un solo botón en template
        on('btnNuevoUsuario', 'click', openNuevoUsuarioModal);
        on('btnRefreshUsuarios', 'click', loadUsuarios);
        on('usuarioForm', 'submit', handleGuardarUsuario);
        on('cancelarUsuarioBtn', 'click', closeUsuarioModal);
        on('closeUsuarioModalBtn', 'click', closeUsuarioModal);
        on('cancelarEliminarUsuarioBtn', 'click', closeConfirmarEliminarModal);
        on('confirmarEliminarUsuarioBtn', 'click', handleEliminarUsuario);
        
        // Event listeners para exportación
        on('exportExcelBtn', 'click', () => executeExport('excel'));
        on('exportPdfBtn', 'click', () => executeExport('pdf'));
        on('cancelExportBtn', 'click', closeExportModal);
        
        // Cerrar modal de exportación al hacer clic fuera
        const exportModal = document.getElementById('exportModal');
        if (exportModal) {
            exportModal.addEventListener('click', function(event) {
                if (event.target === exportModal) {
                    closeExportModal();
                }
            });
        }
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
        
        let hashedPassword = null;
        
        try {
            // 🔐 SISTEMA HÍBRIDO: Intentar hash primero, fallback automático si falla
            hashedPassword = await hashPasswordForTransmission(password);
            console.log('🔐 Intentando login con hash del cliente...');
            
            const response = await fetch(endpointObfuscator.getObfuscatedUrl('login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    usuario, 
                    password: hashedPassword,
                    isHashedClient: true
                })
            });
            
            const result = await processAPIResponse(response);
            
            // 🔄 FALLBACK AUTOMÁTICO: Si falla con hash, intentar sin hash
            if (!result.success) {
                console.log('⚠️ Login con hash falló, intentando sistema legacy...');
                
                const legacyResponse = await fetch(endpointObfuscator.getObfuscatedUrl('login'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        usuario, 
                        password: password // Contraseña original
                        // Sin isHashedClient = true
                    })
                });
                
                const legacyResult = await processAPIResponse(legacyResponse);
                if (legacyResult.success) {
                    console.log('✅ Login exitoso con sistema legacy');
                    // Usar resultado del sistema legacy
                    authToken = legacyResult.token;
                    sessionId = legacyResult.sessionId;
                    currentUser = legacyResult.user;
                    
                    sessionStorage.setItem('authToken', authToken);
                    if (sessionId) {
                        sessionStorage.setItem('sessionId', sessionId);
                    }
                    
                    if (legacyResult.requiresPasswordChange) {
                        showChangePasswordModal(legacyResult.changeReason);
                    } else {
                        await loadAppData();
                        showApp();
                        resetInactivityTimer();
                    }
                    return; // Salir exitosamente
                } else {
                    // Ambos sistemas fallaron
                    showLoginError(legacyResult.message || 'Error al iniciar sesión');
                    return;
                }
            }
            
            if (result.success) {
                authToken = result.token;
                sessionId = result.sessionId;
                currentUser = result.user;
                
                sessionStorage.setItem('authToken', authToken);
                if (sessionId) {
                    sessionStorage.setItem('sessionId', sessionId);
                }
                if (result.requirePasswordChange) {
                    showChangePasswordModal(result.changeReason);
                } else {
                    await loadAppData();
                    showApp();
                    // Iniciar timer de inactividad después del login exitoso
                    resetInactivityTimer();
                }
            } else {
                showLoginError(result.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            showLoginError('Error de conexión: ' + error.message);
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Iniciar Sesión';
            
            // 🔐 SEGURIDAD: Limpiar datos sensibles de memoria
            clearSensitiveData(password, hashedPassword);
            document.getElementById('password').value = '';
        }
    }

    // Nueva función para mostrar modal de cambio obligatorio
    function showChangePasswordModal(reason) {
        const modal = document.getElementById('changePasswordModal');
        modal.style.display = 'flex';
        
        // Mostrar el motivo del cambio requerido
        const reasonDiv = document.getElementById('passwordChangeReason');
        if (reasonDiv) {
            reasonDiv.textContent = reason || 'Por razones de seguridad, debe cambiar su contraseña.';
            reasonDiv.style.display = 'block';
        }
        
        // Mostrar requisitos de contraseña
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
    const submitBtn = document.getElementById('submitPasswordChangeBtn');
    let hashedNewPassword = null; // 🔐 Declarar fuera del try-catch para acceso en finally
    
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
    
    // Validación completa de contraseña segura
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
        errorDiv.textContent = passwordValidation.message;
        errorDiv.style.display = 'block';
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Cambiando contraseña...';
    
    try {
        // 🔐 SEGURIDAD: Hash la nueva contraseña antes del envío
        hashedNewPassword = await hashPasswordForTransmission(newPassword);
        
        const response = await fetch(endpointObfuscator.getObfuscatedUrl('change-password'), {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({ 
                newPassword: hashedNewPassword,
                isHashedClient: true
            })
        });
        
        const result = await processAPIResponse(response);
        
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
        
        // 🔐 SEGURIDAD: Limpiar datos sensibles de memoria
        clearSensitiveData(newPassword, hashedNewPassword);
        document.getElementById('mandatoryNewPassword').value = '';
        document.getElementById('mandatoryConfirmPassword').value = '';
    }
    }
    async function verifyAndLoadApp() {
        try {
            // Primero verificar que el token existe y obtener información del usuario
            if (!authToken) {
                handleLogout();
                return;
            }

            // Decodificar el token para obtener información del usuario
            try {
                const payload = JSON.parse(atob(authToken.split('.')[1]));
                
                // Verificar que el token no haya expirado
                if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
                    console.log('Token expirado');
                    handleLogout();
                    return;
                }

                // Restaurar currentUser desde el token
                currentUser = {
                    id: payload.id || payload.sub,
                    usuario: payload.usuario,
                    email: payload.email,
                    rol: payload.rol,
                    empresa: payload.empresa,
                    parques: Array.isArray(payload.parques) ? payload.parques : [],
                    esEnel: payload.esEnel || false
                };

                console.log('Usuario restaurado desde token:', currentUser);
            } catch (error) {
                console.error('Error decodificando token:', error);
                handleLogout();
                return;
            }

            // Verificar conectividad con el servidor
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
    
    // Auto-logout por inactividad (30 minutos)
    let inactivityTimer = null;
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos en milisegundos
    
    function resetInactivityTimer() {
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }
        
        // Solo configurar timer si hay usuario logueado
        if (authToken) {
            inactivityTimer = setTimeout(() => {
                alert('Sesión expirada por inactividad. Debe iniciar sesión nuevamente.');
                handleLogout();
            }, INACTIVITY_TIMEOUT);
        }
    }
    
    function handleLogout() {
        authToken = null;
        sessionId = null;
        currentUser = null;
        sessionStorage.clear();
        
        // Limpiar timer de inactividad
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
            inactivityTimer = null;
        }
        
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
            
            if (['admin', 'Admin', 'ADMIN', 'administrator', 'Administrator'].includes(currentUser.rol)) {
                document.getElementById('tabDatos').style.display = 'block';
                document.getElementById('tabAdminUsuarios').style.display = 'block';
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
        // Cargando datos de la aplicación...
        
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
            
            // Datos cargados exitosamente
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
        
        // Limpiar personal seleccionado al cambiar de planta
        personalSeleccionado = [];
        const personalSeleccionadoContainer = document.getElementById('personalSeleccionado');
        personalSeleccionadoContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No hay personal seleccionado</div>';
        
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
        
        // Determinar si estamos editando o creando
        const isEditing = window.permisoEditando !== undefined;
        
        // Deshabilitar el botón de submit para evitar múltiples envíos
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
            fechaInicio: formatChileDateTime(getChileDateTime())
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
            let response;
            
            if (isEditing) {
                // Agregar ID del permiso para edición
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
                
                // Resetear estado de edición
                if (isEditing) {
                    window.permisoEditando = undefined;
                    submitButton.textContent = 'CREAR PERMISO DE TRABAJO';
                }
                
                await loadPermisos();
                switchTab('consultar');
                
                // Re-habilitar el botón después del éxito
                submitButton.disabled = false;
                submitButton.textContent = isEditing ? 'CREAR PERMISO DE TRABAJO' : originalText;
            } else {
                const accion = isEditing ? 'actualizar' : 'crear';
                alert(\`Error al \${accion} el permiso: \` + (response.error || 'Error desconocido'));
                // Re-habilitar el botón si hay error
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        } catch (error) {
            const accion = isEditing ? 'actualizando' : 'creando';
            console.error(\`Error \${accion} permiso:\`, error);
            alert(\`Error al \${accion} el permiso: \` + error.message);
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
            
            // Configurar límites de fechas basados en los permisos cargados
            setupDateLimits();
            
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
        
        // Verificar si el usuario es el creador del permiso
        const esCreador = currentUser?.id && permiso.usuario_creador_id && 
                         currentUser.id.toString() === permiso.usuario_creador_id.toString();
        
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
        } else if (permiso.estado === 'CERRADO_PENDIENTE_APROBACION') {
            estadoTexto = 'CERRADO - PENDIENTE APROBACIÓN';
        } else if (permiso.estado === 'CIERRE_RECHAZADO') {
            estadoTexto = 'CIERRE RECHAZADO';
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
                                        \${permiso.estado === 'CERRADO_PENDIENTE_APROBACION' && (currentUser.rol === 'Admin' || currentUser.rol === 'Supervisor') ? \`
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
        const searchTerm = document.getElementById('searchPermiso').value.toLowerCase();
        const estadoFilter = document.getElementById('filterEstado').value;
        const fechaDesde = document.getElementById('fechaDesde').value;
        const fechaHasta = document.getElementById('fechaHasta').value;
        const txt = v => String(v ?? '').toLowerCase();
        
        // Filtrar primero por parques autorizados
        const parquesAutorizados = currentUser?.parques || [];
        const esEnel = currentUser?.esEnel || false;
        
        const permisosAutorizados = permisosData.filter(permiso => {
            return esEnel || parquesAutorizados.includes(permiso.planta_nombre);
        });
        
        // Filtrar por estado si se seleccionó uno
        let filtered = permisosAutorizados;
        if (estadoFilter) {
            filtered = filtered.filter(p => p.estado === estadoFilter);
        }
        
        // Filtrar por rango de fechas
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
        
        // Filtrar por término de búsqueda si hay uno
        if (searchTerm) {
            filtered = filtered.filter(p =>
                txt(p.numero_pt).includes(searchTerm) ||
                txt(p.planta_nombre).includes(searchTerm) ||
                txt(p.descripcion).includes(searchTerm) ||
                txt(p.jefe_faena_nombre).includes(searchTerm)
            );
        }
        
        // Si no hay filtros aplicados, mostrar todos
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
    
    // ========================================================================
    // FUNCIONES DE EXPORTACIÓN
    // ========================================================================
    
    // Función para mostrar/ocultar menú de exportación
    window.toggleExportMenu = function(permisoId) {
        // Cerrar otros menús abiertos
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
    
    // Función para exportar archivo (Excel o PDF)
    window.exportarArchivo = async function(permisoId, numeroPT, tipo) {
        // Cerrar menú
        const menu = document.getElementById(\`exportMenu_\${permisoId}\`);
        if (menu) menu.style.display = 'none';
        
        try {
            const endpoint = tipo === 'excel' ? '/exportar-permiso-excel' : '/exportar-permiso-pdf';
            const extension = tipo === 'excel' ? 'xlsx' : 'pdf';
            const fechaActual = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const descripcion = '_' + fechaActual;
            
            // Realizar petición
            const response = await fetch(endpointObfuscator.getObfuscatedUrl(endpoint.replace('/', '')) + \`?id=\${permisoId}\`, {
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                    'X-Session-Id': sessionId
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al generar el archivo');
            }
            
            // Descargar archivo
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
    
    // Cerrar menús al hacer click fuera
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.export-dropdown')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.style.display = 'none';
            });
        }
    });
    
    function setupDateLimits() {
        if (!permisosData || permisosData.length === 0) return;
        
        // Obtener todas las fechas de creación de los permisos
        const fechas = permisosData
            .map(p => p.fecha_creacion)
            .filter(f => f) // Filtrar fechas válidas
            .map(f => new Date(f))
            .filter(d => !isNaN(d.getTime())); // Filtrar fechas válidas
        
        if (fechas.length === 0) return;
        
        // Encontrar fecha mínima y máxima
        const fechaMin = new Date(Math.min(...fechas));
        const fechaMax = new Date(Math.max(...fechas));
        
        // Formatear para input type="date" (YYYY-MM-DD)
        const formatDate = (date) => {
            return date.toISOString().split('T')[0];
        };
        
        // Configurar límites en los inputs
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
        document.getElementById('searchPermiso').value = '';
        document.getElementById('filterEstado').value = '';
        document.getElementById('fechaDesde').value = '';
        document.getElementById('fechaHasta').value = '';
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
    
    // Función para abrir modal básico de aprobación de cierre
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
    
    // Función auxiliar para escapar comillas en strings de JavaScript
    function escapeJsString(str) {
        return (str || '').replace(/'/g, '\\'');
    }
    
    // Función para reenviar cierre rechazado
    window.openReenviarCierreModal = async function(permisoId, numeroPT, planta, aerogenerador) {
        try {
            // Obtener detalles del permiso rechazado
            const response = await ClientSecurity.makeSecureRequest('/permiso-detalle?id=' + permisoId);
            if (!response.success) {
                throw new Error('Error al obtener detalles del permiso: ' + (response.error || 'Error desconocido'));
            }
            const permiso = response.permiso;
            
            // Mostrar alerta informativa con el motivo de rechazo
            if (permiso.motivo_rechazo) {
                const confirmReenvio = confirm(
                    'ATENCION: Este permiso fue RECHAZADO\\n\\n' +
                    'MOTIVO DEL RECHAZO:\\n' + permiso.motivo_rechazo + '\\n\\n' +
                    'Desea corregir los errores y reenviar el cierre?'
                );
                if (!confirmReenvio) return;
            }
            
            // Pre-cargar el modal con datos anteriores
            document.querySelector('#cerrarPermisoModal h3').textContent = '🔄 REENVIAR CIERRE - ' + numeroPT;
            document.getElementById('permisoInfoNumero').textContent = numeroPT;
            document.getElementById('permisoInfoPlanta').textContent = planta;
            document.getElementById('permisoInfoAerogenerador').textContent = aerogenerador;
            
            // Función auxiliar para convertir fecha de forma segura
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
            
            // Pre-poblar campos con datos existentes (verificando que existan)
            const fechaInicioEl = document.getElementById('fechaInicioTrabajos');
            if (fechaInicioEl) fechaInicioEl.value = safeDateToISOString(permiso.fecha_inicio_trabajos);
            
            const fechaFinEl = document.getElementById('fechaFinTrabajos');
            if (fechaFinEl) fechaFinEl.value = safeDateToISOString(permiso.fecha_fin_trabajos);
            
            const fechaParadaEl = document.getElementById('fechaParadaTurbina');
            if (fechaParadaEl) fechaParadaEl.value = safeDateToISOString(permiso.fecha_parada_turbina);
            
            const fechaPuestaEl = document.getElementById('fechaPuestaMarcha');
            if (fechaPuestaEl) fechaPuestaEl.value = safeDateToISOString(permiso.fecha_puesta_marcha_turbina);
            
            // Agregar contexto de reenvío a las observaciones
            const observacionesEl = document.getElementById('observacionesCierre');
            if (observacionesEl) {
                const observacionesActuales = permiso.observaciones_cierre || 'Trabajo completado según programación';
                const contextoReenvio = 'REENVIO - Correccion aplicada tras rechazo:\\n"' + (permiso.motivo_rechazo || 'Sin motivo especifico') + '"\\n\\n' + observacionesActuales;
                observacionesEl.value = contextoReenvio;
            }
            
            // Pre-cargar materiales existentes
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
            
            // Agregar banner informativo
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
                    // Si no encuentra .modal-content, insertarlo al inicio del modal
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
        // Limpiar banner de reenvío al cerrar
        const modal = document.getElementById('cerrarPermisoModal');
        const banner = modal.querySelector('.reenvio-banner');
        if (banner) {
            banner.remove();
        }
        
        // Restaurar título original
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
            const response = await fetch(endpointObfuscator.getObfuscatedUrl('generate-register'), {
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
        
        if (tabName === 'datos' && ['admin', 'Admin', 'ADMIN', 'administrator', 'Administrator'].includes(currentUser?.rol)) {
            loadDatosTab();
        } else if (tabName === 'admin-usuarios' && ['admin', 'Admin', 'ADMIN', 'administrator', 'Administrator'].includes(currentUser?.rol)) {
            loadUsuarios();
        }
    }
    
    async function loadDatosTab() {
        const parquesContainer = document.getElementById('parquesContainer');
        if (parquesContainer && parquesData) {
            parquesContainer.innerHTML = '<p>Total: ' + parquesData.length + ' parques</p>';
            parquesData.forEach(parque => {
                parquesContainer.innerHTML += '<div>• ' + parque.nombre + '</div>';
            });
        }
        
        const personalContainer = document.getElementById('personalContainer');
        if (personalContainer && personalData) {
            personalContainer.innerHTML = '<p>Total: ' + personalData.length + ' personas</p>';
        }
        
        // 🔧 CORREGIDO: Cargar TODOS los supervisores del sistema, no solo los filtrados
        const supervisoresContainer = document.getElementById('supervisoresContainer');
        if (supervisoresContainer) {
            try {
                // Hacer consulta independiente para obtener todos los supervisores
                supervisoresContainer.innerHTML = '<p>Cargando supervisores...</p>';
                const response = await ClientSecurity.makeSecureRequest('/supervisores?todos=true');
                const todosSupervisores = response.results || [];
                supervisoresContainer.innerHTML = '<p>Total: ' + todosSupervisores.length + ' supervisores</p>';
            } catch (error) {
                console.error('Error cargando supervisores globales:', error);
                supervisoresContainer.innerHTML = '<p>Error al cargar supervisores</p>';
            }
        }
        
        const actividadesContainer = document.getElementById('actividadesContainer');
        if (actividadesContainer && actividadesData) {
            actividadesContainer.innerHTML = '<p>Total: ' + actividadesData.length + ' actividades</p>';
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
            const response = await fetch(endpointObfuscator.getObfuscatedUrl('health'));
            const data = await processAPIResponse(response);
            
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
    
    // ========================================================================
    // FUNCIONES DE EXPORTACIÓN CON MODAL
    // ========================================================================
    
    let currentExportPermisoId = null;
    let currentExportPermisoInfo = null;
    
    window.openExportModal = function(permisoId, permisoInfo) {
        currentExportPermisoId = permisoId;
        currentExportPermisoInfo = permisoInfo;
        
        document.getElementById('exportPermisoInfo').textContent = permisoInfo || \`ID: \${permisoId}\`;
        document.getElementById('exportModal').style.display = 'flex';
        
        // Reset status
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
            // Mostrar estado de carga
            document.getElementById('exportStatus').style.display = 'block';
            document.getElementById('exportStatusText').textContent = \`Generando \${formato.toUpperCase()}...\`;
            document.getElementById('exportExcelBtn').disabled = true;
            document.getElementById('exportPdfBtn').disabled = true;
            
            const fechaActual = new Date().toISOString().split('T')[0].replace(/-/g, '');
            let endpoint, filename;
            if (formato === 'excel') {
                endpoint = \`\${API_BASE}/exportar-permiso-excel?id=\${currentExportPermisoId}\`;
                filename = \`\${currentExportPermisoInfo}_\${fechaActual}.csv\`;
            } else {
                endpoint = \`\${API_BASE}/exportar-permiso-pdf?id=\${currentExportPermisoId}\`;
                filename = \`\${currentExportPermisoInfo}_\${fechaActual}.html\`;
            }
            
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': 'Bearer ' + authToken
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
                throw new Error(errorData.error || \`Error HTTP: \${response.status}\`);
            }
            
            // DIFERENCIACIÓN: PDF vs Excel
            if (formato === 'pdf') {
                // Para PDF (HTML): Abrir en nueva ventana como generateRegister
                document.getElementById('exportStatusText').textContent = 'Abriendo vista para imprimir...';
                
                const html = await response.text();
                const newWindow = window.open('', '_blank');
                newWindow.document.write(html);
                newWindow.document.close();
                
                // Reset UI y cerrar modal inmediatamente
                document.getElementById('exportStatus').style.display = 'none';
                document.getElementById('exportExcelBtn').disabled = false;
                document.getElementById('exportPdfBtn').disabled = false;
                showMessage('PDF abierto para imprimir', 'success');
                closeExportModal();
                
            } else {
                // Para Excel: Descargar archivo como antes
                document.getElementById('exportStatusText').textContent = 'Descargando archivo...';
                
                const blob = await response.blob();
                
                // Verificar que el blob tiene contenido
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
                
                // Cleanup
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                }, 100);
                
                // Reset UI y cerrar modal después de la descarga
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
            
            // Reset UI
            document.getElementById('exportStatus').style.display = 'none';
            document.getElementById('exportExcelBtn').disabled = false;
            document.getElementById('exportPdfBtn').disabled = false;
        }
    }
    
    // Función auxiliar para mostrar mensajes
    function showMessage(message, type = 'info') {
        // Usar alert simple por ahora
        alert(message);
    }
    
    // Event listeners para exportación se configuran en setupEventListeners()
    
    // Función para editar un permiso existente
    window.editarPermiso = async function(permisoId) {
        console.log('Iniciando edición de permiso ID:', permisoId);
        try {
            // Obtener los datos completos del permiso
            const response = await ClientSecurity.makeSecureRequest(\`/permiso-detalle?id=\${permisoId}\`);
            
            if (!response.success) {
                alert('Error al cargar los datos del permiso: ' + (response.error || 'Error desconocido'));
                return;
            }
            
            const permiso = response.permiso;
            
            // Verificar que el permiso esté en estado CREADO
            if (permiso.estado !== 'CREADO') {
                alert('Solo se pueden editar permisos en estado CREADO');
                return;
            }
            
            // Cambiar a la pestaña de nuevo permiso
            const nuevoTab = document.querySelector('[data-tab="nuevo"]');
            const tabs = document.querySelectorAll('.tab');
            const contents = document.querySelectorAll('.tab-content');
            
            tabs.forEach(tab => tab.classList.remove('active'));
            contents.forEach(content => content.classList.remove('active'));
            
            nuevoTab.classList.add('active');
            document.getElementById('tab-nuevo').classList.add('active');
            
            // Rellenar el formulario con los datos del permiso
            await llenarFormularioEdicion(permiso);
            
            // Indicar que se está editando
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
        // Llenar campos básicos
        document.getElementById('planta').value = permiso.planta_id || '';
        document.getElementById('descripcion').value = permiso.descripcion || '';
        document.getElementById('tipoMantenimiento').value = permiso.tipo_mantenimiento || '';
        
        if (permiso.tipo_mantenimiento === 'OTROS' && permiso.tipo_otros) {
            document.getElementById('tipoOtros').value = permiso.tipo_otros;
            document.getElementById('tipoOtrosContainer').style.display = 'block';
        }
        
        // Disparar eventos para cargar datos dependientes
        if (permiso.planta_id) {
            // Simular evento de cambio de planta para cargar aerogeneradores y personal
            const plantaSelect = document.getElementById('planta');
            const fakeEvent = { target: plantaSelect };
            await handlePlantaChange(fakeEvent);
            
            // Seleccionar aerogenerador
            if (permiso.aerogenerador_id) {
                document.getElementById('aerogenerador').value = permiso.aerogenerador_id;
            }
            
            // Seleccionar jefe de faena
            if (permiso.jefe_faena_id) {
                document.getElementById('jefeFaena').value = permiso.jefe_faena_id;
            }
            
            // Seleccionar supervisor
            if (permiso.supervisor_parque_id) {
                document.getElementById('supervisorParque').value = permiso.supervisor_parque_id;
            }
        }
        
        // Marcar actividades seleccionadas
        if (permiso.actividades_ids) {
            const actividadIds = permiso.actividades_ids.split(',').map(id => id.trim());
            actividadIds.forEach(actividadId => {
                const checkbox = document.querySelector(\`input[name="actividades"][value="\${actividadId}"]\`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
            
            // Actualizar matriz de riesgos
            updateMatrizDisplay();
        }
        
        // Cargar personal seleccionado
        if (permiso.personal_ids) {
            personalSeleccionado = [];
            const personalIds = permiso.personal_ids.split(',').map(id => id.trim());
            
            // Buscar el personal en los datos cargados
            const plantaNombre = document.querySelector('#planta option:checked')?.textContent;
            if (plantaNombre && personalByParque[plantaNombre]) {
                personalIds.forEach(personalId => {
                    const persona = personalByParque[plantaNombre].find(p => p.id.toString() === personalId);
                    if (persona) {
                        personalSeleccionado.push(persona);
                    }
                });
                
                // Actualizar la vista del personal seleccionado
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
    
    // ========================================================================
    // DETECCIÓN DE ACTIVIDAD PARA AUTO-LOGOUT
    // ========================================================================
    
    // Eventos que indican actividad del usuario
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    function setupActivityListeners() {
        activityEvents.forEach(event => {
            document.addEventListener(event, resetInactivityTimer, true);
        });
    }
    
    // Configurar listeners cuando se cargue la aplicación
    if (typeof window !== 'undefined') {
        setupActivityListeners();
    }
    
    // ========================================================================
    // ADMINISTRACIÓN DE USUARIOS - VERSIÓN MODERNA
    // ========================================================================
    
    let usuarioEditando = null;
    let parquesDisponibles = [];
    let parquesSeleccionados = [];
    
    // Cargar parques disponibles
    async function loadParquesDisponibles() {
        try {
            const response = await ClientSecurity.makeSecureRequest('/parques');
            if (response.results && Array.isArray(response.results)) {
                parquesDisponibles = response.results.map(parque => ({
                    id: parque.id || parque.nombre,
                    nombre: parque.nombre,
                    codigo: parque.codigo
                }));
            }
            return parquesDisponibles;
        } catch (error) {
            console.error('Error cargando parques:', error);
            return [];
        }
    }
    
    async function loadUsuarios() {
        const container = document.getElementById('usuariosContainer');
        if (!container) return;
        
        try {
            // Estado de carga mejorado
            container.innerHTML = '<div class="loading-state">' +
                '<div class="loading-spinner"></div>' +
                '<span>Cargando usuarios...</span>' +
            '</div>';
            
            const response = await ClientSecurity.makeSecureRequest('/admin-users');
            
            if (!response.success) {
                container.innerHTML = '<div class="error">❌ Error al cargar usuarios: ' + (response.error || 'Error desconocido') + '</div>';
                return;
            }
            
            const usuarios = response.users || [];
            
            if (usuarios.length === 0) {
                container.innerHTML = 
                    '<div class="admin-controls-bar">' +
                        '<div class="admin-actions" style="justify-content: center;">' +
                            '<p class="empty-state-message">No hay usuarios registrados. Use el botón "➕ Nuevo Usuario" arriba para crear el primer usuario.</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="no-users-state">' +
                        '<div class="no-users-icon">👥</div>' +
                        '<div class="no-users-text">No hay usuarios registrados</div>' +
                        '<div class="no-users-subtext">Crea el primer usuario para comenzar</div>' +
                    '</div>';
                return;
            }
            
            // Almacenar usuarios globalmente para la búsqueda
            window.todosLosUsuarios = usuarios;
            
            // Crear barra de búsqueda y controles
            let html = '<div class="admin-controls-bar">' +
                '<div class="search-container">' +
                    '<input type="text" id="usuariosSearchInput" placeholder="🔍 Buscar por nombre, email, empresa..." class="search-input">' +
                    '<button class="btn-clear" onclick="clearUsuariosSearch()" title="Limpiar búsqueda">✕</button>' +
                '</div>' +
                '<div class="admin-actions">' +
                    '<span id="usuariosCount" class="users-count">' + usuarios.length + ' usuarios encontrados</span>' +
                    '<button id="btnRefreshUsuarios" class="btn btn-secondary" onclick="loadUsuarios()" title="Actualizar lista">' +
                        '<span class="btn-icon">🔄</span>' +
                    '</button>' +
                '</div>' +
            '</div>';
            
            // Crear grid de cards moderno
            html += '<div class="users-grid" id="usersGrid">';
            html += renderUsuarios(usuarios);
            html += '</div>';
            
            container.innerHTML = html;
            
            // Configurar evento de búsqueda
            const searchInput = document.getElementById('usuariosSearchInput');
            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    filterUsuarios(this.value);
                });
                
                // Búsqueda en tiempo real con debounce
                let searchTimeout;
                searchInput.addEventListener('keyup', function() {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        filterUsuarios(this.value);
                    }, 300);
                });
            }
            
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            container.innerHTML = '<div class="error">❌ Error de conexión al cargar usuarios</div>';
        }
    }
    
    function renderUsuarios(usuarios) {
        let html = '';
        usuarios.forEach(usuario => {
            const initials = getInitials(usuario.usuario || 'U');
            const parquesList = usuario.parques_autorizados ? 
                usuario.parques_autorizados.split(',').map(p => p.trim()) : [];
            
            html += '<div class="user-card">' +
                '<div class="user-status-badge ' + (usuario.estado === 'Activo' ? 'status-active' : 'status-inactive') + '">' +
                    (usuario.estado === 'Activo' ? '✅ Activo' : '❌ Inactivo') +
                '</div>' +
                
                '<div class="user-avatar">' + initials + '</div>' +
                
                '<div class="user-name">' + ClientSecurity.encodeHTML(usuario.usuario || '') + '</div>' +
                '<div class="user-email">📧 ' + ClientSecurity.encodeHTML(usuario.email || '') + '</div>' +
                
                '<div class="user-info-grid">';
            
            // Información básica
            if (usuario.rut || usuario.rut_dni) {
                html += '<div class="user-info-item">' +
                    '<span class="user-info-icon">🆔</span>' +
                    '<span class="user-info-label">RUT/DNI</span>' +
                    '<span class="user-info-value">' + ClientSecurity.encodeHTML(usuario.rut || usuario.rut_dni) + '</span>' +
                '</div>';
            }
            
            if (usuario.telefono) {
                html += '<div class="user-info-item">' +
                    '<span class="user-info-icon">📱</span>' +
                    '<span class="user-info-label">Teléfono</span>' +
                    '<span class="user-info-value">' + ClientSecurity.encodeHTML(usuario.telefono) + '</span>' +
                '</div>';
            }
            
            html += '<div class="user-info-item">' +
                '<span class="user-info-icon">🎭</span>' +
                '<span class="user-info-label">Rol</span>' +
                '<span class="user-info-value">' +
                    '<span class="badge badge-' + getRoleBadgeClass(usuario.rol) + '">' + 
                        getRoleDisplayName(usuario.rol) + 
                    '</span>' +
                '</span>' +
            '</div>';
            
            if (usuario.cargo) {
                html += '<div class="user-info-item">' +
                    '<span class="user-info-icon">💼</span>' +
                    '<span class="user-info-label">Cargo</span>' +
                    '<span class="user-info-value">' + ClientSecurity.encodeHTML(usuario.cargo) + '</span>' +
                '</div>';
            }
            
            if (usuario.empresa) {
                html += '<div class="user-info-item">' +
                    '<span class="user-info-icon">🏢</span>' +
                    '<span class="user-info-label">Empresa</span>' +
                    '<span class="user-info-value">' + ClientSecurity.encodeHTML(usuario.empresa) + '</span>' +
                '</div>';
            }
            
            if (usuario.password_temporal) {
                html += '<div class="user-info-item">' +
                    '<span class="user-info-icon">🔑</span>' +
                    '<span class="user-info-label">Password</span>' +
                    '<span class="user-info-value">' +
                        '<span class="badge badge-warning">⚠️ Temporal</span>' +
                    '</span>' +
                '</div>';
            }
            
            html += '</div>';
            
            // Parques autorizados
            if (parquesList.length > 0) {
                html += '<div class="user-parques">' +
                    '<div class="user-info-label">🏭 Parques Autorizados</div>' +
                    '<div class="parques-badges">';
                
                parquesList.forEach(parque => {
                    if (parque.trim()) {
                        html += '<span class="parque-badge">' + ClientSecurity.encodeHTML(parque.trim()) + '</span>';
                    }
                });
                
                html += '</div></div>';
            }
            
            // Acciones
            html += '<div class="user-actions">' +
                '<button class="btn btn-small btn-secondary btn-with-icon" onclick="editarUsuario(' + usuario.id + ')" title="Editar Usuario">' +
                    '<span class="btn-icon">✏️</span>' +
                    'Editar' +
                '</button>' +
                '<button class="btn btn-small btn-danger btn-with-icon" onclick="confirmarEliminarUsuario(' + usuario.id + ', &quot;' + ClientSecurity.encodeHTML(usuario.usuario) + '&quot;)" title="Eliminar Usuario">' +
                    '<span class="btn-icon">🗑️</span>' +
                    'Eliminar' +
                '</button>' +
            '</div>' +
            
            '</div>';
        });
        
        return html;
    }
    
    // Funciones de búsqueda y filtrado
    function filterUsuarios(searchTerm) {
        if (!window.todosLosUsuarios) return;
        
        const term = searchTerm.toLowerCase().trim();
        
        if (term === '') {
            // Mostrar todos los usuarios
            updateUsersDisplay(window.todosLosUsuarios);
            return;
        }
        
        const filtered = window.todosLosUsuarios.filter(usuario => {
            return (
                usuario.usuario?.toLowerCase().includes(term) ||
                usuario.email?.toLowerCase().includes(term) ||
                usuario.empresa?.toLowerCase().includes(term) ||
                usuario.rol?.toLowerCase().includes(term) ||
                usuario.cargo?.toLowerCase().includes(term) ||
                usuario.rut?.toLowerCase().includes(term) ||
                usuario.rut_dni?.toLowerCase().includes(term) ||
                usuario.telefono?.includes(term)
            );
        });
        
        updateUsersDisplay(filtered);
    }
    
    function updateUsersDisplay(usuarios) {
        const usersGrid = document.getElementById('usersGrid');
        const usersCount = document.getElementById('usuariosCount');
        
        if (!usersGrid) return;
        
        if (usuarios.length === 0) {
            usersGrid.innerHTML = '<div class="no-results-state">' +
                '<div class="no-results-icon">🔍</div>' +
                '<div class="no-results-text">No se encontraron usuarios</div>' +
                '<div class="no-results-subtext">Intenta con otro término de búsqueda</div>' +
            '</div>';
        } else {
            usersGrid.innerHTML = renderUsuarios(usuarios);
        }
        
        if (usersCount) {
            usersCount.textContent = usuarios.length + ' usuarios encontrados';
        }
    }
    
    function clearUsuariosSearch() {
        const searchInput = document.getElementById('usuariosSearchInput');
        if (searchInput) {
            searchInput.value = '';
            filterUsuarios('');
        }
    }
    
    // Hacer funciones accesibles globalmente
    window.filterUsuarios = filterUsuarios;
    window.clearUsuariosSearch = clearUsuariosSearch;
    
    function getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    
    function getRoleDisplayName(rol) {
        switch(rol?.toLowerCase()) {
            case 'admin': return '👑 Administrador';
            case 'supervisor': return '👨‍💼 Supervisor';
            case 'operador': return '👷 Operador';
            default: return '👤 ' + (rol || 'Sin rol');
        }
    }
    
    function getRoleBadgeClass(rol) {
        switch(rol?.toLowerCase()) {
            case 'admin': return 'primary';
            case 'supervisor': return 'warning';
            case 'operador': return 'info';
            default: return 'secondary';
        }
    }
    
    // Renderizar multi-select de parques
    function renderParquesMultiSelect() {
        const container = document.getElementById('parquesSelectContainer');
        if (!container || parquesDisponibles.length === 0) {
            container.innerHTML = '<div class="multi-select-loading">No hay parques disponibles</div>';
            return;
        }
        
        let html = '';
        parquesDisponibles.forEach(parque => {
            const isChecked = parquesSeleccionados.includes(parque.nombre);
            html += '<div class="parque-option">' +
                '<input type="checkbox" id="parque_' + parque.id + '" value="' + ClientSecurity.encodeHTML(parque.nombre) + '"' + (isChecked ? ' checked' : '') + ' onchange="toggleParqueSelection(this)">' +
                '<label for="parque_' + parque.id + '">' + ClientSecurity.encodeHTML(parque.nombre) + '</label>' +
            '</div>';
        });
        
        container.innerHTML = html;
        updateSelectedParquesDisplay();
    }
    
    function toggleParqueSelection(checkbox) {
        const parqueName = checkbox.value;
        if (checkbox.checked) {
            if (!parquesSeleccionados.includes(parqueName)) {
                parquesSeleccionados.push(parqueName);
            }
        } else {
            parquesSeleccionados = parquesSeleccionados.filter(p => p !== parqueName);
        }
        updateSelectedParquesDisplay();
    }
    
    function updateSelectedParquesDisplay() {
        const container = document.getElementById('selectedParquesList');
        if (!container) return;
        
        if (parquesSeleccionados.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); font-style: italic; padding: 12px;">Ningún parque seleccionado</div>';
            return;
        }
        
        let html = '';
        parquesSeleccionados.forEach(parque => {
            html += '<div class="selected-item">' +
                ClientSecurity.encodeHTML(parque) +
                '<span class="selected-item-remove" onclick="removeSelectedParque(&quot;' + parque + '&quot;)">×</span>' +
            '</div>';
        });
        
        container.innerHTML = html;
    }
    
    function removeSelectedParque(parqueName) {
        parquesSeleccionados = parquesSeleccionados.filter(p => p !== parqueName);
        
        // Actualizar checkbox correspondiente
        const checkbox = Array.from(document.querySelectorAll('#parquesSelectContainer input[type="checkbox"]'))
            .find(cb => cb.value === parqueName);
        if (checkbox) {
            checkbox.checked = false;
        }
        
        updateSelectedParquesDisplay();
    }
    
    // Hacer funciones accesibles globalmente
    window.toggleParqueSelection = toggleParqueSelection;
    window.removeSelectedParque = removeSelectedParque;
    
    async function openNuevoUsuarioModal() {
        usuarioEditando = null;
        parquesSeleccionados = [];
        
        // Cargar parques si no están cargados
        if (parquesDisponibles.length === 0) {
            await loadParquesDisponibles();
        }
        
        // 🔧 FIX: Mostrar el modal después de configurar
        mostrarModalUsuario();
    }
    
    function mostrarModalUsuario() {
        // Limpiar usuario en edición
        usuarioEditando = null;
        parquesSeleccionados = [];
        
        // Resetear formulario
        document.getElementById('usuarioModalTitle').textContent = '👤 Nuevo Usuario';
        document.getElementById('usuarioForm').reset();
        document.getElementById('modalPassword').placeholder = 'Contraseña requerida (mín. 8 caracteres)';
        document.getElementById('modalPassword').required = true;
        document.getElementById('usuarioError').style.display = 'none';
        
        // Renderizar parques
        renderParquesMultiSelect();
        
        document.getElementById('usuarioModal').style.display = 'flex';
    }
    
    async function editarUsuario(userId) {
        try {
            const response = await ClientSecurity.makeSecureRequest('/admin-users/' + userId);
            
            if (!response.success) {
                alert('❌ Error al cargar datos del usuario: ' + (response.error || 'Error desconocido'));
                return;
            }
            
            const usuario = response.user;
            usuarioEditando = userId;
            
            // Cargar parques si no están cargados
            if (parquesDisponibles.length === 0) {
                await loadParquesDisponibles();
            }
            
            // Establecer parques seleccionados
            parquesSeleccionados = usuario.parques_autorizados ? 
                usuario.parques_autorizados.split(',').map(p => p.trim()).filter(p => p) : [];
            
            // Llenar formulario
            document.getElementById('usuarioModalTitle').textContent = '✏️ Editar Usuario';
            document.getElementById('modalUsuario').value = usuario.usuario || '';
            document.getElementById('modalEmail').value = usuario.email || '';
            document.getElementById('modalPassword').value = '';
            document.getElementById('modalPassword').placeholder = 'Dejar vacío para mantener actual';
            document.getElementById('modalPassword').required = false;
            document.getElementById('modalRol').value = usuario.rol || '';
            document.getElementById('modalRutDni').value = usuario.rut_dni || '';
            document.getElementById('modalTelefono').value = usuario.telefono || '';
            document.getElementById('modalCargo').value = usuario.cargo || '';
            document.getElementById('modalEmpresa').value = usuario.empresa || '';
            document.getElementById('modalEstado').value = usuario.estado || 'Activo';
            document.getElementById('modalPasswordTemporal').checked = usuario.password_temporal || false;
            document.getElementById('usuarioError').style.display = 'none';
            
            // Renderizar parques
            renderParquesMultiSelect();
            
            document.getElementById('usuarioModal').style.display = 'flex';
            
        } catch (error) {
            console.error('Error cargando usuario:', error);
            alert('❌ Error de conexión al cargar usuario');
        }
    }
    
    async function handleGuardarUsuario(e) {
        e.preventDefault();
        
        const errorDiv = document.getElementById('usuarioError');
        const submitBtn = document.getElementById('guardarUsuarioBtn');
        
        errorDiv.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-icon">⏳</span>Guardando...';
        
        try {
            const formData = {
                usuario: ClientSecurity.sanitizeInput(document.getElementById('modalUsuario').value),
                email: ClientSecurity.sanitizeInput(document.getElementById('modalEmail').value),
                rol: document.getElementById('modalRol').value,
                rut_dni: ClientSecurity.sanitizeInput(document.getElementById('modalRutDni').value) || null,
                telefono: ClientSecurity.sanitizeInput(document.getElementById('modalTelefono').value) || null,
                cargo: document.getElementById('modalCargo').value || null,
                empresa: ClientSecurity.sanitizeInput(document.getElementById('modalEmpresa').value) || null,
                parques_autorizados: parquesSeleccionados.length > 0 ? parquesSeleccionados.join(', ') : null,
                estado: document.getElementById('modalEstado').value,
                password_temporal: document.getElementById('modalPasswordTemporal').checked
            };
            
            const password = document.getElementById('modalPassword').value;
            if (password) {
                // Validar fortaleza de contraseña
                const passwordValidation = validatePasswordStrength(password);
                if (!passwordValidation.valid) {
                    errorDiv.innerHTML = '🔒 ' + passwordValidation.message;
                    errorDiv.style.display = 'block';
                    return;
                }
                formData.password = password;
            }
            
            // Validaciones mejoradas
            if (!formData.usuario || !formData.email || !formData.rol) {
                errorDiv.innerHTML = '📝 Los campos Usuario, Email y Rol son requeridos';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                errorDiv.innerHTML = '📧 El formato del email no es válido';
                errorDiv.style.display = 'block';
                return;
            }
            
            if (!usuarioEditando && !password) {
                errorDiv.innerHTML = '🔑 La contraseña es requerida para nuevos usuarios';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Validar RUT chileno si se ingresó
            if (formData.rut_dni && formData.rut_dni.includes('-')) {
                if (!validateRUT(formData.rut_dni)) {
                    errorDiv.innerHTML = '🆔 El formato del RUT no es válido (ej: 12.345.678-9)';
                    errorDiv.style.display = 'block';
                    return;
                }
            }
            
            const url = usuarioEditando ? '/admin-users/' + usuarioEditando : '/admin-users';
            const method = usuarioEditando ? 'PUT' : 'POST';
            
            const response = await ClientSecurity.makeSecureRequest(url, {
                method,
                body: JSON.stringify(formData)
            });
            
            if (!response.success) {
                errorDiv.innerHTML = '❌ ' + (response.error || 'Error desconocido');
                errorDiv.style.display = 'block';
                return;
            }
            
            closeUsuarioModal();
            await loadUsuarios();
            showSuccessMessage('✅ ' + (usuarioEditando ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente'));
            
        } catch (error) {
            console.error('Error guardando usuario:', error);
            errorDiv.innerHTML = '🌐 Error de conexión al servidor';
            errorDiv.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-icon">💾</span>Guardar Usuario';
        }
    }
    
    // Validador de RUT chileno
    function validateRUT(rut) {
        // Remover puntos y guión
        const cleanRut = rut.replace(/[.\-]/g, '');
        
        if (cleanRut.length < 2) return false;
        
        const body = cleanRut.slice(0, -1);
        const dv = cleanRut.slice(-1).toUpperCase();
        
        // Calcular dígito verificador
        let sum = 0;
        let multiplier = 2;
        
        for (let i = body.length - 1; i >= 0; i--) {
            sum += parseInt(body.charAt(i)) * multiplier;
            multiplier = multiplier === 7 ? 2 : multiplier + 1;
        }
        
        const expectedDV = 11 - (sum % 11);
        const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();
        
        return dv === calculatedDV;
    }
    
    function closeUsuarioModal() {
        document.getElementById('usuarioModal').style.display = 'none';
        usuarioEditando = null;
        parquesSeleccionados = [];
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
        // Crear y mostrar mensaje de éxito temporal
        const successDiv = document.createElement('div');
        successDiv.style.cssText = 'position: fixed;'
            + 'top: 20px;'
            + 'right: 20px;'
            + 'background: var(--success-color);'
            + 'color: white;'
            + 'padding: 16px 24px;'
            + 'border-radius: 6px;'
            + 'box-shadow: 0 4px 12px rgba(0,0,0,0.15);'
            + 'z-index: 9999;'
            + 'font-weight: 500;';
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
    
    // Hacer funciones globales para usar en onclick
    window.mostrarModalUsuario = mostrarModalUsuario;
    window.openNuevoUsuarioModal = openNuevoUsuarioModal;
    window.editarUsuario = editarUsuario;
    window.confirmarEliminarUsuario = confirmarEliminarUsuario;
    window.closeUsuarioModal = closeUsuarioModal;
    window.handleGuardarUsuario = handleGuardarUsuario;
    window.cerrarModalEliminarUsuario = closeConfirmarEliminarModal;
    window.confirmarEliminarUsuarioDefinitivo = handleEliminarUsuario;
    
    // Sistema de seguridad activo - D1 Database Edition
  `;
}

export default getWebAppScript;
