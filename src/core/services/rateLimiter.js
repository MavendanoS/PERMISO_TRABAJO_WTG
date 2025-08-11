/**
 * Rate limiting service using Cloudflare KV to track attempts per identifier and route type.
 * Based on the implementation in worker.js.
 */
import SECURITY_CONFIG from '../config/security.js';
import { SecurityError } from '../errors.js';

export class RateLimiter {
  constructor(env) {
    this.env = env;
  }

  async check(identifier, type = 'api') {
    if (!this.env.RATE_LIMIT_KV) {
      console.log('Rate limiting not configured (KV missing)');
      return true;
    }
    const config = SECURITY_CONFIG.rateLimits[type];
    if (!config) {
      console.log('Rate limiting not configured (missing type)');
      return true;
    }
    const key = `rl:${type}:${identifier}`;
    const blockKey = `rl:block:${type}:${identifier}`;
    const blocked = await this.env.RATE_LIMIT_KV.get(blockKey);
    if (blocked) {
      throw new SecurityError('Demasiados intentos. Intente más tarde.', 429);
    }
    const attempts = parseInt((await this.env.RATE_LIMIT_KV.get(key)) || '0');
    if (attempts >= config.max) {
      await this.env.RATE_LIMIT_KV.put(blockKey, 'true', {
        expirationTtl: config.blockDuration
      });
      throw new SecurityError('Límite de intentos excedido', 429);
    }
    await this.env.RATE_LIMIT_KV.put(key, (attempts + 1).toString(), {
      expirationTtl: Math.floor(config.windowMs / 1000)
    });
    return true;
  }

  async reset(identifier, type = 'api') {
    if (!this.env.RATE_LIMIT_KV) return;
    const key = `rl:${type}:${identifier}`;
    const blockKey = `rl:block:${type}:${identifier}`;
    await this.env.RATE_LIMIT_KV.delete(key);
    await this.env.RATE_LIMIT_KV.delete(blockKey);
  }
}

export default RateLimiter;
