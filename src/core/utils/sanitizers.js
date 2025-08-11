/**
 * Utility functions to sanitize input strings and objects.
 * Derived from worker.js sanitization logic.
 */
export class InputSanitizer {
  static sanitizeString(value) {
    if (typeof value !== 'string') {
      return value;
    }
    // Remove any characters that are not word, whitespace, punctuation common in emails/paths
    return value.replace(/[^\w\s.@\/\-]/g, '');
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
