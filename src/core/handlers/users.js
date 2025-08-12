import { InputSanitizer } from '../utils/sanitizers.js';
import AuditLogger from '../services/auditLogger.js';


export async function handleUsers(request, corsHeaders, env) {
  try {
    const result = await env.DB_MASTER.prepare(`
      SELECT id, usuario, email, rol, empresa, parques_autorizados, 
             puede_actualizar_personal, ultimo_login, created_at
      FROM usuarios
      ORDER BY usuario ASC
    `).all();
    
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Error loading users', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handlePersonal(request, corsHeaders, env) {
  try {
    // Ahora lee de usuarios unificada, no de personal_tecnico
    const result = await env.DB_MASTER.prepare(`
      SELECT id, usuario as nombre, email, empresa, cargo as rol, 
             rut, telefono, parques_autorizados, estado
      FROM usuarios
      WHERE rol IN ('Lead Technician', 'Technician', 'Supervisor Enel')
      AND estado = 'Activo'
      ORDER BY usuario ASC
    `).all();
    
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Error loading personal', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handlePersonalByParque(request, corsHeaders, env) {
  try {
    const url = new URL(request.url);
    const parqueNombre = InputSanitizer.sanitizeString(url.searchParams.get('parque'));
    
    // Ahora busca en tabla usuarios unificada
    let query = `SELECT id, usuario as nombre, email, empresa, 
                        cargo as rol, rut, telefono, parques_autorizados
                 FROM usuarios 
                 WHERE estado = 'Activo'
                 AND rol != 'Admin'`;
    let params = [];
    
    if (parqueNombre) {
      query += ` AND parques_autorizados LIKE ?`;
      params.push(`%${parqueNombre}%`);
    }
    
    query += ` ORDER BY usuario ASC`;
    
    const result = await env.DB_MASTER.prepare(query).bind(...params).all();
    
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Error loading personal by parque', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handleSupervisores(request, corsHeaders, env) {
  try {
    // Ahora filtra usuarios con rol Supervisor Enel de tabla unificada
    const result = await env.DB_MASTER.prepare(`
      SELECT id, usuario as nombre, email, cargo, telefono, rut,
             parques_autorizados as plantas_asignadas, estado
      FROM usuarios
      WHERE rol = 'Supervisor Enel'
      AND estado = 'Activo'
      ORDER BY usuario ASC
    `).all();
    
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Error loading supervisores', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export default { handleUsers, handlePersonal, handlePersonalByParque, handleSupervisores };
