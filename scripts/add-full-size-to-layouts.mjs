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

async function updateSizeConstraint() {
    try {
        console.log('🔄 Updating size CHECK constraint on dashboard_layouts table...');

        // First, check the current constraint
        const currentConstraint = await sql`
      SELECT pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conname = 'dashboard_layouts_size_check'
      AND conrelid = 'dashboard_layouts'::regclass
    `;

        console.log('📋 Current constraint:', currentConstraint[0]?.definition);

        // Drop the existing CHECK constraint
        console.log('🗑️  Dropping old CHECK constraint...');
        await sql`
      ALTER TABLE dashboard_layouts 
      DROP CONSTRAINT IF EXISTS dashboard_layouts_size_check
    `;

        // Add the new CHECK constraint with 'full' included
        console.log('➕ Adding new CHECK constraint with "full" size...');
        await sql`
      ALTER TABLE dashboard_layouts 
      ADD CONSTRAINT dashboard_layouts_size_check 
      CHECK (size IN ('small', 'default', 'large', 'full'))
    `;

        // Verify the new constraint
        const newConstraint = await sql`
      SELECT pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conname = 'dashboard_layouts_size_check'
      AND conrelid = 'dashboard_layouts'::regclass
    `;

        console.log('✅ New constraint:', newConstraint[0]?.definition);
        console.log('✅ Migration complete! The "full" size is now supported in the database.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await sql.end();
    }
}

updateSizeConstraint();
