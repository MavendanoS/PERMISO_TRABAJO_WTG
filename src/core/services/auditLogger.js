/**
 * AuditLogger service to log actions and events to the D1 database.
 * This module is extracted from the monolithic worker.js.
 */
export default class AuditLogger {
  constructor(env) {
    this.env = env;
  }

  /**
   * Log an event to the audit_log table.
   * @param {Object} event Event details including userId, userEmail, action, resource, resourceId, ipAddress, userAgent, success, errorMessage, metadata.
   */
  async log(event = {}) {
    // Construct log entry with defaults
    const logEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      user_id: event.userId || null,
      user_email: event.userEmail || null,
      action: event.action || null,
      resource: event.resource || null,
      resource_id: event.resourceId || null,
      ip_address: event.ipAddress || null,
      user_agent: event.userAgent || null,
      success: event.success === true,
      error_message: event.errorMessage || null,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null
    };

    // ensure table exists and insert log entry
    const DB = this.env.DB_PERMISOS;
    await DB.prepare(`CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      user_id INTEGER,
      user_email TEXT,
      action TEXT NOT NULL,
      resource TEXT,
      resource_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      success INTEGER NOT NULL,
      error_message TEXT,
      metadata TEXT
    );`).run();

    await DB.prepare(`INSERT INTO audit_log (
      id, timestamp, user_id, user_email, action, resource, resource_id, ip_address, user_agent, success, error_message, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`)
    .bind(
      logEntry.id,
      logEntry.timestamp,
      logEntry.user_id,
      logEntry.user_email,
      logEntry.action,
      logEntry.resource,
      logEntry.resource_id,
      logEntry.ip_address,
      logEntry.user_agent,
      logEntry.success ? 1 : 0,
      logEntry.error_message,
      logEntry.metadata
    )
    .run();
  }
}
