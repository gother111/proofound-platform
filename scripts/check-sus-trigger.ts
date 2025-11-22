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

async function checkEvents() {
  try {
    const events = await db.execute(sql`
      SELECT event_type, created_at 
      FROM analytics_events 
      WHERE user_id = ${MOCK_USER_ID}
      ORDER BY created_at DESC
    `);

    console.log('Events for mock user:', events);
  } catch (error) {
    console.error('Error checking events:', error);
  } finally {
    await client.end();
  }
}

checkEvents();
