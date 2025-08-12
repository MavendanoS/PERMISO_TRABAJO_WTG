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

//import initializeDatabase from './core/db/init.js';
import handleApiRequest from './core/routes/api.js';

export default {
  async fetch(request, env, ctx) {
    // Asegura que existan las tablas (idempotente: usa IF NOT EXISTS)
    //await initializeDatabase(env);

    const corsHeaders = getCorsHeaders(env, request);
    const secHeaders = getSecurityHeaders();

    // Responder preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...corsHeaders } });
    }

    // Instancias compartidas
    const rateLimiter = new RateLimiter(env);
    const authService = new AuthService(env);
    const auditLogger = new AuditLogger(env);

    // Normalizamos nombres y dejamos alias para compatibilidad
    const services = {
      rateLimiter,
      authService,
      auditLogger,
      // alias (por si algún handler espera 'auth'/'audit')
      auth: authService,
      audit: auditLogger,
      security: SECURITY_CONFIG,
    };

    try {
      const url = new URL(request.url);
      const { pathname } = url;

      // WebApp
      if (request.method === 'GET' && pathname === '/') {
        return new Response(getWebApp(), {
          headers: { 'content-type': 'text/html; charset=utf-8', ...secHeaders, ...corsHeaders },
        });
      }
      if (request.method === 'GET' && pathname === '/styles.css') {
        return new Response(getStyles(), {
          headers: { 'content-type': 'text/css; charset=utf-8', ...secHeaders, ...corsHeaders },
        });
      }
      if (request.method === 'GET' && pathname === '/app.js') {
        return new Response(getWebAppScript(), {
          headers: { 'content-type': 'application/javascript; charset=utf-8', ...secHeaders, ...corsHeaders },
        });
      }

      // API
      if (pathname.startsWith('/api/')) {
        const resp = await handleApiRequest(request, corsHeaders, env, services);

        // Garantiza CORS + security headers en cualquier respuesta del router
        const merged = new Headers(resp.headers);
        for (const [k, v] of Object.entries(corsHeaders)) merged.set(k, v);
        for (const [k, v] of Object.entries(secHeaders)) merged.set(k, v);

        // Nota: resp.body puede ser un ReadableStream; se reenvía tal cual
        return new Response(resp.body, { status: resp.status, headers: merged });
      }

      // 404
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { 'content-type': 'application/json; charset=utf-8', ...secHeaders, ...corsHeaders },
      });
    } catch (err) {
      const status = err instanceof SecurityError ? 403 : 500;
      return new Response(JSON.stringify({ error: err?.message || 'Internal Error' }), {
        status,
        headers: { 'content-type': 'application/json; charset=utf-8', ...secHeaders, ...corsHeaders },
      });
    }
  },
};
