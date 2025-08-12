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
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
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

  // Normaliza ALLOWED_ORIGINS a: '*' o Array<string>
  let allowed;
  try {
    if (!raw || raw === '*') {
      allowed = '*';
    } else if (typeof raw === 'string' && raw.trim().startsWith('[')) {
      // JSON array, p. ej.: ["https://a.com","https://b.com"]
      allowed = JSON.parse(raw);
    } else if (typeof raw === 'string') {
      // coma-separado, p. ej.: https://a.com,https://b.com
      allowed = raw.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      allowed = '*';
    }
  } catch {
    allowed = '*';
  }

  const allowOrigin =
    allowed === '*'
      ? '*'
      : (allowed.includes && allowed.includes(reqOrigin)) ? reqOrigin : 'null';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export default {
  getSecurityHeaders,
  getCorsHeaders
};
