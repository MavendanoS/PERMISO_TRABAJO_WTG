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

export async function handleExportarPermisoExcel(request, corsHeaders, env) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
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
    
    // Generar datos para Excel compatible con SAP
    const excelData = {
      'Información General': [
        ['Campo', 'Valor'],
        ['Número PT', permiso.numero_pt || ''],
        ['Planta', permiso.planta_nombre || ''],
        ['Aerogenerador', permiso.aerogenerador_nombre || ''],
        ['Estado', permiso.estado || ''],
        ['Fecha Creación', permiso.fecha_creacion || ''],
        ['Jefe de Faena', permiso.jefe_faena_nombre || ''],
        ['Supervisor Parque', permiso.supervisor_parque_nombre || ''],
        ['Tipo Mantenimiento', permiso.tipo_mantenimiento || ''],
        ['Descripción', permiso.descripcion || '']
      ],
      'Tiempos': [
        ['Evento', 'Fecha/Hora'],
        ['Inicio Trabajos', permiso.fecha_inicio_trabajos || ''],
        ['Fin Trabajos', permiso.fecha_fin_trabajos || ''],
        ['Parada Turbina', permiso.fecha_parada_turbina || ''],
        ['Puesta en Marcha', permiso.fecha_puesta_marcha_turbina || '']
      ],
      'Personal': [
        ['Nombre', 'Empresa', 'Rol'],
        ...(personalResult.results || []).map(p => [p.personal_nombre, p.personal_empresa, p.personal_rol])
      ],
      'Actividades': [
        ['Actividad', 'Tipo'],
        ...(actividadesResult.results || []).map(a => [a.actividad_nombre, a.tipo_actividad])
      ],
      'Materiales': [
        ['Descripción', 'Cantidad', 'Propietario', 'Almacén', 'N° Item', 'N° Serie'],
        ...(materialesResult.results || []).map(m => [
          m.descripcion, m.cantidad, m.propietario, m.almacen, m.numero_item || '', m.numero_serie || ''
        ])
      ]
    };
    
    // Generar CSV simple para compatibilidad con SAP
    let csvContent = '';
    
    Object.keys(excelData).forEach(sheetName => {
      csvContent += `\n\n[${sheetName}]\n`;
      excelData[sheetName].forEach(row => {
        csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
      });
    });
    
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="PT_${permiso.numero_pt}_${new Date().toISOString().split('T')[0]}.csv"`,
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

export async function handleExportarPermisoPdf(request, corsHeaders, env) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
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
    
    // Logo Enel en base64
    const logoEnel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAllBMVEX///8AcbIAbrAAabAAZ68AZq4AYq0AY60AX6wAXKsAWaoAVqkAVakATqUAS6QARaIAPp4ANJoAM5kALpYAK5UAJpMAH48AGowAFIgAEYcACIIAAH4AAHwAAHkAAHX7/f719/vw9Pjp7/Xh6fHY4+zR3unI2ObAz+G5ydy0xNqswNamuNKbuM+Rr8uKqsiEpMV+n8J4mcBylr1rirhef7MN';
    
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
        .logo { width: 120px; height: auto; margin-bottom: 10px; }
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
        <img src="${logoEnel}" alt="ENEL" class="logo">
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
        <p>Generado con Claude Code</p>
    </div>
</body>
</html>
    `;
    
    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="PT_${permiso.numero_pt}_Auditoria.html"`,
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

