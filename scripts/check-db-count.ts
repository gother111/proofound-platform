#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as path from 'path';

config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkCount() {
  const { count, error } = await supabase
    .from('skills_taxonomy')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(`\n📊 Skills in database: ${count || 0}`);
    console.log(`   Expected: 18,708 skills\n`);

    if (count === 0) {
      console.log('❌ Database is empty! You need to seed it.');
      console.log('   Run: npm run db:seed-taxonomy\n');
    } else if (count < 1000) {
      console.log('⚠️  Database has very few skills. You should reseed it.');
      console.log('   Run: npm run db:seed-taxonomy\n');
    } else {
      console.log('✅ Database has skills!\n');
    }
  }
}

checkCount();
