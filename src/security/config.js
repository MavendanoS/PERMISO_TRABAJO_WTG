export const SECURITY_CONFIG = {
  rateLimits: {
    login: { windowMs: 900000, max: 5, blockDuration: 3600 },
    api: { windowMs: 60000, max: 100 },
    heavy: { windowMs: 300000, max: 10 }
  },
  session: {
    duration: 7200,
    refreshThreshold: 1800,
    maxSessions: 5
  },
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    maxAge: 90
  },
  crypto: {
    iterations: 100000,
    hashLength: 32,
    saltLength: 32,
    algorithm: 'SHA-256'
  }
};