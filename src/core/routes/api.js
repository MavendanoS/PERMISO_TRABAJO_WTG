// src/core/routes/api.js
import { handleLogin, handleChangePassword } from '../handlers/auth.js';
import {
  handleUsers, handlePersonal, handlePersonalByParque, handleSupervisores,
} from '../handlers/users.js';
import { handleParques, handleAerogeneradores, handleActividades } from '../handlers/catalog.js';
import { handleMatrizRiesgos } from '../handlers/matrix.js';
import {
  handlePermisos, handlePermisoDetalle, handleAprobarPermiso, handleCerrarPermiso, handleObtenerDetalleAprobacion, handleAprobarCierrePermiso,
  handleGenerateRegister, handleHealth, handleExportarPermisoExcel, handleExportarPermisoPdf,
} from '../handlers/permits.js';
import generateTomaConocimientoPDF from '../handlers/pdf.js';

export async function handleApiRequest(request, corsHeaders, env, services) {
  const { rateLimiter, authService, auditLogger } = services;
  const url = new URL(request.url);
  const endpoint = url.pathname.replace('/api/', '');
  
  try {
    // Endpoints públicos que no requieren autenticación
    const publicEndpoints = ['login', 'health'];
    let currentUser = null;
    
    // Verificar autenticación para endpoints protegidos
    if (!publicEndpoints.includes(endpoint)) {
      const authHeader = request.headers.get('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'No autorizado - Token requerido'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      const token = authHeader.substring(7);
      try {
        currentUser = await authService.verifyToken(token);
        
        // Verificar que el token tenga la estructura esperada
        if (!currentUser || !currentUser.sub) {
          throw new Error('Token inválido - estructura incorrecta');
        }
      } catch (error) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Token inválido o expirado'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    switch (endpoint) {
      case 'login':
        return await handleLogin(request, corsHeaders, env, services);
      case 'change-password':
        return await handleChangePassword(request, corsHeaders, env, services);
      case 'users':
        return await handleUsers(request, corsHeaders, env);
      case 'personal':
        return await handlePersonal(request, corsHeaders, env);
      case 'personal-by-parque':
        return await handlePersonalByParque(request, corsHeaders, env, currentUser);
      case 'supervisores':
        return await handleSupervisores(request, corsHeaders, env, currentUser);
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
      case 'permiso-detalle':
        return await handlePermisoDetalle(request, corsHeaders, env, currentUser, services);
      case 'cerrar-permiso':
        return await handleCerrarPermiso(request, corsHeaders, env, currentUser, services);
      case 'aprobar-permiso':
        return await handleAprobarPermiso(request, corsHeaders, env, currentUser, services);
      case 'detalle-aprobacion':
        return await handleObtenerDetalleAprobacion(request, corsHeaders, env, currentUser, services);
      case 'aprobar-cierre-permiso':
        return await handleAprobarCierrePermiso(request, corsHeaders, env, currentUser, services);
      case 'generate-register':
        return await handleGenerateRegister(request, corsHeaders, env);
      case 'exportar-permiso-excel':
        return await handleExportarPermisoExcel(request, corsHeaders, env, currentUser, services);
      case 'exportar-permiso-pdf':
        return await handleExportarPermisoPdf(request, corsHeaders, env, currentUser, services);
      case 'health':
        return await handleHealth(request, corsHeaders, env);
      default:
        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      endpoint: endpoint 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export default handleApiRequest;
