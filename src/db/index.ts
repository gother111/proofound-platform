import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dns from 'dns';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';

// Force IPv4 to avoid EHOSTUNREACH errors with Supabase on some networks
dns.setDefaultResultOrder('ipv4first');

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
  // Check if we are allowed to use mocks
  const allowMocks = process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true';
  const isNextBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

  // In production, DATABASE_URL is required unless mocks are explicitly enabled
  if (
    (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') &&
    !allowMocks &&
    // `next build` runs with NODE_ENV=production but should not require runtime env vars.
    !isNextBuild
  ) {
    throw new Error(
      'DATABASE_URL is required in production. ' +
        'Please set this environment variable in your deployment settings. ' +
        'See PRODUCTION_ENV_CHECK.md for instructions.'
    );
  }

  // In development or if mocks allowed, warn about mock database usage
  console.error('');
  console.error('═════════════════════════════════════════════════════════════════════');
  console.error('❌ CRITICAL: DATABASE_URL is missing!');
  console.error('═════════════════════════════════════════════════════════════════════');
  console.error('');
  console.error('Your application is using an IN-MEMORY MOCK DATABASE.');
  console.error('This means:');
  console.error('  ❌ Data will NOT be saved');
  console.error('  ❌ All operations will appear to work but data is lost on restart');
  console.error('  ❌ Users will see "Failed to save" errors in production');
  console.error('');
  console.error('🔧 How to fix:');
  console.error('  1. Set DATABASE_URL in your environment variables');
  console.error('  2. Format: postgresql://user:password@host:port/database');
  console.error('  3. For Vercel: Go to Settings → Environment Variables');
  console.error('  4. For local dev: Add to .env.local file');
  console.error('');
  console.error('📚 See PRODUCTION_ENV_CHECK.md for detailed instructions');
  console.error('═════════════════════════════════════════════════════════════════════');
  console.error('');
}

const queryClient = connectionString
  ? postgres(connectionString, {
      idle_timeout: 10,
      max_lifetime: 60 * 30,
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
      prepare: false,
    })
  : null;

const dbInstance: DbType = connectionString ? drizzle(queryClient!, { schema }) : createMockDb();

export const db = dbInstance;

export * from './schema';
