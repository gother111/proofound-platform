#!/usr/bin/env tsx
/**
 * Verify Smart Search Migration
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as path from 'path';

config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMigration() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFYING SMART SEARCH MIGRATION');
  console.log('='.repeat(70) + '\n');

  // Test the search function
  console.log('Testing search_skills_smart() function...\n');

  const testQueries = [
    { query: 'python', expected: 'Python-related skills' },
    { query: 'pythn', expected: 'Python (typo test)' },
    { query: 'react', expected: 'React variants' },
    { query: 'prog', expected: 'Programming skills' },
  ];

  for (const test of testQueries) {
    try {
      const { data, error } = await supabase.rpc('search_skills_smart', {
        search_query: test.query,
        result_limit: 5,
      });

      if (error) {
        console.log(`❌ "${test.query}": ERROR - ${error.message}`);
      } else {
        console.log(`✅ "${test.query}": Found ${data?.length || 0} results (${test.expected})`);
        if (data && data.length > 0) {
          console.log(`   Top result: ${data[0].name_i18n?.en || 'Unknown'}`);
        }
      }
    } catch (err: any) {
      console.log(`❌ "${test.query}": EXCEPTION - ${err.message}`);
    }
    console.log('');
  }

  console.log('='.repeat(70));
  console.log('✨ VERIFICATION COMPLETE');
  console.log('='.repeat(70) + '\n');

  console.log('🚀 Next steps:');
  console.log('   1. Restart your dev server if it\'s running');
  console.log('   2. Go to: Expertise tab → Add manually → Quick Search');
  console.log('   3. Try the test queries above\n');
}

verifyMigration().catch(console.error);
