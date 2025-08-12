/**
 * Authentication and hashing service for user passwords and JWT management.
 * Compatible with:
 *  - pbkdf2:<iterations>:<saltHex>:<hashHex>
 *  - legacy "salt:hash" (uses SECURITY_CONFIG iterations)
 *  - legacy plaintext (stored as-is)
 */
import SECURITY_CONFIG from '../config/security.js';
import SecurityError from '../errors.js'; // default import

// --- helpers --------------------------------------------------------------

const toHex = (buf) =>
  [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

const fromHex = (hex) =>
  new Uint8Array(hex.match(/.{1,2}/g).map(h => parseInt(h, 16)));

const timingSafeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

const b64url = (str) => str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// -------------------------------------------------------------------------

export default class AuthService {
  constructor(env) {
    this.env = env;
    // Si no hay secreto, se usa uno aleatorio (como en tu worker original)
    this.SECRET = env.JWT_SECRET || crypto.randomUUID();
  }

  /**
   * Genera hash PBKDF2 con salt aleatorio.
   * Devuelve: "pbkdf2:<iter>:<saltHex>:<hashHex>"
   */
  async hashPassword(password) {
    const enc = new TextEncoder();

    const iterations = SECURITY_CONFIG.crypto.iterations;    // p.ej. 100000
    const hashLen    = SECURITY_CONFIG.crypto.hashLength;    // bytes, p.ej. 32
    const saltLen    = SECURITY_CONFIG.crypto.saltLength;    // bytes

    const salt = crypto.getRandomValues(new Uint8Array(saltLen));

    const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
      key,
      hashLen * 8
    );

    const hashHex = toHex(bits);
    const saltHex = toHex(salt);
    return `pbkdf2:${iterations}:${saltHex}:${hashHex}`;
  }

  /**
   * Verifica password contra formatos soportados:
   * 1) pbkdf2:<iter>:<saltHex>:<hashHex>
   * 2) legacy "salt:hash" (usa iteraciones del SECURITY_CONFIG)
   * 3) legacy plaintext (igualdad directa)
   */
  async verifyPassword(plain, stored) {
    if (!plain || stored == null) return false;

    // 3) Legacy: texto plano (no contiene ':', no es hex fijo)
    if (!stored.includes(':')) {
      return plain === stored;
    }

    const parts = stored.split(':');

    // 1) PBKDF2 con prefijo
    if (parts[0] === 'pbkdf2') {
      // admite pbkdf2:100000:<salt>:<hash> o pbkdf2:sha256:100000:<salt>:<hash>
      let iterations = SECURITY_CONFIG.crypto.iterations;
      let saltHex, hashHex;

      for (let i = 1; i < parts.length; i++) {
        if (/^\d+$/.test(parts[i])) { iterations = parseInt(parts[i], 10); continue; }
        if (!saltHex) { saltHex = parts[i]; continue; }
        if (!hashHex) { hashHex = parts[i]; break; }
      }
      if (!saltHex || !hashHex) return false;

      const salt = fromHex(saltHex);
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(plain), { name: 'PBKDF2' }, false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
        key,
        hashHex.length * 4 // longitud hex * 4 = bits
      );
      const derivedHex = toHex(bits).toLowerCase();
      return timingSafeEqual(derivedHex, hashHex.toLowerCase());
    }

    // 2) Legacy "salt:hash" (sin prefijo)
    if (parts.length === 2) {
      const [saltHex, hashHex] = parts;
      const salt = fromHex(saltHex);
      const iterations = SECURITY_CONFIG.crypto.iterations;

      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(plain), { name: 'PBKDF2' }, false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
        key,
        hashHex.length * 4
      );
      const derivedHex = toHex(bits).toLowerCase();
      return timingSafeEqual(derivedHex, (hashHex || '').toLowerCase());
    }

    // Formato desconocido
    return false;
  }

  // -------------------------- JWT ----------------------------------------

  async createToken(payload) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const enc = new TextEncoder();

    const headerB64 = b64url(btoa(String.fromCharCode(...enc.encode(JSON.stringify(header)))));
    const payloadB64 = b64url(btoa(String.fromCharCode(...enc.encode(JSON.stringify(payload)))));

    const unsigned = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey('raw', enc.encode(this.SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(unsigned));
    const signature = b64url(btoa(String.fromCharCode(...new Uint8Array(sigBuf))));

    return `${unsigned}.${signature}`;
  }

  async verifyToken(token) {
    const [headerB64, payloadB64, signature] = token.split('.');
    if (!headerB64 || !payloadB64 || !signature) throw new SecurityError('Token inválido', 401);

    const unsigned = `${headerB64}.${payloadB64}`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(this.SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(unsigned));
    const expectedSig = b64url(btoa(String.fromCharCode(...new Uint8Array(sigBuf))));
    if (signature !== expectedSig) throw new SecurityError('Token inválido', 401);

    const payloadJson = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    return payloadJson;
  }

  decodeToken(token) {
    const [, payloadB64] = token.split('.');
    return JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
  }
}
