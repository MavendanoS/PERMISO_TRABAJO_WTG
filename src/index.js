// Entry point for the modular Cloudflare Worker.
// This file reuses the original worker's fetch handler while importing
// all modular components to ensure they're bundled by Wrangler.

import getStyles from './core/webapp/styles.js';
import getWebApp from './core/webapp/template.js';
import getWebAppScript from './core/webapp/script.js';
import SECURITY_CONFIG from './core/config/security.js';
import SecurityError from './core/errors.js';
import RateLimiter from './core/services/rateLimiter.js';
import AuthService from './core/services/authService.js';
import AuditLogger from './core/services/auditLogger.js';
import SQL_SCHEMAS from './core/db/sqlSchemas.js';
import initializeDatabase from './core/db/init.js';
import { getLocalDateTime, formatLocalDateTime } from './core/utils/time.js';
import { getSecurityHeaders, getCorsHeaders } from './core/utils/headers.js';
import { InputSanitizer } from './core/utils/sanitizers.js';

// Import the original worker default export which contains the fetch handler and route logic.
import worker from '../worker.js';

// Ensure the imported modules are referenced so they are not tree-shaken by the bundler.
void getStyles;
void getWebApp;
void getWebAppScript;
void SECURITY_CONFIG;
void SecurityError;
void RateLimiter;
void AuthService;
void AuditLogger;
void SQL_SCHEMAS;
void initializeDatabase;
void getLocalDateTime;
void formatLocalDateTime;
void getSecurityHeaders;
void getCorsHeaders;
void InputSanitizer;

// Export the fetch handler from the original worker.
export async function fetch(request, env, ctx) {
  return worker.fetch(request, env, ctx);
}

export default { fetch };
