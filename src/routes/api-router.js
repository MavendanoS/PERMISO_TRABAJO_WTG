import { SecurityError } from '../security/errors.js';
import { InputSanitizer } from '../security/sanitizer.js';
import { AuthMiddleware } from '../middleware/auth-middleware.js';

export class ApiRouter {
  constructor(env, services) {
    this.env = env;
    this.services = services;
    this.authMiddleware = new AuthMiddleware(env);
  }

  async handleRequest(request, corsHeaders) {
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
            currentUser = await this.services.authService.verifyToken(token);
          } catch (error) {
            console.log('Token verification failed, continuing without auth');
          }
        }
      }
      
      // Routear a los handlers apropiados
      const routes = {
        'login': () => this.handleLogin(request, corsHeaders),
        'change-password': () => this.handleChangePassword(request, corsHeaders),
        'users': () => this.handleUsers(request, corsHeaders),
        'personal': () => this.handlePersonal(request, corsHeaders),
        'personal-by-parque': () => this.handlePersonalByParque(request, corsHeaders),
        'supervisores': () => this.handleSupervisores(request, corsHeaders),
        'parques': () => this.handleParques(request, corsHeaders),
        'aerogeneradores': () => this.handleAerogeneradores(request, corsHeaders),
        'matriz-riesgos': () => this.handleMatrizRiesgos(request, corsHeaders),
        'actividades': () => this.handleActividades(request, corsHeaders),
        'permisos': () => this.handlePermisos(request, corsHeaders, currentUser),
        'cerrar-permiso': () => this.handleCerrarPermiso(request, corsHeaders, currentUser),
        'aprobar-permiso': () => this.handleAprobarPermiso(request, corsHeaders, currentUser),
        'generate-register': () => this.handleGenerateRegister(request, corsHeaders),
        'health': () => this.handleHealth(request, corsHeaders)
      };

      const handler = routes[endpoint];
      if (!handler) {
        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      return await handler();
      
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

  async handleLogin(request, corsHeaders) {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    try {
      // Rate limiting para login
      await this.services.rateLimiter.check(clientIp, 'login');
      
      // Parsear y sanitizar
      const rawData = await request.json();
      const { usuario, password } = InputSanitizer.sanitizeObject(rawData);
      
      if (!usuario || !password) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Usuario y contraseña requeridos' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Continuar con la lógica de login...
      // Esta implementación se completaría con la lógica específica de login
      
    } catch (error) {
      console.error('Login error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  async handleHealth(request, corsHeaders) {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString() 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Placeholder methods for other handlers - to be implemented
  async handleChangePassword(request, corsHeaders) {
    throw new Error('Not implemented yet');
  }

  async handleUsers(request, corsHeaders) {
    throw new Error('Not implemented yet');
  }

  async handlePersonal(request, corsHeaders) {
    throw new Error('Not implemented yet');
  }

  async handlePersonalByParque(request, corsHeaders) {
    throw new Error('Not implemented yet');
  }

  async handleSupervisores(request, corsHeaders) {
    throw new Error('Not implemented yet');
  }

  async handleParques(request, corsHeaders) {
    throw new Error('Not implemented yet');
  }

  async handleAerogeneradores(request, corsHeaders) {
    throw new Error('Not implemented yet');
  }

  async handleMatrizRiesgos(request, corsHeaders) {
    throw new Error('Not implemented yet');
  }

  async handleActividades(request, corsHeaders) {
    throw new Error('Not implemented yet');
  }

  async handlePermisos(request, corsHeaders, currentUser) {
    throw new Error('Not implemented yet');
  }

  async handleCerrarPermiso(request, corsHeaders, currentUser) {
    throw new Error('Not implemented yet');
  }

  async handleAprobarPermiso(request, corsHeaders, currentUser) {
    throw new Error('Not implemented yet');
  }

  async handleGenerateRegister(request, corsHeaders) {
    throw new Error('Not implemented yet');
  }
}