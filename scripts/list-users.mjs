/**
 * Simple script to list all users in the database
 * This queries the profiles table to show who is registered
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables from .env.local if it exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const [key, ...values] = line.split('=');
    if (key && !key.startsWith('#') && values.length > 0) {
      const value = values.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
} catch (err) {
  // .env.local doesn't exist or can't be read, that's okay
}

// Get Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable is not set');
  process.exit(1);
}

// Use service role key if available, otherwise use anon key
const supabaseKey = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Error: Supabase API key is not set');
  process.exit(1);
}

// Create Supabase admin client (uses service role key if available, which bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function listUsers() {
  try {
    console.log('🔍 Querying database for users...\n');

    // Query all profiles - get all columns
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        handle,
        display_name,
        persona,
        created_at,
        individual_profiles (
          headline,
          verified
        )
      `)
      .order('created_at', { ascending: true });

    if (profilesError) {
      throw profilesError;
    }

    console.log('📊 Users in the database:\n');
    console.log('═'.repeat(80));

    if (!profiles || profiles.length === 0) {
      console.log('   No users found in the database.');
    } else {
      profiles.forEach((profile, index) => {
        const individual = Array.isArray(profile.individual_profiles) 
          ? profile.individual_profiles[0] 
          : profile.individual_profiles;
        
        const verified = individual?.verified ? ' ✅ Verified' : '';
        
        console.log(`\n${index + 1}. ${profile.display_name || 'No name'}`);
        console.log(`   ID: ${profile.id}`);
        console.log(`   Handle: ${profile.handle || 'No handle'}`);
        console.log(`   Persona: ${profile.persona || 'unknown'}${verified}`);
        if (individual?.headline) {
          console.log(`   Headline: ${individual.headline}`);
        }
        console.log(`   Created: ${profile.created_at ? new Date(profile.created_at).toLocaleString() : 'Unknown'}`);
      });
    }

    console.log('\n' + '═'.repeat(80));
    console.log(`\n📈 Total: ${profiles?.length || 0} active user(s)`);

    // Count by persona
    if (profiles && profiles.length > 0) {
      const personaCounts = profiles.reduce((acc, p) => {
        const persona = p.persona || 'unknown';
        acc[persona] = (acc[persona] || 0) + 1;
        return acc;
      }, {});

      if (Object.keys(personaCounts).length > 0) {
        console.log('\n📊 Breakdown by type:');
        Object.entries(personaCounts).forEach(([persona, count]) => {
          console.log(`   - ${persona}: ${count}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error querying database:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.hint) {
      console.error(`   Hint: ${error.hint}`);
    }
    process.exit(1);
  }
}

// Run the script
listUsers();
