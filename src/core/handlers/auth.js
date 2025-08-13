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
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Error al cambiar la contraseña'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handleFixPasswords(request, corsHeaders, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    // Obtener usuarios con contraseñas no hasheadas
    const usuarios = await env.DB_MASTER.prepare(`
      SELECT id, usuario, email, password_hash, password_temporal
      FROM usuarios
    `).all();

    const toUpdate = [];
    let updated = 0;

    for (const user of usuarios.results) {
      let needsUpdate = false;
      const hash = user.password_hash || '';
      
      // Detectar si es contraseña en texto plano
      if (!hash.startsWith('pbkdf2:') &&           // No es formato moderno
          !hash.includes(':') &&                   // No es formato legacy salt:hash
          hash.length < 40) {                      // No es hash SHA-1 o SHA-256
        needsUpdate = true;
      }
      
      if (needsUpdate && user.password_temporal !== 1) {
        await env.DB_MASTER.prepare(`
          UPDATE usuarios SET password_temporal = 1 WHERE id = ?
        `).bind(user.id).run();
        
        toUpdate.push({
          id: user.id,
          usuario: user.usuario,
          email: user.email,
          hash_length: hash.length
        });
        updated++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `${updated} usuarios marcados como contraseña temporal`,
      usuarios_actualizados: toUpdate,
      total_usuarios: usuarios.results.length
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error en fix-passwords:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handleListUsers(request, corsHeaders, env) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const usuarios = await env.DB_MASTER.prepare(`
      SELECT 
        id, usuario, email, rol,
        LENGTH(password_hash) as hash_length,
        password_temporal,
        CASE 
          WHEN password_hash LIKE 'pbkdf2:%' THEN 'Moderna PBKDF2'
          WHEN password_hash LIKE '%:%' THEN 'Legacy salt:hash'
          WHEN LENGTH(password_hash) = 64 THEN 'SHA-256 hash'
          WHEN LENGTH(password_hash) = 40 THEN 'SHA-1 hash'
          ELSE 'Texto plano (temporal)'
        END as tipo_password
      FROM usuarios
      ORDER BY password_temporal DESC, usuario
      LIMIT 10
    `).all();

    return new Response(JSON.stringify({
      success: true,
      usuarios: usuarios.results,
      total_shown: usuarios.results.length
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error listando usuarios:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handleDebugPassword(request, corsHeaders, env, services) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const { authService } = services;
    const { email, password } = await request.json();
    
    // Buscar usuario
    const user = await env.DB_MASTER.prepare(`
      SELECT id, usuario, email, password_hash, password_temporal
      FROM usuarios 
      WHERE LOWER(email) = LOWER(?)
      LIMIT 1
    `).bind(email).first();

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuario no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Verificar contraseña con debug info
    const verification = await authService.verifyPassword(password, user.password_hash);
    
    // Debug: verificar qué tipo está siendo detectado
    const isHex = /^[a-f0-9]+$/i.test(user.password_hash);
    const isBase64 = /^[A-Za-z0-9+/]+={0,2}$/.test(user.password_hash) && user.password_hash.length % 4 === 0;
    
    return new Response(JSON.stringify({
      success: true,
      user_info: {
        id: user.id,
        usuario: user.usuario,
        email: user.email,
        password_temporal: user.password_temporal,
        stored_hash: user.password_hash,
        stored_hash_length: user.password_hash?.length || 0
      },
      password_check: {
        provided_password: password,
        provided_length: password.length,
        verification_result: verification,
        is_direct_match: password === user.password_hash
      },
      format_detection: {
        is_pbkdf2: user.password_hash?.startsWith('pbkdf2:'),
        has_colon: user.password_hash?.includes(':'),
        is_hex: isHex,
        is_base64: isBase64,
        should_be_plaintext: !user.password_hash?.startsWith('pbkdf2:') && !user.password_hash?.includes(':') && !isHex && !isBase64
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error en debug-password:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export default { handleLogin, handleChangePassword, handleFixPasswords, handleListUsers, handleDebugPassword };