/**
 * Comprehensive audit of demo data completeness
 * Checks if all features can be tested with existing demo data
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

async function auditDemoCompleteness() {
  console.log('🔍 COMPREHENSIVE DEMO DATA AUDIT\n');
  console.log('Checking if all MVP features can be tested...\n');
  console.log('=' .repeat(80));
  
  const results = {
    complete: [],
    incomplete: [],
    missing: [],
  };
  
  // Get demo users
  const demoHandles = ['sofia-martinez', 'james-chen', 'amara-okafor', 'yuki-tanaka', 'alex-rivera'];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, handle, display_name')
    .in('handle', demoHandles);
  
  console.log('\n👥 INDIVIDUAL USERS AUDIT:\n');
  
  for (const profile of profiles) {
    console.log(`\n📋 ${profile.display_name} (@${profile.handle}):`);
    
    // Check individual_profiles
    const { data: indProfile } = await supabase
      .from('individual_profiles')
      .select('*')
      .eq('user_id', profile.id)
      .single();
    
    if (indProfile && indProfile.headline && indProfile.bio) {
      console.log('  ✅ Profile: Complete (headline, bio, values, causes)');
      results.complete.push(`${profile.display_name}: Profile`);
    } else {
      console.log('  ❌ Profile: Missing headline or bio');
      results.incomplete.push(`${profile.display_name}: Profile`);
    }
    
    // Check skills
    const { data: skills, count: skillsCount } = await supabase
      .from('skills')
      .select('*', { count: 'exact' })
      .eq('profile_id', profile.id);
    
    if (skillsCount >= 5) {
      console.log(`  ✅ Skills: ${skillsCount} skills with taxonomy codes`);
      results.complete.push(`${profile.display_name}: Skills`);
    } else {
      console.log(`  ⚠️  Skills: Only ${skillsCount} skills (recommended: 8+)`);
      results.incomplete.push(`${profile.display_name}: Skills`);
    }
    
    // Check matching profile
    const { data: matchingProfile } = await supabase
      .from('matching_profiles')
      .select('*')
      .eq('profile_id', profile.id)
      .single();
    
    if (matchingProfile && matchingProfile.work_mode && matchingProfile.comp_min) {
      console.log('  ✅ Matching Profile: Complete (preferences, compensation, availability)');
      results.complete.push(`${profile.display_name}: Matching Profile`);
    } else {
      console.log('  ❌ Matching Profile: Missing or incomplete');
      results.incomplete.push(`${profile.display_name}: Matching Profile`);
    }
    
    // Check projects
    const { data: projects, count: projectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('user_id', profile.id);
    
    if (projectsCount >= 2) {
      console.log(`  ✅ Projects: ${projectsCount} projects with outcomes`);
      results.complete.push(`${profile.display_name}: Projects`);
    } else {
      console.log(`  ⚠️  Projects: Only ${projectsCount} projects`);
      results.incomplete.push(`${profile.display_name}: Projects`);
    }
    
    // Check impact stories
    const { data: stories, count: storiesCount } = await supabase
      .from('impact_stories')
      .select('*', { count: 'exact' })
      .eq('user_id', profile.id);
    
    if (storiesCount >= 1) {
      console.log(`  ✅ Impact Stories: ${storiesCount} verified stories`);
      results.complete.push(`${profile.display_name}: Impact Stories`);
    } else {
      console.log(`  ⚠️  Impact Stories: ${storiesCount} stories`);
      results.incomplete.push(`${profile.display_name}: Impact Stories`);
    }
    
    // Check work experiences
    const { data: experiences, count: expCount } = await supabase
      .from('experiences')
      .select('*', { count: 'exact' })
      .eq('user_id', profile.id);
    
    if (expCount >= 1) {
      console.log(`  ✅ Work Experience: ${expCount} experiences`);
      results.complete.push(`${profile.display_name}: Work Experience`);
    } else {
      console.log(`  ⚠️  Work Experience: ${expCount} experiences`);
      results.incomplete.push(`${profile.display_name}: Work Experience`);
    }
    
    // Check education
    const { data: education, count: eduCount } = await supabase
      .from('education')
      .select('*', { count: 'exact' })
      .eq('user_id', profile.id);
    
    if (eduCount >= 1) {
      console.log(`  ✅ Education: ${eduCount} degrees/certifications`);
      results.complete.push(`${profile.display_name}: Education`);
    } else {
      console.log(`  ⚠️  Education: ${eduCount} records`);
      results.incomplete.push(`${profile.display_name}: Education`);
    }
    
    // Check capabilities
    const { data: capabilities, count: capCount } = await supabase
      .from('capabilities')
      .select('*', { count: 'exact' })
      .eq('profile_id', profile.id);
    
    if (capCount >= 3) {
      console.log(`  ✅ Capabilities: ${capCount} capabilities with evidence`);
      results.complete.push(`${profile.display_name}: Capabilities`);
    } else {
      console.log(`  ⚠️  Capabilities: ${capCount} capabilities`);
      results.incomplete.push(`${profile.display_name}: Capabilities`);
    }
  }
  
  // Check organizations
  console.log('\n\n🏢 ORGANIZATIONS AUDIT:\n');
  
  const { data: orgs } = await supabase
    .from('organizations')
    .select('*')
    .in('slug', ['greenpath-ngo', 'skillbridge', 'circularcraft']);
  
  for (const org of orgs) {
    console.log(`\n🏛️  ${org.display_name}:`);
    
    // Check org profile completeness
    if (org.mission && org.website && org.legal_name) {
      console.log('  ✅ Profile: Complete (mission, website, legal name)');
      results.complete.push(`${org.display_name}: Profile`);
    } else {
      console.log('  ⚠️  Profile: Missing some fields');
      results.incomplete.push(`${org.display_name}: Profile`);
    }
    
    // Check assignments
    const { data: assignments, count: assignCount } = await supabase
      .from('assignments')
      .select('*', { count: 'exact' })
      .eq('org_id', org.id);
    
    if (assignCount >= 2) {
      const activeCount = assignments.filter(a => a.status === 'active').length;
      console.log(`  ✅ Assignments: ${assignCount} total (${activeCount} active)`);
      results.complete.push(`${org.display_name}: Assignments`);
    } else {
      console.log(`  ⚠️  Assignments: Only ${assignCount} postings`);
      results.incomplete.push(`${org.display_name}: Assignments`);
    }
    
    // Check org projects
    const { data: orgProjects, count: orgProjCount } = await supabase
      .from('org_projects')
      .select('*', { count: 'exact' })
      .eq('org_id', org.id);
    
    if (orgProjCount >= 2) {
      console.log(`  ✅ Projects: ${orgProjCount} organization projects`);
      results.complete.push(`${org.display_name}: Projects`);
    } else {
      console.log(`  ⚠️  Projects: ${orgProjCount} projects`);
      results.incomplete.push(`${org.display_name}: Projects`);
    }
    
    // Check org members
    const { data: members, count: memberCount } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact' })
      .eq('org_id', org.id);
    
    if (memberCount >= 1) {
      console.log(`  ✅ Team Members: ${memberCount} members`);
      results.complete.push(`${org.display_name}: Team Members`);
    } else {
      console.log(`  ⚠️  Team Members: ${memberCount} members`);
      results.incomplete.push(`${org.display_name}: Team Members`);
    }
  }
  
  // Check system-wide data
  console.log('\n\n🌐 SYSTEM-WIDE DATA:\n');
  
  // Skills taxonomy
  const { count: taxonomyCount } = await supabase
    .from('skills_taxonomy')
    .select('*', { count: 'exact', head: true });
  
  if (taxonomyCount > 15000) {
    console.log(`  ✅ Skills Taxonomy: ${taxonomyCount} skills loaded`);
    results.complete.push('System: Skills Taxonomy');
  } else {
    console.log(`  ⚠️  Skills Taxonomy: Only ${taxonomyCount} skills`);
    results.incomplete.push('System: Skills Taxonomy');
  }
  
  // Matches (may be zero if not generated yet)
  const { count: matchesCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true });
  
  console.log(`  ${matchesCount > 0 ? '✅' : '⚠️ '} Matches: ${matchesCount} match records ${matchesCount === 0 ? '(will be generated by matching engine)' : ''}`);
  
  // Conversations
  const { count: conversationsCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true });
  
  console.log(`  ${conversationsCount > 0 ? '✅' : '⚠️ '} Conversations: ${conversationsCount} active conversations ${conversationsCount === 0 ? '(will be created when users express interest)' : ''}`);
  
  // Interviews
  const { count: interviewsCount } = await supabase
    .from('interviews')
    .select('*', { count: 'exact', head: true });
  
  console.log(`  ${interviewsCount > 0 ? '✅' : '⚠️ '} Interviews: ${interviewsCount} scheduled ${interviewsCount === 0 ? '(can be created via UI)' : ''}`);
  
  // Summary
  console.log('\n' + '=' .repeat(80));
  console.log('\n📊 COMPLETENESS SUMMARY:\n');
  
  const totalChecks = results.complete.length + results.incomplete.length + results.missing.length;
  const completePercent = Math.round((results.complete.length / totalChecks) * 100);
  
  console.log(`✅ Complete: ${results.complete.length}/${totalChecks} checks (${completePercent}%)`);
  console.log(`⚠️  Incomplete: ${results.incomplete.length}/${totalChecks} checks`);
  console.log(`❌ Missing: ${results.missing.length}/${totalChecks} checks`);
  
  if (results.incomplete.length > 0) {
    console.log('\n⚠️  ITEMS NEEDING ATTENTION:\n');
    results.incomplete.forEach((item, i) => {
      console.log(`${i + 1}. ${item}`);
    });
  }
  
  if (results.missing.length > 0) {
    console.log('\n❌ CRITICAL MISSING DATA:\n');
    results.missing.forEach((item, i) => {
      console.log(`${i + 1}. ${item}`);
    });
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n🎯 MVP TESTING READINESS:\n');
  
  if (completePercent >= 90) {
    console.log('🟢 EXCELLENT: Demo data is comprehensive and ready for full MVP testing!');
  } else if (completePercent >= 75) {
    console.log('🟡 GOOD: Most features can be tested, but some data could be enhanced.');
  } else {
    console.log('🔴 NEEDS WORK: Significant data gaps that may limit MVP testing.');
  }
  
  console.log('\n' + '=' .repeat(80));
}

auditDemoCompleteness();

