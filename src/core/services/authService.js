/**
 * Authentication and hashing service for user passwords and JWT management.
 * Based on the AuthService implementation in worker.js.
 */
import SECURITY_CONFIG from '../config/security.js';
import { SecurityError } from '../errors.js';

export class AuthService {
  constructor(env) {
    this.env = env;
    // Use provided JWT secret or generate a random one for development
    this.SECRET = env.JWT_SECRET || crypto.randomUUID();
  }

  // Helper: convert Uint8Array to hex string
  toHex(buffer) {
    return Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Helper: base64url encode a string (URL-safe)
  base64url(str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Hash a plain password using PBKDF2 with a random salt.
   * Returns a string "salt:hash" where both components are hex-encoded.
   */
  async hashPassword(password) {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(
      new Uint8Array(SECURITY_CONFIG.crypto.saltLength)
    );
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const derived = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: SECURITY_CONFIG.crypto.iterations,
        hash: `SHA-${SECURITY_CONFIG.crypto.hashLength * 8}`,
      },
      key,
      SECURITY_CONFIG.crypto.hashLength * 8
    );
    const hashArray = new Uint8Array(derived);
    const saltHex = this.toHex(salt);
    const hashHex = this.toHex(hashArray);
    return `${saltHex}:${hashHex}`;
  }

  /**
   * Verify a password against a stored hash. Supports legacy unsalted SHA-256 (base64) hashes.
   * Returns true if the password matches.
   */
  async verifyPassword(password, stored) {
    // legacy unsalted: just base64 of SHA-256 digest
    if (!stored.includes(':')) {
      const enc = new TextEncoder();
      const digest = await crypto.subtle.digest(
        'SHA-256',
        enc.encode(password)
      );
      const bytes = new Uint8Array(digest);
      const b64 = btoa(String.fromCharCode(...bytes));
      return b64 === stored;
    }
    const [saltHex, hashHex] = stored.split(':');
    const salt = new Uint8Array(
      saltHex.match(/.{1,2}/g).map((h) => parseInt(h, 16))
    );
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const derived = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: SECURITY_CONFIG.crypto.iterations,
        hash: `SHA-${SECURITY_CONFIG.crypto.hashLength * 8}`,
      },
      key,
      SECURITY_CONFIG.crypto.hashLength * 8
    );
    const derivedHex = this.toHex(new Uint8Array(derived));
    return derivedHex === hashHex;
  }

  /**
   * Create a signed JWT using HS256 algorithm and the configured secret.
   */
  async createToken(payload) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const enc = new TextEncoder();
    const headerJson = JSON.stringify(header);
    const payloadJson = JSON.stringify(payload);
    const headerB64 = this.base64url(
      btoa(String.fromCharCode(...enc.encode(headerJson)))
    );
    const payloadB64 = this.base64url(
      btoa(String.fromCharCode(...enc.encode(payloadJson)))
    );
    const unsigned = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(this.SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuf = await crypto.subtle.sign(
      'HMAC',
      key,
      enc.encode(unsigned)
    );
    const signature = this.base64url(
      btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    );
    return `${unsigned}.${signature}`;
  }

  /**
   * Verify a JWT and return its payload if valid. Throws SecurityError on invalid signature.
   */
  async verifyToken(token) {
    const [headerB64, payloadB64, signature] = token.split('.');
    if (!headerB64 || !payloadB64 || !signature) {
      throw new SecurityError('Token inválido', 401);
    }
    const unsigned = `${headerB64}.${payloadB64}`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(this.SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuf = await crypto.subtle.sign(
      'HMAC',
      key,
      enc.encode(unsigned)
    );
    const expectedSig = this.base64url(
      btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    );
    if (signature !== expectedSig) {
      throw new SecurityError('Token inválido', 401);
    }
    const payloadJson = JSON.parse(
      atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    );
    return payloadJson;
  }

  /**
   * Decode a JWT payload without verifying the signature.
   */
  decodeToken(token) {
    const [, payloadB64] = token.split('.');
    return JSON.parse(
      atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    );
  }
}

export default AuthService;
