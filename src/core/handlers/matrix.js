import { InputSanitizer } from '../utils/sanitizers.js';

export async function handleMatrizRiesgos(request, corsHeaders, env) {
  try {
    const url = new URL(request.url);
    const actividades = InputSanitizer.sanitizeString(url.searchParams.get('actividades'));
    
    let query = `SELECT * FROM matriz_riesgos WHERE estado = 'Activo'`;
    let params = [];
    
    if (actividades) {
      const actividadesList = actividades.split(',').map(act => act.trim());
      const placeholders = actividadesList.map(() => '?').join(',');
      query += ` AND actividad IN (${placeholders})`;
      params.push(...actividadesList);
    }
    
    query += ` ORDER BY actividad ASC, codigo ASC`;
    
    const result = await env.DB_HSEQ.prepare(query).bind(...params).all();
    
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false,
      debug: {
        totalResults: result.results?.length || 0,
        requestedActivities: actividades ? actividades.split(',') : []
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error loading matriz riesgos:', error);
    return new Response(JSON.stringify({ 
      error: 'Error loading matriz riesgos', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export default { handleMatrizRiesgos };
