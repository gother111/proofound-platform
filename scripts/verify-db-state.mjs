import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    process.exit(1);
}

const sql = postgres(databaseUrl);

async function verifyDatabaseState() {
    try {
        console.log('🔍 Verifying database state...\n');

        // 1. Check dashboard_layouts table and size constraint
        console.log('1️⃣  Checking dashboard_layouts table...');
        const dashboardLayouts = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'dashboard_layouts'
    `;

        if (dashboardLayouts.length > 0) {
            console.log('   ✅ Table dashboard_layouts exists');

            const sizeConstraint = await sql`
        SELECT pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conname = 'dashboard_layouts_size_check'
        AND conrelid = 'dashboard_layouts'::regclass
      `;

            if (sizeConstraint.length > 0) {
                console.log(`   ✅ Size constraint found: ${sizeConstraint[0].definition}`);
                if (sizeConstraint[0].definition.includes("'full'")) {
                    console.log('   ✅ Constraint correctly includes "full" size');
                } else {
                    console.log('   ❌ Constraint MISSING "full" size');
                }
            } else {
                console.log('   ❌ Size constraint NOT found');
            }
        } else {
            console.log('   ❌ Table dashboard_layouts does NOT exist');
        }

        // 2. Check verification_requests table
        console.log('\n2️⃣  Checking verification_requests table...');
        const verificationRequests = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'verification_requests'
    `;

        if (verificationRequests.length > 0) {
            console.log('   ✅ Table verification_requests exists');
        } else {
            console.log('   ❌ Table verification_requests does NOT exist');
        }

        // 3. Check other key tables
        console.log('\n3️⃣  Checking other key tables...');
        const tables = ['impact_stories', 'projects', 'matches', 'capabilities', 'verification_requests'];

        for (const table of tables) {
            const result = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = ${table}
      `;
            if (result.length > 0) {
                const count = await sql`SELECT count(*) FROM ${sql(table)}`;
                console.log(`   ✅ Table ${table} exists (${count[0].count} rows)`);
            } else {
                console.log(`   ❌ Table ${table} does NOT exist`);
            }
        }

    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await sql.end();
    }
}

verifyDatabaseState();
