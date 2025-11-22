import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/db/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const client = postgres(connectionString, { ssl: false });
const db = drizzle(client, { schema });

async function debugTTVParts() {
  try {
    console.log('Checking introductions...');
    const intros = await db.execute(sql`
      SELECT
        properties,
        (properties->>'match_id') as match_id_raw
      FROM analytics_events
      WHERE event_type = 'first_qualified_intro'
    `);
    console.log('Intros:', JSON.stringify(intros, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await client.end();
  }
}

debugTTVParts();
