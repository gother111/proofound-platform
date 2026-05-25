/**
 * Comprehensive platform health check
 * Verifies migrations, data, API connectivity, and feature status
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

async function checkTableExists(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);
  
  if (error && error.message.includes('does not exist')) {
    return false;
  }
  return true;
}

async function checkHealth() {
  console.log('🏥 PLATFORM HEALTH CHECK\n');
  console.log('=' .repeat(60));
  
  const results = {
    migrations: { status: 'pending', issues: [] },
    demoData: { status: 'pending', issues: [] },
    coreFeatures: { status: 'pending', issues: [] },
    criticalGaps: { status: 'pending', issues: [] },
  };
  
  // 1. Check Core Tables Exist
  console.log('\n📊 DATABASE SCHEMA CHECK\n');
  
  const coreTables = [
    'profiles',
    'individual_profiles',
    'organizations',
    'organization_members',
    'skills',
    'skills_taxonomy',
    'matching_profiles',
    'assignments',
    'matches',
    'applications',
    'conversations',
    'messages',
  ];
  
  const newTables = [
    'interviews',
    'fairness_reports',
  ];
  
  console.log('Core Tables:');
  for (const table of coreTables) {
    const exists = await checkTableExists(table);
    console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    if (!exists) {
      results.migrations.issues.push(`Missing core table: ${table}`);
    }
  }
  
  console.log('\nNew Feature Tables (from critical gaps):');
  for (const table of newTables) {
    const exists = await checkTableExists(table);
    console.log(`  ${exists ? '✅' : '⚠️ '} ${table} ${!exists ? '(not migrated)' : ''}`);
    if (!exists) {
      results.migrations.issues.push(`Missing new table: ${table}`);
    }
  }
  
  // 2. Check Demo Data
  console.log('\n👥 DEMO DATA CHECK\n');
  
  const demoHandles = ['sofia-martinez', 'james-chen', 'amara-okafor', 'yuki-tanaka', 'alex-rivera'];
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, handle, display_name')
    .in('handle', demoHandles);
  
  console.log(`Demo Users: ${profiles?.length || 0}/5`);
  if (profiles) {
    profiles.forEach(p => console.log(`  ✅ ${p.display_name} (@${p.handle})`));
  }
  if (!profiles || profiles.length < 5) {
    results.demoData.issues.push(`Only ${profiles?.length || 0}/5 demo users found`);
  }
  
  // Check skills
  if (profiles && profiles.length > 0) {
    const { data: skills } = await supabase
      .from('skills')
      .select('id')
      .in('profile_id', profiles.map(p => p.id));
    
    console.log(`Skills: ${skills?.length || 0}`);
    if (!skills || skills.length < 40) {
      results.demoData.issues.push(`Expected ~42 skills, found ${skills?.length || 0}`);
    }
  }
  
  // Check matching profiles
  if (profiles && profiles.length > 0) {
    const { data: matchingProfiles } = await supabase
      .from('matching_profiles')
      .select('profile_id')
      .in('profile_id', profiles.map(p => p.id));
    
    console.log(`Matching Profiles: ${matchingProfiles?.length || 0}/5`);
    if (!matchingProfiles || matchingProfiles.length < 5) {
      results.demoData.issues.push(`Only ${matchingProfiles?.length || 0}/5 matching profiles`);
    }
  }
  
  // Check organizations
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, display_name, slug')
    .in('slug', ['greenpath-ngo', 'skillbridge', 'circularcraft']);
  
  console.log(`\nDemo Organizations: ${orgs?.length || 0}/3`);
  if (orgs) {
    orgs.forEach(o => console.log(`  ✅ ${o.display_name}`));
  }
  if (!orgs || orgs.length < 3) {
    results.demoData.issues.push(`Only ${orgs?.length || 0}/3 demo organizations found`);
  }
  
  // Check assignments
  if (orgs && orgs.length > 0) {
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, role, status')
      .in('org_id', orgs.map(o => o.id));
    
    console.log(`Assignments: ${assignments?.length || 0}/6`);
    if (assignments && assignments.length > 0) {
      assignments.forEach(a => console.log(`  ✅ ${a.role} (${a.status})`));
    }
    if (!assignments || assignments.length < 6) {
      results.demoData.issues.push(`Only ${assignments?.length || 0}/6 assignments found`);
    }
  }
  
  // 3. Check Critical Features
  console.log('\n🚀 CRITICAL FEATURES CHECK\n');
  
  // Check for API routes
  const apiRoutes = [
    'src/app/api/interviews/schedule/route.ts',
    'src/app/api/interviews/cancel/route.ts',
    'src/lib/integrations/zoom.ts',
    'src/lib/integrations/google-meet.ts',
    'src/components/matching/MatchDetailPanel.tsx',
    'src/components/matching/MatchingProfileEditor.tsx',
  ];
  
  console.log('Feature Implementation:');
  for (const route of apiRoutes) {
    try {
      const fullPath = join(__dirname, '..', route);
      readFileSync(fullPath, 'utf-8');
      console.log(`  ✅ ${route}`);
    } catch (err) {
      console.log(`  ❌ ${route}`);
      results.criticalGaps.issues.push(`Missing: ${route}`);
    }
  }
  
  // 4. Check Environment Variables
  console.log('\n🔐 ENVIRONMENT VARIABLES CHECK\n');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  const optionalEnvVars = [
    'ZOOM_CLIENT_ID',
    'ZOOM_CLIENT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];
  
  console.log('Required:');
  requiredEnvVars.forEach(varName => {
    const exists = !!process.env[varName];
    console.log(`  ${exists ? '✅' : '❌'} ${varName}`);
    if (!exists) {
      results.coreFeatures.issues.push(`Missing env var: ${varName}`);
    }
  });
  
  console.log('\nOptional (for integrations):');
  optionalEnvVars.forEach(varName => {
    const exists = !!process.env[varName];
    console.log(`  ${exists ? '✅' : '⚠️ '} ${varName}`);
  });
  
  // 5. Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 SUMMARY\n');
  
  results.migrations.status = results.migrations.issues.length === 0 ? 'pass' : 'fail';
  results.demoData.status = results.demoData.issues.length === 0 ? 'pass' : 'fail';
  results.coreFeatures.status = results.coreFeatures.issues.length === 0 ? 'pass' : 'fail';
  results.criticalGaps.status = results.criticalGaps.issues.length === 0 ? 'pass' : 'needs_work';
  
  console.log(`Database Schema: ${results.migrations.status === 'pass' ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Demo Data: ${results.demoData.status === 'pass' ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Core Features: ${results.coreFeatures.status === 'pass' ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Critical Gaps: ${results.criticalGaps.status === 'pass' ? '✅ PASS' : '⚠️  NEEDS WORK'}`);
  
  // Issues
  const allIssues = [
    ...results.migrations.issues,
    ...results.demoData.issues,
    ...results.coreFeatures.issues,
    ...results.criticalGaps.issues,
  ];
  
  if (allIssues.length > 0) {
    console.log('\n⚠️  ISSUES FOUND:\n');
    allIssues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
  } else {
    console.log('\n🎉 ALL CHECKS PASSED! Platform is healthy.\n');
  }
  
  console.log('='.repeat(60));
}

checkHealth();

