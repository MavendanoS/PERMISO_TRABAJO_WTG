import { InputSanitizer } from '../utils/sanitizers.js';
import AuditLogger from '../services/auditLogger.js';
import { getLocalDateTime, formatLocalDateTime } from '../utils/time.js';

// Validar que el usuario tenga permisos de administrador
function validateAdminPermissions(currentUser) {
  if (!currentUser || !currentUser.rol) {
    return { valid: false, message: 'Usuario no autorizado' };
  }
  
  // Verificar si tiene rol de administrador
  const adminRoles = ['admin', 'Admin', 'administrator', 'Administrator'];
  if (!adminRoles.includes(currentUser.rol)) {
    return { valid: false, message: 'Acceso denegado - Permisos de administrador requeridos' };
  }
  
  return { valid: true };
}

export async function handleAdminUsers(request, corsHeaders, env, services, currentUser) {
  const { authService, auditLogger } = services;
  
  // Validar permisos de administrador
  const adminValidation = validateAdminPermissions(currentUser);
  if (!adminValidation.valid) {
    return new Response(JSON.stringify({ 
      success: false,
      error: adminValidation.message 
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const method = request.method;
  const url = new URL(request.url);
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

  try {
    switch (method) {
      case 'GET':
        // Check if requesting a specific user by ID
        const pathParts = url.pathname.split('/');
        const userId = pathParts[pathParts.length - 1];
        
        if (userId && userId !== 'admin-users' && !isNaN(userId)) {
          return await handleGetSingleUser(userId, env, corsHeaders, auditLogger, currentUser, clientIp);
        } else {
          return await handleGetUsers(env, corsHeaders, auditLogger, currentUser, clientIp);
        }
      
      case 'POST':
        return await handleCreateUser(request, env, corsHeaders, authService, auditLogger, currentUser, clientIp);
      
      case 'PUT':
        // Extraer ID de la URL para PUT
        const pathPartsPut = url.pathname.split('/');
        const userIdPut = pathPartsPut[pathPartsPut.length - 1];
        
        if (userIdPut && !isNaN(parseInt(userIdPut))) {
          return await handleUpdateUser(request, userIdPut, env, corsHeaders, authService, auditLogger, currentUser, clientIp);
        } else {
          return new Response(JSON.stringify({ error: 'ID de usuario requerido para actualización' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      
      case 'DELETE':
        // Extraer ID de la URL para DELETE
        const pathPartsDelete = url.pathname.split('/');
        const userIdDelete = pathPartsDelete[pathPartsDelete.length - 1];
        
        if (userIdDelete && !isNaN(parseInt(userIdDelete))) {
          return await handleDeleteUser(userIdDelete, env, corsHeaders, auditLogger, currentUser, clientIp);
        } else {
          return new Response(JSON.stringify({ error: 'ID de usuario requerido para eliminación' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      
      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
  } catch (error) {
    console.error('Error in handleAdminUsers:', error);
    
    await auditLogger.log({
      action: 'ADMIN_USER_ERROR',
      resource: 'admin',
      userId: currentUser.id,
      userEmail: currentUser.email,
      ip: clientIp,
      success: false,
      error: error.message
    });

    return new Response(JSON.stringify({ 
      success: false,
      error: 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleGetSingleUser(userId, env, corsHeaders, auditLogger, currentUser, clientIp) {
  const result = await env.DB_MASTER.prepare(`
    SELECT id, usuario, email, rol, empresa, parques_autorizados,
           puede_actualizar_personal, estado, password_temporal,
           ultimo_login, created_at, rut, telefono, cargo
    FROM usuarios
    WHERE id = ?
  `).bind(parseInt(userId)).first();

  if (!result) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Usuario no encontrado'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  await auditLogger.log({
    action: 'ADMIN_GET_USER',
    resource: 'admin',
    userId: currentUser.id,
    userEmail: currentUser.email,
    ip: clientIp,
    success: true,
    message: `Consultó usuario ID: ${userId}`
  });

  return new Response(JSON.stringify({
    success: true,
    user: result
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function handleGetUsers(env, corsHeaders, auditLogger, currentUser, clientIp) {
  const result = await env.DB_MASTER.prepare(`
    SELECT id, usuario, email, rol, empresa, parques_autorizados,
           puede_actualizar_personal, estado, password_temporal,
           ultimo_login, created_at, rut, telefono, cargo
    FROM usuarios
    ORDER BY usuario ASC
  `).all();

  await auditLogger.log({
    action: 'ADMIN_LIST_USERS',
    resource: 'admin',
    userId: currentUser.id,
    userEmail: currentUser.email,
    ip: clientIp,
    success: true,
    message: `Listó ${result.results?.length || 0} usuarios`
  });

  return new Response(JSON.stringify({
    success: true,
    users: result.results || []
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function handleCreateUser(request, env, corsHeaders, authService, auditLogger, currentUser, clientIp) {
  const rawData = await request.json();
  const userData = InputSanitizer.sanitizeObject(rawData);

  // Validaciones requeridas
  const requiredFields = ['usuario', 'email', 'password', 'rol'];
  for (const field of requiredFields) {
    if (!userData[field]) {
      return new Response(JSON.stringify({
        success: false,
        error: `Campo requerido: ${field}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // Validar formato de email
  const sanitizedEmail = InputSanitizer.sanitizeEmail(userData.email);
  if (!sanitizedEmail) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Formato de email inválido'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Verificar que no exista el usuario o email
  const existingUser = await env.DB_MASTER.prepare(`
    SELECT id FROM usuarios 
    WHERE LOWER(email) = LOWER(?) OR LOWER(usuario) = LOWER(?)
    LIMIT 1
  `).bind(sanitizedEmail, userData.usuario).first();

  if (existingUser) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Ya existe un usuario con ese email o nombre de usuario'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Hashear contraseña automáticamente
  const hashedPassword = await authService.hashPassword(userData.password);
  const fechaCreacion = formatLocalDateTime(getLocalDateTime());

  // Parsear parques autorizados si viene como string
  let parquesAutorizados = userData.parques_autorizados || '[]';
  if (typeof parquesAutorizados === 'string' && !parquesAutorizados.startsWith('[')) {
    // Convertir string separado por comas a JSON array
    const parquesArray = parquesAutorizados.split(',').map(p => p.trim()).filter(p => p);
    parquesAutorizados = JSON.stringify(parquesArray);
  }

  // Insertar nuevo usuario
  const insertResult = await env.DB_MASTER.prepare(`
    INSERT INTO usuarios (
      usuario, email, password_hash, rol, empresa, parques_autorizados,
      puede_actualizar_personal, estado, password_temporal, created_at, rut, telefono, cargo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userData.usuario,
    sanitizedEmail,
    hashedPassword,
    userData.rol,
    userData.empresa || '',
    parquesAutorizados,
    userData.puede_actualizar_personal || 0,
    userData.estado || 'Activo',
    userData.password_temporal || 0,
    fechaCreacion,
    userData.rut || '',
    userData.telefono || '',
    userData.cargo || ''
  ).run();

  await auditLogger.log({
    action: 'ADMIN_CREATE_USER',
    resource: 'admin',
    userId: currentUser.id,
    userEmail: currentUser.email,
    ip: clientIp,
    success: true,
    message: `Creó usuario: ${userData.usuario} (${sanitizedEmail})`
  });

  return new Response(JSON.stringify({
    success: true,
    message: 'Usuario creado exitosamente',
    userId: insertResult.meta.last_row_id
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function handleUpdateUser(request, userId, env, corsHeaders, authService, auditLogger, currentUser, clientIp) {
  const sanitizedUserId = InputSanitizer.sanitizeId(userId);
  
  if (!sanitizedUserId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'ID de usuario requerido'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const rawData = await request.json();
  const userData = InputSanitizer.sanitizeObject(rawData);

  // Verificar que existe el usuario
  const existingUser = await env.DB_MASTER.prepare(`
    SELECT * FROM usuarios WHERE id = ?
  `).bind(sanitizedUserId).first();

  if (!existingUser) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Usuario no encontrado'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Construir query de actualización dinámicamente
  const updateFields = [];
  const updateValues = [];

  if (userData.usuario) {
    updateFields.push('usuario = ?');
    updateValues.push(userData.usuario);
  }

  if (userData.email) {
    const sanitizedEmail = InputSanitizer.sanitizeEmail(userData.email);
    if (!sanitizedEmail) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Formato de email inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    updateFields.push('email = ?');
    updateValues.push(sanitizedEmail);
  }

  if (userData.password) {
    const hashedPassword = await authService.hashPassword(userData.password);
    updateFields.push('password_hash = ?');
    updateFields.push('password_temporal = ?');
    updateValues.push(hashedPassword);
    updateValues.push(userData.password_temporal || 0);
  }

  if (userData.rol) {
    updateFields.push('rol = ?');
    updateValues.push(userData.rol);
  }

  if (userData.empresa !== undefined) {
    updateFields.push('empresa = ?');
    updateValues.push(userData.empresa);
  }

  if (userData.estado !== undefined) {
    updateFields.push('estado = ?');
    updateValues.push(userData.estado);
  }

  if (userData.parques_autorizados !== undefined) {
    let parquesAutorizados = userData.parques_autorizados;
    if (typeof parquesAutorizados === 'string' && !parquesAutorizados.startsWith('[')) {
      const parquesArray = parquesAutorizados.split(',').map(p => p.trim()).filter(p => p);
      parquesAutorizados = JSON.stringify(parquesArray);
    }
    updateFields.push('parques_autorizados = ?');
    updateValues.push(parquesAutorizados);
  }

  if (userData.rut !== undefined) {
    updateFields.push('rut = ?');
    updateValues.push(userData.rut);
  }

  if (userData.telefono !== undefined) {
    updateFields.push('telefono = ?');
    updateValues.push(userData.telefono);
  }

  if (userData.cargo !== undefined) {
    updateFields.push('cargo = ?');
    updateValues.push(userData.cargo);
  }

  if (updateFields.length === 0) {
    return new Response(JSON.stringify({
      success: false,
      error: 'No hay campos para actualizar'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  updateValues.push(sanitizedUserId);

  await env.DB_MASTER.prepare(`
    UPDATE usuarios SET ${updateFields.join(', ')} WHERE id = ?
  `).bind(...updateValues).run();

  await auditLogger.log({
    action: 'ADMIN_UPDATE_USER',
    resource: 'admin',
    userId: currentUser.id,
    userEmail: currentUser.email,
    ip: clientIp,
    success: true,
    message: `Actualizó usuario ID: ${sanitizedUserId} (${existingUser.usuario})`
  });

  return new Response(JSON.stringify({
    success: true,
    message: 'Usuario actualizado exitosamente'
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function handleDeleteUser(userId, env, corsHeaders, auditLogger, currentUser, clientIp) {
  const sanitizedUserId = InputSanitizer.sanitizeId(userId);
  
  if (!sanitizedUserId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'ID de usuario requerido'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Verificar que existe el usuario
  const existingUser = await env.DB_MASTER.prepare(`
    SELECT usuario, email FROM usuarios WHERE id = ?
  `).bind(sanitizedUserId).first();

  if (!existingUser) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Usuario no encontrado'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Prevenir auto-eliminación
  if (sanitizedUserId === currentUser.id) {
    return new Response(JSON.stringify({
      success: false,
      error: 'No puedes eliminar tu propio usuario'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  await env.DB_MASTER.prepare(`
    DELETE FROM usuarios WHERE id = ?
  `).bind(sanitizedUserId).run();

  await auditLogger.log({
    action: 'ADMIN_DELETE_USER',
    resource: 'admin',
    userId: currentUser.id,
    userEmail: currentUser.email,
    ip: clientIp,
    success: true,
    message: `Eliminó usuario: ${existingUser.usuario} (${existingUser.email})`
  });

  return new Response(JSON.stringify({
    success: true,
    message: 'Usuario eliminado exitosamente'
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

export default { handleAdminUsers };