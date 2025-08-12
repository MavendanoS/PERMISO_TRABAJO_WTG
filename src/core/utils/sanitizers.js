/**
 * Utility functions to sanitize input strings and objects.
 * Derived from worker.js sanitization logic.
 */
export class InputSanitizer {
  static sanitizeString(value) {
    if (typeof value !== 'string') {
      return value;
    }
    // Permitir letras (incluyendo Unicode/acentos), números, espacios y caracteres comunes
    // Remover solo caracteres potencialmente peligrosos como <, >, &, ", ', `, etc.
    return value.replace(/[<>'"`;{}()]/g, '');
  }

  static sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = InputSanitizer.sanitizeString(obj[key]);
    }
    return sanitized;
  }

  static sanitizeForSQL(value) {
    if (typeof value === 'string') {
      return value.replace(/'/g, "''");
    }
    return value;
  }
}

export default InputSanitizer;
