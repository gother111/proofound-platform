#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as path from 'path';

config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testSearch() {
  console.log('\n🔍 Testing different search methods:\n');

  // Test 1: Direct substring search
  console.log('1. Direct substring search for "python":');
  const { data: data1, error: error1 } = await supabase
    .from('skills_taxonomy')
    .select('code, name_i18n')
    .ilike('name_i18n->en', '%python%')
    .limit(5);

  console.log(`   Found ${data1?.length || 0} results`);
  data1?.forEach((s: any) => console.log(`   - ${s.name_i18n?.en}`));

  // Test 2: Search for "react"
  console.log('\n2. Direct substring search for "react":');
  const { data: data2, error: error2 } = await supabase
    .from('skills_taxonomy')
    .select('code, name_i18n')
    .ilike('name_i18n->en', '%react%')
    .limit(5);

  console.log(`   Found ${data2?.length || 0} results`);
  data2?.forEach((s: any) => console.log(`   - ${s.name_i18n?.en}`));

  // Test 3: Check search_vector
  console.log('\n3. Count skills with search_vector:');
  const { count } = await supabase
    .from('skills_taxonomy')
    .select('*', { count: 'exact', head: true })
    .not('search_vector', 'is', null);

  console.log(`   ${count} skills have search_vector populated`);

  console.log('\n');
}

testSearch();
