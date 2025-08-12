// src/index.js
import getStyles from './core/webapp/styles.js';
import getWebApp from './core/webapp/template.js';
import getWebAppScript from './core/webapp/script.js';

import SECURITY_CONFIG from './core/config/security.js';
import SecurityError from './core/errors.js';

import { getSecurityHeaders, getCorsHeaders } from './core/utils/headers.js';

import RateLimiter from './core/services/rateLimiter.js';
import AuthService from './core/services/authService.js';
import AuditLogger from './core/services/auditLogger.js';

import handleApiRequest from './core/routes/api.js';

export default {
  async fetch(request, env, ctx) {
    // CORS fijo y headers de seguridad (igual que en worker.js)
    const corsHeaders = getCorsHeaders(env, request);
    const secHeaders = getSecurityHeaders();

    // Instancias compartidas (como en el monolito)
    const services = {
      rateLimiter: new RateLimiter(env),
      auth: new AuthService(env),
      audit: new AuditLogger(env),
      security: SECURITY_CONFIG,
    };

    try {
      const url = new URL(request.url);
      const { pathname } = url;

      // Rutas de la WebApp (igual que worker.js)
      if (request.method === 'GET' && pathname === '/') {
        return new Response(getWebApp(), { headers: { 'content-type': 'text/html; charset=utf-8', ...secHeaders }});
      }
      if (request.method === 'GET' && pathname === '/styles.css') {
        return new Response(getStyles(), { headers: { 'content-type': 'text/css; charset=utf-8', ...secHeaders }});
      }
      if (request.method === 'GET' && pathname === '/app.js') {
        return new Response(getWebAppScript(), { headers: { 'content-type': 'application/javascript; charset=utf-8', ...secHeaders }});
      }

      // API (router exacto movido a módulos)
      if (pathname.startsWith('/api/')) {
        return await handleApiRequest(request, corsHeaders, env, services);
      }

      // 404 por defecto (igual que worker.js)
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { 'content-type': 'application/json', ...corsHeaders, ...secHeaders },
      });
    } catch (err) {
      const status = err instanceof SecurityError ? 403 : 500;
      return new Response(JSON.stringify({ error: err.message || 'Internal Error' }), {
        status,
        headers: { 'content-type': 'application/json', ...corsHeaders, ...secHeaders },
      });
    }
  }
};
