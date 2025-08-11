/**
 * Custom error class for security-related errors thrown during input validation,
 * authentication and rate limiting. Mirrors the SecurityError class defined in worker.js.
 */
export class SecurityError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'SecurityError';
    this.status = status;
  }

  toPublicJSON() {
    return {
      error: this.name,
      message: this.message,
      status: this.status
    };
  }
}

export default SecurityError;
