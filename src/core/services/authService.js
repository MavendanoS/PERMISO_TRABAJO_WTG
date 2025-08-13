// src/core/services/authService.js
/**
 * Auth + hashing + JWT
 * Formatos soportados en verifyPassword():
 *  - pbkdf2:<iteraciones>:<saltHex>:<hashHex>
 *  - salt:hash (legacy PBKDF2 usando SECURITY_CONFIG.iterations)
 *  - base64(SHA-256(password))  (legacy)
 *  - HEX (64 = SHA-256, 40 = SHA-1) (legacy)
 *  - texto plano (igualdad directa)  (legacy)
 */
import SECURITY_CONFIG from '../config/security.js';
import SecurityError from '../errors.js';

const enc = new TextEncoder();

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

const isHex = (s) => /^[a-f0-9]+$/i.test(s);
const isBase64 = (s) => /^[A-Za-z0-9+/]+={0,2}$/.test(s) && s.length % 4 === 0;

const b64url = (s) => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export default class AuthService {
  constructor(env) {
    this.env = env;
    // JWT_SECRET debe estar configurado en Cloudflare
    // Si no está configurado, lanzar error en lugar de generar uno aleatorio
    if (!env.JWT_SECRET) {
      throw new Error('JWT_SECRET no está configurado. Configure en Cloudflare: wrangler secret put JWT_SECRET');
    }
    this.SECRET = env.JWT_SECRET;
  }

  async hashPassword(password) {
    const iterations = SECURITY_CONFIG.crypto.iterations; // p.ej. 100000
    const hashLen    = SECURITY_CONFIG.crypto.hashLength; // bytes, p.ej. 32
    const saltLen    = SECURITY_CONFIG.crypto.saltLength; // bytes

    const salt = crypto.getRandomValues(new Uint8Array(saltLen));
    const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
      key,
      hashLen * 8
    );
    return `pbkdf2:${iterations}:${toHex(salt)}:${toHex(bits)}`;
  }

  /**
   * Verifica password contra múltiples formatos legacy.
   * Retorna objeto con { valid: boolean, needsUpdate: boolean }
   */
  async verifyPassword(plain, stored) {
    if (plain == null || stored == null) return { valid: false, needsUpdate: false };

    let valid = false;
    let needsUpdate = false;

    // 1) pbkdf2:<iter>:<saltHex>:<hashHex>  (formato actual, no necesita update)
    if (stored.startsWith('pbkdf2:')) {
      const parts = stored.split(':');
      let iterations = SECURITY_CONFIG.crypto.iterations;
      let saltHex, hashHex;
      for (let i = 1; i < parts.length; i++) {
        if (/^\d+$/.test(parts[i])) { iterations = parseInt(parts[i], 10); continue; }
        if (!saltHex) { saltHex = parts[i]; continue; }
        if (!hashHex) { hashHex = parts[i]; break; }
      }
      if (!saltHex || !hashHex || !isHex(saltHex) || !isHex(hashHex)) {
        return { valid: false, needsUpdate: false };
      }

      const key = await crypto.subtle.importKey('raw', enc.encode(plain), { name: 'PBKDF2' }, false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations },
        key,
        hashHex.length * 4
      );
      valid = timingSafeEqual(toHex(bits).toLowerCase(), hashHex.toLowerCase());
      needsUpdate = false; // formato actual, no necesita actualización
      return { valid, needsUpdate };
    }

    // 2) salt:hash  (legacy PBKDF2 con iteraciones de SECURITY_CONFIG)
    if (stored.includes(':')) {
      const [saltHex, hashHex] = stored.split(':');
      if (isHex(saltHex) && isHex(hashHex)) {
        const iterations = SECURITY_CONFIG.crypto.iterations;
        const key = await crypto.subtle.importKey('raw', enc.encode(plain), { name: 'PBKDF2' }, false, ['deriveBits']);
        const bits = await crypto.subtle.deriveBits(
          { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations },
          key,
          hashHex.length * 4
        );
        valid = timingSafeEqual(toHex(bits).toLowerCase(), hashHex.toLowerCase());
        needsUpdate = valid; // formato legacy, necesita actualización
        return { valid, needsUpdate };
      }
      // si no es hex, cae a otros formatos abajo
    }

    // 3) HEX legacy: 64 => SHA-256, 40 => SHA-1
    if (isHex(stored) && (stored.length === 64 || stored.length === 40)) {
      const algo = stored.length === 64 ? 'SHA-256' : 'SHA-1';
      const digest = await crypto.subtle.digest(algo, enc.encode(plain));
      valid = timingSafeEqual(toHex(digest).toLowerCase(), stored.toLowerCase());
      needsUpdate = valid; // formato legacy, necesita actualización
      return { valid, needsUpdate };
    }

    // 4) base64(SHA-256(password)) - solo si es suficientemente largo para ser un hash real
    if (isBase64(stored) && stored.length >= 32) {  // Base64 de SHA-256 sería ~44 chars
      const digest = await crypto.subtle.digest('SHA-256', enc.encode(plain));
      const b64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
      valid = timingSafeEqual(b64, stored);
      needsUpdate = valid; // formato legacy, necesita actualización
      return { valid, needsUpdate };
    }

    // 5) texto plano (último recurso legacy)
    valid = plain === stored;
    needsUpdate = valid; // formato legacy inseguro, necesita actualización urgente
    return { valid, needsUpdate };
  }

  // -------------------------- JWT ----------------------------------------

  async createToken(payload) {
    // Asegurar que el payload tenga el campo 'sub' para compatibilidad con verifyToken
    const tokenPayload = {
      ...payload,
      sub: payload.id || payload.sub,  // Usar 'id' como 'sub' si no existe
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // Expira en 24 horas
    };
    
    const headerB64 = b64url(btoa(String.fromCharCode(...enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))));
    const payloadB64 = b64url(btoa(String.fromCharCode(...enc.encode(JSON.stringify(tokenPayload)))));
    const unsigned = `${headerB64}.${payloadB64}`;

    const key = await crypto.subtle.importKey('raw', enc.encode(this.SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(unsigned));
    const signature = b64url(btoa(String.fromCharCode(...new Uint8Array(sigBuf))));
    return `${unsigned}.${signature}`;
  }

  async verifyToken(token) {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) throw new SecurityError('Token inválido', 401);

    const unsigned = `${h}.${p}`;
    const key = await crypto.subtle.importKey('raw', enc.encode(this.SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(unsigned));
    const expected = b64url(btoa(String.fromCharCode(...new Uint8Array(sigBuf))));
    if (s !== expected) throw new SecurityError('Token inválido', 401);

    return JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
  }

  decodeToken(token) {
    const [, p] = token.split('.');
    return JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
  }
}
