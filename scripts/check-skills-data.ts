#!/usr/bin/env tsx
/**
 * Quick check to see if skills_taxonomy table has data
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSkillsData() {
  console.log('🔍 Checking skills_taxonomy table...\n');

  // Count total skills
  const { count, error: countError } = await supabase
    .from('skills_taxonomy')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error counting skills:', countError.message);
    return;
  }

  console.log(`📊 Total skills in database: ${count || 0}`);

  if (count === 0) {
    console.log('\n⚠️  Database is empty! Run: npm run db:seed-taxonomy');
    return;
  }

  // Get sample skills
  const { data: samples, error: samplesError } = await supabase
    .from('skills_taxonomy')
    .select('code, name_i18n, aliases_i18n, tags')
    .limit(5);

  if (samplesError) {
    console.error('❌ Error fetching samples:', samplesError.message);
    return;
  }

  console.log('\n📝 Sample skills:');
  samples?.forEach((skill, idx) => {
    console.log(`${idx + 1}. ${skill.name_i18n?.en || 'Unknown'} (${skill.code})`);
    if (skill.aliases_i18n?.en?.length > 0) {
      console.log(`   Aliases: ${skill.aliases_i18n.en.join(', ')}`);
    }
    if (skill.tags?.length > 0) {
      console.log(`   Tags: ${skill.tags.join(', ')}`);
    }
  });

  // Test search
  console.log('\n🔍 Testing current search with "python"...');
  const { data: searchResults, error: searchError } = await supabase
    .from('skills_taxonomy')
    .select('code, name_i18n')
    .ilike('name_i18n->>en', '%python%')
    .limit(20);

  if (searchError) {
    console.error('❌ Error searching:', searchError.message);
    return;
  }

  console.log(`   Found ${searchResults?.length || 0} results containing "python"`);
  if (searchResults && searchResults.length > 0) {
    console.log('\n   Top 5 results:');
    searchResults.slice(0, 5).forEach((skill: any, idx: number) => {
      console.log(`   ${idx + 1}. ${skill.name_i18n?.en}`);
    });
  }

  console.log('\n✅ Check complete!');
}

checkSkillsData().catch(console.error);
