import { InputSanitizer } from '../utils/sanitizers.js';

export async function handleParques(request, corsHeaders, env) {
  try {
    const result = await env.DB_MASTER.prepare(`
      SELECT * FROM parques_eolicos
      ORDER BY nombre ASC
    `).all();
    
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Error loading parques', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handleAerogeneradores(request, corsHeaders, env) {
  try {
    const url = new URL(request.url);
    const parqueNombre = InputSanitizer.sanitizeString(url.searchParams.get('parque'));
    
    // Usar la tabla Aerogeneradores del DB_PERMISOS con prepared statements
    let query = 'SELECT Plant_Code, Plant_Name, WTG_Name FROM Aerogeneradores';
    let params = [];
    
    if (parqueNombre) {
      query += ' WHERE Plant_Name = ?';
      params.push(parqueNombre);
    }
    
    query += ' ORDER BY WTG_Name ASC';
    
    const result = await env.DB_PERMISOS.prepare(query).bind(...params).all();
    
    const adaptedResults = result.results?.map(row => ({
      codigo: row.WTG_Name,
      nombre: row.WTG_Name,
      Plant_Code: row.Plant_Code,
      Plant_Name: row.Plant_Name,
      WTG_Name: row.WTG_Name
    })) || [];
    
    return new Response(JSON.stringify({
      results: adaptedResults,
      has_more: false,
      total: adaptedResults.length
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Error loading aerogeneradores'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function handleActividades(request, corsHeaders, env) {
  try {
    const result = await env.DB_MASTER.prepare(`
      SELECT * FROM actividades
    `).all();
    
    // Definir el orden prioritario de las actividades rutinarias
    const ordenPrioridad = [
      'Tránsito al lugar de trabajo',
      'Ingreso al aerogenerador', 
      'Uso de elevador',
      'Trabajos en Ground o Foso',
      'Trabajos en Secciones de Torre',
      'Trabajos en Nacelle'
    ];
    
    // Ordenar las actividades según prioridad
    const actividadesOrdenadas = (result.results || []).sort((a, b) => {
      const indexA = ordenPrioridad.indexOf(a.nombre);
      const indexB = ordenPrioridad.indexOf(b.nombre);
      
      // Si ambos están en la lista de prioridad, ordenar por índice
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // Si solo A está en prioridad, A va primero
      if (indexA !== -1 && indexB === -1) {
        return -1;
      }
      
      // Si solo B está en prioridad, B va primero
      if (indexA === -1 && indexB !== -1) {
        return 1;
      }
      
      // Si ninguno está en prioridad, ordenar alfabéticamente
      return a.nombre.localeCompare(b.nombre);
    });
    
    return new Response(JSON.stringify({
      results: actividadesOrdenadas,
      has_more: false
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Error loading actividades', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export default { handleParques, handleAerogeneradores, handleActividades };