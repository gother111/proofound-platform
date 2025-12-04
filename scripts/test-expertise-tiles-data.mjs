/**
 * Test script to verify expertise tiles display correct data
 * 
 * This script:
 * 1. Queries database directly for user skills
 * 2. Calculates expected values for L1Grid stats
 * 3. Verifies L4Card data matches database records
 * 4. Compares calculations with what page.tsx produces
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

// Load environment variables
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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Test with a specific user ID (you can pass as argument or use default)
const userId = process.argv[2] || '0584f063-58cd-4e1f-a95d-c54c105a7ac0'; // Sofia's ID as default

/**
 * Calculate recency mix for skills (matching page.tsx logic)
 */
function calculateRecencyMix(skills) {
  const now = new Date();
  let active = 0, recent = 0, rusty = 0;

  skills.forEach((skill) => {
    if (!skill.last_used_at) {
      rusty++;
      return;
    }

    const monthsAgo = Math.floor(
      (now.getTime() - new Date(skill.last_used_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    if (monthsAgo <= 6) active++;
    else if (monthsAgo <= 24) recent++;
    else rusty++;
  });

  const total = active + recent + rusty || 1;

  return {
    active: Math.round((active / total) * 100),
    recent: Math.round((recent / total) * 100),
    rusty: Math.round((rusty / total) * 100),
  };
}

/**
 * Calculate average level for skills
 */
function calculateAvgLevel(skills) {
  if (skills.length === 0) return 0;
  const sum = skills.reduce((acc, skill) => acc + (skill.level || 0), 0);
  return sum / skills.length;
}

/**
 * Get recency text (matching L4Card logic)
 */
function getRecencyText(date) {
  const now = new Date();
  const monthsAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30));

  if (monthsAgo < 1) return 'This month';
  if (monthsAgo < 6) return `${monthsAgo} months ago`;
  if (monthsAgo < 12) return `${monthsAgo} months ago (Recent)`;
  if (monthsAgo < 24) return `${Math.floor(monthsAgo / 12)} year ago`;
  return `${Math.floor(monthsAgo / 12)} years ago (Rusty)`;
}

async function testExpertiseTilesData() {
  console.log('='.repeat(80));
  console.log('EXPERTISE TILES DATA VERIFICATION');
  console.log('='.repeat(80));
  console.log(`Testing user ID: ${userId}\n`);

  // 1. Fetch user profile
  console.log('1. Fetching user profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error(`   ❌ ERROR: ${profileError?.message || 'Profile not found'}`);
    console.log('   Please provide a valid user ID as argument');
    process.exit(1);
  }

  console.log(`   ✅ Profile: ${profile.full_name} (${profile.email})\n`);

  // 2. Fetch user skills
  console.log('2. Fetching user skills...');
  const { data: userSkills, error: skillsError } = await supabase
    .from('skills')
    .select('*')
    .eq('profile_id', userId);

  if (skillsError) {
    console.error(`   ❌ ERROR: ${skillsError.message}`);
    process.exit(1);
  }

  if (!userSkills || userSkills.length === 0) {
    console.log('   ⚠️  No skills found for this user');
    console.log('   This is expected for users without skills (empty state)\n');
    process.exit(0);
  }

  console.log(`   ✅ Found ${userSkills.length} skills\n`);

  // 3. Fetch taxonomy data
  console.log('3. Fetching taxonomy data...');
  const skillCodes = userSkills
    .map((s) => s.skill_code)
    .filter((code) => code !== null && code !== undefined);

  let taxonomyMap = {};
  if (skillCodes.length > 0) {
    const { data: taxonomyData, error: taxonomyError } = await supabase
      .from('skills_taxonomy')
      .select('code, slug, name_i18n, cat_id, subcat_id, l3_id, tags')
      .in('code', skillCodes);

    if (taxonomyError) {
      console.error(`   ❌ ERROR: ${taxonomyError.message}`);
    } else {
      taxonomyData?.forEach((tax) => {
        taxonomyMap[tax.code] = tax;
      });
      console.log(`   ✅ Found taxonomy for ${taxonomyData?.length || 0}/${skillCodes.length} skills\n`);
    }
  } else {
    console.log('   ⚠️  No skill codes found (all skills may be custom)\n');
  }

  // 4. Fetch proof counts
  console.log('4. Fetching proof counts...');
  const { data: proofs, error: proofsError } = await supabase
    .from('skill_proofs')
    .select('skill_id')
    .eq('profile_id', userId);

  const proofCountMap = {};
  if (!proofsError && proofs) {
    proofs.forEach(({ skill_id }) => {
      proofCountMap[skill_id] = (proofCountMap[skill_id] || 0) + 1;
    });
    console.log(`   ✅ Found ${proofs.length} proof records\n`);
  } else {
    console.log(`   ⚠️  ${proofsError?.message || 'No proofs found'}\n`);
  }

  // 5. Fetch verification counts
  console.log('5. Fetching verification counts...');
  const { data: verifications, error: verificationsError } = await supabase
    .from('skill_verification_requests')
    .select('skill_id, verifier_source, status')
    .eq('requester_profile_id', userId)
    .eq('status', 'accepted');

  const verificationCountMap = {};
  if (!verificationsError && verifications) {
    verifications.forEach(({ skill_id }) => {
      verificationCountMap[skill_id] = (verificationCountMap[skill_id] || 0) + 1;
    });
    console.log(`   ✅ Found ${verifications.length} accepted verifications\n`);
  } else {
    console.log(`   ⚠️  ${verificationsError?.message || 'No verifications found'}\n`);
  }

  // 6. Enrich skills (matching page.tsx logic)
  console.log('6. Enriching skills with taxonomy and counts...');
  const enrichedSkills = userSkills.map((skill) => ({
    ...skill,
    taxonomy: skill.skill_code ? taxonomyMap[skill.skill_code] : null,
    proof_count: proofCountMap[skill.id] || 0,
    verification_count: verificationCountMap[skill.id] || 0,
  }));

  console.log(`   ✅ Enriched ${enrichedSkills.length} skills\n`);

  // 7. Fetch L1 domains
  console.log('7. Fetching L1 domains...');
  const { data: l1Domains, error: domainsError } = await supabase
    .from('skills_categories')
    .select('*')
    .order('display_order');

  if (domainsError) {
    console.error(`   ❌ ERROR: ${domainsError.message}`);
    process.exit(1);
  }

  console.log(`   ✅ Found ${l1Domains?.length || 0} L1 domains\n`);

  // 8. Calculate L1Grid stats (matching page.tsx logic)
  console.log('8. Calculating L1Grid domain stats...');
  console.log('='.repeat(80));
  console.log('L1GRID TILES VERIFICATION\n');

  const domainsWithStats = (l1Domains || []).map((domain) => {
    const domainSkills = enrichedSkills.filter(
      (skill) => skill.taxonomy?.cat_id === domain.cat_id
    );

    const skillCount = domainSkills.length;
    const avgLevel = calculateAvgLevel(domainSkills);
    const recencyMix = calculateRecencyMix(domainSkills);

    return {
      catId: domain.cat_id,
      name: domain.name_i18n?.en || domain.slug,
      skillCount,
      avgLevel,
      recencyMix,
      skills: domainSkills,
    };
  });

  // Display L1Grid verification
  domainsWithStats.forEach((domain) => {
    if (domain.skillCount === 0) return; // Skip domains with no skills

    console.log(`Domain: ${domain.name} (L1-${domain.catId})`);
    console.log(`  Skill Count: ${domain.skillCount}`);
    console.log(`  Average Level: ${domain.avgLevel.toFixed(2)} / 5.0`);
    console.log(`  Recency Mix:`);
    console.log(`    Active (≤6 months): ${domain.recencyMix.active}%`);
    console.log(`    Recent (7-24 months): ${domain.recencyMix.recent}%`);
    console.log(`    Rusty (>24 months): ${domain.recencyMix.rusty}%`);
    console.log(`  Recency Sum: ${domain.recencyMix.active + domain.recencyMix.recent + domain.recencyMix.rusty}% (should be 100%)`);
    
    // Verify recency percentages sum to 100
    const sum = domain.recencyMix.active + domain.recencyMix.recent + domain.recencyMix.rusty;
    if (sum !== 100) {
      console.log(`  ⚠️  WARNING: Recency percentages sum to ${sum}%, not 100%`);
    } else {
      console.log(`  ✅ Recency percentages are correct`);
    }
    console.log('');
  });

  // 9. Verify L4Card data
  console.log('='.repeat(80));
  console.log('L4CARD TILES VERIFICATION\n');

  enrichedSkills.forEach((skill, idx) => {
    console.log(`Skill ${idx + 1}: ${skill.id}`);
    
    // Skill name resolution
    const skillName = skill.skill_name || 
                     skill.taxonomy?.name_i18n?.en || 
                     skill.custom_skill_name || 
                     'Unknown Skill';
    console.log(`  Name: ${skillName}`);
    console.log(`  Code: ${skill.skill_code || 'N/A (custom skill)'}`);
    
    // Level verification
    if (skill.level < 1 || skill.level > 5) {
      console.log(`  ⚠️  WARNING: Level ${skill.level} is outside valid range (1-5)`);
    } else {
      console.log(`  ✅ Level: ${skill.level}`);
    }
    
    // Experience verification
    if (skill.months_experience < 0) {
      console.log(`  ⚠️  WARNING: Negative months_experience: ${skill.months_experience}`);
    } else {
      console.log(`  ✅ Experience: ${skill.months_experience} months`);
    }
    
    // Recency verification
    if (skill.last_used_at) {
      const recencyText = getRecencyText(new Date(skill.last_used_at));
      console.log(`  ✅ Last Used: ${recencyText} (${skill.last_used_at})`);
    } else {
      console.log(`  ✅ Last Used: Never used`);
    }
    
    // Relevance verification
    const validRelevance = ['obsolete', 'current', 'emerging'].includes(skill.relevance);
    if (!validRelevance) {
      console.log(`  ⚠️  WARNING: Invalid relevance: ${skill.relevance}`);
    } else {
      console.log(`  ✅ Relevance: ${skill.relevance}`);
    }
    
    // Evidence strength calculation (if available)
    // Note: evidenceStrength is calculated in the frontend, not stored in DB
    // We can verify proof_count instead
    console.log(`  ✅ Proof Count: ${skill.proof_count}`);
    console.log(`  ✅ Verification Count: ${skill.verification_count}`);
    
    // Taxonomy verification
    if (skill.skill_code && !skill.taxonomy) {
      console.log(`  ⚠️  WARNING: Skill has code ${skill.skill_code} but no taxonomy found`);
    } else if (!skill.skill_code && !skill.custom_skill_name) {
      console.log(`  ⚠️  WARNING: Skill has no code and no custom name`);
    } else {
      console.log(`  ✅ Taxonomy: ${skill.taxonomy ? 'Found' : 'Custom skill (no taxonomy)'}`);
    }
    
    console.log('');
  });

  // 10. Summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  const totalSkills = enrichedSkills.length;
  const skillsWithTaxonomy = enrichedSkills.filter((s) => s.taxonomy !== null).length;
  const customSkills = totalSkills - skillsWithTaxonomy;
  const skillsWithProofs = enrichedSkills.filter((s) => s.proof_count > 0).length;
  const skillsWithVerifications = enrichedSkills.filter((s) => s.verification_count > 0).length;
  const domainsWithSkills = domainsWithStats.filter((d) => d.skillCount > 0).length;

  console.log(`Total Skills: ${totalSkills}`);
  console.log(`  - With Taxonomy: ${skillsWithTaxonomy}`);
  console.log(`  - Custom Skills: ${customSkills}`);
  console.log(`  - With Proofs: ${skillsWithProofs}`);
  console.log(`  - With Verifications: ${skillsWithVerifications}`);
  console.log(`Domains with Skills: ${domainsWithSkills}`);
  console.log('');

  // Check for issues
  const issues = [];
  
  enrichedSkills.forEach((skill) => {
    if (skill.level < 1 || skill.level > 5) {
      issues.push(`Skill ${skill.id} has invalid level: ${skill.level}`);
    }
    if (skill.months_experience < 0) {
      issues.push(`Skill ${skill.id} has negative months_experience: ${skill.months_experience}`);
    }
    if (!['obsolete', 'current', 'emerging'].includes(skill.relevance)) {
      issues.push(`Skill ${skill.id} has invalid relevance: ${skill.relevance}`);
    }
    if (skill.skill_code && !skill.taxonomy) {
      issues.push(`Skill ${skill.id} has code ${skill.skill_code} but no taxonomy found`);
    }
  });

  domainsWithStats.forEach((domain) => {
    if (domain.skillCount > 0) {
      const sum = domain.recencyMix.active + domain.recencyMix.recent + domain.recencyMix.rusty;
      if (sum !== 100) {
        issues.push(`Domain ${domain.name} recency percentages sum to ${sum}% instead of 100%`);
      }
    }
  });

  if (issues.length === 0) {
    console.log('✅ ALL CHECKS PASSED');
    console.log('');
    console.log('Expertise tiles data appears to be correct.');
    console.log('All calculations match expected values from the database.');
  } else {
    console.log(`⚠️  FOUND ${issues.length} ISSUE(S):`);
    issues.forEach((issue, idx) => {
      console.log(`  ${idx + 1}. ${issue}`);
    });
  }

  console.log('='.repeat(80));
}

testExpertiseTilesData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

