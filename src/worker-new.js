/**
 * PT_Wind - PWA para Permisos de Trabajo en Parques Eólicos
 * Versión 19.0 - MODULAR ARCHITECTURE EDITION
 * 
 * ESTRUCTURA MODULAR:
 * ==================
 * ✅ Separación de responsabilidades en módulos
 * ✅ Mantenimiento simplificado
 * ✅ Reutilización de código
 * ✅ Testing individual de componentes
 */

// Importar módulos
import { SECURITY_CONFIG } from './security/config.js';
import { SecurityError } from './security/errors.js';
import { InputSanitizer } from './security/sanitizer.js';
import { RateLimiter } from './security/rate-limiter.js';
import { AuthService } from './auth/auth-service.js';
import { AuthMiddleware } from './middleware/auth-middleware.js';
import { AuditLogger } from './utils/audit-logger.js';
import { ApiRouter } from './routes/api-router.js';
import { initializeDatabase } from './database/init.js';
import { getSecurityHeaders, getCorsHeaders } from './utils/helpers.js';
import { ViewBuilder } from './views/view-builder.js';

// Worker principal
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
      return new Response(null, { headers: corsHeaders });
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
      
      // Manejar API
      if (path.startsWith('/api/')) {
        const apiRouter = new ApiRouter(env, {
          rateLimiter,
          authService,
          auditLogger
        });
        
        return await apiRouter.handleRequest(request, corsHeaders);
      }
      
      // Servir app usando el ViewBuilder modular
      const viewBuilder = new ViewBuilder();
      return viewBuilder.createResponse(corsHeaders);
      
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

// Worker modular completo - todas las funcionalidades están en módulos

export default worker;