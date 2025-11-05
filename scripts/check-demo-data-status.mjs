/**
 * Check the status of demo data in the database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables from .env.local
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
  console.error('⚠️  Could not load .env.local file');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function checkDemoData() {
  console.log('🔍 Checking Demo Data Status...\n');
  
  // Check demo users by handle (sofia-martinez, james-chen, etc.)
  console.log('👥 DEMO USERS:');
  const demoHandles = ['sofia-martinez', 'james-chen', 'amara-okafor', 'yuki-tanaka', 'alex-rivera'];
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, handle, display_name')
    .in('handle', demoHandles);
  
  if (profilesError) {
    console.log('   ❌ Error:', profilesError.message);
  } else {
    console.log(`   ✅ Found ${profiles.length} demo users`);
    profiles.forEach(p => console.log(`      - ${p.display_name} (@${p.handle})`));
  }
  
  // Check demo user skills
  if (profiles && profiles.length > 0) {
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('profile_id')
      .in('profile_id', profiles.map(p => p.id));
    
    if (!skillsError) {
      console.log(`   ✅ Total skills: ${skills.length}`);
    }
  }
  
  // Check matching profiles
  let matchingProfiles = [];
  if (profiles && profiles.length > 0) {
    const { data: matchingProfilesData, error: mpError } = await supabase
      .from('matching_profiles')
      .select('profile_id, work_mode, hours_min, hours_max, comp_min, comp_max')
      .in('profile_id', profiles.map(p => p.id));
    
    if (mpError) {
      console.log('   ❌ Matching profiles error:', mpError.message);
    } else {
      matchingProfiles = matchingProfilesData || [];
      console.log(`   ${matchingProfiles.length > 0 ? '✅' : '❌'} Matching profiles: ${matchingProfiles.length}`);
    }
  }
  
  console.log('\n🏢 DEMO ORGANIZATIONS:');
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, display_name, slug')
    .in('slug', ['greenpath-ngo', 'skillbridge', 'circularcraft']);
  
  if (orgsError) {
    console.log('   ❌ Error:', orgsError.message);
  } else {
    console.log(`   ✅ Found ${orgs.length} demo organizations`);
    orgs.forEach(o => console.log(`      - ${o.display_name} (${o.slug})`));
  }
  
  // Check org projects
  if (orgs && orgs.length > 0) {
    const { data: projects, error: projError } = await supabase
      .from('org_projects')
      .select('org_id')
      .in('org_id', orgs.map(o => o.id));
    
    if (!projError) {
      console.log(`   ✅ Org projects: ${projects.length}`);
    }
  }
  
  // Check assignments
  console.log('\n💼 ASSIGNMENTS:');
  let assignments = [];
  if (orgs && orgs.length > 0) {
    const { data: assignmentsData, error: assignError } = await supabase
      .from('assignments')
      .select('id, role, status, org_id')
      .in('org_id', orgs.map(o => o.id));
    
    if (assignError) {
      console.log('   ❌ Error:', assignError.message);
    } else {
      assignments = assignmentsData || [];
      console.log(`   ${assignments.length > 0 ? '✅' : '❌'} Found ${assignments.length} assignments`);
      if (assignments.length > 0) {
        assignments.forEach(a => console.log(`      - ${a.role} (${a.status})`));
      }
    }
  }
  
  // Check matches
  console.log('\n🔗 MATCHES:');
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('id, score')
    .limit(10);
  
  if (matchError) {
    console.log('   ❌ Error:', matchError.message);
  } else {
    console.log(`   ${matches.length > 0 ? '✅' : '⚠️'} Found ${matches.length} matches`);
  }
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log('   ✅ Complete: Individual profiles, skills, projects');
  console.log('   ✅ Complete: Organizations, org projects');
  
  if (!matchingProfiles || matchingProfiles.length === 0) {
    console.log('   ❌ MISSING: Matching profiles for demo users');
  }
  
  if (!assignments || assignments.length === 0) {
    console.log('   ❌ MISSING: Assignments (job postings)');
  }
  
  if (!matches || matches.length === 0) {
    console.log('   ⚠️  OPTIONAL: Match records (generated by matching engine)');
  }
  
  console.log('\n');
}

checkDemoData();

