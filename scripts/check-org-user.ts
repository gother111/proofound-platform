import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/db/schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const client = postgres(connectionString, { ssl: false });
const db = drizzle(client, { schema });

const ORG_ADMIN_ID = '88888888-8888-4888-8888-888888888888';

async function checkOrgUser() {
  try {
    const profile = await db.query.profiles.findFirst({
      where: sql`id = ${ORG_ADMIN_ID}`,
    });

    console.log('Org Admin Profile:', profile);
  } catch (error) {
    console.error('Error checking profile:', error);
  } finally {
    await client.end();
  }
}

checkOrgUser();
