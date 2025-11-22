import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql, eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';
import { v4 as uuidv4 } from 'uuid';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const client = postgres(connectionString, { ssl: false });
const db = drizzle(client, { schema });

async function testTourStatus() {
  try {
    const userId = uuidv4();
    console.log('Created test user for tour:', userId);

    // 1. Create User with tourCompleted = false (default)
    await db.insert(schema.profiles).values({
      id: userId,
      persona: 'individual',
      displayName: 'Tour Test User',
      tourCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Verify initial state
    const initialProfile = await db.query.profiles.findFirst({
      where: eq(schema.profiles.id, userId),
      columns: { tourCompleted: true },
    });

    if (initialProfile?.tourCompleted !== false) {
      throw new Error('Initial tour status should be false');
    }
    console.log('Initial status: false (Correct)');

    // 2. Simulate Complete Tour (Server Action Logic)
    console.log('Simulating tour completion...');
    await db
      .update(schema.profiles)
      .set({
        tourCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.profiles.id, userId));

    // 3. Verify final state
    const finalProfile = await db.query.profiles.findFirst({
      where: eq(schema.profiles.id, userId),
      columns: { tourCompleted: true },
    });

    if (finalProfile?.tourCompleted !== true) {
      throw new Error('Final tour status should be true');
    }
    console.log('Final status: true (Correct)');

    console.log('✅ Tour Status Logic verified successfully!');
  } catch (error) {
    console.error('❌ Tour verification failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testTourStatus();
