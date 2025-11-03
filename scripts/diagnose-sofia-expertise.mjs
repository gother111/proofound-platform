/**
 * Diagnostic script to check why Sofia's Expertise tab is empty
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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
  console.error('Could not load .env.local file');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SOFIA_ID = '0584f063-58cd-4e1f-a95d-c54c105a7ac0';

async function diagnose() {
  console.log('🔍 Diagnosing Sofia\'s Expertise Tab Issue...\n');
  console.log(`Sofia's Profile ID: ${SOFIA_ID}\n`);

  // 1. Check if Sofia's profile exists
  console.log('1️⃣ Checking if Sofia profile exists...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', SOFIA_ID)
    .single();

  if (profileError) {
    console.log(`   ❌ Profile not found: ${profileError.message}`);
    console.log('   → ACTION: Run the seeding script to create demo users\n');
    return;
  }
  console.log(`   ✅ Profile exists: ${profile.full_name} (${profile.email})\n`);

  // 2. Check skills count
  console.log('2️⃣ Checking skills...');
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('*')
    .eq('profile_id', SOFIA_ID);

  if (skillsError) {
    console.log(`   ❌ Error fetching skills: ${skillsError.message}\n`);
    return;
  }

  if (!skills || skills.length === 0) {
    console.log('   ❌ No skills found');
    console.log('   → ACTION: Run the seeding script to add skills\n');
    return;
  }

  console.log(`   ✅ Found ${skills.length} skills`);

  // 3. Check skill_code population
  const skillsWithCode = skills.filter(s => s.skill_code !== null);
  const skillsWithoutCode = skills.filter(s => s.skill_code === null);

  console.log(`   • Skills with skill_code: ${skillsWithCode.length}`);
  console.log(`   • Skills without skill_code (NULL): ${skillsWithoutCode.length}\n`);

  if (skillsWithoutCode.length > 0) {
    console.log('   ⚠️  Skills without taxonomy codes:');
    skillsWithoutCode.forEach(s => {
      console.log(`      - ${s.skill_id}: skill_code = NULL`);
    });
    console.log('   → ACTION: Re-run the seeding script with updated taxonomy codes\n');
  }

  // 4. Check if taxonomy codes exist in skills_taxonomy
  if (skillsWithCode.length > 0) {
    console.log('3️⃣ Checking if skill codes exist in taxonomy...');
    const codes = skillsWithCode.map(s => s.skill_code);
    const { data: taxonomyRecords, error: taxonomyError } = await supabase
      .from('skills_taxonomy')
      .select('code, name_i18n')
      .in('code', codes);

    if (taxonomyError) {
      console.log(`   ❌ Error fetching taxonomy: ${taxonomyError.message}\n`);
      return;
    }

    const foundCodes = new Set(taxonomyRecords?.map(t => t.code) || []);
    const missingCodes = codes.filter(c => !foundCodes.has(c));

    console.log(`   • Taxonomy records found: ${taxonomyRecords?.length || 0}/${codes.length}`);
    if (missingCodes.length > 0) {
      console.log(`   ⚠️  Missing taxonomy codes: ${missingCodes.join(', ')}`);
      console.log('   → ACTION: Ensure skills_taxonomy table is populated\n');
    } else {
      console.log('   ✅ All skill codes exist in taxonomy\n');
    }
  }

  // 5. Show sample of Sofia's skills
  console.log('4️⃣ Sample of Sofia\'s skills:');
  skills.slice(0, 3).forEach(skill => {
    console.log(`   • Skill ID: ${skill.skill_id}`);
    console.log(`     Code: ${skill.skill_code || 'NULL'}`);
    console.log(`     Level: ${skill.level}`);
    console.log(`     Custom Name: ${skill.custom_skill_name || 'N/A'}`);
    console.log('');
  });

  // 6. Summary
  console.log('📊 SUMMARY:');
  if (skillsWithoutCode.length === skills.length) {
    console.log('   ❌ ISSUE: All skills have skill_code = NULL');
    console.log('   💡 FIX: Run: node scripts/seed-demo-users.mjs --yes');
  } else if (skillsWithoutCode.length > 0) {
    console.log('   ⚠️  ISSUE: Some skills missing skill_code');
    console.log('   💡 FIX: Re-run seeding script or update existing records');
  } else {
    console.log('   ✅ All skills have taxonomy codes');
    console.log('   💡 If Expertise tab still empty, check browser console for errors');
  }
}

diagnose().catch(console.error);

