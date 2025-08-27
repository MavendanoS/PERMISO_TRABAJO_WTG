# Sistema de Versionado y Auditoría para Cierres de Permisos

Este documento describe el sistema completo de versionado y auditoría implementado para los cierres de permisos de trabajo.

## Descripción General

El sistema implementa un mecanismo completo de auditoría que registra cada intento de cierre, aprobación o rechazo de permisos de trabajo, proporcionando:

- **Versionado**: Cada cambio incrementa la versión del permiso
- **Historial completo**: Todos los comentarios y motivos quedan registrados
- **Control de concurrencia**: Versión de fila para prevenir conflictos
- **Auditoría completa**: Trazabilidad total de cambios
- **Compatibilidad**: Usa mecanismos existentes sin romper contratos

## Estructura de Base de Datos

### Tabla `historial_aprobaciones_cierre`

Almacena cada intento de cierre con los siguientes campos:

```sql
CREATE TABLE historial_aprobaciones_cierre (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    permiso_id INTEGER NOT NULL,           -- FK a permisos_trabajo
    version_intento INTEGER NOT NULL,      -- Número de versión
    accion TEXT NOT NULL,                  -- ENVIAR_CIERRE, APROBAR, RECHAZAR, etc.
    estado_resultante TEXT NOT NULL,       -- Estado después de la acción
    usuario_id TEXT NOT NULL,              -- ID del usuario
    usuario_nombre TEXT NOT NULL,          -- Nombre del usuario
    comentarios TEXT,                      -- Comentarios/motivos
    fecha_accion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Snapshot de datos del cierre
    observaciones_cierre TEXT,
    fecha_inicio_trabajos DATE,
    fecha_fin_trabajos DATE,
    fecha_parada_turbina DATETIME,
    fecha_puesta_marcha_turbina DATETIME,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (permiso_id) REFERENCES permisos_trabajo(id),
    UNIQUE(permiso_id, version_intento)
);
```

### Campo `version` en `permiso_cierre`

Se agregó el campo `version INTEGER DEFAULT 1` para control de concurrencia.

## Vistas Disponibles

### `vista_historial_cierre_completo`
Historial completo de un permiso con información de la planta y aerogenerador.

### `vista_estado_actual_cierres`
Estado actual de todos los cierres con estadísticas del historial.

### `vista_analisis_rechazos`
Análisis de rechazos por planta con motivos frecuentes.

### `vista_performance_supervisores`
Performance de supervisores con tiempos de respuesta y tasas de aprobación.

## Uso del Sistema

### Consultar Historial de un Permiso

```sql
SELECT * FROM vista_historial_cierre_completo 
WHERE permiso_id = ?
ORDER BY version_intento DESC, fecha_accion DESC;
```

### Ver Estado Actual de Cierres

```sql
SELECT * FROM vista_estado_actual_cierres
WHERE estado_aprobacion_cierre = 'PENDIENTE';
```

### Análisis de Rechazos

```sql
SELECT * FROM vista_analisis_rechazos
ORDER BY total_rechazos DESC;
```

### Performance de Supervisores

```sql
SELECT * FROM vista_performance_supervisores
WHERE total_acciones > 5
ORDER BY porcentaje_aprobacion DESC;
```

## Triggers Automáticos

### `trigger_increment_version_permiso_cierre`
Incrementa automáticamente la versión cuando hay cambios significativos.

### `trigger_historial_cambio_estado_cierre`
Registra automáticamente en el historial los cambios de estado.

## Estados Válidos

### Acciones (`accion`)
- `ENVIAR_CIERRE`: Envío inicial del cierre
- `APROBAR`: Aprobación del cierre
- `RECHAZAR`: Rechazo del cierre
- `REENVIAR`: Reenvío después de correcciones
- `CANCELAR`: Cancelación del proceso

### Estados Resultantes (`estado_resultante`)
- `CERRADO_PENDIENTE_APROBACION`: Cierre enviado, esperando aprobación
- `CERRADO`: Cierre aprobado
- `CIERRE_RECHAZADO`: Cierre rechazado
- `CANCELADO`: Proceso cancelado

## Archivos de Migración

### `002_historial_aprobaciones_cierre.sql`
Script principal con la definición completa del sistema.

### `apply_historial_migration.sql`
Script idempotente de aplicación, seguro para ejecutar múltiples veces.

### `validate_historial_migration.sql`
Script de validación para verificar que todo funciona correctamente.

## Instrucciones de Despliegue

### 1. Desarrollo
```bash
# Aplicar migración
npx wrangler d1 execute DB_PERMISOS --file=migrations/apply_historial_migration.sql

# Validar migración
npx wrangler d1 execute DB_PERMISOS --file=migrations/validate_historial_migration.sql
```

### 2. Producción
```bash
# Con flag --remote para producción
npx wrangler d1 execute DB_PERMISOS --remote --file=migrations/apply_historial_migration.sql
```

## Beneficios del Sistema

### Para Supervisores
- **Visibilidad completa**: Historia de cada permiso
- **Trazabilidad**: Quién hizo qué y cuándo
- **Análisis**: Identificar patrones de problemas

### Para Administradores
- **Auditoría**: Cumplimiento normativo
- **Performance**: Métricas de supervisores
- **Análisis**: Puntos de mejora en procesos

### Para el Sistema
- **Integridad**: Control de concurrencia
- **Consistencia**: Estados bien definidos
- **Performance**: Índices optimizados

## Control de Concurrencia

El campo `version` previene problemas de concurrencia:

```javascript
// Ejemplo de uso en la aplicación
const currentVersion = await getCurrentVersion(permisoId);
const success = await updateCierre(permisoId, data, currentVersion);
if (!success) {
    throw new Error('El permiso fue modificado por otro usuario');
}
```

## Rollback de Emergencia

En caso de problemas críticos:

```sql
-- SOLO EN EMERGENCIA
DROP VIEW vista_performance_supervisores;
DROP VIEW vista_analisis_rechazos;
DROP VIEW vista_estado_actual_cierres;  
DROP VIEW vista_historial_cierre_completo;
DROP TRIGGER trigger_historial_cambio_estado_cierre;
DROP TRIGGER trigger_increment_version_permiso_cierre;
DROP TABLE historial_aprobaciones_cierre;
-- ALTER TABLE permiso_cierre DROP COLUMN version; -- No soportado en SQLite
```

## Monitoreo y Mantenimiento

### Consultas de Monitoreo

```sql
-- Volumen de cambios por día
SELECT DATE(fecha_accion) as fecha, COUNT(*) as cambios
FROM historial_aprobaciones_cierre
WHERE fecha_accion > DATE('now', '-30 days')
GROUP BY DATE(fecha_accion)
ORDER BY fecha DESC;

-- Permisos con más rechazos
SELECT permiso_id, COUNT(*) as rechazos
FROM historial_aprobaciones_cierre
WHERE accion = 'RECHAZAR'
GROUP BY permiso_id
ORDER BY rechazos DESC
LIMIT 10;
```

### Limpieza de Datos Antiguos

```sql
-- Limpiar historial de más de 2 años (opcional)
DELETE FROM historial_aprobaciones_cierre
WHERE fecha_accion < DATE('now', '-2 years');
```

## Soporte

Para problemas o consultas sobre el sistema de historial:
1. Revisar este documento
2. Ejecutar el script de validación
3. Consultar los logs de la aplicación
4. Verificar integridad de datos

---

**Nota**: Este sistema es fundamental para la auditoría y cumplimiento normativo. Cualquier modificación debe ser cuidadosamente planeada y probada.