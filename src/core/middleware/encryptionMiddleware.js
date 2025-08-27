/**
 * Middleware de Encriptación para Respuestas API
 * Encripta automáticamente todas las respuestas JSON salientes
 */

import { EncryptionService } from '../services/encryptionService.js';

export class EncryptionMiddleware {
  constructor(secretKey) {
    this.encryptionService = new EncryptionService(secretKey);
  }

  /**
   * Middleware para encriptar respuestas automáticamente
   */
  async encryptResponse(response, corsHeaders, excludeEndpoints = []) {
    try {
      // Verificar si es una respuesta JSON válida
      if (!response || response.status !== 200) {
        return response;
      }

      // Obtener el contenido de la respuesta
      const responseText = await response.text();
      
      // Verificar si es JSON válido
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        // No es JSON, retornar sin cambios
        return new Response(responseText, {
          status: response.status,
          headers: response.headers
        });
      }

      // Encriptar los datos
      const encryptedData = await this.encryptionService.encryptResponse(responseData);

      // Crear respuesta encriptada
      return new Response(JSON.stringify({
        encrypted: true,
        data: encryptedData,
        timestamp: Date.now()
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Encrypted': 'true',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Encryption middleware error:', error);
      // En caso de error, retornar respuesta sin encriptar
      return response;
    }
  }

  /**
   * Crea una respuesta encriptada directamente
   */
  async createEncryptedResponse(data, status = 200, corsHeaders = {}) {
    try {
      const encryptedData = await this.encryptionService.encryptResponse(data);
      
      return new Response(JSON.stringify({
        encrypted: true,
        data: encryptedData,
        timestamp: Date.now()
      }), {
        status: status,
        headers: {
          'Content-Type': 'application/json',
          'X-Encrypted': 'true',
          ...corsHeaders
        }
      });
    } catch (error) {
      console.error('Error creating encrypted response:', error);
      // Fallback a respuesta normal en caso de error
      return new Response(JSON.stringify(data), {
        status: status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }

  /**
   * Verifica si el endpoint debe ser excluido de la encriptación
   */
  shouldExclude(endpoint, excludeList = []) {
    return excludeList.some(excluded => endpoint.includes(excluded));
  }
}

export default EncryptionMiddleware;