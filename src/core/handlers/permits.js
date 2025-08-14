import AuditLogger from '../services/auditLogger.js';
import { getLocalDateTime, formatLocalDateTime } from '../utils/time.js';
import { InputSanitizer } from '../utils/sanitizers.js';
import generateTomaConocimientoPDF from './pdf.js';

export async function handlePermisos(request, corsHeaders, env, currentUser, services) {
  const { auditLogger } = services;
  
  if (request.method === 'POST' || request.method === 'PUT') {
    const rawData = await request.json();
    const permisoData = InputSanitizer.sanitizeObject(rawData);
    
    if (!permisoData.planta || !permisoData.descripcion || !permisoData.jefeFaena) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Faltan campos obligatorios'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    try {
      // Si es PUT (edición), manejar actualización
      if (request.method === 'PUT') {
        return await handleUpdatePermiso(permisoData, env, currentUser, services, corsHeaders);
      }
      
      // TEMPORAL: Comentar validación para debugging
      /*
      const esEnel = currentUser?.esEnel || false;
      const parquesAutorizados = currentUser?.parques || [];
      
      if (!esEnel && !parquesAutorizados.includes(permisoData.planta)) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'No tiene autorización para crear permisos en esta planta'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      */
      
      // Obtener número correlativo
      let numeroCorrelativo = 1;
      
      const lastPermiso = await env.DB_PERMISOS.prepare(`
        SELECT COALESCE(MAX(CAST(numero_correlativo AS INTEGER)), 0) as ultimo_numero 
        FROM permisos_trabajo 
        WHERE planta_nombre = ?
      `).bind(permisoData.planta).first();
       
      numeroCorrelativo = (lastPermiso?.ultimo_numero || 0) + 1;
      
      const codigoParque = permisoData.codigoParque || 
                          permisoData.planta.replace(/\s+/g, '').substring(0, 3).toUpperCase();
      const numeroPT = `PT-${codigoParque}-${numeroCorrelativo.toString().padStart(4, '0')}`;
      
      // Insertar permiso
      const insertPermiso = await env.DB_PERMISOS.prepare(`
        INSERT INTO permisos_trabajo (
          numero_pt, numero_correlativo, planta_id, planta_nombre, 
          aerogenerador_id, aerogenerador_nombre, descripcion, 
          jefe_faena_id, jefe_faena_nombre, supervisor_parque_id, 
          supervisor_parque_nombre, tipo_mantenimiento, tipo_mantenimiento_otros,
          usuario_creador, usuario_creador_id, observaciones, estado,
          fecha_inicio, fecha_creacion, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        numeroPT,
        numeroCorrelativo.toString(),
        permisoData.plantaId || 'unknown',
        permisoData.planta,
        permisoData.aerogeneradorCodigo || null,
        permisoData.aerogenerador || null,
        permisoData.descripcion,
        permisoData.jefeFaenaId || 'unknown',
        permisoData.jefeFaena,
        permisoData.supervisorParqueId || null,
        permisoData.supervisorParque || null,
        permisoData.tipoMantenimiento || 'PREVENTIVO',
        permisoData.tipoMantenimientoOtros || null,
        permisoData.usuarioCreador || currentUser?.email || 'unknown',
        parseInt(currentUser?.id) || 'unknown',
        permisoData.observaciones || null,
        'CREADO',
        permisoData.fechaInicio || formatLocalDateTime(getLocalDateTime()),
        formatLocalDateTime(getLocalDateTime()),
        formatLocalDateTime(getLocalDateTime())
      ).run();
      
      const permisoId = insertPermiso.meta.last_row_id;
      
      // Insertar personal - ahora usando usuario.id
      if (permisoData.personal && permisoData.personal.length > 0) {
        for (const persona of permisoData.personal) {
          await env.DB_PERMISOS.prepare(`
            INSERT INTO permiso_personal (
              permiso_id, personal_id, personal_nombre, 
              personal_empresa, personal_rol, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            permisoId, 
            parseInt(persona.id), // Ahora es el usuario.id directamente
            persona.nombre || 'Sin nombre', 
            persona.empresa || 'Sin empresa', 
            persona.rol || 'Sin rol',
            formatLocalDateTime(getLocalDateTime())
          ).run();
        }
      }
      
      // Insertar actividades
      if (permisoData.actividades && permisoData.actividades.length > 0) {
        for (const actividad of permisoData.actividades) {
          await env.DB_PERMISOS.prepare(`
            INSERT INTO permiso_actividades (
              permiso_id, actividad_id, actividad_nombre, 
              tipo_actividad, created_at
            ) VALUES (?, ?, ?, ?, ?)
          `).bind(
            permisoId, 
            actividad.id || 'unknown', 
            actividad.nombre || 'Sin nombre', 
            actividad.tipo || 'RUTINARIA',
            formatLocalDateTime(getLocalDateTime())
          ).run();
        }
      }
      
      // Insertar matriz de riesgos
      if (permisoData.matrizRiesgos && permisoData.matrizRiesgos.length > 0) {
        for (const riesgo of permisoData.matrizRiesgos) {
          await env.DB_PERMISOS.prepare(`
            INSERT INTO permiso_matriz_riesgos (
              permiso_id, actividad, peligro, riesgo, 
              medidas_preventivas, codigo_matriz, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            permisoId, 
            riesgo.actividad || 'Sin actividad', 
            riesgo.peligro || 'Sin peligro', 
            riesgo.riesgo || 'Sin riesgo', 
            riesgo.medidas || 'Sin medidas', 
            riesgo.codigo || null,
            formatLocalDateTime(getLocalDateTime())
          ).run();
        }
      }
      
      // Log auditoría
      if (auditLogger) {
        await auditLogger.log({
          action: 'CREATE_PERMISO',
          resource: 'permisos',
          resourceId: permisoId.toString(),
          userId: currentUser?.sub || 'anonymous',
          userEmail: currentUser?.email || permisoData.usuarioCreador,
          ip: request.headers.get('CF-Connecting-IP'),
          success: true,
          metadata: { numeroPT, planta: permisoData.planta }
        });
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        id: permisoId, 
        numeroPT: numeroPT,
        numeroCorrelativo: numeroCorrelativo,
        message: 'Permiso guardado exitosamente'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
      
    } catch (error) {
      console.error('Error creando permiso:', error);
      
      if (auditLogger) {
        await auditLogger.log({
          action: 'CREATE_PERMISO_FAILED',
          resource: 'permisos',
          userId: currentUser?.sub || 'anonymous',
          userEmail: currentUser?.email || permisoData.usuarioCreador,
          ip: request.headers.get('CF-Connecting-IP'),
          success: false,
          error: error.message
        });
      }
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Error al guardar el permiso: ${error.message}`
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  
  // GET permisos
  try {
    // Primero obtenemos los permisos con información básica
    const permisosResult = await env.DB_PERMISOS.prepare(`
      SELECT 
        p.*,
        pc.fecha_inicio_trabajos,
        pc.fecha_fin_trabajos,
        pc.fecha_parada_turbina,
        pc.fecha_puesta_marcha_turbina,
        pc.observaciones_cierre,
        pc.usuario_cierre,
        pc.fecha_cierre,
        GROUP_CONCAT(DISTINCT pp.personal_nombre || ' (' || pp.personal_empresa || ')') as personal_asignado,
        GROUP_CONCAT(DISTINCT pp.personal_id) as personal_ids
      FROM permisos_trabajo p
      LEFT JOIN permiso_cierre pc ON p.id = pc.permiso_id
      LEFT JOIN permiso_personal pp ON p.id = pp.permiso_id
      GROUP BY p.id
      ORDER BY p.fecha_creacion DESC
      LIMIT 100
    `).all();
    
    const permisos = permisosResult.results || [];
    
    // Para cada permiso, obtener actividades y materiales
    for (let permiso of permisos) {
      // Obtener actividades (usando nombres de columnas correctos según la estructura real)
      const actividadesResult = await env.DB_PERMISOS.prepare(`
        SELECT actividad_nombre, tipo_actividad
        FROM permiso_actividades
        WHERE permiso_id = ?
      `).bind(permiso.id).all();
      
      permiso.actividades_detalle = actividadesResult.results || [];
      
      // Obtener materiales (usando estructura correcta de la tabla)
      try {
        const materialesResult = await env.DB_PERMISOS.prepare(`
          SELECT descripcion as material_nombre, cantidad as material_cantidad, 
                 propietario as material_propietario, almacen as material_almacen,
                 numero_item, numero_serie, observaciones_material
          FROM permiso_materiales
          WHERE permiso_id = ?
          ORDER BY descripcion ASC
        `).bind(permiso.id).all();
        
        permiso.materiales_detalle = materialesResult.results || [];
      } catch (e) {
        console.error('Error cargando materiales para permiso', permiso.id, ':', e);
        permiso.materiales_detalle = [];
      }
      
      // Obtener matriz de riesgos
      try {
        const matrizResult = await env.DB_PERMISOS.prepare(`
          SELECT riesgo_descripcion, medida_control
          FROM permiso_matriz_riesgos
          WHERE permiso_id = ?
        `).bind(permiso.id).all();
        
        permiso.matriz_riesgos_detalle = matrizResult.results || [];
      } catch (e) {
        permiso.matriz_riesgos_detalle = [];
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      permisos: permisos
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error consultando permisos:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handleAprobarPermiso(request, corsHeaders, env, currentUser, services) {
  const { auditLogger } = services;
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    const rawData = await request.json();
    const { permisoId, usuarioAprobador } = InputSanitizer.sanitizeObject(rawData);
    
    if (!permisoId || !usuarioAprobador) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Datos requeridos faltantes' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const result = await env.DB_PERMISOS.prepare(`
      UPDATE permisos_trabajo 
      SET 
        estado = 'ACTIVO',
        usuario_aprobador = ?,
        fecha_aprobacion = ?
      WHERE id = ? AND estado = 'CREADO'
    `).bind(
      usuarioAprobador,
      formatLocalDateTime(getLocalDateTime()),
      permisoId
    ).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Permiso no encontrado o ya procesado' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    if (auditLogger) {
      await auditLogger.log({
        action: 'APPROVE_PERMISO',
        resource: 'permisos',
        resourceId: permisoId.toString(),
        userId: currentUser?.sub || 'anonymous',
        userEmail: currentUser?.email || usuarioAprobador,
        ip: request.headers.get('CF-Connecting-IP'),
        success: true
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Permiso aprobado exitosamente'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error aprobando permiso:', error);
    
    if (auditLogger) {
      await auditLogger.log({
        action: 'APPROVE_PERMISO_FAILED',
        resource: 'permisos',
        userId: currentUser?.sub || 'anonymous',
        userEmail: currentUser?.email || 'unknown',
        ip: request.headers.get('CF-Connecting-IP'),
        success: false,
        error: error.message
      });
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Error al aprobar el permiso: ${error.message}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handleCerrarPermiso(request, corsHeaders, env, currentUser, services) {
  const { auditLogger } = services;
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    const rawData = await request.json();
    const cierreData = InputSanitizer.sanitizeObject(rawData);
    
    const { 
      permisoId, 
      usuarioCierre, 
      fechaFinTrabajos,
      materiales = []
    } = cierreData;
    
    if (!permisoId || !usuarioCierre || !fechaFinTrabajos) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Datos requeridos faltantes' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Actualizar estado del permiso
    await env.DB_PERMISOS.prepare(`
      UPDATE permisos_trabajo 
      SET 
        estado = 'CERRADO',
        observaciones = ?
      WHERE id = ? AND estado = 'ACTIVO'
    `).bind(
      cierreData.observacionesCierre || 'Trabajo completado',
      permisoId
    ).run();
    
    // Insertar registro de cierre
    await env.DB_PERMISOS.prepare(`
      INSERT INTO permiso_cierre (
        permiso_id, 
        fecha_inicio_trabajos, 
        fecha_fin_trabajos,
        fecha_parada_turbina,
        fecha_puesta_marcha_turbina,
        observaciones_cierre,
        usuario_cierre,
        fecha_cierre
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      permisoId,
      cierreData.fechaInicioTrabajos || null,
      fechaFinTrabajos,
      cierreData.fechaParadaTurbina || null,
      cierreData.fechaPuestaMarcha || null,
      cierreData.observacionesCierre || 'Trabajo completado',
      usuarioCierre,
      formatLocalDateTime(getLocalDateTime())
    ).run();
    
    // Insertar materiales si los hay
    if (materiales && materiales.length > 0) {
      for (const material of materiales) {
        await env.DB_PERMISOS.prepare(`
          INSERT INTO permiso_materiales (
            permiso_id, cantidad, descripcion, propietario,
            almacen, fecha_uso, numero_item, numero_serie,
            observaciones_material, fecha_registro
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          permisoId,
          material.cantidad || 1,
          material.descripcion || 'Material sin descripción',
          material.propietario || 'No especificado',
          material.almacen || 'Central',
          formatLocalDateTime(getLocalDateTime()),
          material.numeroItem || null,
          material.numeroSerie || null,
          material.observaciones || null,
          formatLocalDateTime(getLocalDateTime())
        ).run();
      }
    }
    
    if (auditLogger) {
      await auditLogger.log({
        action: 'CLOSE_PERMISO',
        resource: 'permisos',
        resourceId: permisoId.toString(),
        userId: currentUser?.sub || 'anonymous',
        userEmail: currentUser?.email || usuarioCierre,
        ip: request.headers.get('CF-Connecting-IP'),
        success: true,
        metadata: { materialesCount: materiales.length }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Permiso cerrado exitosamente',
      materialesCount: materiales.length
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error cerrando permiso:', error);
    
    if (auditLogger) {
      await auditLogger.log({
        action: 'CLOSE_PERMISO_FAILED',
        resource: 'permisos',
        userId: currentUser?.sub || 'anonymous',
        userEmail: currentUser?.email || 'unknown',
        ip: request.headers.get('CF-Connecting-IP'),
        success: false,
        error: error.message
      });
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Error al cerrar el permiso: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handleGenerateRegister(request, corsHeaders, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const rawData = await request.json();
  const data = InputSanitizer.sanitizeObject(rawData);
  const htmlContent = generateTomaConocimientoPDF(data);
  
  return new Response(htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="TomaConocimiento_${data.planta}_${formatLocalDateTime(getLocalDateTime()).split(' ')[0].replace(/-/g, '')}.html"`,
      ...corsHeaders
    }
  });
}

export async function handleHealth(request, corsHeaders, env) {
  try {
    const checks = {
      db_master: false,
      db_hseq: false,
      db_permisos: false
    };
    
    // Check DB_MASTER
    if (env.DB_MASTER) {
      try {
        const test = await env.DB_MASTER.prepare('SELECT COUNT(*) as count FROM usuarios').first();
        checks.db_master = true;
        checks.usuarios_count = test?.count || 0;
      } catch (error) {
        checks.db_master_error = error.message;
      }
    }
    
    // Check DB_HSEQ
    if (env.DB_HSEQ) {
      try {
        const test = await env.DB_HSEQ.prepare('SELECT COUNT(*) as count FROM matriz_riesgos').first();
        checks.db_hseq = true;
        checks.matriz_count = test?.count || 0;
      } catch (error) {
        checks.db_hseq_error = error.message;
      }
    }
    
    // Check DB_PERMISOS
    if (env.DB_PERMISOS) {
      try {
        const test = await env.DB_PERMISOS.prepare('SELECT COUNT(*) as count FROM permisos_trabajo').first();
        checks.db_permisos = true;
        checks.permisos_count = test?.count || 0;
      } catch (error) {
        checks.db_permisos_error = error.message;
      }
    }
    
    return new Response(JSON.stringify({
      status: 'OK',
      databases: checks,
      localTime: formatLocalDateTime(getLocalDateTime()),
      message: 'Sistema operativo con D1 Database'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'ERROR',
      error: error.message,
      timestamp: formatLocalDateTime(getLocalDateTime())
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Función para manejar la actualización de permisos
async function handleUpdatePermiso(permisoData, env, currentUser, services, corsHeaders) {
  const { auditLogger } = services;
  
  console.log('BACKEND - Recibiendo edición permiso, ID:', permisoData.permisoId, 'Datos:', JSON.stringify(permisoData, null, 2));
  
  if (!permisoData.permisoId) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'ID del permiso requerido para actualización'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    // Verificar que el permiso existe y está en estado CREADO
    const existingPermiso = await env.DB_PERMISOS.prepare(`
      SELECT * FROM permisos_trabajo WHERE id = ? AND estado = 'CREADO'
    `).bind(permisoData.permisoId).first();

    if (!existingPermiso) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Permiso no encontrado o no se puede editar (debe estar en estado CREADO)'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Verificar que el usuario actual es el creador
    const esCreador = parseInt(currentUser.id) === parseInt(existingPermiso.usuario_creador_id);
    const esEnel = currentUser.esEnel || currentUser.rol === 'Supervisor Enel';
    
    if (!esCreador && !esEnel) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Solo el creador del permiso puede editarlo'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Actualizar el permiso principal
    await env.DB_PERMISOS.prepare(`
      UPDATE permisos_trabajo SET 
        planta_id = ?, planta_nombre = ?, aerogenerador_id = ?, 
        aerogenerador_nombre = ?, descripcion = ?, jefe_faena_id = ?, 
        jefe_faena_nombre = ?, supervisor_parque_id = ?, supervisor_parque_nombre = ?, 
        tipo_mantenimiento = ?, tipo_mantenimiento_otros = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      permisoData.plantaId || 'unknown',
      permisoData.planta,
      permisoData.aerogeneradorCodigo || null,
      permisoData.aerogenerador || null,
      permisoData.descripcion,
      permisoData.jefeFaenaId || 'unknown',
      permisoData.jefeFaena,
      permisoData.supervisorParqueId || null,
      permisoData.supervisorParque || null,
      permisoData.tipoMantenimiento || 'PREVENTIVO',
      permisoData.tipoMantenimientoOtros || null,
      formatLocalDateTime(getLocalDateTime()),
      permisoData.permisoId
    ).run();

    // Eliminar registros existentes relacionados
    await env.DB_PERMISOS.prepare(`DELETE FROM permiso_personal WHERE permiso_id = ?`).bind(permisoData.permisoId).run();
    await env.DB_PERMISOS.prepare(`DELETE FROM permiso_actividades WHERE permiso_id = ?`).bind(permisoData.permisoId).run();
    await env.DB_PERMISOS.prepare(`DELETE FROM permiso_matriz_riesgos WHERE permiso_id = ?`).bind(permisoData.permisoId).run();

    // Re-insertar personal actualizado
    if (permisoData.personal && permisoData.personal.length > 0) {
      for (const persona of permisoData.personal) {
        await env.DB_PERMISOS.prepare(`
          INSERT INTO permiso_personal (
            permiso_id, personal_id, personal_nombre, 
            personal_empresa, personal_rol, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          permisoData.permisoId, 
          parseInt(persona.id),
          persona.nombre || 'Sin nombre', 
          persona.empresa || 'Sin empresa', 
          persona.rol || 'Sin rol',
          formatLocalDateTime(getLocalDateTime())
        ).run();
      }
    }

    // Re-insertar actividades actualizadas
    if (permisoData.actividades && permisoData.actividades.length > 0) {
      for (const actividad of permisoData.actividades) {
        await env.DB_PERMISOS.prepare(`
          INSERT INTO permiso_actividades (
            permiso_id, actividad_id, actividad_nombre, 
            tipo_actividad, created_at
          ) VALUES (?, ?, ?, ?, ?)
        `).bind(
          permisoData.permisoId, 
          actividad.id || 'unknown', 
          actividad.nombre || 'Sin nombre', 
          actividad.tipo || 'RUTINARIA',
          formatLocalDateTime(getLocalDateTime())
        ).run();
      }
    }

    // Re-insertar matriz de riesgos actualizada
    if (permisoData.matrizRiesgos && permisoData.matrizRiesgos.length > 0) {
      for (const riesgo of permisoData.matrizRiesgos) {
        await env.DB_PERMISOS.prepare(`
          INSERT INTO permiso_matriz_riesgos (
            permiso_id, actividad, peligro, riesgo, 
            medidas_preventivas, codigo_matriz, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          permisoData.permisoId, 
          riesgo.actividad || 'Sin actividad', 
          riesgo.peligro || 'Sin peligro', 
          riesgo.riesgo || 'Sin riesgo', 
          riesgo.medidas || 'Sin medidas', 
          riesgo.codigo || null,
          formatLocalDateTime(getLocalDateTime())
        ).run();
      }
    }

    // Log auditoría
    if (auditLogger) {
      await auditLogger.log({
        action: 'UPDATE_PERMISO',
        resource: 'permisos',
        resourceId: permisoData.permisoId.toString(),
        userId: currentUser?.sub || 'anonymous',
        userEmail: currentUser?.email,
        ip: null,
        success: true,
        metadata: { numeroPT: existingPermiso.numero_pt, planta: permisoData.planta }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      id: permisoData.permisoId, 
      numeroPT: existingPermiso.numero_pt,
      message: 'Permiso actualizado exitosamente'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error actualizando permiso:', error);
    
    if (auditLogger) {
      await auditLogger.log({
        action: 'UPDATE_PERMISO_FAILED',
        resource: 'permisos',
        resourceId: permisoData.permisoId?.toString(),
        userId: currentUser?.sub || 'anonymous',
        userEmail: currentUser?.email,
        ip: null,
        success: false,
        error: error.message
      });
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Error al actualizar el permiso: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handlePermisoDetalle(request, corsHeaders, env, currentUser, services) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  // Verificar que el usuario esté autenticado
  if (!currentUser || !currentUser.sub) {
    return new Response(JSON.stringify({ error: 'Usuario no autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    const url = new URL(request.url);
    const permisoId = url.searchParams.get('id');
    
    if (!permisoId) {
      return new Response(JSON.stringify({ error: 'ID del permiso requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Obtener datos completos del permiso
    const permiso = await env.DB_PERMISOS.prepare(`
      SELECT * FROM permisos_trabajo WHERE id = ?
    `).bind(permisoId).first();
    
    if (!permiso) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Permiso no encontrado' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Verificar que el usuario actual sea el creador o tenga permisos
    const esCreador = parseInt(currentUser.id) === parseInt(permiso.usuario_creador_id);
    const esEnel = currentUser.esEnel || currentUser.rol === 'Supervisor Enel';
    
    if (!esCreador && !esEnel) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No tienes permisos para ver este permiso' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Obtener actividades del permiso
    const actividadesResult = await env.DB_PERMISOS.prepare(`
      SELECT actividad_id FROM permiso_actividades WHERE permiso_id = ?
    `).bind(permisoId).all();
    
    const actividades_ids = (actividadesResult.results || []).map(a => a.actividad_id).join(',');
    
    // Obtener personal del permiso
    const personalResult = await env.DB_PERMISOS.prepare(`
      SELECT personal_id FROM permiso_personal WHERE permiso_id = ?
    `).bind(permisoId).all();
    
    const personal_ids = (personalResult.results || []).map(p => p.personal_id).join(',');
    
    // Agregar los IDs al objeto permiso
    permiso.actividades_ids = actividades_ids;
    permiso.personal_ids = personal_ids;
    
    return new Response(JSON.stringify({ 
      success: true, 
      permiso: permiso 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error obteniendo detalle permiso:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handleExportarPermisoExcel(request, corsHeaders, env, currentUser, services) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  // Verificar que el usuario esté autenticado
  if (!currentUser || !currentUser.sub) {
    return new Response(JSON.stringify({ error: 'Usuario no autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    const url = new URL(request.url);
    const permisoId = url.searchParams.get('id');
    
    if (!permisoId) {
      return new Response(JSON.stringify({ error: 'ID del permiso requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Obtener datos completos del permiso
    const permiso = await env.DB_PERMISOS.prepare(`
      SELECT 
        p.*,
        pc.fecha_inicio_trabajos,
        pc.fecha_fin_trabajos,
        pc.fecha_parada_turbina,
        pc.fecha_puesta_marcha_turbina,
        pc.observaciones_cierre,
        pc.usuario_cierre,
        pc.fecha_cierre
      FROM permisos_trabajo p
      LEFT JOIN permiso_cierre pc ON p.id = pc.permiso_id
      WHERE p.id = ?
    `).bind(permisoId).first();
    
    if (!permiso) {
      return new Response(JSON.stringify({ error: 'Permiso no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Obtener personal
    const personalResult = await env.DB_PERMISOS.prepare(`
      SELECT personal_nombre, personal_empresa, personal_rol
      FROM permiso_personal
      WHERE permiso_id = ?
    `).bind(permisoId).all();
    
    // Obtener actividades
    const actividadesResult = await env.DB_PERMISOS.prepare(`
      SELECT actividad_nombre, tipo_actividad
      FROM permiso_actividades
      WHERE permiso_id = ?
    `).bind(permisoId).all();
    
    // Obtener materiales
    const materialesResult = await env.DB_PERMISOS.prepare(`
      SELECT descripcion, cantidad, propietario, almacen, numero_item, numero_serie
      FROM permiso_materiales
      WHERE permiso_id = ?
    `).bind(permisoId).all();
    
    // Obtener matriz de riesgos
    const riesgosResult = await env.DB_PERMISOS.prepare(`
      SELECT actividad, peligro, riesgo, medidas_preventivas, codigo_matriz
      FROM permiso_matriz_riesgos
      WHERE permiso_id = ?
    `).bind(permisoId).all();
    
    // Generar CSV con formato UTF-8 BOM para Excel
    const BOM = '\uFEFF';
    let csvContent = BOM;
    
    // Sección: Información General
    csvContent += '=== INFORMACIÓN GENERAL ===\n';
    csvContent += 'Campo,Valor\n';
    csvContent += `"Número PT","${permiso.numero_pt || ''}"\n`;
    csvContent += `"Planta","${permiso.planta_nombre || ''}"\n`;
    csvContent += `"Aerogenerador","${permiso.aerogenerador_nombre || ''}"\n`;
    csvContent += `"Estado","${permiso.estado || ''}"\n`;
    csvContent += `"Fecha Creación","${permiso.fecha_creacion || ''}"\n`;
    csvContent += `"Jefe de Faena","${permiso.jefe_faena_nombre || ''}"\n`;
    csvContent += `"Supervisor Parque","${permiso.supervisor_parque_nombre || ''}"\n`;
    csvContent += `"Tipo Mantenimiento","${permiso.tipo_mantenimiento || ''}"\n`;
    csvContent += `"Descripción","${(permiso.descripcion || '').replace(/"/g, '""')}"\n`;
    csvContent += `"Observaciones de Cierre","${(permiso.observaciones_cierre || '').replace(/"/g, '""')}"\n`;
    csvContent += `"Usuario Cierre","${permiso.usuario_cierre || ''}"\n`;
    csvContent += `"Fecha Cierre","${permiso.fecha_cierre || ''}"\n`;
    csvContent += '\n';
    
    // Sección: Tiempos
    csvContent += '=== TIEMPOS ===\n';
    csvContent += 'Evento,Fecha/Hora\n';
    csvContent += `"Inicio Trabajos","${permiso.fecha_inicio_trabajos || ''}"\n`;
    csvContent += `"Fin Trabajos","${permiso.fecha_fin_trabajos || ''}"\n`;
    csvContent += `"Parada Turbina","${permiso.fecha_parada_turbina || ''}"\n`;
    csvContent += `"Puesta en Marcha","${permiso.fecha_puesta_marcha_turbina || ''}"\n`;
    csvContent += '\n';
    
    // Sección: Personal Asignado
    csvContent += '=== PERSONAL ASIGNADO ===\n';
    csvContent += 'Nombre,Empresa,Rol\n';
    (personalResult.results || []).forEach(p => {
      csvContent += `"${p.personal_nombre}","${p.personal_empresa}","${p.personal_rol}"\n`;
    });
    csvContent += '\n';
    
    // Sección: Actividades
    csvContent += '=== ACTIVIDADES ===\n';
    csvContent += 'Actividad,Tipo\n';
    (actividadesResult.results || []).forEach(a => {
      csvContent += `"${a.actividad_nombre}","${a.tipo_actividad}"\n`;
    });
    csvContent += '\n';
    
    // Sección: Materiales
    csvContent += '=== MATERIALES ===\n';
    csvContent += 'Descripción,Cantidad,Propietario,Almacén,N° Item,N° Serie\n';
    (materialesResult.results || []).forEach(m => {
      csvContent += `"${m.descripcion}","${m.cantidad}","${m.propietario}","${m.almacen}","${m.numero_item || ''}","${m.numero_serie || ''}"\n`;
    });
    csvContent += '\n';
    
    // Sección: Matriz de Riesgos
    csvContent += '=== MATRIZ DE RIESGOS ===\n';
    csvContent += 'Actividad,Peligro,Riesgo,Medidas Preventivas,Código Matriz\n';
    (riesgosResult.results || []).forEach(r => {
      csvContent += `"${(r.actividad || '').replace(/"/g, '""')}","${(r.peligro || '').replace(/"/g, '""')}","${(r.riesgo || '').replace(/"/g, '""')}","${(r.medidas_preventivas || '').replace(/"/g, '""')}","${r.codigo_matriz || ''}"\n`;
    });
    
    // Generar nombre de archivo con formato solicitado
    const fechaActual = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `${permiso.numero_pt}_${fechaActual}.csv`;
    
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Error exportando Excel:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handleExportarPermisoPdf(request, corsHeaders, env, currentUser, services) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  // Verificar que el usuario esté autenticado
  if (!currentUser || !currentUser.sub) {
    return new Response(JSON.stringify({ error: 'Usuario no autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    const url = new URL(request.url);
    const permisoId = url.searchParams.get('id');
    
    if (!permisoId) {
      return new Response(JSON.stringify({ error: 'ID del permiso requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Obtener datos completos del permiso (misma query que Excel)
    const permiso = await env.DB_PERMISOS.prepare(`
      SELECT 
        p.*,
        pc.fecha_inicio_trabajos,
        pc.fecha_fin_trabajos,
        pc.fecha_parada_turbina,
        pc.fecha_puesta_marcha_turbina,
        pc.observaciones_cierre,
        pc.usuario_cierre,
        pc.fecha_cierre
      FROM permisos_trabajo p
      LEFT JOIN permiso_cierre pc ON p.id = pc.permiso_id
      WHERE p.id = ?
    `).bind(permisoId).first();
    
    if (!permiso) {
      return new Response(JSON.stringify({ error: 'Permiso no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Obtener datos relacionados
    const personalResult = await env.DB_PERMISOS.prepare(`
      SELECT personal_nombre, personal_empresa, personal_rol
      FROM permiso_personal WHERE permiso_id = ?
    `).bind(permisoId).all();
    
    const actividadesResult = await env.DB_PERMISOS.prepare(`
      SELECT actividad_nombre, tipo_actividad
      FROM permiso_actividades WHERE permiso_id = ?
    `).bind(permisoId).all();
    
    const materialesResult = await env.DB_PERMISOS.prepare(`
      SELECT descripcion, cantidad, propietario, almacen
      FROM permiso_materiales WHERE permiso_id = ?
    `).bind(permisoId).all();
    
    // Obtener matriz de riesgos completa para las actividades del permiso
    let matrizRiesgosCompleta = [];
    if (actividadesResult.results && actividadesResult.results.length > 0) {
      const actividades = actividadesResult.results.map(a => a.actividad_nombre);
      const placeholders = actividades.map(() => '?').join(',');
      const matrizResult = await env.DB_HSEQ.prepare(`
        SELECT codigo, actividad, peligro, riesgo, medidas_preventivas
        FROM matriz_riesgos 
        WHERE estado = 'Activo' AND actividad IN (${placeholders})
        ORDER BY actividad ASC, codigo ASC
      `).bind(...actividades).all();
      matrizRiesgosCompleta = matrizResult.results || [];
    }
    
    // Logo Enel Green Power - Mismo logo que en el PDF de registro
    const logoEnel = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDIzLjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiIFsKCTwhRU5USVRZIG5zX2V4dGVuZCAiaHR0cDovL25zLmFkb2JlLmNvbS9FeHRlbnNpYmlsaXR5LzEuMC8iPgoJPCFFTlRJVFkgbnNfYWkgImh0dHA6Ly9ucy5hZG9iZS5jb20vQWRvYmVJbGx1c3RyYXRvci8xMC4wLyI+Cgk8IUVOVElUWSBuc19ncmFwaHMgImh0dHA6Ly9ucy5hZG9iZS5jb20vR3JhcGhzLzEuMC8iPgoJPCFFTlRJVFkgbnNfdmFycyAiaHR0cDovL25zLmFkb2JlLmNvbS9WYXJpYWJsZXMvMS4wLyI+Cgk8IUVOVElUWSBuc19pbXJlcCAiaHR0cDovL25zLmFkb2JlLmNvbS9JbWFnZVJlcGxhY2VtZW50LzEuMC8iPgoJPCFFTlRJVFkgbnNfc2Z3ICJodHRwOi8vbnMuYWRvYmUuY29tL1NhdmVGb3JXZWIvMS4wLyI+Cgk8IUVOVElUWSBuc19jdXN0b20gImh0dHA6Ly9ucy5hZG9iZS5jb20vR2VuZXJpY0N1c3RvbU5hbWVzcGFjZS8xLjAvIj4KCTwhRU5USVRZIG5zX2Fkb2JlX3hwYXRoICJodHRwOi8vbnMuYWRvYmUuY29tL1hQYXRoLzEuMC8iPgpdPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkVHUF9Mb2dvX1ByaW1hcnlfUkdCIiB4bWxuczp4PSImbnNfZXh0ZW5kOyIgeG1sbnM6aT0iJm5zX2FpOyIgeG1sbnM6Z3JhcGg9IiZuc19ncmFwaHM7IgoJIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMjgzLjUgMTQyLjEiCgkgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMjgzLjUgMTQyLjEiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8bWV0YWRhdGE+Cgk8c2Z3ICB4bWxucz0iJm5zX3NmdzsiPgoJCTxzbGljZXM+PC9zbGljZXM+CgkJPHNsaWNlU291cmNlQm91bmRzICBib3R0b21MZWZ0T3JpZ2luPSJ0cnVlIiBoZWlnaHQ9IjE0Mi4xIiB3aWR0aD0iMjgzLjUiIHg9IjI2OTQuNiIgeT0iLTQxMzkuNSI+PC9zbGljZVNvdXJjZUJvdW5kcz4KCTwvc2Z3Pgo8L21ldGFkYXRhPgo8Zz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMV8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMjY2Ljg2MiIgeTE9IjQxLjI5NjkiIHgyPSIyNjYuODYyIiB5Mj0iNzYuNDU5NCI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzAwOEM1QSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM3M0I5NjQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cmVjdCB4PSIyNjEiIHk9IjQxIiBmaWxsPSJ1cmwoI1NWR0lEXzFfKSIgd2lkdGg9IjExLjciIGhlaWdodD0iMzUuNCIvPgoJPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8yXyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIyNzEuMjU5OCIgeTE9Ijg2LjgzNzUiIHgyPSIyODEuOTk0NiIgeTI9Ijk1LjY4OSI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzczQjk2NCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM3M0I5NjQ7c3RvcC1vcGFjaXR5OjAiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzJfKSIgZD0iTTI3Mi43LDc2LjNjMCw4LjUsMy45LDEyLjEsMTAuNywxNi44bC02LjcsOS42Yy0xMC02LjYtMTUuOC0xNC0xNS44LTI2LjRIMjcyLjd6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzNfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjEwMS41MDY1IiB5MT0iNDEuNDQ0MSIgeDI9IjEyOC40Nzc4IiB5Mj0iNDEuNDQ0MSI+CgkJPHN0b3AgIG9mZnNldD0iNC43MDIyNDFlLTAzIiBzdHlsZT0ic3RvcC1jb2xvcjojMDA4QzVBIi8+CgkJPHN0b3AgIG9mZnNldD0iMC45OTU3IiBzdHlsZT0ic3RvcC1jb2xvcjojMzJBOTU5Ii8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8zXykiIGQ9Ik0xMjcuNiwyNC4yYy0xMC4yLDAtMTkuNCw0LjEtMjYuMSwxMC43djIzLjhjMS44LTkuNCwxMC4xLTIyLjgsMjYuMS0yMi44YzAuMywwLDAuNiwwLDAuOSwwVjI0LjIKCQlDMTI4LjIsMjQuMiwxMjcuOSwyNC4yLDEyNy42LDI0LjJ6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzRfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjE0NC4wNjczIiB5MT0iMzguMzY2IiB4Mj0iMTQ0LjA2NzMiIHkyPSI1OS4xMTYxIj4KCQk8c3RvcCAgb2Zmc2V0PSIxLjExMDQ1NmUtMDIiIHN0eWxlPSJzdG9wLWNvbG9yOiMzMkE5NTkiLz4KCQk8c3RvcCAgb2Zmc2V0PSIwLjE3MDEiIHN0eWxlPSJzdG9wLWNvbG9yOiM0MUIyNTkiLz4KCQk8c3RvcCAgb2Zmc2V0PSIwLjMzMyIgc3R5bGU9InN0b3AtY29sb3I6IzU1QkU1QSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM1NUJFNUE7c3RvcC1vcGFjaXR5OjAiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzRfKSIgZD0iTTE2MC4yLDYwLjVoLTExLjdsMC0zLjljMC0xMS42LTkuMi0yMC42LTIwLjUtMjAuN1YyNC4yYzE3LjgsMC4yLDMyLjIsMTQuNSwzMi4yLDMyLjVWNjAuNXoiLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfNV8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTUzLjc0MjgiIHkxPSI1NC41ODI2IiB4Mj0iMTU0LjMzOTciIHkyPSI2MC42NjM5Ij4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojRTk0OTg2Ii8+CgkJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6I0U5NDk4NjtzdG9wLW9wYWNpdHk6MCIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxsaW5lIGZpbGw9InVybCgjU1ZHSURfNV8pIiB4MT0iMTYwLjIiIHkxPSI2MC41IiB4Mj0iMTQ4LjUiIHkyPSI2MC41Ii8+Cgk8cmVjdCB4PSI4OS44IiB5PSIyNy40IiBmaWxsPSIjQzZDNkM2IiB3aWR0aD0iMTEuNyIgaGVpZ2h0PSI0MSIvPgoJPHJlY3QgeD0iMjYxIiBmaWxsPSIjQzZDNkM2IiB3aWR0aD0iMTEuNyIgaGVpZ2h0PSI0MSIvPgoJPHJlY3QgeD0iMTQ4LjUiIHk9IjYwLjUiIGZpbGw9IiNDNkM2QzYiIHdpZHRoPSIxMS43IiBoZWlnaHQ9IjQxIi8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzZfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjcxLjUyMyIgeTE9IjUzLjMzOTIiIHgyPSI2NC4xNjY0IiB5Mj0iNDAuNjk1MiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzAwOEM1QSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMxRDk3NUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzZfKSIgZD0iTTY2LjEsNTYuN2gxMmMtMS40LTguMy01LjUtMTUuNi0xMS4yLTIxLjNsLTguMiw4LjRDNjIuMiw0Ny4zLDY0LjgsNTEuNyw2Ni4xLDU2Ljd6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzdfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjYxLjIxODUiIHkxPSIzNy41MzgyIiB4Mj0iNDEuNzU0MyIgeTI9IjI5LjQ5MiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzFEOTc1RCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMyODlCNUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzdfKSIgZD0iTTM5LjMsMzUuOWM3LjYsMCwxNC41LDMuMSwxOS41LDhsOC4zLTguM2MtNy4xLTcuMS0xNy0xMS41LTI3LjgtMTEuNWMtMC4xLDAtMC4yLDAtMC4zLDBMMzksMzUuOQoJCUMzOS4xLDM1LjksMzkuMiwzNS45LDM5LjMsMzUuOXoiLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfOF8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTYuODgiIHkxPSIzNy44NjYyIiB4Mj0iMzYuNDk3NCIgeTI9IjI5LjUxMzUiPgoJCTxzdG9wICBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOiMzREE0NUYiLz4KCQk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojMjg5QjVEIi8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF84XykiIGQ9Ik0zOS4zLDM1LjlWMjQuMmMtMTEsMC0yMC45LDQuNS0yOCwxMS43bDguNCw4LjJDMjQuNiwzOS4xLDMxLjYsMzUuOSwzOS4zLDM1Ljl6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzlfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjUuNDEwNCIgeTE9IjYwLjcyMzUiIHgyPSIxMy40NTY2IiB5Mj0iNDEuNDEyNiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzUwQUI2MCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMzREE0NUYiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzlfKSIgZD0iTTExLjcsNjMuNWMwLTcuNiwzLjEtMTQuNSw4LjEtMTkuNWwtOC4zLTguM0M0LjQsNDIuOCwwLDUyLjYsMCw2My41YzAsMC4xLDAsMC4yLDAsMC4zbDExLjctMC4xCgkJQzExLjcsNjMuNiwxMS43LDYzLjUsMTEuNyw2My41eiIvPgoJPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8xMF8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iNS4zNTE0IiB5MT0iNjYuMzE5IiB4Mj0iMTMuNzA0MiIgeTI9Ijg1Ljc4MzIiPgoJCTxzdG9wICBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOiM1MEFCNjAiLz4KCQk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojNjdCNDYyIi8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8xMF8pIiBkPSJNMTEuNyw2My41SDBjMCwxMSw0LjUsMjAuOSwxMS43LDI4bDguMi04LjRDMTQuOSw3OC4xLDExLjcsNzEuMiwxMS43LDYzLjV6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzExXyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIxNS41MzYzIiB5MT0iODguNzAwMyIgeDI9IjM4LjMyMjkiIHkyPSI5OC4wMjIxIj4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojNjdCNDYyIi8+CgkJPHN0b3AgIG9mZnNldD0iMC45NjIzIiBzdHlsZT0ic3RvcC1jb2xvcjojOTJDODg2Ii8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8xMV8pIiBkPSJNMzkuMyw5MWMtNy42LDAtMTQuNS0zLjEtMTkuNS04LjFsLTguMyw4LjNjNy4xLDcuMSwxNi45LDExLjUsMjcuOCwxMS41YzAuMSwwLDAuMiwwLDAuMywwCgkJTDM5LjUsOTFDMzkuNCw5MSwzOS40LDkxLDM5LjMsOTF6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzEyXyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIzOS4yNTg4IiB5MT0iMTA2LjQ5MTEiIHgyPSI2Mi4zNDI2IiB5Mj0iODEuMDUxNyI+CgkJPHN0b3AgIG9mZnNldD0iMC4zMjkiIHN0eWxlPSJzdG9wLWNvbG9yOiM5MkM4ODYiLz4KCQk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojOTJDODg2O3N0b3Atb3BhY2l0eTowIi8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8xMl8pIiBkPSJNNjEuMSw4MC4yYy01LDYuNi0xMywxMC44LTIxLjksMTAuOHYxMS43YzEyLjcsMCwyNC02LDMxLjItMTUuNEw2MS4xLDgwLjJ6Ii8+Cgk8cmVjdCB4PSIzNyIgeT0iNTYuNyIgZmlsbD0iI0M2QzZDNiIgd2lkdGg9IjQxIiBoZWlnaHQ9IjExLjciLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMTNfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjI0Mi43NDExIiB5MT0iNTMuMzM5MiIgeDI9IjIzNS4zODQ2IiB5Mj0iNDAuNjk1MiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzAwOEM1QSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMxRDk3NUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzEzXykiIGQ9Ik0yMzcuMyw1Ni43aDEyYy0xLjQtOC4zLTUuNS0xNS42LTExLjItMjEuM2wtOC4yLDguNEMyMzMuNCw0Ny4zLDIzNiw1MS43LDIzNy4zLDU2Ljd6Ii8+Cgk8bGluZWFyR3JhZGllbnRgaWQ9IlNWR0lEXzE0XyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIyMzIuNDM2NyIgeTE9IjM3LjUzODIiIHgyPSIyMTIuOTcyNSIgeTI9IjI5LjQ5MiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzFEOTc1RCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMyODlCNUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzE0XykiIGQ9Ik0yMTAuNSwzNS45YzcuNiwwLDE0LjUsMy4xLDE5LjUsOGw4LjMtOC4zYy03LjEtNy4xLTE3LTExLjUtMjcuOC0xMS41Yy0wLjEsMC0wLjIsMC0wLjMsMAoJCWwwLjEsMTEuN0MyMTAuMywzNS45LDIxMC40LDM1LjksMjEwLjUsMzUuOXoiLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMTVfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjE4OC4wOTgxIiB5MT0iMzcuODY2MiIgeDI9IjIwNy43MTU2IiB5Mj0iMjkuNTEzNSI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzNEQTQ1RiIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMyODlCNUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzE1XykiIGQ9Ik0yMTAuNSwzNS45VjI0LjJjLTExLDAtMjAuOSw0LjUtMjgsMTEuN2w4LjQsOC4yQzE5NS44LDM5LjEsMjAyLjgsMzUuOSwyMTAuNSwzNS45eiIvPgoJPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8xNl8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTc2LjYyODYiIHkxPSI2MC43MjM1IiB4Mj0iMTg0LjY3NDgiIHkyPSI0MS40MTI2Ij4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojNTBBQjYwIi8+CgkJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6IzNEQTQ1RiIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxwYXRoIGZpbGw9InVybCgjU1ZHSURfMTZfKSIgZD0iTTE4Mi45LDYzLjVjMC03LjYsMy4xLTE0LjUsOC4xLTE5LjVsLTguMy04LjNjLTcuMSw3LjEtMTEuNSwxNi45LTExLjUsMjcuOGMwLDAuMSwwLDAuMiwwLDAuMwoJCWwxMS43LTAuMUMxODIuOSw2My42LDE4Mi45LDYzLjUsMTgyLjksNjMuNXoiLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMTdfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjE3Ni41Njk2IiB5MT0iNjYuMzE5IiB4Mj0iMTg0LjkyMjMiIHkyPSI4NS43ODMyIj4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojNTBBQjYwIi8+CgkJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6IzY3QjQ2MiIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxwYXRoIGZpbGw9InVybCgjU1ZHSURfMTdfKSIgZD0iTTE4Mi45LDYzLjVoLTExLjdjMCwxMSw0LjUsMjAuOSwxMS43LDI4bDguMi04LjRDMTg2LjEsNzguMSwxODIuOSw3MS4yLDE4Mi45LDYzLjV6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzE4XyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIxODYuNzU0NCIgeTE9Ijg4LjcwMDMiIHgyPSIyMDkuNTQxIiB5Mj0iOTguMDIyMSI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzY3QjQ2MiIvPgoJCTxzdG9wICBvZmZzZXQ9IjAuOTYyMyIgc3R5bGU9InN0b3AtY29sb3I6IzkyQzg4NiIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxwYXRoIGZpbGw9InVybCgjU1ZHSURfMThfKSIgZD0iTTIxMC41LDkxYy03LjYsMC0xNC41LTMuMS0xOS41LTguMWwtOC4zLDguM2M3LjEsNy4xLDE2LjksMTEuNSwyNy44LDExLjVjMC4xLDAsMC4yLDAsMC4zLDAKCQlMMjEwLjcsOTFDMjEwLjcsOTEsMjEwLjYsOTEsMjEwLjUsOTF6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzE5XyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIyMTAuNDc2OSIgeTE9IjEwNi40OTExIiB4Mj0iMjMzLjU2MDgiIHkyPSI4MS4wNTE3Ij4KCQk8c3RvcCAgb2Zmc2V0PSIwLjMyOSIgc3R5bGU9InN0b3AtY29sb3I6IzkyQzg4NiIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM5MkM4ODY7c3RvcC1vcGFjaXR5OjAiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzE5XykiIGQ9Ik0yMzIuNCw4MC4yYy01LDYuNi0xMywxMC44LTIxLjksMTAuOHYxMS43YzEyLjcsMCwyNC02LDMxLjItMTUuNEwyMzIuNCw4MC4yeiIvPgoJPHJlY3QgeD0iMjA4LjIiIHk9IjU2LjciIGZpbGw9IiNDNkM2QzYiIHdpZHRoPSI0MSIgaGVpZ2h0PSIxMS43Ii8+Cgk8Zz4KCQk8cGF0aCBmaWxsPSIjMDA4QzVBIiBkPSJNMTUzLjIsMTMzLjJ2Ny45Yy0yLDAuOC0zLjksMS02LDFjLTQuNiwwLTcuMi0zLjYtNy4yLTguN2MwLTQuMywyLjMtOC43LDcuMi04LjdjMi44LDAsNS42LDEuNSw1LjksNC41CgkJCWgtMS43Yy0wLjMtMi4xLTIuMi0zLjEtNC4yLTMuMWMtNCwwLTUuNSwzLjktNS41LDcuM2MwLDQuMywxLjgsNy4zLDYuMyw3LjNjMS4zLDAsMi41LTAuMywzLjctMC43di01LjRoLTQuMnYtMS40SDE1My4yeiIvPgoJCTxwYXRoIGZpbGw9IiMwMDhDNUEiIGQ9Ik0xNTguNiwxNDEuOGgtMS40di05YzAtMC45LTAuMS0xLjgtMC4xLTIuNmgxLjRsMC4xLDEuN2gwYzAuNC0xLjIsMS41LTIsMi42LTIuMWMwLjUsMCwwLjksMCwxLjQsMHYxLjMKCQkJYy0wLjMsMC0wLjYtMC4xLTAuOS0wLjFjLTIuMSwwLTMuMiwxLjUtMy4yLDMuN1YxNDEuOHoiLz4KCQk8cGF0aCBmaWxsPSIjMDA4QzVBIiBkPSJNMTY1LjcsMTM2LjNjMCwyLjUsMS4yLDQuNiw0LDQuNmMxLjcsMCwzLTEuMiwzLjQtMi44aDEuNWMtMC43LDIuOC0yLjUsNC4xLTUuMyw0LjFjLTMuNSwwLTUuMS0zLTUuMS02LjIKCQkJYzAtMy4yLDEuNy02LjIsNS4yLTYuMmMzLjksMCw1LjMsMi45LDUuMyw2LjVIMTY1Ljd6IE0xNzMuMiwxMzVjLTAuMi0yLjMtMS40LTQtMy44LTRjLTIuMywwLTMuNSwxLjktMy43LDRIMTczLjJ6Ii8+CgkJPHBhdGggZmlsbD0iIzAwOEM1QSIgZD0iTTE3OC42LDEzNi4zYzAsMi41LDEuMiw0LjYsNCw0LjZjMS43LDAsMy0xLjIsMy40LTIuOGgxLjVjLTAuNywyLjgtMi41LDQuMS01LjMsNC4xYy0zLjUsMC01LjEtMy01LjEtNi4yCgkJCWMwLTMuMiwxLjctNi4yLDUuMi02LjJjMy45LDAsNS4zLDIuOSw1LjMsNi41SDE3OC42eiBNMTg2LjEsMTM1Yy0wLjItMi4zLTEuNC00LTMuOC00Yy0yLjMsMC0zLjUsMS45LTMuNyw0SDE4Ni4xeiIvPgoJCTxwYXRoIGZpbGw9IiMwMDhDNUEiIGQ9Ik0xOTIuMSwxNDEuOGgtMS40di05YzAtMC45LTAuMS0xLjgtMC4xLTIuNmgxLjRsMC4xLDEuN2wwLDBjMC44LTEuNCwyLjEtMi4xLDMuNi0yLjEKCQkJYzMuOCwwLDQuMSwzLjQsNC4xLDQuN3Y3LjNoLTEuNHYtNy41YzAtMi0xLjItMy4yLTMuMS0zLjJjLTIuMywwLTMuMywxLjktMy4zLDRWMTQxLjh6Ii8+CgkJPHBhdGggZmlsbD0iIzAwOEM1QSIgZD0iTTIxMC42LDE0MS44VjEyNWg0LjJjMy4yLTAuMSw2LjksMC43LDYuOSw0LjdjMCw0LTMuNiw0LjgtNi45LDQuN2gtMi43djcuM0gyMTAuNnogTTIxMi4xLDEzMy4xaDMuNwoJCQljMi4zLDAsNC4zLTAuNyw0LjMtMy4zYzAtMi42LTItMy4zLTQuMy0zLjNoLTMuN1YxMzMuMXoiLz4KCQk8cGF0aCBmaWxsPSIjMDA4QzVBIiBkPSJNMjMzLjEsMTM1LjljMCwzLjEtMS43LDYuMi01LjQsNi4yYy0zLjcsMC01LjQtMy4xLTUuNC02LjJzMS43LTYuMiw1LjQtNi4yCgkJCUMyMzEuNCwxMjkuOCwyMzMuMSwxMzIuOSwyMzMuMSwxMzUuOXogTTIyNy43LDEzMWMtMi44LDAtMy45LDIuNy0zLjksNC45czEuMSw0LjksMy45LDQuOWMyLjgsMCwzLjktMi43LDMuOS00LjkKCQkJUzIzMC41LDEzMSwyMjcuNywxMzF6Ii8+CgkJPHBhdGggZmlsbD0iIzAwOEM1QSIgZD0iTTIzOSwxMzkuOUwyMzksMTM5LjlsMy42LTkuOGgxLjZsMy40LDkuN2gwbDMuNC05LjdoMS41bC00LjMsMTEuN0gyNDdsLTMuNi0xMC4xaDBsLTMuNiwxMC4xaC0xLjQKCQkJbC00LjMtMTEuN2gxLjVMMjM5LDEzOS45eiIvPgoJCTxwYXRoIGZpbGw9IiMwMDhDNUEiIGQ9Ik0yNTUuMiwxMzYuM2MwLDIuNSwxLjIsNC42LDQsNC42YzEuNiwwLDMtMS4yLDMuNC0yLjhoMS41Yy0wLjcsMi44LTIuNSw0LjEtNS4zLDQuMWMtMy41LDAtNS4xLTMtNS4xLTYuMgoJCQljMC0zLjIsMS43LTYuMiw1LjItNi4yYzMuOSwwLDUuMywyLjksNS4zLDYuNUgyNTUuMnogTTI2Mi43LDEzNWMtMC4yLTIuMy0xLjQtNC0zLjgtNGMtMi4zLDAtMy41LDEuOS0zLjcsNEgyNjIuN3oiLz4KCQk8cGF0aCBmaWxsPSIjMDA4QzVBIiBkPSJNMjY4LjcsMTQxLjhoLTEuNHYtOWMwLTAuOS0wLjEtMS44LTAuMS0yLjZoMS40bDAuMSwxLjdoMGMwLjQtMS4yLDEuNS0yLDIuNi0yLjFjMC41LDAsMC45LDAsMS40LDB2MS4zCgkJCWMtMC4zLDAtMC42LTAuMS0wLjktMC4xYy0yLjEsMC0zLjIsMS41LTMuMiwzLjdWMTQxLjh6Ii8+Cgk8L2c+CjwvZz4KPC9zdmc+Cg==";
    
    // Generar HTML para PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Permiso de Trabajo ${permiso.numero_pt} - Exportación</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0066cc; padding-bottom: 20px; }
        .logo { width: 150px; height: 75px; margin-bottom: 10px; }
        .title { color: #0066cc; font-size: 24px; font-weight: bold; }
        .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
        .section { margin-bottom: 25px; }
        .section-title { background: #0066cc; color: white; padding: 8px 12px; font-weight: bold; margin-bottom: 10px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .info-item { margin-bottom: 8px; }
        .info-label { font-weight: bold; color: #0066cc; }
        .info-value { margin-left: 10px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .table th { background: #f0f0f0; padding: 8px; border: 1px solid #ddd; font-weight: bold; }
        .table td { padding: 8px; border: 1px solid #ddd; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #666; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
        <img src="${logoEnel}" alt="Enel Green Power">
        </div>
        <div class="title">REPORTE DE PERMISO DE TRABAJO</div>
        <div class="subtitle">${permiso.numero_pt} - ${permiso.planta_nombre}</div>
    </div>
    
    <div class="section">
        <div class="section-title">INFORMACIÓN GENERAL</div>
        <div class="info-grid">
            <div>
                <div class="info-item"><span class="info-label">Número PT:</span><span class="info-value">${permiso.numero_pt || ''}</span></div>
                <div class="info-item"><span class="info-label">Planta:</span><span class="info-value">${permiso.planta_nombre || ''}</span></div>
                <div class="info-item"><span class="info-label">Aerogenerador:</span><span class="info-value">${permiso.aerogenerador_nombre || ''}</span></div>
                <div class="info-item"><span class="info-label">Estado:</span><span class="info-value">${permiso.estado || ''}</span></div>
            </div>
            <div>
                <div class="info-item"><span class="info-label">Jefe de Faena:</span><span class="info-value">${permiso.jefe_faena_nombre || ''}</span></div>
                <div class="info-item"><span class="info-label">Supervisor:</span><span class="info-value">${permiso.supervisor_parque_nombre || 'N/A'}</span></div>
                <div class="info-item"><span class="info-label">Tipo:</span><span class="info-value">${permiso.tipo_mantenimiento || ''}</span></div>
                <div class="info-item"><span class="info-label">Fecha Creación:</span><span class="info-value">${permiso.fecha_creacion || ''}</span></div>
            </div>
        </div>
        <div class="info-item" style="margin-top: 15px;">
            <span class="info-label">Descripción:</span><br>
            <div style="margin-top: 5px; padding: 10px; background: #f9f9f9; border-left: 4px solid #0066cc;">
                ${permiso.descripcion || 'Sin descripción'}
            </div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">TIEMPOS DE TRABAJO</div>
        <table class="table">
            <tr><th>Evento</th><th>Fecha y Hora</th></tr>
            <tr><td>Inicio de Trabajos</td><td>${permiso.fecha_inicio_trabajos || 'No registrado'}</td></tr>
            <tr><td>Fin de Trabajos</td><td>${permiso.fecha_fin_trabajos || 'No registrado'}</td></tr>
            <tr><td>Parada Turbina</td><td>${permiso.fecha_parada_turbina || 'No aplica'}</td></tr>
            <tr><td>Puesta en Marcha</td><td>${permiso.fecha_puesta_marcha_turbina || 'No aplica'}</td></tr>
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">PERSONAL ASIGNADO</div>
        <table class="table">
            <tr><th>Nombre</th><th>Empresa</th><th>Rol</th></tr>
            ${(personalResult.results || []).map(p => 
              `<tr><td>${p.personal_nombre}</td><td>${p.personal_empresa}</td><td>${p.personal_rol}</td></tr>`
            ).join('')}
            ${(personalResult.results || []).length === 0 ? '<tr><td colspan="3">No hay personal registrado</td></tr>' : ''}
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">ACTIVIDADES REALIZADAS</div>
        <table class="table">
            <tr><th>Actividad</th><th>Tipo</th></tr>
            ${(actividadesResult.results || []).map(a => 
              `<tr><td>${a.actividad_nombre}</td><td>${a.tipo_actividad}</td></tr>`
            ).join('')}
            ${(actividadesResult.results || []).length === 0 ? '<tr><td colspan="2">No hay actividades registradas</td></tr>' : ''}
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">MATERIALES UTILIZADOS</div>
        <table class="table">
            <tr><th>Descripción</th><th>Cantidad</th><th>Propietario</th><th>Almacén</th></tr>
            ${(materialesResult.results || []).map(m => 
              `<tr><td>${m.descripcion}</td><td>${m.cantidad}</td><td>${m.propietario}</td><td>${m.almacen}</td></tr>`
            ).join('')}
            ${(materialesResult.results || []).length === 0 ? '<tr><td colspan="4">No hay materiales registrados</td></tr>' : ''}
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">MATRIZ DE RIESGOS</div>
        <table class="table">
            <tr><th>Código</th><th>Actividad</th><th>Peligro</th><th>Riesgo</th><th>Medidas Preventivas</th></tr>
            ${matrizRiesgosCompleta.map(m => 
              `<tr>
                <td>${m.codigo || 'N/A'}</td>
                <td>${m.actividad}</td>
                <td>${m.peligro}</td>
                <td>${m.riesgo}</td>
                <td>${m.medidas_preventivas}</td>
              </tr>`
            ).join('')}
            ${matrizRiesgosCompleta.length === 0 ? '<tr><td colspan="5">No hay matriz de riesgos disponible para las actividades seleccionadas</td></tr>' : ''}
        </table>
    </div>
    
    ${permiso.observaciones_cierre ? `
    <div class="section">
        <div class="section-title">OBSERVACIONES DE CIERRE</div>
        <div style="padding: 15px; background: #f9f9f9; border: 1px solid #ddd; margin-top: 10px;">
            ${permiso.observaciones_cierre}
        </div>
    </div>
    ` : ''}
    
    <div class="footer">
        <p>Documento generado el ${new Date().toLocaleString('es-CL')} - PT Wind - Sistema de Gestión de Permisos de Trabajo</p>
    </div>
</body>
</html>
    `;
    
    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="PT-${permiso.numero_pt}_${currentUser.usuario || 'Usuario'}.html"`,
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Error exportando PDF:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export default {
  handlePermisos,
  handleAprobarPermiso,
  handleCerrarPermiso,
  handleGenerateRegister,
  handleHealth,
  handleExportarPermisoExcel,
  handleExportarPermisoPdf
};

