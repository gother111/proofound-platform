import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { calculateSUSScore, type SUSResponse } from '../src/lib/feedback/sus-scoring';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const client = postgres(connectionString, { ssl: false });
const db = drizzle(client, { schema });

async function testSUSFlow() {
  try {
    const userId = uuidv4();
    console.log('Created test user:', userId);

    // 0. Create User Profile
    await db.insert(schema.profiles).values({
      id: userId,
      persona: 'individual',
      displayName: 'SUS Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 1. Define Responses (alternating 5 and 1 for perfect score of 100)
    const responses: SUSResponse[] = [
      { questionId: 1, value: 5 }, // +4
      { questionId: 2, value: 1 }, // +4
      { questionId: 3, value: 5 }, // +4
      { questionId: 4, value: 1 }, // +4
      { questionId: 5, value: 5 }, // +4
      { questionId: 6, value: 1 }, // +4
      { questionId: 7, value: 5 }, // +4
      { questionId: 8, value: 1 }, // +4
      { questionId: 9, value: 5 }, // +4
      { questionId: 10, value: 1 }, // +4
    ];

    // 2. Calculate Score locally
    const result = calculateSUSScore(responses);
    console.log('Calculated Score:', result.score);

    if (result.score !== 100) {
      throw new Error(`Expected score 100, got ${result.score}`);
    }

    // 3. Simulate submitting to DB (replicating API logic)
    console.log('Simulating API submission...');
    const eventId = uuidv4();

    await db.execute(sql`
      INSERT INTO analytics_events (
        id,
        event_type,
        user_id,
        properties,
        created_at
      ) VALUES (
        ${eventId},
        'sus_survey_completed',
        ${userId},
        ${{
          total_score: result.score, // Using key from API implementation in SUSDialog/SUSQuestionnaire
          score: result.score, // Also storing as 'score' for robustness
          responses: responses.map((r) => r.value),
          trigger_point: 'test_script',
        }}::jsonb,
        NOW()
      )
    `);

    // 4. Verify in DB
    console.log('Verifying in database...');
    const event = await db.query.analyticsEvents.findFirst({
      where: sql`id = ${eventId}`,
    });

    if (!event) {
      throw new Error('Event not found in database');
    }

    const props = event.properties as any;
    console.log('Event properties:', JSON.stringify(props, null, 2));

    if (props.score !== 100 && props.total_score !== 100) {
      throw new Error('Score not correctly stored');
    }

    console.log('✅ SUS Flow verified successfully!');
  } catch (error) {
    console.error('❌ SUS Flow failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testSUSFlow();
