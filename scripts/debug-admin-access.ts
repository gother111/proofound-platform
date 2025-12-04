import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local FIRST
config({ path: resolve(process.cwd(), '.env.local') });

// Now import after env is loaded
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema.js';

async function main() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('DATABASE_URL not found in environment');
        process.exit(1);
    }

    const queryClient = postgres(connectionString, {
        idle_timeout: 10,
        max_lifetime: 60 * 30,
        ssl: false,
        prepare: false,
    });

    const db = drizzle(queryClient, { schema });

    console.log('Fetching all profiles...');
    const allProfiles = await db.select({
        id: schema.profiles.id,
        displayName: schema.profiles.displayName,
        handle: schema.profiles.handle,
        platformRole: schema.profiles.platformRole,
        persona: schema.profiles.persona
    }).from(schema.profiles);

    console.log(`\nFound ${allProfiles.length} profiles:\n`);

    console.table(allProfiles.map(p => ({
        id: p.id.substring(0, 8) + '...',
        displayName: p.displayName || 'null',
        handle: p.handle || 'null',
        platformRole: p.platformRole || 'null',
        persona: p.persona || 'null'
    })));

    await queryClient.end();
}

main().catch(console.error).finally(() => process.exit(0));
