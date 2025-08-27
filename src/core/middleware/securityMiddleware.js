/**
 * Security Middleware para protección de datos
 * Implementa el mismo patrón que aplicaciones Angular empresariales
 */

import { DataObfuscator } from '../services/dataObfuscator.js';

export class SecurityMiddleware {
  constructor() {
    this.obfuscator = new DataObfuscator();
    this.dataCache = new Map();
  }

  /**
   * Procesa respuestas para proteger datos sensibles
   */
  async secureResponse(response, corsHeaders) {
    try {
      // Solo procesar respuestas JSON exitosas
      if (!response || response.status !== 200) {
        return response;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return response;
      }

      // Obtener datos originales
      const originalData = await response.json();
      
      // Ofuscar datos completos
      const securedData = await this.obfuscator.obfuscate(originalData);
      
      // Crear respuesta segura
      return new Response(JSON.stringify(securedData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Encoded': 'secure',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          ...corsHeaders
        }
      });
    } catch (error) {
      console.error('Security middleware error:', error);
      return response;
    }
  }

  /**
   * Wrapper para handlers que aplica seguridad automáticamente
   */
  secureHandler(handlerFunction) {
    return async (...args) => {
      const response = await handlerFunction(...args);
      const corsHeaders = args.find(arg => arg && typeof arg === 'object' && 'Access-Control-Allow-Origin' in arg) || {};
      return this.secureResponse(response, corsHeaders);
    };
  }

  /**
   * Aplica headers de seguridad adicionales
   */
  applySecurityHeaders(headers) {
    return {
      ...headers,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }
}

export default SecurityMiddleware;