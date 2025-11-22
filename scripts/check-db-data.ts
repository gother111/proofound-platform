import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const client = postgres(connectionString, { ssl: false });
const db = drizzle(client, { schema });

async function checkData() {
  try {
    const events = await db.query.analyticsEvents.findMany();
    console.log(`Found ${events.length} events`);

    for (const event of events) {
      if (
        event.eventType === 'first_qualified_intro' ||
        event.eventType === 'interview_scheduled'
      ) {
        console.log(
          `Event: ${event.eventType}, User: ${event.userId}, MatchID: ${(event.properties as any)?.match_id}`
        );
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.end();
  }
}

checkData();
