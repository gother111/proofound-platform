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

const MOCK_USER_ID = '7266c3d8-c513-4cc8-8775-1bfba4865106';

async function clearEvents() {
  try {
    console.log('Clearing events for mock user...');
    await db.execute(sql`
      DELETE FROM analytics_events 
      WHERE user_id = ${MOCK_USER_ID}
    `);

    console.log('Events cleared.');
  } catch (error) {
    console.error('Error clearing events:', error);
  } finally {
    await client.end();
  }
}

clearEvents();
