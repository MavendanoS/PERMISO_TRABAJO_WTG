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
export function getCorsHeaders(origin, allowedOrigins = []) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export default {
  getSecurityHeaders,
  getCorsHeaders
};
