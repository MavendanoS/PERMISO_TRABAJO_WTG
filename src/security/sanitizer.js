export class InputSanitizer {
  static sanitizeString(input, options = {}) {
    if (typeof input !== 'string') return input;
    
    let sanitized = input
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    const maxLength = options.maxLength || 10000;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }
  
  static sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = key.replace(/[^\w.-]/g, '');
      
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[sanitizedKey] = value.map(item => 
          typeof item === 'object' ? this.sanitizeObject(item) : this.sanitizeString(item)
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }
    
    return sanitized;
  }
  
  static sanitizeForSQL(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[\0\x08\x09\x1a\n\r"'\\%]/g, (char) => {
        switch (char) {
          case "\0": return "\\0";
          case "\x08": return "\\b";
          case "\x09": return "\\t";
          case "\x1a": return "\\z";
          case "\n": return "\\n";
          case "\r": return "\\r";
          case "\"":
          case "'":
          case "\\":
          case "%": return "\\" + char;
          default: return char;
        }
      });
  }
}