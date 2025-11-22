import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/db/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const client = postgres(connectionString, { ssl: false });
const db = drizzle(client, { schema });

async function debugTTV() {
  try {
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = new Date();

    const query = sql`
      WITH introductions AS (
        SELECT
          (properties->>'match_id')::uuid as match_id,
          MIN(created_at) as introduced_at
        FROM analytics_events
        WHERE event_type = 'first_qualified_intro'
          AND created_at >= ${start.toISOString()}
          AND created_at <= ${end.toISOString()}
        GROUP BY (properties->>'match_id')::uuid
      ),
      interviews AS (
        SELECT
          (properties->>'match_id')::uuid as match_id,
          MIN(created_at) as scheduled_at
        FROM analytics_events
        WHERE event_type = 'interview_scheduled'
        GROUP BY (properties->>'match_id')::uuid
      ),
      ttv_values AS (
        SELECT
          intro.match_id,
          EXTRACT(EPOCH FROM (int.scheduled_at - intro.introduced_at)) / (24 * 3600) as days
        FROM introductions intro
        INNER JOIN interviews int ON intro.match_id = int.match_id
        WHERE int.scheduled_at > intro.introduced_at
      )
      SELECT * FROM ttv_values
    `;

    const result = await db.execute(query);
    console.log('TTV Rows:', result);
  } catch (error) {
    console.error(error);
  } finally {
    await client.end();
  }
}

debugTTV();
