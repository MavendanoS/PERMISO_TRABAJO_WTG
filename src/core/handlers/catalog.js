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
    const parqueNombre = InputSanitizer.sanitizeForSQL(url.searchParams.get('parque'));
    
    // Usar la tabla Aerogeneradores del DB_PERMISOS
    let query = 'SELECT Plant_Code, Plant_Name, WTG_Name FROM Aerogeneradores';
    let params = [];
    
    if (parqueNombre) {
      query += ' WHERE Plant_Name LIKE ? OR Plant_Name = ?';
      params.push(`%${parqueNombre}%`, parqueNombre);
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
    console.error('Error loading aerogeneradores:', error);
    return new Response(JSON.stringify({ 
      error: 'Error loading aerogeneradores', 
      details: error.message 
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
      error: 'Error loading actividades', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export default { handleParques, handleAerogeneradores, handleActividades };