import AuditLogger from '../services/auditLogger.js';
import { getLocalDateTime, formatLocalDateTime } from '../utils/time.js';
import { InputSanitizer } from '../utils/sanitizers.js';
import generateTomaConocimientoPDF from './pdf.js';

export async function handlePermisos(request, corsHeaders, env, currentUser, services) {
  const { auditLogger } = services;
  
  if (request.method === 'POST') {
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
          usuario_creador, fecha_inicio, fecha_creacion, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        permisoData.fechaInicio || formatLocalDateTime(getLocalDateTime()),
        formatLocalDateTime(getLocalDateTime()),
        'CREADO'
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
            persona.id, // Ahora es el usuario.id directamente
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
    const result = await env.DB_PERMISOS.prepare(`
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
        GROUP_CONCAT(DISTINCT pp.personal_id) as personal_ids,
        GROUP_CONCAT(DISTINCT pa.actividad_nombre) as actividades
      FROM permisos_trabajo p
      LEFT JOIN permiso_cierre pc ON p.id = pc.permiso_id
      LEFT JOIN permiso_personal pp ON p.id = pp.permiso_id
      LEFT JOIN permiso_actividades pa ON p.id = pa.permiso_id
      GROUP BY p.id
      ORDER BY p.fecha_creacion DESC
      LIMIT 100
    `).all();
    
    return new Response(JSON.stringify({ 
      success: true,
      permisos: result.results || []
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
      getLocalDateTime()
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
          getLocalDateTime()
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
      'Content-Disposition': `inline; filename="TomaConocimiento_${data.planta}_${new Date().toISOString().split('T')[0]}.html"`,
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
      security: {
        jwtSecret: env.JWT_SECRET ? 'Configured' : 'Using default',
        rateLimitKV: env.RATE_LIMIT_KV ? 'Connected' : 'Not configured'
      },
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

export default {
  handlePermisos,
  handleAprobarPermiso,
  handleCerrarPermiso,
  handleGenerateRegister,
  handleHealth
};

