import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local FIRST
config({ path: resolve(process.cwd(), '.env.local') });

// Now import after env is loaded
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
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

    // Get the email from command line argument
    const email = process.argv[2];

    if (!email) {
        console.error('\nUsage: npx tsx scripts/grant-admin.ts <email>\n');
        console.log('Example: npx tsx scripts/grant-admin.ts yurgen9608@gmail.com\n');
        process.exit(1);
    }

    console.log(`\nLooking for user with displayName containing: ${email}...`);

    const profiles = await db.select({
        id: schema.profiles.id,
        displayName: schema.profiles.displayName,
        handle: schema.profiles.handle,
        platformRole: schema.profiles.platformRole,
    }).from(schema.profiles);

    const user = profiles.find(p =>
        p.displayName?.toLowerCase().includes(email.toLowerCase())
    );

    if (!user) {
        console.error(`\nUser with email/displayName "${email}" not found.`);
        console.log('\nAvailable users:');
        profiles.forEach(p => {
            console.log(`  - ${p.displayName} (role: ${p.platformRole || 'none'})`);
        });
        process.exit(1);
    }

    console.log(`\nFound user:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Display Name: ${user.displayName}`);
    console.log(`  Handle: ${user.handle || 'none'}`);
    console.log(`  Current Role: ${user.platformRole || 'none'}`);

    console.log(`\nGranting platform_admin role...`);

    await db.update(schema.profiles)
        .set({ platformRole: 'platform_admin' })
        .where(eq(schema.profiles.id, user.id));

    console.log('\n✅ Successfully granted platform_admin role!\n');
    console.log('You may need to log out and log back in for changes to take effect.\n');

    await queryClient.end();
}

main().catch(console.error).finally(() => process.exit(0));
