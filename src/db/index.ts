import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Allow build to succeed without DATABASE_URL
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/placeholder';

// For migrations and queries
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

export * from './schema';
