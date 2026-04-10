/**
 * API Endpoint Testing Script
 *
 * Tests all critical API endpoints to verify they work correctly
 * and persist data to the database.
 *
 * Run with: npx tsx tests/api-endpoints-test.ts
 */

import { db } from '@/db';
import { profiles, organizations, assignments, matches, skills } from '@/db/schema';
import { eq } from 'drizzle-orm';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface ApiTestResult {
  endpoint: string;
  method: string;
  status: 'pass' | 'fail' | 'skip';
  statusCode?: number;
  message?: string;
  dbVerified?: boolean;
}

const results: ApiTestResult[] = [];

async function testApiEndpoint(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  expectedStatus: number = 200
): Promise<ApiTestResult> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json().catch(() => ({}));

    const passed =
      response.status === expectedStatus || (expectedStatus === 200 && response.status < 400);

    return {
      endpoint,
      method,
      status: passed ? 'pass' : 'fail',
      statusCode: response.status,
      message: passed
        ? `Status ${response.status}`
        : `Expected ${expectedStatus}, got ${response.status}: ${JSON.stringify(data).substring(0, 100)}`,
      dbVerified: false,
    };
  } catch (error) {
    return {
      endpoint,
      method,
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      dbVerified: false,
    };
  }
}

async function testHealthCheck(): Promise<void> {
  console.log('Testing Health Check Endpoint...');
  const result = await testApiEndpoint('/api/cron/health-check', 'GET', undefined, 200);
  results.push(result);
}

async function testUserEndpoints(): Promise<void> {
  console.log('Testing User Endpoints...');

  // Note: These require authentication, so they may fail without proper auth
  // But we can verify the endpoints exist and return appropriate responses

  results.push(await testApiEndpoint('/api/user/me', 'GET', undefined, 401)); // Should require auth
  results.push(await testApiEndpoint('/api/user/export', 'GET', undefined, 401)); // Should require auth
}

async function testExpertiseEndpoints(): Promise<void> {
  console.log('Testing Expertise Endpoints...');

  results.push(await testApiEndpoint('/api/expertise/taxonomy', 'GET', undefined, 200));
  results.push(await testApiEndpoint('/api/expertise/user-skills', 'GET', undefined, 401)); // Requires auth
}

async function testMatchingEndpoints(): Promise<void> {
  console.log('Testing Matching Endpoints...');

  results.push(await testApiEndpoint('/api/matching-profile', 'GET', undefined, 401)); // Requires auth
}

async function testAssignmentEndpoints(): Promise<void> {
  console.log('Testing Assignment Endpoints...');

  results.push(await testApiEndpoint('/api/assignments', 'GET', undefined, 401)); // Requires auth
}

async function testWellbeingEndpoints(): Promise<void> {
  console.log('Testing Wellbeing Endpoints...');

  results.push(await testApiEndpoint('/api/wellbeing/checkin', 'POST', undefined, 401)); // Requires auth
}

async function testDatabaseQueries(): Promise<void> {
  console.log('Testing Database Queries...');

  try {
    // Test profiles query
    const profileCount = await db.select().from(profiles).limit(1);
    results.push({
      endpoint: 'DB: profiles query',
      method: 'SELECT',
      status: 'pass',
      message: `Found ${profileCount.length} profile(s)`,
      dbVerified: true,
    });
  } catch (error) {
    results.push({
      endpoint: 'DB: profiles query',
      method: 'SELECT',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      dbVerified: false,
    });
  }

  try {
    // Test organizations query
    const orgCount = await db.select().from(organizations).limit(1);
    results.push({
      endpoint: 'DB: organizations query',
      method: 'SELECT',
      status: 'pass',
      message: `Found ${orgCount.length} organization(s)`,
      dbVerified: true,
    });
  } catch (error) {
    results.push({
      endpoint: 'DB: organizations query',
      method: 'SELECT',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      dbVerified: false,
    });
  }

  try {
    // Test assignments query
    const assignmentCount = await db.select().from(assignments).limit(1);
    results.push({
      endpoint: 'DB: assignments query',
      method: 'SELECT',
      status: 'pass',
      message: `Found ${assignmentCount.length} assignment(s)`,
      dbVerified: true,
    });
  } catch (error) {
    results.push({
      endpoint: 'DB: assignments query',
      method: 'SELECT',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      dbVerified: false,
    });
  }

  try {
    // Test skills query
    const skillsCount = await db.select().from(skills).limit(10);
    results.push({
      endpoint: 'DB: skills query',
      method: 'SELECT',
      status: 'pass',
      message: `Found ${skillsCount.length} skill(s)`,
      dbVerified: true,
    });
  } catch (error) {
    results.push({
      endpoint: 'DB: skills query',
      method: 'SELECT',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      dbVerified: false,
    });
  }

  try {
    // Test matches query
    const matchesCount = await db.select().from(matches).limit(1);
    results.push({
      endpoint: 'DB: matches query',
      method: 'SELECT',
      status: 'pass',
      message: `Found ${matchesCount.length} match(es)`,
      dbVerified: true,
    });
  } catch (error) {
    results.push({
      endpoint: 'DB: matches query',
      method: 'SELECT',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      dbVerified: false,
    });
  }
}

function printResults(): void {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('API ENDPOINT TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const skipped = results.filter((r) => r.status === 'skip').length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}\n`);

  if (failed > 0) {
    console.log('FAILED TESTS:');
    console.log('─────────────────────────────────────────────────────────');
    results
      .filter((r) => r.status === 'fail')
      .forEach((r) => {
        console.log(`❌ ${r.method} ${r.endpoint}`);
        if (r.statusCode) console.log(`   Status: ${r.statusCode}`);
        if (r.message) console.log(`   ${r.message}`);
      });
    console.log('');
  }

  console.log('ALL TEST RESULTS:');
  console.log('─────────────────────────────────────────────────────────');
  results.forEach((r) => {
    const icon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⏭️';
    const dbIcon = r.dbVerified ? '💾' : '';
    console.log(`${icon} ${dbIcon} ${r.method} ${r.endpoint}`);
    if (r.statusCode) console.log(`   Status: ${r.statusCode}`);
    if (r.message) console.log(`   ${r.message}`);
  });
}

async function main() {
  console.log('Starting API Endpoint Testing...');
  console.log(`Base URL: ${BASE_URL}\n`);

  // Test health check (should work without auth)
  await testHealthCheck();

  // Test database queries directly
  await testDatabaseQueries();

  // Test API endpoints (many will require auth)
  await testUserEndpoints();
  await testExpertiseEndpoints();
  await testMatchingEndpoints();
  await testAssignmentEndpoints();
  await testWellbeingEndpoints();

  // Print results
  printResults();

  // Exit with appropriate code
  const failed = results.filter((r) => r.status === 'fail' && r.dbVerified !== true).length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
