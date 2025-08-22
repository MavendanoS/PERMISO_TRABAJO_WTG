/**
 * Migration Runner para PERMISO_TRABAJO_WTG
 * Ejecuta las migraciones de base de datos de forma segura
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class MigrationRunner {
  constructor(database) {
    this.db = database;
    this.migrationsPath = join(__dirname, 'migrations.sql');
  }

  /**
   * Ejecuta todas las migraciones disponibles
   */
  async runMigrations() {
    try {
      console.log('🚀 Iniciando migraciones de base de datos...');
      
      // Leer archivo de migraciones
      const migrationsSql = await readFile(this.migrationsPath, 'utf-8');
      
      // Dividir por secciones de migración
      const migrations = this.parseMigrations(migrationsSql);
      
      // Ejecutar migraciones en orden
      for (const [index, migration] of migrations.entries()) {
        await this.executeMigration(index + 1, migration);
      }
      
      console.log('✅ Todas las migraciones se ejecutaron correctamente');
      return { success: true, migrationsExecuted: migrations.length };
      
    } catch (error) {
      console.error('❌ Error durante las migraciones:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analiza el archivo de migraciones y las divide en secciones
   */
  parseMigrations(migrationsSql) {
    const sections = migrationsSql
      .split('-- MIGRACIÓN')
      .filter(section => section.trim() && !section.startsWith('='))
      .map(section => {
        const lines = section.split('\n');
        const titleLine = lines[0] || '';
        const title = titleLine.replace(/^\d+:/, '').trim();
        const sql = lines.slice(1).join('\n');
        
        return {
          title,
          sql: sql.trim()
        };
      });
    
    return sections;
  }

  /**
   * Ejecuta una migración individual
   */
  async executeMigration(number, migration) {
    console.log(`\n📋 Ejecutando Migración ${number}: ${migration.title}`);
    
    try {
      // Dividir por comandos SQL individuales
      const commands = this.splitSqlCommands(migration.sql);
      
      let successCount = 0;
      for (const command of commands) {
        if (command.trim()) {
          await this.executeCommand(command.trim());
          successCount++;
        }
      }
      
      console.log(`✅ Migración ${number} completada: ${successCount} comandos ejecutados`);
      
    } catch (error) {
      console.error(`❌ Error en Migración ${number}:`, error);
      throw error;
    }
  }

  /**
   * Divide el SQL en comandos individuales
   */
  splitSqlCommands(sql) {
    return sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));
  }

  /**
   * Ejecuta un comando SQL individual
   */
  async executeCommand(command) {
    try {
      // Skip comments and empty lines
      if (!command || command.startsWith('--')) {
        return;
      }

      console.log(`  🔄 Ejecutando: ${command.substring(0, 100)}...`);
      
      if (this.db.prepare) {
        // D1 Database
        await this.db.prepare(command).run();
      } else {
        // Otras bases de datos
        await this.db.exec(command);
      }
      
    } catch (error) {
      // Algunos errores son esperados (como intentar agregar columna que ya existe)
      if (this.isExpectedError(error)) {
        console.log(`  ⚠️  Comando ya aplicado: ${command.substring(0, 50)}...`);
        return;
      }
      
      console.error(`  ❌ Error ejecutando comando: ${command}`);
      throw error;
    }
  }

  /**
   * Determina si un error es esperado (como columna ya existe)
   */
  isExpectedError(error) {
    const expectedErrors = [
      'duplicate column name',
      'already exists',
      'UNIQUE constraint failed',
      'table already exists',
      'index already exists'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return expectedErrors.some(expected => errorMessage.includes(expected));
  }

  /**
   * Verifica el estado de las migraciones
   */
  async checkMigrationStatus() {
    try {
      // Verificar si las nuevas columnas existen
      const tables = await this.getTableInfo();
      
      const status = {
        permisos_trabajo: {
          usuario_creador_id: false,
          created_at: false,
          updated_at: false
        },
        permiso_cierre: {
          supervisor_aprobacion_id: false,
          fecha_aprobacion_cierre: false,
          estado_aprobacion: false,
          created_at: false,
          updated_at: false
        }
      };

      // Check permisos_trabajo columns
      if (tables.permisos_trabajo) {
        const columns = tables.permisos_trabajo.map(col => col.name);
        status.permisos_trabajo.usuario_creador_id = columns.includes('usuario_creador_id');
        status.permisos_trabajo.created_at = columns.includes('created_at');
        status.permisos_trabajo.updated_at = columns.includes('updated_at');
      }

      // Check permiso_cierre columns
      if (tables.permiso_cierre) {
        const columns = tables.permiso_cierre.map(col => col.name);
        status.permiso_cierre.supervisor_aprobacion_id = columns.includes('supervisor_aprobacion_id');
        status.permiso_cierre.fecha_aprobacion_cierre = columns.includes('fecha_aprobacion_cierre');
        status.permiso_cierre.estado_aprobacion = columns.includes('estado_aprobacion');
        status.permiso_cierre.created_at = columns.includes('created_at');
        status.permiso_cierre.updated_at = columns.includes('updated_at');
      }

      return status;
      
    } catch (error) {
      console.error('Error checking migration status:', error);
      return null;
    }
  }

  /**
   * Obtiene información de las tablas
   */
  async getTableInfo() {
    const tables = {};
    
    try {
      // Get permisos_trabajo table info
      const permisosCols = await this.db.prepare("PRAGMA table_info(permisos_trabajo)").all();
      tables.permisos_trabajo = permisosCols;
      
      // Get permiso_cierre table info  
      const cierreCols = await this.db.prepare("PRAGMA table_info(permiso_cierre)").all();
      tables.permiso_cierre = cierreCols;
      
    } catch (error) {
      console.warn('Could not get table info:', error.message);
    }
    
    return tables;
  }

  /**
   * Ejecuta una migración específica por número
   */
  async runSpecificMigration(migrationNumber) {
    try {
      const migrationsSql = await readFile(this.migrationsPath, 'utf-8');
      const migrations = this.parseMigrations(migrationsSql);
      
      if (migrationNumber > migrations.length || migrationNumber < 1) {
        throw new Error(`Migración ${migrationNumber} no existe. Disponibles: 1-${migrations.length}`);
      }
      
      const migration = migrations[migrationNumber - 1];
      await this.executeMigration(migrationNumber, migration);
      
      return { success: true, migrationExecuted: migrationNumber };
      
    } catch (error) {
      console.error(`Error ejecutando migración ${migrationNumber}:`, error);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Función helper para ejecutar migraciones desde el worker
 */
export async function runDatabaseMigrations(database) {
  const runner = new MigrationRunner(database);
  return await runner.runMigrations();
}

export default MigrationRunner;