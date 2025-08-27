# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - heading "PT WIND" [level=1] [ref=e5]
    - paragraph [ref=e6]: Sistema de Gestión de Permisos de Trabajo
  - generic [ref=e7]:
    - generic [ref=e8]:
      - generic [ref=e9]: Usuario / Email
      - textbox "Usuario / Email" [active] [ref=e10]: <script>alert("XSS")</script>
    - generic [ref=e11]:
      - generic [ref=e12]: Contraseña
      - textbox "Contraseña" [ref=e13]
    - button "Iniciar Sesión" [ref=e14] [cursor=pointer]
  - generic [ref=e15]: Verificando conexión...
```