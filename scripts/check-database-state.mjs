/**
 * Check database state for demo users
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

async function checkState() {
  console.log('='.repeat(70));
  console.log('DATABASE STATE CHECK');
  console.log('='.repeat(70));
  console.log('');

  // 1. Check Sofia's profile
  console.log('1. Checking Sofia\'s profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', SOFIA_ID)
    .single();

  if (profileError) {
    console.log(`   ❌ ERROR: ${profileError.message}`);
    console.log('   Profile does not exist. Seeding script may have failed.');
    return;
  }

  console.log(`   ✅ Profile exists`);
  console.log(`      Name: ${profile.full_name}`);
  console.log(`      Email: ${profile.email}`);
  console.log(`      Handle: @${profile.handle}`);
  console.log('');

  // 2. Check skills
  console.log('2. Checking skills...');
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('*')
    .eq('profile_id', SOFIA_ID);

  if (skillsError) {
    console.log(`   ❌ ERROR: ${skillsError.message}`);
    return;
  }

  if (!skills || skills.length === 0) {
    console.log('   ❌ NO SKILLS FOUND');
    console.log('   The seeding script did not create skills or they were deleted.');
    return;
  }

  console.log(`   ✅ Found ${skills.length} skills`);
  console.log('');

  // 3. Detailed skill check
  console.log('3. Skill details:');
  skills.forEach((skill, idx) => {
    console.log(`   ${idx + 1}. ${skill.skill_id}`);
    console.log(`      skill_code: ${skill.skill_code || '❌ NULL'}`);
    console.log(`      level: ${skill.level}`);
    console.log(`      months_experience: ${skill.months_experience}`);
    console.log('');
  });

  // 4. Check taxonomy for these codes
  const skillCodes = skills
    .map(s => s.skill_code)
    .filter(code => code !== null);

  if (skillCodes.length === 0) {
    console.log('4. Taxonomy check:');
    console.log('   ❌ NO SKILL CODES - All skill_code fields are NULL');
    console.log('   This is why the Expertise tab is empty!');
    console.log('');
    console.log('   FIX: The seeding script needs to be updated or re-run.');
    return;
  }

  console.log('4. Checking taxonomy records...');
  const { data: taxonomyRecords, error: taxonomyError } = await supabase
    .from('skills_taxonomy')
    .select('code, name_i18n, cat_id, subcat_id, l3_id')
    .in('code', skillCodes);

  if (taxonomyError) {
    console.log(`   ❌ ERROR: ${taxonomyError.message}`);
    return;
  }

  console.log(`   Found ${taxonomyRecords?.length || 0}/${skillCodes.length} taxonomy records`);
  console.log('');

  if (taxonomyRecords && taxonomyRecords.length > 0) {
    console.log('   Sample taxonomy records:');
    taxonomyRecords.slice(0, 3).forEach(tax => {
      console.log(`   • ${tax.code}`);
      console.log(`     Name: ${tax.name_i18n?.en || 'N/A'}`);
      console.log(`     Hierarchy: L1=${tax.cat_id}, L2=${tax.subcat_id}, L3=${tax.l3_id}`);
    });
    console.log('');
  }

  // 5. Check L1 domains
  console.log('5. Checking L1 domains...');
  const { data: domains, error: domainsError } = await supabase
    .from('skills_categories')
    .select('cat_id, slug, name_i18n')
    .order('display_order');

  if (domainsError) {
    console.log(`   ❌ ERROR: ${domainsError.message}`);
    return;
  }

  console.log(`   Found ${domains?.length || 0} L1 domains`);
  if (domains) {
    domains.forEach(d => {
      console.log(`   • L1-${d.cat_id}: ${d.name_i18n?.en || d.slug}`);
    });
  }
  console.log('');

  // 6. Final diagnosis
  console.log('='.repeat(70));
  console.log('DIAGNOSIS');
  console.log('='.repeat(70));

  const hasSkills = skills.length > 0;
  const allHaveCodes = skills.every(s => s.skill_code !== null);
  const hasMatchingTaxonomy = taxonomyRecords && taxonomyRecords.length === skillCodes.length;

  if (hasSkills && allHaveCodes && hasMatchingTaxonomy) {
    console.log('✅ ALL CHECKS PASSED');
    console.log('');
    console.log('Database state looks correct. If Expertise tab is still empty:');
    console.log('1. Check browser console for JavaScript errors');
    console.log('2. Try logging out and logging back in');
    console.log('3. Check if you\'re logged in as the correct user (Sofia)');
    console.log('4. Try hard refresh (Cmd+Shift+R on Mac)');
  } else {
    console.log('❌ ISSUES FOUND');
    console.log('');
    if (!hasSkills) {
      console.log('• No skills in database');
    }
    if (hasSkills && !allHaveCodes) {
      const nullCount = skills.filter(s => s.skill_code === null).length;
      console.log(`• ${nullCount}/${skills.length} skills have NULL skill_code`);
    }
    if (!hasMatchingTaxonomy) {
      console.log(`• Only ${taxonomyRecords?.length || 0}/${skillCodes.length} taxonomy records found`);
    }
    console.log('');
    console.log('RECOMMENDATION: Delete and re-run seeding script');
  }
  console.log('='.repeat(70));
}

checkState().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

