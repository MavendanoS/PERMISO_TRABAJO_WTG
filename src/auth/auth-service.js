import { SECURITY_CONFIG } from '../security/config.js';
import { SecurityError } from '../security/errors.js';

export class AuthService {
  constructor(env) {
    this.env = env;
    this.SECRET = env.JWT_SECRET || crypto.randomUUID();
  }
  
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(SECURITY_CONFIG.crypto.saltLength));
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const hash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: SECURITY_CONFIG.crypto.iterations,
        hash: SECURITY_CONFIG.crypto.algorithm
      },
      keyMaterial,
      SECURITY_CONFIG.crypto.hashLength * 8
    );
    
    const hashArray = new Uint8Array(hash);
    const saltHex = this.bufferToHex(salt);
    const hashHex = this.bufferToHex(hashArray);
    
    return `pbkdf2:${SECURITY_CONFIG.crypto.iterations}:${saltHex}:${hashHex}`;
  }
  
  async verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.startsWith('pbkdf2:')) {
      // Hash antiguo (SHA-256 simple) - verificar y actualizar
      const oldHash = await this.oldHashMethod(password);
      if (oldHash === storedHash) {
        return { valid: true, needsUpdate: true };
      }
      // Plaintext legacy
      if (password === storedHash) {
        return { valid: true, needsUpdate: true };
      }
      return { valid: false };
    }
    
    const [, iterations, salt, hash] = storedHash.split(':');
    const encoder = new TextEncoder();
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const newHash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: this.hexToBuffer(salt),
        iterations: parseInt(iterations),
        hash: SECURITY_CONFIG.crypto.algorithm
      },
      keyMaterial,
      SECURITY_CONFIG.crypto.hashLength * 8
    );
    
    const newHashHex = this.bufferToHex(new Uint8Array(newHash));
    
    return { valid: newHashHex === hash, needsUpdate: false };
  }
  
  async generateToken(user) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      empresa: user.empresa,
      esEnel: user.esEnel,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + SECURITY_CONFIG.session.duration,
      jti: crypto.randomUUID()
    };
    
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    
    const signature = await this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
      this.SECRET
    );
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
  
  async verifyToken(token) {
    if (!token) throw new SecurityError('Token no proporcionado');
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new SecurityError('Token inválido');
    }
    
    const [encodedHeader, encodedPayload, signature] = parts;
    
    const expectedSignature = await this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
      this.SECRET
    );
    
    if (signature !== expectedSignature) {
      throw new SecurityError('Firma de token inválida');
    }
    
    const payload = JSON.parse(this.base64UrlDecode(encodedPayload));
    
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new SecurityError('Token expirado');
    }
    
    return payload;
  }
  
  async createSignature(data, secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(data)
    );
    
    return this.base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  }
  
  base64UrlEncode(str) {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  
  base64UrlDecode(str) {
    str = (str + '===').slice(0, str.length + (str.length % 4));
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  }
  
  bufferToHex(buffer) {
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }
  
  async oldHashMethod(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}