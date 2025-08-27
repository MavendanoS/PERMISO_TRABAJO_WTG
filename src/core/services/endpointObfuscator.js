/**
 * Endpoint Obfuscation Service
 * Ofusca los nombres de los endpoints para que no sean legibles en Network tab
 */

export class EndpointObfuscator {
  constructor() {
    // Mapeo bidireccional de endpoints reales a códigos ofuscados
    this.endpointMap = {
      // Endpoints públicos
      'login': 'a1b2c3',
      'health': 'h3a1th',
      'change-password': 'p4s5ch',
      
      // Endpoints de usuarios
      'users': 'u5r5d4',
      'personal': 'p3r5n1',
      'personal-by-parque': 'pbp789',
      'supervisores': 's9p3r5',
      'admin-users': 'a9u5r5',
      
      // Endpoints de catálogo
      'parques': 'p4rq35',
      'aerogeneradores': 'a3r0g5',
      'actividades': 'ac7v15',
      'matriz-riesgos': 'm4tr1x',
      
      // Endpoints de permisos
      'permisos': 'pr3m15',
      'permiso-detalle': 'pd3t41',
      'cerrar-permiso': 'cp3rm0',
      'aprobar-permiso': 'ap9r0v',
      'detalle-aprobacion': 'd4pr0b',
      'aprobar-cierre-permiso': 'acp9r0',
      
      // Endpoints de generación
      'generate-register': 'g3nr3g',
      'exportar-permiso-excel': 'epx3xc',
      'exportar-permiso-pdf': 'eppdf9'
    };
    
    // Crear mapeo inverso
    this.reverseMap = {};
    for (const [key, value] of Object.entries(this.endpointMap)) {
      this.reverseMap[value] = key;
    }
  }
  
  /**
   * Ofusca un endpoint real a un código
   */
  obfuscate(endpoint) {
    // Si tiene parámetros adicionales (como IDs), separarlos
    const parts = endpoint.split('/');
    const base = parts[0];
    const rest = parts.slice(1).join('/');
    
    const obfuscated = this.endpointMap[base];
    if (obfuscated) {
      return rest ? `${obfuscated}/${rest}` : obfuscated;
    }
    
    // Si no está mapeado, generar un hash simple
    return this.simpleHash(endpoint);
  }
  
  /**
   * Desofusca un código a un endpoint real
   */
  deobfuscate(obfuscated) {
    // Si tiene parámetros adicionales (como IDs), separarlos
    const parts = obfuscated.split('/');
    const base = parts[0];
    const rest = parts.slice(1).join('/');
    
    const real = this.reverseMap[base];
    if (real) {
      return rest ? `${real}/${rest}` : real;
    }
    
    // Si no está mapeado, devolver tal cual
    return obfuscated;
  }
  
  /**
   * Genera un hash simple para endpoints no mapeados
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'x' + Math.abs(hash).toString(36);
  }
  
  /**
   * Obtiene la URL ofuscada completa
   */
  getObfuscatedUrl(baseUrl, endpoint) {
    const obfuscated = this.obfuscate(endpoint);
    return `${baseUrl}/api/v/${obfuscated}`;
  }
}

export default EndpointObfuscator;