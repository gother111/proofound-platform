/**
 * Quick script to create the dashboard_layouts table
 */
import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
});

async function createTable() {
  try {
    console.log('🔄 Creating dashboard_layouts table...');

    await sql`
      CREATE TABLE IF NOT EXISTS dashboard_layouts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        widget_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        visible BOOLEAN NOT NULL DEFAULT true,
        size TEXT DEFAULT 'default' CHECK (size IN ('small', 'default', 'large')),
        settings JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, widget_id)
      )
    `;

    console.log('✅ dashboard_layouts table created successfully!');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON dashboard_layouts(user_id)
    `;

    console.log('✅ Index created successfully!');

  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createTable();
