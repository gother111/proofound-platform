import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { getEnv } from '@/lib/env';

import * as schema from './schema';

const { DATABASE_URL: connectionString } = getEnv(false);

type DbType = PostgresJsDatabase<typeof schema>;

function createMockDb(): DbType {
  return {
    insert: () => ({ values: () => ({ returning: async () => [] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: async () => [] }) }) }),
    delete: () => ({ where: async () => ({}) }),
    query: new Proxy(
      {},
      {
        get: () => ({ findFirst: async () => null, findMany: async () => [] }),
      }
    ),
  } as unknown as DbType;
}

if (!connectionString) {
  console.warn('[db] DATABASE_URL missing; using in-memory mock database.');
}

const queryClient = connectionString
  ? postgres(connectionString, {
      idle_timeout: 10,
      max_lifetime: 60 * 30,
      ssl: 'require',
    })
  : null;

const dbInstance: DbType = connectionString ? drizzle(queryClient!, { schema }) : createMockDb();

export const db = dbInstance;

export * from './schema';
