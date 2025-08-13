/**
 * Utility functions for generating HTTP headers such as security and CORS.
 * Extracted from the monolithic worker.js.
 */

/**
 * Returns a set of security-related HTTP headers to mitigate common web vulnerabilities.
 * @returns {Object} Headers object with security directives.
 */
export function getSecurityHeaders() {
  return {
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",  // ← Permite Google Fonts CSS
      "font-src 'self' https://fonts.gstatic.com",                      // ← Permite Google Fonts archivos
      "img-src 'self' data:",
      "manifest-src 'self' data:",
      "connect-src 'self'",
    ].join("; "),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "no-referrer"
  };
}

/**
 * Generates CORS headers based on the request origin and allowed origins list.
 * @param {string} origin - The Origin header from the request.
 * @param {string[]} allowedOrigins - Array of allowed origins.
 * @returns {Object} Headers object with appropriate CORS directives.
 */
export function getCorsHeaders(env, request) {
  const reqOrigin = request.headers.get('Origin') || '';
  let raw = env.ALLOWED_ORIGINS;

  // Por defecto, rechazar todos los orígenes si no está configurado
  if (!raw) {
    console.warn('ALLOWED_ORIGINS not configured - defaulting to restrictive CORS');
    return {
      'Access-Control-Allow-Origin': 'null',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'false',
    };
  }

  // Normaliza ALLOWED_ORIGINS a: '*' o Array<string>
  let allowed;
  try {
    if (raw === '*') {
      // Solo permitir '*' si está explícitamente configurado
      allowed = '*';
    } else if (typeof raw === 'string' && raw.trim().startsWith('[')) {
      // JSON array, p. ej.: ["https://a.com","https://b.com"]
      allowed = JSON.parse(raw);
    } else if (typeof raw === 'string') {
      // coma-separado, p. ej.: https://a.com,https://b.com
      allowed = raw.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      // Si no es un formato válido, rechazar
      allowed = [];
    }
  } catch {
    // En caso de error de parsing, ser restrictivo
    allowed = [];
  }

  const allowOrigin =
    allowed === '*'
      ? '*'
      : (Array.isArray(allowed) && allowed.includes(reqOrigin)) ? reqOrigin : 'null';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': allowed === '*' ? 'false' : 'true',
  };
}

export default {
  getSecurityHeaders,
  getCorsHeaders
};
