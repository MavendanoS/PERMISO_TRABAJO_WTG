import { SecurityError } from '../security/errors.js';
import { AuthService } from '../auth/auth-service.js';

export class AuthMiddleware {
  constructor(env) {
    this.authService = new AuthService(env);
  }

  async verifyAuth(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new SecurityError('Token de autenticación requerido');
    }

    const token = authHeader.substring(7);
    return await this.authService.verifyToken(token);
  }

  async requireRole(request, allowedRoles) {
    const user = await this.verifyAuth(request);
    
    if (!allowedRoles.includes(user.rol)) {
      throw new SecurityError('No tienes permisos para esta acción');
    }

    return user;
  }
}