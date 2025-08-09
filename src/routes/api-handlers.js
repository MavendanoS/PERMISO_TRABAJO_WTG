// ============================================================================
// API HANDLERS COMPLETOS - EXTRAIDOS DE WORKER ORIGINAL
// ============================================================================

// Esta es la versión completa con todas las funcionalidades D1
export class ApiHandlers {
  constructor(env, services) {
    this.env = env;
    this.services = services;
  }

  async handleLogin(request, corsHeaders) {
    const { rateLimiter, authService, auditLogger } = this.services;
    
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
      
      if (!rawData.usuario || !rawData.password) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Usuario y contraseña son requeridos' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Buscar usuario en D1
      const userResult = await this.env.DB_MASTER.prepare(\`
        SELECT * FROM usuarios 
        WHERE LOWER(email) = LOWER(?) OR LOWER(usuario) = LOWER(?)
        LIMIT 1
      \`).bind(rawData.usuario, rawData.usuario).first();
      
      if (!userResult) {
        await auditLogger.log({
          action: 'LOGIN_FAILED',
          resource: 'auth',
          ip: clientIp,
          userEmail: rawData.usuario,
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
      const verification = await authService.verifyPassword(rawData.password, userResult.password_hash);
      
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

      // Actualizar último login
      await this.env.DB_MASTER.prepare(\`
        UPDATE usuarios SET ultimo_login = ? WHERE id = ?
      \`).bind(new Date().toISOString(), userResult.id).run();
      
      // Generar token
      const token = await authService.generateToken({
        id: userResult.id,
        email: userResult.email,
        rol: userResult.rol,
        empresa: userResult.empresa,
        esEnel: userResult.rol === 'Supervisor Enel'
      });

      // Log exitoso
      await auditLogger.log({
        action: 'LOGIN_SUCCESS',
        resource: 'auth',
        userId: userResult.id,
        userEmail: userResult.email,
        ip: clientIp,
        success: true
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Login exitoso',
        token: token,
        requirePasswordChange: userResult.requiere_cambio_password === 1,
        user: {
          id: userResult.id,
          nombre: userResult.nombre,
          email: userResult.email,
          rol: userResult.rol,
          empresa: userResult.empresa,
          esEnel: userResult.rol === 'Supervisor Enel'
        }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
      
    } catch (error) {
      console.error('Login error:', error);
      
      await auditLogger.log({
        action: 'LOGIN_ERROR',
        resource: 'auth',
        ip: clientIp,
        success: false,
        error: error.message
      });

      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Error interno del servidor' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  async handleParques(request, corsHeaders) {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    try {
      const parques = await this.env.DB_MASTER.prepare(\`
        SELECT * FROM parques_eolicos ORDER BY nombre
      \`).all();

      return new Response(JSON.stringify({
        success: true,
        data: parques.results
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Error loading parques:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Error cargando parques' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  async handleAerogeneradores(request, corsHeaders) {
    const url = new URL(request.url);
    const parqueId = url.searchParams.get('parque_id');

    if (!parqueId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'parque_id requerido' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    try {
      const aerogeneradores = await this.env.DB_MASTER.prepare(\`
        SELECT * FROM aerogeneradores 
        WHERE parque_id = ? 
        ORDER BY nombre
      \`).bind(parqueId).all();

      return new Response(JSON.stringify({
        success: true,
        data: aerogeneradores.results
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Error loading aerogeneradores:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Error cargando aerogeneradores' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  async handlePersonal(request, corsHeaders) {
    try {
      const personal = await this.env.DB_MASTER.prepare(\`
        SELECT * FROM personal ORDER BY nombre
      \`).all();

      return new Response(JSON.stringify({
        success: true,
        data: personal.results
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Error loading personal:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Error cargando personal' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  async handleActividades(request, corsHeaders) {
    try {
      const actividades = await this.env.DB_MASTER.prepare(\`
        SELECT * FROM actividades_rutinarias ORDER BY nombre
      \`).all();

      return new Response(JSON.stringify({
        success: true,
        data: actividades.results
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Error loading actividades:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Error cargando actividades' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  async handleMatrizRiesgos(request, corsHeaders) {
    try {
      const matriz = await this.env.DB_HSEQ.prepare(\`
        SELECT * FROM matriz_riesgos ORDER BY codigo
      \`).all();

      return new Response(JSON.stringify({
        success: true,
        data: matriz.results
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Error loading matriz riesgos:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Error cargando matriz de riesgos' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  async handleHealth(request, corsHeaders) {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '19.0-modular-complete',
      databases: {
        master: !!this.env.DB_MASTER,
        hseq: !!this.env.DB_HSEQ,
        permisos: !!this.env.DB_PERMISOS
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}