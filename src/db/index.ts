import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { getEnv } from '@/lib/env';

import * as schema from './schema';

const { DATABASE_URL: connectionString } = getEnv(false);

if (!connectionString) {
  const err = new Error('Database is not configured (missing DATABASE_URL).') as Error & {
    code?: string;
  };
  err.code = 'ENV_MISCONFIG';
  throw err;
}

const queryClient = postgres(connectionString, {
  idle_timeout: 10,
  max_lifetime: 60 * 30,
  ssl: 'require',
});

export const db = drizzle(queryClient, { schema });

export * from './schema';
