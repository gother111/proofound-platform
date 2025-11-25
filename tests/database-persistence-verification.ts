/**
 * Database Persistence Verification Script
 *
 * Verifies that all database operations persist correctly
 * by checking data integrity and relationships.
 */

import { db } from '@/db';
import {
  profiles,
  organizations,
  assignments,
  matches,
  skills,
  matchingProfiles,
  experiences,
  education,
  volunteering,
} from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

interface VerificationResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  count?: number;
}

const results: VerificationResult[] = [];

async function verifyProfilesData(): Promise<void> {
  console.log('Verifying Profiles Data...');

  try {
    const profileCount = await db.select().from(profiles);
    results.push({
      check: 'Profiles table has data',
      status: profileCount.length > 0 ? 'pass' : 'warning',
      message: `Found ${profileCount.length} profile(s)`,
      count: profileCount.length,
    });

    // Check for profiles with skills
    const profilesWithSkills = await db
      .select({ profileId: skills.profileId })
      .from(skills)
      .groupBy(skills.profileId);

    results.push({
      check: 'Profiles with skills',
      status: profilesWithSkills.length > 0 ? 'pass' : 'warning',
      message: `${profilesWithSkills.length} profile(s) have skills`,
      count: profilesWithSkills.length,
    });

    // Check for profiles with matching profiles
    const profilesWithMatching = await db
      .select({ profileId: matchingProfiles.profileId })
      .from(matchingProfiles)
      .groupBy(matchingProfiles.profileId);

    results.push({
      check: 'Profiles with matching profiles',
      status: profilesWithMatching.length > 0 ? 'pass' : 'warning',
      message: `${profilesWithMatching.length} profile(s) have matching profiles configured`,
      count: profilesWithMatching.length,
    });
  } catch (error) {
    results.push({
      check: 'Profiles data verification',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function verifyOrganizationsData(): Promise<void> {
  console.log('Verifying Organizations Data...');

  try {
    const orgCount = await db.select().from(organizations);
    results.push({
      check: 'Organizations table has data',
      status: orgCount.length > 0 ? 'pass' : 'warning',
      message: `Found ${orgCount.length} organization(s)`,
      count: orgCount.length,
    });

    // Check for organizations with members
    const orgsWithMembers = await db.execute(sql`
      SELECT org_id, COUNT(*) as member_count
      FROM organization_members
      WHERE status = 'active'
      GROUP BY org_id
    `);

    results.push({
      check: 'Organizations with active members',
      status: orgsWithMembers.length > 0 ? 'pass' : 'warning',
      message: `${orgsWithMembers.length} organization(s) have active members`,
      count: orgsWithMembers.length,
    });

    // Check for organizations with assignments
    const orgsWithAssignments = await db.execute(sql`
      SELECT org_id, COUNT(*) as assignment_count
      FROM assignments
      GROUP BY org_id
    `);

    results.push({
      check: 'Organizations with assignments',
      status: orgsWithAssignments.length > 0 ? 'pass' : 'warning',
      message: `${orgsWithAssignments.length} organization(s) have assignments`,
      count: orgsWithAssignments.length,
    });
  } catch (error) {
    results.push({
      check: 'Organizations data verification',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function verifySkillsData(): Promise<void> {
  console.log('Verifying Skills Data...');

  try {
    const skillsCount = await db.select().from(skills);
    results.push({
      check: 'Skills table has data',
      status: skillsCount.length > 0 ? 'pass' : 'warning',
      message: `Found ${skillsCount.length} skill(s)`,
      count: skillsCount.length,
    });

    // Check skills linked to profiles
    const skillsWithProfiles = await db.execute(sql`
      SELECT profile_id, COUNT(*) as skill_count
      FROM skills
      GROUP BY profile_id
      HAVING COUNT(*) >= 10
    `);

    results.push({
      check: 'Profiles with 10+ skills (activation threshold)',
      status: skillsWithProfiles.length > 0 ? 'pass' : 'warning',
      message: `${skillsWithProfiles.length} profile(s) have 10+ skills`,
      count: skillsWithProfiles.length,
    });
  } catch (error) {
    results.push({
      check: 'Skills data verification',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function verifyAssignmentsData(): Promise<void> {
  console.log('Verifying Assignments Data...');

  try {
    const assignmentsCount = await db.select().from(assignments);
    results.push({
      check: 'Assignments table has data',
      status: assignmentsCount.length > 0 ? 'pass' : 'warning',
      message: `Found ${assignmentsCount.length} assignment(s)`,
      count: assignmentsCount.length,
    });

    // Check published assignments
    const publishedAssignments = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM assignments
      WHERE status = 'active' AND published_at IS NOT NULL
    `);

    results.push({
      check: 'Published assignments',
      status: publishedAssignments[0]?.count > 0 ? 'pass' : 'warning',
      message: `${publishedAssignments[0]?.count || 0} assignment(s) are published`,
      count: publishedAssignments[0]?.count || 0,
    });
  } catch (error) {
    results.push({
      check: 'Assignments data verification',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function verifyMatchesData(): Promise<void> {
  console.log('Verifying Matches Data...');

  try {
    const matchesCount = await db.select().from(matches);
    results.push({
      check: 'Matches table has data',
      status: matchesCount.length > 0 ? 'pass' : 'warning',
      message: `Found ${matchesCount.length} match(es)`,
      count: matchesCount.length,
    });

    // Check matches linked to assignments
    if (matchesCount.length > 0) {
      const matchesWithAssignments = await db.execute(sql`
        SELECT assignment_id, COUNT(*) as match_count
        FROM matches
        GROUP BY assignment_id
      `);

      results.push({
        check: 'Assignments with matches',
        status: 'pass',
        message: `${matchesWithAssignments.length} assignment(s) have matches`,
        count: matchesWithAssignments.length,
      });
    }
  } catch (error) {
    results.push({
      check: 'Matches data verification',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function verifyJourneyData(): Promise<void> {
  console.log('Verifying Journey Data (Experiences, Education, Volunteering)...');

  try {
    const experiencesCount = await db.select().from(experiences);
    results.push({
      check: 'Experiences table has data',
      status: experiencesCount.length > 0 ? 'pass' : 'warning',
      message: `Found ${experiencesCount.length} experience(s)`,
      count: experiencesCount.length,
    });

    const educationCount = await db.select().from(education);
    results.push({
      check: 'Education table has data',
      status: educationCount.length > 0 ? 'pass' : 'warning',
      message: `Found ${educationCount.length} education record(s)`,
      count: educationCount.length,
    });

    const volunteeringCount = await db.select().from(volunteering);
    results.push({
      check: 'Volunteering table has data',
      status: volunteeringCount.length > 0 ? 'pass' : 'warning',
      message: `Found ${volunteeringCount.length} volunteering record(s)`,
      count: volunteeringCount.length,
    });
  } catch (error) {
    results.push({
      check: 'Journey data verification',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function verifyForeignKeys(): Promise<void> {
  console.log('Verifying Foreign Key Relationships...');

  try {
    // Check skills -> profiles
    const orphanedSkills = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM skills s
      LEFT JOIN profiles p ON s.profile_id = p.id
      WHERE p.id IS NULL
    `);

    results.push({
      check: 'Skills foreign key integrity (profile_id)',
      status: orphanedSkills[0]?.count === 0 ? 'pass' : 'fail',
      message:
        orphanedSkills[0]?.count === 0
          ? 'All skills linked to valid profiles'
          : `${orphanedSkills[0]?.count} orphaned skill(s) found`,
      count: orphanedSkills[0]?.count || 0,
    });

    // Check assignments -> organizations
    const orphanedAssignments = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM assignments a
      LEFT JOIN organizations o ON a.org_id = o.id
      WHERE o.id IS NULL
    `);

    results.push({
      check: 'Assignments foreign key integrity (org_id)',
      status: orphanedAssignments[0]?.count === 0 ? 'pass' : 'fail',
      message:
        orphanedAssignments[0]?.count === 0
          ? 'All assignments linked to valid organizations'
          : `${orphanedAssignments[0]?.count} orphaned assignment(s) found`,
      count: orphanedAssignments[0]?.count || 0,
    });

    // Check matches -> profiles and assignments
    const orphanedMatches = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM matches m
      LEFT JOIN profiles p ON m.profile_id = p.id
      LEFT JOIN assignments a ON m.assignment_id = a.id
      WHERE p.id IS NULL OR a.id IS NULL
    `);

    results.push({
      check: 'Matches foreign key integrity',
      status: orphanedMatches[0]?.count === 0 ? 'pass' : 'fail',
      message:
        orphanedMatches[0]?.count === 0
          ? 'All matches linked to valid profiles and assignments'
          : `${orphanedMatches[0]?.count} orphaned match(es) found`,
      count: orphanedMatches[0]?.count || 0,
    });
  } catch (error) {
    results.push({
      check: 'Foreign key verification',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function printResults(): void {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('DATABASE PERSISTENCE VERIFICATION RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const warnings = results.filter((r) => r.status === 'warning').length;

  console.log(`Total Checks: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}\n`);

  if (failed > 0) {
    console.log('FAILED CHECKS:');
    console.log('─────────────────────────────────────────────────────────');
    results
      .filter((r) => r.status === 'fail')
      .forEach((r) => {
        console.log(`❌ ${r.check}`);
        console.log(`   ${r.message}`);
      });
    console.log('');
  }

  if (warnings > 0) {
    console.log('WARNINGS:');
    console.log('─────────────────────────────────────────────────────────');
    results
      .filter((r) => r.status === 'warning')
      .forEach((r) => {
        console.log(`⚠️  ${r.check}`);
        console.log(`   ${r.message}`);
      });
    console.log('');
  }

  console.log('ALL RESULTS:');
  console.log('─────────────────────────────────────────────────────────');
  results.forEach((r) => {
    const icon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${r.check}`);
    console.log(`   ${r.message}`);
    if (r.count !== undefined) {
      console.log(`   Count: ${r.count}`);
    }
  });
}

async function main() {
  console.log('Starting Database Persistence Verification...\n');

  await verifyProfilesData();
  await verifyOrganizationsData();
  await verifySkillsData();
  await verifyAssignmentsData();
  await verifyMatchesData();
  await verifyJourneyData();
  await verifyForeignKeys();

  printResults();

  const failed = results.filter((r) => r.status === 'fail').length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
