// src/core/routes/api.js
import { handleLogin, handleChangePassword } from '../handlers/auth.js';
import {
  handleUsers, handlePersonal, handlePersonalByParque, handleSupervisores,
} from '../handlers/users.js';
import { handleParques, handleAerogeneradores, handleActividades } from '../handlers/catalog.js';
import { handleMatrizRiesgos } from '../handlers/matrix.js';
import {
  handlePermisos, handleAprobarPermiso, handleCerrarPermiso,
  handleGenerateRegister, handleHealth,
} from '../handlers/permits.js';
import generateTomaConocimientoPDF from '../handlers/pdf.js';

export async function handleApiRequest(request, corsHeaders, env, services) {
  const { rateLimiter, authService, auditLogger } = services;
  const url = new URL(request.url);
  const endpoint = url.pathname.replace('/api/', '');
  
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
        return await handleLogin(request, corsHeaders, env, services);
      case 'change-password':
        return await handleChangePassword(request, corsHeaders, env, services);
      case 'users':
        return await handleUsers(request, corsHeaders, env);
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
      case 'generate-register':
        return await handleGenerateRegister(request, corsHeaders, env);
      case 'health':
        return await handleHealth(request, corsHeaders, env);
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

export default handleApiRequest;
