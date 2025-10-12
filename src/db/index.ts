import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Missing DATABASE_URL environment variable.');
}

const queryClient = postgres(connectionString, {
  idle_timeout: 10,
  max_lifetime: 60 * 30,
  ssl: 'require',
});

export const db = drizzle(queryClient, { schema });

export * from './schema';
