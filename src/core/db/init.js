/**
 * Initializes the D1 database by ensuring all tables exist.
 * It iterates over SQL_SCHEMAS and runs each CREATE TABLE statement.
 */

import SQL_SCHEMAS from './sqlSchemas.js';

/**
 * Initialize the provided D1 database with required tables.
 * @param {any} db - The D1 database binding from Cloudflare env.
 */
export async function initializeDatabase(db) {
  for (const schema of Object.values(SQL_SCHEMAS)) {
    await db.prepare(schema).run();
  }
}

export default initializeDatabase;
