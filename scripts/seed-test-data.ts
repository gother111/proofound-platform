import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/db/schema';
import { v4 as uuidv4 } from 'uuid';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const client = postgres(connectionString, { ssl: false });
const db = drizzle(client, { schema });

async function seedTestData() {
  try {
    console.log('Cleaning existing analytics events...');
    await db.delete(schema.analyticsEvents);
    await db.delete(schema.profiles);

    const userId = uuidv4();
    const matchId = uuidv4();
    const now = new Date();

    // 1. Create Profile
    console.log('Creating profile...', userId);
    await db.insert(schema.profiles).values({
      id: userId,
      persona: 'individual',
      displayName: 'Test User',
      createdAt: now,
      updatedAt: now,
    });

    // 2. Create Analytics Events using raw SQL to ensure JSONB
    console.log('Creating analytics events...');

    // Profile Activated
    await db.execute(sql`
      INSERT INTO analytics_events (event_type, user_id, properties, created_at)
      VALUES (
        'profile_activated',
        ${userId},
        ${{ l4_count: 10 }}::jsonb,
        ${new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2)}
      )
    `);

    // First Qualified Intro
    await db.execute(sql`
      INSERT INTO analytics_events (event_type, user_id, entity_type, entity_id, properties, created_at)
      VALUES (
        'first_qualified_intro',
        ${userId},
        'match',
        ${matchId},
        ${{ match_score: 0.95, match_id: matchId }}::jsonb,
        ${new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1)}
      )
    `);

    // Interview Scheduled
    await db.execute(sql`
      INSERT INTO analytics_events (event_type, user_id, entity_type, properties, created_at)
      VALUES (
        'interview_scheduled',
        ${userId},
        'interview',
        ${{ application_id: 'app_123', match_id: matchId }}::jsonb,
        ${new Date(now.getTime() - 1000 * 60 * 60 * 22)}
      )
    `);

    console.log('Test data seeded successfully!');
  } catch (error) {
    console.error('Error seeding test data:', error);
  } finally {
    await client.end();
  }
}

seedTestData();
