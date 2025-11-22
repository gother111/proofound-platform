import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql, eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { isFieldVisible, applyVisibility } from '../src/lib/privacy/visibility';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const client = postgres(connectionString, { ssl: false });
const db = drizzle(client, { schema });

async function testVisibility() {
  try {
    const userId = uuidv4();
    console.log('Created test user for visibility:', userId);

    // 1. Create User & Individual Profile
    await db.insert(schema.profiles).values({
      id: userId,
      persona: 'individual',
      displayName: 'Privacy Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(schema.individualProfiles).values({
      userId: userId,
      headline: 'Software Engineer',
      mission: 'Build great things',
      fieldVisibility: sql`'{}'::jsonb`, // Default
      redactMode: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. Simulate API Update (Update DB)
    const newVisibility = {
      mission: 'private',
      headline: 'public',
      location: 'matched',
    };

    console.log('Updating visibility settings...', newVisibility);
    await db
      .update(schema.individualProfiles)
      .set({
        fieldVisibility: sql`${newVisibility}::jsonb`,
        updatedAt: new Date(),
      })
      .where(eq(schema.individualProfiles.userId, userId));

    // 3. Verify DB Persistence
    const profile = await db.query.individualProfiles.findFirst({
      where: eq(schema.individualProfiles.userId, userId),
    });

    const savedVisibility = profile?.fieldVisibility as Record<string, any>;
    if (savedVisibility.mission !== 'private') {
      throw new Error('Failed to save mission visibility');
    }
    console.log('✅ DB Persistence verified');

    // 4. Verify Filtering Logic (isFieldVisible)
    console.log('Verifying filtering logic...');

    // Case A: Public context
    if (isFieldVisible('mission', 'public', savedVisibility)) {
      throw new Error('Mission should be HIDDEN in public context (it is private)');
    }
    if (!isFieldVisible('headline', 'public', savedVisibility)) {
      throw new Error('Headline should be VISIBLE in public context');
    }
    console.log('✅ Public context logic verified');

    // Case B: Matched context
    if (isFieldVisible('mission', 'matched', savedVisibility)) {
      throw new Error('Mission should be HIDDEN in matched context (it is private)');
    }
    if (!isFieldVisible('location', 'matched', savedVisibility)) {
      throw new Error('Location should be VISIBLE in matched context');
    }
    console.log('✅ Matched context logic verified');

    // Case C: applyVisibility function
    const testProfileData = {
      mission: 'Secret Mission',
      headline: 'Public Headline',
      location: 'Secret Location',
    };

    const filteredPublic = applyVisibility(testProfileData, 'public', savedVisibility);
    if (filteredPublic.mission) throw new Error('Mission leaked in public view');
    if (!filteredPublic.headline) throw new Error('Headline missing in public view');
    console.log('✅ applyVisibility (Public) verified');

    const filteredMatched = applyVisibility(testProfileData, 'matched', savedVisibility);
    if (filteredMatched.mission) throw new Error('Mission leaked in matched view');
    if (!filteredMatched.location) throw new Error('Location missing in matched view');
    console.log('✅ applyVisibility (Matched) verified');

    console.log('✅ Visibility Controls verification complete!');
  } catch (error) {
    console.error('❌ Visibility verification failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testVisibility();
