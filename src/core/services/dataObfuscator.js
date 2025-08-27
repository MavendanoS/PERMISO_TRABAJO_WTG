/**
 * Data Obfuscation Service
 * Protege datos sensibles en tránsito usando técnicas estándar empresariales
 */

export class DataObfuscator {
  constructor() {
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  /**
   * Ofusca datos usando Base64 + compresión
   */
  async obfuscate(data) {
    try {
      // Convertir a JSON string
      const jsonStr = JSON.stringify(data);
      
      // Comprimir usando CompressionStream API (nativo en navegadores modernos)
      const stream = new Blob([jsonStr]).stream();
      const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
      const compressedBlob = await new Response(compressedStream).blob();
      const compressedBuffer = await compressedBlob.arrayBuffer();
      
      // Convertir a Base64
      const base64 = btoa(String.fromCharCode(...new Uint8Array(compressedBuffer)));
      
      // Agregar metadata ofuscada
      return {
        _: base64,
        t: Date.now(),
        v: 1
      };
    } catch (error) {
      console.error('Obfuscation failed:', error);
      // Fallback: solo Base64
      return {
        _: btoa(unescape(encodeURIComponent(JSON.stringify(data)))),
        t: Date.now(),
        v: 0
      };
    }
  }

  /**
   * Desofusca datos
   */
  async deobfuscate(obfuscatedData) {
    try {
      if (!obfuscatedData || !obfuscatedData._) {
        return obfuscatedData;
      }

      const base64 = obfuscatedData._;
      
      if (obfuscatedData.v === 1) {
        // Versión con compresión
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Descomprimir
        const blob = new Blob([bytes]);
        const stream = blob.stream();
        const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
        const decompressedBlob = await new Response(decompressedStream).blob();
        const text = await decompressedBlob.text();
        
        return JSON.parse(text);
      } else {
        // Versión sin compresión (fallback)
        return JSON.parse(decodeURIComponent(escape(atob(base64))));
      }
    } catch (error) {
      console.error('Deobfuscation failed:', error);
      return obfuscatedData;
    }
  }

  /**
   * Ofusca campos sensibles selectivamente
   */
  maskSensitiveFields(data, fieldsToMask = ['email', 'rut', 'telefono', 'password']) {
    if (Array.isArray(data)) {
      return data.map(item => this.maskSensitiveFields(item, fieldsToMask));
    }
    
    if (typeof data === 'object' && data !== null) {
      const masked = {};
      for (const [key, value] of Object.entries(data)) {
        if (fieldsToMask.includes(key) && typeof value === 'string') {
          // Mantener solo los primeros y últimos caracteres
          if (value.length > 4) {
            masked[key] = value.substring(0, 2) + '***' + value.substring(value.length - 2);
          } else {
            masked[key] = '***';
          }
        } else if (typeof value === 'object') {
          masked[key] = this.maskSensitiveFields(value, fieldsToMask);
        } else {
          masked[key] = value;
        }
      }
      return masked;
    }
    
    return data;
  }

  /**
   * Genera un token único para referenciar datos
   */
  generateDataToken() {
    return 'tk_' + btoa(Math.random().toString(36).substring(2) + Date.now().toString(36));
  }
}

export default DataObfuscator;