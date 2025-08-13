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

export async function handlePersonalByParque(request, corsHeaders, env, currentUser) {
  try {
    const url = new URL(request.url);
    const parqueNombre = InputSanitizer.sanitizeString(url.searchParams.get('parque'));
    
    // Primero obtenemos todos los usuarios activos
    let query = `SELECT id, usuario as nombre, email, empresa, 
                        cargo as rol, rut, telefono, parques_autorizados
                 FROM usuarios 
                 WHERE estado = 'Activo'
                 AND rol IN ('Lead Technician', 'Technician', 'Supervisor Enel', 'Enel Otro')
                 ORDER BY usuario ASC`;
    
    const result = await env.DB_MASTER.prepare(query).all();
    
    // Aplicar filtro por empresa del usuario actual
    let filteredResults = result.results || [];
    
    if (currentUser && filteredResults.length > 0) {
      const usuarioEsEnel = currentUser.empresa && currentUser.empresa.toLowerCase().includes('enel');
      
      filteredResults = filteredResults.filter(user => {
        const userEsEnel = user.rol === 'Supervisor Enel' || 
                          user.rol === 'Enel Otro' ||
                          (user.empresa && user.empresa.toLowerCase().includes('enel'));
        
        // Si el usuario actual es de Enel, puede ver todo el personal
        if (usuarioEsEnel) {
          return true;
        }
        
        // Si el usuario no es de Enel, solo puede ver:
        // 1. Personal de Enel
        // 2. Personal de su propia empresa
        return userEsEnel || (user.empresa === currentUser.empresa);
      });
    }
    
    // Si hay un parque específico, filtramos por parques autorizados
    if (parqueNombre && filteredResults.length > 0) {
      filteredResults = filteredResults.filter(user => {
        // Los usuarios de Enel pueden trabajar en cualquier parque
        const esEnel = user.rol === 'Supervisor Enel' || 
                      user.rol === 'Enel Otro' ||
                      (user.empresa && user.empresa.toLowerCase().includes('enel'));
        
        if (esEnel) {
          return true; // Incluir todos los usuarios de Enel
        }
        
        // Para el resto del personal, verificar parques autorizados
        if (!user.parques_autorizados) return false;
        
        try {
          // Intentar parsear como JSON array
          const parques = JSON.parse(user.parques_autorizados);
          if (Array.isArray(parques)) {
            return parques.some(p => {
              const parqueNorm = p.toLowerCase().trim();
              const busquedaNorm = parqueNombre.toLowerCase().trim();
              return parqueNorm.includes(busquedaNorm) || busquedaNorm.includes(parqueNorm);
            });
          }
        } catch (e) {
          // Si no es JSON, intentar como texto separado por comas
          const parques = user.parques_autorizados.split(',').map(p => p.trim());
          return parques.some(p => {
            const parqueNorm = p.toLowerCase().trim();
            const busquedaNorm = parqueNombre.toLowerCase().trim();
            return parqueNorm.includes(busquedaNorm) || busquedaNorm.includes(parqueNorm);
          });
        }
        
        return false;
      });
    }
    
    return new Response(JSON.stringify({
      results: filteredResults,
      has_more: false
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error loading personal by parque:', error);
    return new Response(JSON.stringify({ 
      error: 'Error loading personal by parque', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handleSupervisores(request, corsHeaders, env, currentUser) {
  try {
    const url = new URL(request.url);
    const parqueNombre = InputSanitizer.sanitizeString(url.searchParams.get('parque'));
    
    // Obtener únicamente supervisores Enel activos para el campo de Supervisor de Parque
    const result = await env.DB_MASTER.prepare(`
      SELECT id, usuario as nombre, email, cargo, telefono, rut, empresa,
             parques_autorizados, estado, rol
      FROM usuarios
      WHERE rol = 'Supervisor Enel'
      AND estado = 'Activo'
      ORDER BY usuario ASC
    `).all();
    
    let filteredResults = result.results || [];
    
    // Ya solo tenemos supervisores Enel, no necesitamos filtro adicional por empresa
    
    // Si se especifica un parque, filtrar supervisores Enel que lo tengan autorizado
    if (parqueNombre && filteredResults.length > 0) {
      filteredResults = filteredResults.filter(supervisor => {
        // Todos son supervisores Enel, verificar que tengan este parque autorizado
        if (!supervisor.parques_autorizados) return false;
        
        try {
          // Intentar parsear como JSON array
          const parques = JSON.parse(supervisor.parques_autorizados);
          if (Array.isArray(parques)) {
            return parques.some(p => {
              const parqueNorm = p.toLowerCase().trim();
              const busquedaNorm = parqueNombre.toLowerCase().trim();
              return parqueNorm === busquedaNorm || 
                     parqueNorm.includes(busquedaNorm) || 
                     busquedaNorm.includes(parqueNorm);
            });
          }
        } catch (e) {
          // Si no es JSON, intentar como texto separado por comas
          const parques = supervisor.parques_autorizados.split(',').map(p => p.trim());
          return parques.some(p => {
            const parqueNorm = p.toLowerCase().trim();
            const busquedaNorm = parqueNombre.toLowerCase().trim();
            return parqueNorm === busquedaNorm || 
                   parqueNorm.includes(busquedaNorm) || 
                   busquedaNorm.includes(parqueNorm);
          });
        }
        
        return false;
      });
    }
    
    return new Response(JSON.stringify({
      results: filteredResults,
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
