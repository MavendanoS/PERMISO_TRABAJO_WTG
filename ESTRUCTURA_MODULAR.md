# PT Wind - Estructura Modular

## 📁 Estructura de Carpetas

```
src/
├── auth/                    # Autenticación y autorización
│   └── auth-service.js      # Servicio de autenticación JWT
├── config/                  # Configuraciones centralizadas
│   └── index.js            # Exportaciones de configuración
├── database/               # Gestión de base de datos
│   ├── init.js            # Inicialización de DB
│   └── schemas.js         # Esquemas SQL
├── middleware/             # Middleware de la aplicación
│   └── auth-middleware.js  # Middleware de autenticación
├── routes/                 # Enrutamiento de API
│   └── api-router.js      # Router principal de API
├── security/              # Módulos de seguridad
│   ├── config.js         # Configuración de seguridad
│   ├── errors.js         # Errores de seguridad
│   ├── rate-limiter.js   # Control de velocidad
│   └── sanitizer.js      # Sanitización de entrada
├── utils/                 # Utilidades generales
│   ├── audit-logger.js   # Logger de auditoría
│   └── helpers.js        # Funciones auxiliares
├── views/                 # (Futuro) Templates HTML/CSS/JS
└── worker-new.js         # Worker principal modularizado
```

## 🔧 Configuración

### Archivos de Configuración

1. **wrangler.toml** - Configuración de Cloudflare Worker
2. **package.json** - Dependencias y scripts
3. **src/config/** - Configuraciones de la aplicación

### Variables de Entorno

Las mismas variables que antes:
- `JWT_SECRET` (obligatorio)
- `ALLOWED_ORIGINS` (opcional)

### Bindings de Base de Datos

- `DB_MASTER` - Base de datos maestra
- `DB_HSEQ` - Base de datos HSEQ
- `DB_PERMISOS` - Base de datos de permisos
- `RATE_LIMIT_KV` - KV para rate limiting

## 🚀 Ventajas de la Nueva Estructura

### ✅ Mantenibilidad
- Código organizado por responsabilidades
- Fácil localización de funciones específicas
- Separación clara entre lógica de negocio y infraestructura

### ✅ Escalabilidad
- Fácil agregar nuevos módulos
- Importaciones explícitas y controladas
- Estructura preparada para crecimiento

### ✅ Testing
- Cada módulo puede ser testeado independientemente
- Mocking simplificado de dependencias
- Cobertura de pruebas granular

### ✅ Reutilización
- Módulos reutilizables entre proyectos
- Servicios independientes
- APIs consistentes

## 📋 Próximos Pasos

1. **Migrar funciones restantes** del worker.js original
2. **Implementar vista completa** en src/views/
3. **Agregar tests unitarios** para cada módulo
4. **Documentación detallada** de cada servicio
5. **Optimización de bundles** para producción

## 🔄 Migración desde worker.js Original

El archivo `worker.js` original contiene toda la funcionalidad. La nueva estructura mantiene:

- ✅ Todas las funciones de seguridad
- ✅ Autenticación y autorización
- ✅ Rate limiting
- ✅ Audit logging
- ✅ Configuración de bases de datos
- ⏳ API handlers (en desarrollo)
- ⏳ Vista completa de la aplicación (pendiente)

## 🛠️ Comandos de Desarrollo

```bash
# Desarrollo local
npm run dev

# Deploy a producción
npm run deploy

# Instalar dependencias
npm install
```

## 📝 Notas Importantes

- El archivo `worker.js` original se mantiene como respaldo
- La aplicación funciona con arquitectura modular
- Todas las funcionalidades de seguridad están preservadas
- La migración es incremental y sin pérdida de funcionalidad