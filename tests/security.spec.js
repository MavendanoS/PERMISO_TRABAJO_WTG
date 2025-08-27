// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:62100';

test.describe('Security Tests - Login', () => {
  
  test('should show generic error message for invalid username', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Intentar login con usuario inválido
    await page.fill('#usuario', 'usuario_no_existe');
    await page.fill('#password', 'Password123!');
    await page.click('#loginBtn');
    
    // Verificar mensaje genérico
    const errorMessage = await page.locator('#loginError').textContent();
    expect(errorMessage).toBe('Usuario o contraseña incorrectos');
  });
  
  test('should show generic error message for invalid password', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Intentar login con contraseña incorrecta (asumiendo que existe un usuario 'admin')
    await page.fill('#usuario', 'admin');
    await page.fill('#password', 'WrongPassword123!');
    await page.click('#loginBtn');
    
    // Verificar mensaje genérico
    const errorMessage = await page.locator('#loginError').textContent();
    expect(errorMessage).toBe('Usuario o contraseña incorrectos');
  });
  
  test('should have security headers', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    const headers = response.headers();
    
    // Verificar headers de seguridad
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    expect(headers['strict-transport-security']).toContain('max-age=31536000');
    expect(headers['content-security-policy']).toBeDefined();
  });
});

test.describe('Password Validation Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Simular que el usuario necesita cambiar contraseña
    await page.evaluate(() => {
      // Mostrar modal de cambio de contraseña
      const modal = document.getElementById('changePasswordModal');
      if (modal) modal.style.display = 'block';
    });
  });
  
  test('should reject password without uppercase', async ({ page }) => {
    await page.fill('#newPassword', 'password123!');
    await page.fill('#confirmPassword', 'password123!');
    
    // Verificar validación del cliente
    const validation = await page.evaluate(() => {
      const password = 'password123!';
      return validatePasswordStrength(password);
    });
    
    expect(validation.valid).toBe(false);
    expect(validation.message).toContain('mayúscula');
  });
  
  test('should reject password without lowercase', async ({ page }) => {
    await page.fill('#newPassword', 'PASSWORD123!');
    await page.fill('#confirmPassword', 'PASSWORD123!');
    
    const validation = await page.evaluate(() => {
      const password = 'PASSWORD123!';
      return validatePasswordStrength(password);
    });
    
    expect(validation.valid).toBe(false);
    expect(validation.message).toContain('minúscula');
  });
  
  test('should reject password without numbers', async ({ page }) => {
    await page.fill('#newPassword', 'Password!');
    await page.fill('#confirmPassword', 'Password!');
    
    const validation = await page.evaluate(() => {
      const password = 'Password!';
      return validatePasswordStrength(password);
    });
    
    expect(validation.valid).toBe(false);
    expect(validation.message).toContain('número');
  });
  
  test('should reject password without special characters', async ({ page }) => {
    await page.fill('#newPassword', 'Password123');
    await page.fill('#confirmPassword', 'Password123');
    
    const validation = await page.evaluate(() => {
      const password = 'Password123';
      return validatePasswordStrength(password);
    });
    
    expect(validation.valid).toBe(false);
    expect(validation.message).toContain('carácter especial');
  });
  
  test('should reject password shorter than 8 characters', async ({ page }) => {
    await page.fill('#newPassword', 'Pass1!');
    await page.fill('#confirmPassword', 'Pass1!');
    
    const validation = await page.evaluate(() => {
      const password = 'Pass1!';
      return validatePasswordStrength(password);
    });
    
    expect(validation.valid).toBe(false);
    expect(validation.message).toContain('8 caracteres');
  });
  
  test('should accept valid password', async ({ page }) => {
    await page.fill('#newPassword', 'Password123!');
    await page.fill('#confirmPassword', 'Password123!');
    
    const validation = await page.evaluate(() => {
      const password = 'Password123!';
      return validatePasswordStrength(password);
    });
    
    expect(validation.valid).toBe(true);
  });
});

test.describe('XSS Prevention Tests', () => {
  
  test('should sanitize user input', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Intentar inyectar script
    const xssPayload = '<script>alert("XSS")</script>';
    await page.fill('#usuario', xssPayload);
    
    // Verificar que el input se sanitiza
    const sanitized = await page.evaluate(() => {
      const input = document.getElementById('usuario').value;
      return ClientSecurity.sanitizeInput(input);
    });
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('</script>');
  });
  
  test('should encode HTML output', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const htmlPayload = '<img src=x onerror=alert(1)>';
    const encoded = await page.evaluate((payload) => {
      return ClientSecurity.encodeHTML(payload);
    }, htmlPayload);
    
    expect(encoded).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });
});