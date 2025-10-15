import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const sslMode = (() => {
  try {
    return new URL(connectionString).searchParams.get('sslmode');
  } catch {
    return null;
  }
})();

type GlobalDb = {
  __dbPool?: Pool;
  __db?: NodePgDatabase<typeof schema>;
};

const globalForDb = globalThis as unknown as GlobalDb;

export const pool =
  globalForDb.__dbPool ??
  new Pool({
    connectionString,
    max: 1,
    ssl: sslMode && sslMode !== 'disable' ? { rejectUnauthorized: false } : undefined,
  });

export const db =
  globalForDb.__db ??
  drizzle(pool, {
    schema,
  });

if (!globalForDb.__dbPool) {
  globalForDb.__dbPool = pool;
}

if (!globalForDb.__db) {
  globalForDb.__db = db;
}
