import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
