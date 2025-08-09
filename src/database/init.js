import { SQL_SCHEMAS } from './schemas.js';

export async function initializeDatabase(db) {
  try {
    // Crear tablas si no existen
    for (const [name, schema] of Object.entries(SQL_SCHEMAS)) {
      await db.prepare(schema).run();
    }
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}