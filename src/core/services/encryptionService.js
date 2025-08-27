/**
 * Servicio de Encriptación AES-256-GCM para Respuestas API
 * Implementa encriptación end-to-end para proteger datos en tránsito
 */

export class EncryptionService {
  constructor(secretKey) {
    this.secretKey = secretKey;
    this.algorithm = 'AES-GCM';
  }

  /**
   * Deriva una clave criptográfica de la clave secreta
   */
  async deriveKey(salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.secretKey),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encripta datos JSON para respuestas API
   */
  async encryptResponse(data) {
    try {
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(jsonString);

      // Generar salt e IV únicos para cada encriptación
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Derivar clave con el salt
      const key = await this.deriveKey(salt);

      // Encriptar los datos
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        dataBytes
      );

      // Combinar salt, iv y datos encriptados
      const encryptedArray = new Uint8Array(encrypted);
      const result = new Uint8Array(salt.length + iv.length + encryptedArray.length);
      result.set(salt, 0);
      result.set(iv, salt.length);
      result.set(encryptedArray, salt.length + iv.length);

      // Convertir a base64 para transmisión
      return this.arrayBufferToBase64(result);
    } catch (error) {
      console.error('Error encrypting response:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Desencripta respuesta en el cliente
   */
  async decryptResponse(encryptedData) {
    try {
      // Decodificar de base64
      const encryptedArray = this.base64ToArrayBuffer(encryptedData);
      
      // Extraer salt, iv y datos encriptados
      const salt = encryptedArray.slice(0, 16);
      const iv = encryptedArray.slice(16, 28);
      const encrypted = encryptedArray.slice(28);

      // Derivar clave con el salt
      const key = await this.deriveKey(salt);

      // Desencriptar
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encrypted
      );

      // Convertir de vuelta a JSON
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decrypted);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error decrypting response:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Convierte ArrayBuffer a base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convierte base64 a ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Verifica si los datos están encriptados
   */
  static isEncrypted(data) {
    try {
      // Si es un objeto normal, no está encriptado
      if (typeof data === 'object' && data !== null) {
        return false;
      }
      // Si es string y parece base64, probablemente está encriptado
      if (typeof data === 'string' && data.length > 50 && /^[A-Za-z0-9+/]+=*$/.test(data)) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export default EncryptionService;