export class SecurityError extends Error {
  constructor(publicMessage, privateDetails = null) {
    super(publicMessage);
    this.name = 'SecurityError';
    this.publicMessage = publicMessage;
    this.privateDetails = privateDetails;
    this.timestamp = new Date().toISOString();
  }
  
  toPublicJSON() {
    return {
      error: this.publicMessage,
      timestamp: this.timestamp
    };
  }
}