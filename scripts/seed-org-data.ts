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

// Fixed IDs for testing
const ORG_ID = '99999999-9999-4999-9999-999999999999';
const ORG_ADMIN_ID = '88888888-8888-4888-8888-888888888888';

async function seedOrgData() {
  try {
    console.log('Seeding organization data...');

    // 1. Create Organization
    console.log('Creating organization...');
    // Check if org exists first
    const existingOrg = await db
      .select()
      .from(schema.organizations)
      .where(sql`id = ${ORG_ID}`);

    if (existingOrg.length === 0) {
      await db.insert(schema.organizations).values({
        id: ORG_ID,
        displayName: 'Test Organization',
        slug: 'test-org',
        mission: 'A test organization for verification',
        logoUrl: 'https://via.placeholder.com/150',
        website: 'https://example.com',
      });
    } else {
      console.log('Organization already exists.');
    }

    // 2. Create Org Admin Profile
    console.log('Creating org admin profile...');
    // Check if profile exists
    const existingProfile = await db
      .select()
      .from(schema.profiles)
      .where(sql`id = ${ORG_ADMIN_ID}`);

    if (existingProfile.length === 0) {
      await db.insert(schema.profiles).values({
        id: ORG_ADMIN_ID,
        persona: 'org_member',
        displayName: 'Org Admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      console.log('Org Admin profile already exists.');
    }

    // 3. Link User to Organization (OrganizationMember)
    console.log('Linking user to organization...');
    const existingMember = await db
      .select()
      .from(schema.organizationMembers)
      .where(sql`user_id = ${ORG_ADMIN_ID} AND org_id = ${ORG_ID}`);

    if (existingMember.length === 0) {
      await db.insert(schema.organizationMembers).values({
        userId: ORG_ADMIN_ID,
        orgId: ORG_ID,
        role: 'admin',
        joinedAt: new Date(),
      });
    } else {
      console.log('User is already a member.');
    }

    console.log('Organization data seeded successfully!');
    console.log('ORG_ID:', ORG_ID);
    console.log('ORG_ADMIN_ID:', ORG_ADMIN_ID);
  } catch (error) {
    console.error('Error seeding org data:', error);
  } finally {
    await client.end();
  }
}

seedOrgData();
