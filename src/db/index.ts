import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  throw new Error(
    [
      'Missing database connection string.',
      'Set DATABASE_URL (or POSTGRES_URL/POSTGRES_PRISMA_URL) in your environment.',
      'Vercel steps:',
      '1. Open your project → Settings → Environment Variables.',
      '2. Click "Add", set Name = DATABASE_URL, Value = Supabase connection string (Project Settings → Database → Connection string → Node.js).',
      '3. Save, then redeploy.',
    ].join(' ')
  );
}

const queryClient = postgres(connectionString, {
  idle_timeout: 10,
  max_lifetime: 60 * 30,
  ssl: 'require',
});

export const db = drizzle(queryClient, { schema });

export * from './schema';
