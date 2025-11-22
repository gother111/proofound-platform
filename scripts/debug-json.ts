import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/db/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const client = postgres(connectionString, { ssl: false });
const db = drizzle(client, { schema });

async function debugJSON() {
  try {
    const result = await db.execute(sql`
      SELECT
        properties,
        jsonb_typeof(properties) as type,
        properties->>'match_id' as match_id_op,
        properties #>> '{match_id}' as match_id_path
      FROM analytics_events
      WHERE event_type = 'first_qualified_intro'
    `);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await client.end();
  }
}

debugJSON();
