/**
 * Quick script to create the verification_requests table
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
        console.log('🔄 Creating verification_requests table...');

        await sql`
      CREATE TABLE IF NOT EXISTS verification_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        verifier_email TEXT NOT NULL,
        verifier_name TEXT NOT NULL,
        verifier_relationship TEXT,
        claim_type TEXT NOT NULL CHECK (claim_type IN ('experience', 'skill', 'education', 'achievement', 'project')),
        claim_data TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        one_time_use BOOLEAN DEFAULT true,
        used_at TIMESTAMP,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'declined', 'expired', 'cancelled')),
        response_note TEXT,
        responded_at TIMESTAMP,
        visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
        show_verifier_name BOOLEAN DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        badge_id UUID
      )
    `;

        console.log('✅ verification_requests table created successfully!');

    } catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

createTable();
