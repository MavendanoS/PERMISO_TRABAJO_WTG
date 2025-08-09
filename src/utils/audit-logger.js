export class AuditLogger {
  constructor(env) {
    this.env = env;
  }
  
  async log(event) {
    if (!this.env.DB_PERMISOS) return;
    
    try {
      const logEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        user_id: event.userId || 'anonymous',
        user_email: event.userEmail || 'unknown',
        action: event.action,
        resource: event.resource,
        resource_id: event.resourceId || null,
        ip_address: event.ip || 'unknown',
        user_agent: event.userAgent || 'unknown',
        success: event.success !== false,
        error_message: event.error || null,
        metadata: JSON.stringify(event.metadata || {})
      };
      
      await this.env.DB_PERMISOS.prepare(`
        CREATE TABLE IF NOT EXISTS audit_log (
          id TEXT PRIMARY KEY,
          timestamp DATETIME,
          user_id TEXT,
          user_email TEXT,
          action TEXT,
          resource TEXT,
          resource_id TEXT,
          ip_address TEXT,
          user_agent TEXT,
          success BOOLEAN,
          error_message TEXT,
          metadata TEXT
        )
      `).run();
      
      await this.env.DB_PERMISOS.prepare(`
        INSERT INTO audit_log VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
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
      ).run();
      
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }
}