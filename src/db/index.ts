import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.NEXT_PUBLIC_SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Missing database connection string. Set NEXT_PUBLIC_SUPABASE_DB_URL.');
}

// For migrations and queries
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

export * from './schema';
