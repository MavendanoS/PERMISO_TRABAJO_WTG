import { InputSanitizer } from '../utils/sanitizers.js';
import AuthService from '../services/authService.js';
import AuditLogger from '../services/auditLogger.js';
import { getLocalDateTime, formatLocalDateTime } from '../utils/time.js';

export async function handleLogin(request, corsHeaders, env, services) {
  const { rateLimiter, authService, auditLogger } = services;
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
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
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Buscar usuario en D1
    const userResult = await env.DB_MASTER.prepare(`
      SELECT * FROM usuarios 
      WHERE LOWER(email) = LOWER(?) OR LOWER(usuario) = LOWER(?)
      LIMIT 1
    `).bind(usuario, usuario).first();
    
    if (!userResult) {
      await auditLogger.log({
        action: 'LOGIN_FAILED',
        resource: 'auth',
        ip: clientIp,
        userEmail: usuario,
        success: false,
        error: 'Usuario no encontrado'
      });
      
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Usuario no encontrado' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
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
        error: 'Contraseña incorrecta'
      });

      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Contraseña incorrecta' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }


    // Actualizar hash si es necesario
    if (verification.needsUpdate) {
      try {
        const newHash = await authService.hashPassword(password);
        await env.DB_MASTER.prepare(`
          UPDATE usuarios SET password_hash = ? WHERE id = ?
        `).bind(newHash, userResult.id).run();
      } catch (error) {
        console.warn('Could not update password hash:', error);
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
    
    // AQUÍ VA: Verificar si la contraseña es temporal
    const esPasswordTemporal = userResult.password_temporal === 1;
    if (esPasswordTemporal) {
        return new Response(JSON.stringify({ 
            success: true,
            token,
            user: userData,
            requirePasswordChange: true  // ← INDICADOR CLAVE
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
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
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handleChangePassword(request, corsHeaders, env, services) {
  const { authService, auditLogger } = services;
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
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
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const token = authHeader.substring(7);
    const userToken = await authService.verifyToken(token);
    
    const { newPassword } = await request.json();
    
    // Validar contraseña
    if (!newPassword || newPassword.length < 8) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'La contraseña debe tener al menos 8 caracteres'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
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
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Error al cambiar la contraseña',
      debug: error.message || 'Error desconocido',
      debugStack: error.stack 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export default { handleLogin, handleChangePassword };