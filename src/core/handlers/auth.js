import { InputSanitizer } from '../utils/sanitizers.js';
import AuthService from '../services/authService.js';
import AuditLogger from '../services/auditLogger.js';
import { getLocalDateTime, formatLocalDateTime } from '../utils/time.js';

// Función de validación de contraseñas seguras
function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);
  
  if (!password || password.length < minLength) {
    return { 
      valid: false, 
      message: 'La contraseña debe tener al menos 8 caracteres' 
    };
  }
  
  if (!hasUppercase) {
    return { 
      valid: false, 
      message: 'La contraseña debe contener al menos una letra mayúscula' 
    };
  }
  
  if (!hasLowercase) {
    return { 
      valid: false, 
      message: 'La contraseña debe contener al menos una letra minúscula' 
    };
  }
  
  if (!hasNumbers) {
    return { 
      valid: false, 
      message: 'La contraseña debe contener al menos un número' 
    };
  }
  
  if (!hasSpecialChar) {
    return { 
      valid: false, 
      message: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*()_+-=[]{};\':"|,.<>/?)' 
    };
  }
  
  return { valid: true };
}

// Headers de seguridad adicionales
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:;"
};

export async function handleLogin(request, corsHeaders, env, services) {
  const { rateLimiter, authService, auditLogger } = services;
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders, ...securityHeaders }
    });
  }
  
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  
  try {
    // Rate limiting para login
    await rateLimiter.check(clientIp, 'login');
    
    // Parsear y sanitizar
    const rawData = await request.json();
    const { usuario, password } = InputSanitizer.sanitizeObject(rawData);
    
    if (!usuario || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Usuario y contraseña son requeridos' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders, ...securityHeaders }
      });
    }
    
    // Buscar usuario en D1
    const userResult = await env.DB_MASTER.prepare(`
      SELECT * FROM usuarios 
      WHERE LOWER(email) = LOWER(?) OR LOWER(usuario) = LOWER(?)
      LIMIT 1
    `).bind(usuario, usuario).first();
    
    // Mensaje genérico para evitar enumerar usuarios
    const genericLoginError = 'Usuario o contraseña incorrectos';
    
    if (!userResult) {
      await auditLogger.log({
        action: 'LOGIN_FAILED',
        resource: 'auth',
        ip: clientIp,
        userEmail: usuario,
        success: false,
        error: 'Usuario no encontrado' // Log interno mantiene el detalle
      });
      
      // Añadir delay artificial para evitar timing attacks
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      
      return new Response(JSON.stringify({ 
        success: false, 
        message: genericLoginError // Mensaje genérico para el usuario
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders, ...securityHeaders }
      });
    }
    
    // Verificar contraseña
    const verification = await authService.verifyPassword(password, userResult.password_hash);
    
    if (!verification.valid) {
      await auditLogger.log({
        action: 'LOGIN_FAILED',
        resource: 'auth',
        userId: userResult.id,
        userEmail: userResult.email,
        ip: clientIp,
        success: false,
        error: 'Contraseña incorrecta' // Log interno mantiene el detalle
      });
      
      // Añadir delay artificial para evitar timing attacks
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

      return new Response(JSON.stringify({ 
        success: false, 
        message: genericLoginError // Mismo mensaje genérico
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders, ...securityHeaders }
      });
    }


    // Verificar si la contraseña cumple con los nuevos requisitos de seguridad
    const passwordStrengthCheck = validatePasswordStrength(password);
    const requiresPasswordUpdate = !passwordStrengthCheck.valid || userResult.password_temporal === 1;
    
    // Actualizar hash si es necesario
    if (verification.needsUpdate && passwordStrengthCheck.valid) {
      try {
        const newHash = await authService.hashPassword(password);
        await env.DB_MASTER.prepare(`
          UPDATE usuarios SET password_hash = ? WHERE id = ?
        `).bind(newHash, userResult.id).run();
      } catch (error) {
        // Silently fail password hash update - non-critical operation
      }
    }
    
    // Actualizar último login (D1 necesita string, no Date object)
    const fechaLogin = formatLocalDateTime(getLocalDateTime());
    await env.DB_MASTER.prepare(`
      UPDATE usuarios SET ultimo_login = ? WHERE id = ?
    `).bind(fechaLogin, userResult.id).run();
    
    // Determinar si es usuario Enel basado en el rol
    const esEnel = userResult.rol === 'Supervisor Enel' || 
                  userResult.empresa?.toLowerCase().includes('enel') || 
                  userResult.email?.toLowerCase().includes('@enel.');
    
    // Parsear parques_autorizados como JSON
    let parquesAutorizados = [];
    if (userResult.parques_autorizados) {
      try {
        parquesAutorizados = JSON.parse(userResult.parques_autorizados);
      } catch (error) {
        console.error('Error parseando parques_autorizados:', error);
        // Si no es JSON válido, intentar con split por si es formato antiguo
        parquesAutorizados = userResult.parques_autorizados.split(',').map(p => p.trim());
      }
    }

    const userData = {
      id: userResult.id,
      usuario: userResult.usuario,
      email: userResult.email,
      rol: userResult.rol,
      empresa: userResult.empresa,
      cargo: userResult.cargo,
      rut: userResult.rut,
      telefono: userResult.telefono,
      esEnel: esEnel,
      parques: parquesAutorizados,
      puedeActualizarPersonal: userResult.puede_actualizar_personal === 1
    };
    
    // Generar JWT
    const token = await authService.createToken(userData);
    
    // Verificar si la contraseña necesita ser cambiada (temporal o no cumple requisitos)
    if (requiresPasswordUpdate) {
        // Log del motivo del cambio requerido
        await auditLogger.log({
          action: 'PASSWORD_CHANGE_REQUIRED',
          resource: 'auth',
          userId: userData.id,
          userEmail: userData.email,
          ip: clientIp,
          reason: !passwordStrengthCheck.valid ? 'weak_password' : 'temporary_password',
          details: !passwordStrengthCheck.valid ? passwordStrengthCheck.message : 'Password marked as temporary'
        });
        
        return new Response(JSON.stringify({ 
            success: true,
            token,
            user: userData,
            requirePasswordChange: true,
            changeReason: !passwordStrengthCheck.valid 
              ? 'Su contraseña actual no cumple con los requisitos de seguridad. Por favor, cree una nueva contraseña.'
              : 'Debe cambiar su contraseña temporal por una permanente.'
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders, ...securityHeaders }
        });
    }
    
    // Log exitoso
    await auditLogger.log({
      action: 'LOGIN_SUCCESS',
      resource: 'auth',
      userId: userData.id,
      userEmail: userData.email,
      ip: clientIp,
      success: true
    });
    
    // Reset rate limit
    await rateLimiter.reset(clientIp, 'login');
    
    return new Response(JSON.stringify({ 
      success: true,
      token,
      user: userData
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders, ...securityHeaders }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders, ...securityHeaders }
    });
  }
}

export async function handleChangePassword(request, corsHeaders, env, services) {
  const { authService, auditLogger } = services;
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders, ...securityHeaders }
    });
  }
  
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No autorizado'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders, ...securityHeaders }
      });
    }
    
    const token = authHeader.substring(7);
    const userToken = await authService.verifyToken(token);
    
    const { newPassword } = await request.json();
    
    // Validar fortaleza de contraseña
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return new Response(JSON.stringify({ 
        success: false,
        error: passwordValidation.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders, ...securityHeaders }
      });
    }
    
    // Hashear nueva contraseña
    const hashedPassword = await authService.hashPassword(newPassword);
    
    // Actualizar contraseña y marcar como no temporal
    await env.DB_MASTER.prepare(`
      UPDATE usuarios 
      SET password_hash = ?,
          password_temporal = 0
      WHERE id = ?
    `).bind(hashedPassword, userToken.sub).run();
    
    // Log
    if (auditLogger) {
      await auditLogger.log({
        action: 'PASSWORD_CHANGED',
        resource: 'auth',
        userId: userToken.sub,
        userEmail: userToken.email,
        ip: request.headers.get('CF-Connecting-IP'),
        success: true
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Contraseña actualizada exitosamente'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders, ...securityHeaders }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Error al cambiar la contraseña'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders, ...securityHeaders }
    });
  }
}

export default { handleLogin, handleChangePassword };