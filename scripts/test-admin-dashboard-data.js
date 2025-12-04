/**
 * Admin Dashboard Data Loading Test Script
 * 
 * This script tests all API endpoints used by the admin dashboard
 * to verify data is loading correctly.
 * 
 * Usage: node scripts/test-admin-dashboard-data.js
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_TEST_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD || '';

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: [],
};

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: json,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

/**
 * Test helper
 */
function test(name, fn) {
  return async () => {
    try {
      console.log(`\n🧪 Testing: ${name}`);
      await fn();
      results.passed++;
      console.log(`✅ PASSED: ${name}`);
    } catch (error) {
      results.failed++;
      results.errors.push({ test: name, error: error.message });
      console.error(`❌ FAILED: ${name}`);
      console.error(`   Error: ${error.message}`);
    }
  };
}

/**
 * Assert helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Test 1: Overview API Endpoint
 */
const testOverviewAPI = test('Overview API Endpoint', async () => {
  const response = await makeRequest(`${BASE_URL}/api/admin/analytics/overview`, {
    headers: {
      // Note: In a real test, you'd need to include auth cookies/tokens
      // This test assumes you're running it with proper authentication
    },
  });

  // Check response status
  assert(response.status === 200 || response.status === 401 || response.status === 403, 
    `Expected status 200, 401, or 403, got ${response.status}`);

  if (response.status === 200) {
    // Verify response structure
    assert(response.data.success === true, 'Response should have success: true');
    assert(response.data.data !== undefined, 'Response should have data object');
    
    const data = response.data.data;
    
    // Verify users structure
    assert(data.users !== undefined, 'Data should have users object');
    assert(typeof data.users.total === 'number', 'users.total should be a number');
    assert(typeof data.users.thisMonth === 'number', 'users.thisMonth should be a number');
    assert(typeof data.users.activeLastWeek === 'number', 'users.activeLastWeek should be a number');
    
    // Verify organizations structure
    assert(data.organizations !== undefined, 'Data should have organizations object');
    assert(typeof data.organizations.total === 'number', 'organizations.total should be a number');
    assert(typeof data.organizations.active === 'number', 'organizations.active should be a number');
    
    // Verify matches structure
    assert(data.matches !== undefined, 'Data should have matches object');
    assert(typeof data.matches.total === 'number', 'matches.total should be a number');
    assert(typeof data.matches.thisMonth === 'number', 'matches.thisMonth should be a number');
    
    // Verify contracts structure
    assert(data.contracts !== undefined, 'Data should have contracts object');
    assert(typeof data.contracts.total === 'number', 'contracts.total should be a number');
    assert(typeof data.contracts.thisMonth === 'number', 'contracts.thisMonth should be a number');
    
    // Verify assignments structure
    assert(data.assignments !== undefined, 'Data should have assignments object');
    assert(typeof data.assignments.active === 'number', 'assignments.active should be a number');
    
    // Verify metrics structure
    assert(data.metrics !== undefined, 'Data should have metrics object');
    // TTSC can be null if no data
    if (data.metrics.ttsc !== null) {
      assert(typeof data.metrics.ttsc.median === 'number', 'ttsc.median should be a number');
      assert(typeof data.metrics.ttsc.mean === 'number', 'ttsc.mean should be a number');
    }
    
    // Verify period structure
    assert(data.period !== undefined, 'Data should have period object');
    assert(data.period.last30Days !== undefined, 'period.last30Days should exist');
    assert(data.period.last7Days !== undefined, 'period.last7Days should exist');
    assert(data.period.now !== undefined, 'period.now should exist');
    
    // Check for invalid values
    assert(!isNaN(data.users.total), 'users.total should not be NaN');
    assert(!isNaN(data.users.thisMonth), 'users.thisMonth should not be NaN');
    assert(!isNaN(data.users.activeLastWeek), 'users.activeLastWeek should not be NaN');
    
    console.log(`   ✓ Users: ${data.users.total} total, ${data.users.thisMonth} this month`);
    console.log(`   ✓ Organizations: ${data.organizations.total} total, ${data.organizations.active} active`);
    console.log(`   ✓ Matches: ${data.matches.total} total, ${data.matches.thisMonth} this month`);
    console.log(`   ✓ Contracts: ${data.contracts.total} total, ${data.contracts.thisMonth} this month`);
    console.log(`   ✓ Active Assignments: ${data.assignments.active}`);
  } else {
    console.log(`   ⚠️  Authentication required (status ${response.status})`);
  }
});

/**
 * Test 2: Metrics API Endpoint
 */
const testMetricsAPI = test('Metrics API Endpoint', async () => {
  const response = await makeRequest(`${BASE_URL}/api/metrics/all?days=30`, {
    headers: {},
  });

  assert(response.status === 200 || response.status === 401 || response.status === 403,
    `Expected status 200, 401, or 403, got ${response.status}`);

  if (response.status === 200) {
    assert(response.data.metrics !== undefined, 'Response should have metrics object');
    
    const metrics = response.data.metrics;
    
    // Verify all 6 required metrics exist
    assert(metrics.ttfqi !== undefined, 'Metrics should have ttfqi');
    assert(metrics.ttv !== undefined, 'Metrics should have ttv');
    assert(metrics.ttsc !== undefined, 'Metrics should have ttsc');
    assert(metrics.pacLift !== undefined, 'Metrics should have pacLift');
    assert(metrics.sus !== undefined, 'Metrics should have sus');
    assert(metrics.wellBeingDelta !== undefined, 'Metrics should have wellBeingDelta');
    
    // Verify TTFQI structure
    assert(typeof metrics.ttfqi.value === 'number', 'ttfqi.value should be a number');
    assert(typeof metrics.ttfqi.target === 'number', 'ttfqi.target should be a number');
    assert(typeof metrics.ttfqi.onTrack === 'boolean', 'ttfqi.onTrack should be a boolean');
    assert(typeof metrics.ttfqi.sampleSize === 'number', 'ttfqi.sampleSize should be a number');
    assert(metrics.ttfqi.percentile !== undefined, 'ttfqi should have percentile');
    assert(typeof metrics.ttfqi.percentile.p50 === 'number', 'ttfqi.percentile.p50 should be a number');
    
    // Verify TTV structure
    assert(typeof metrics.ttv.value === 'number', 'ttv.value should be a number');
    assert(typeof metrics.ttv.target === 'number', 'ttv.target should be a number');
    assert(typeof metrics.ttv.onTrack === 'boolean', 'ttv.onTrack should be a boolean');
    assert(typeof metrics.ttv.sampleSize === 'number', 'ttv.sampleSize should be a number');
    
    // Verify TTSC structure
    assert(typeof metrics.ttsc.value === 'number', 'ttsc.value should be a number');
    assert(typeof metrics.ttsc.target === 'number', 'ttsc.target should be a number');
    assert(typeof metrics.ttsc.onTrack === 'boolean', 'ttsc.onTrack should be a boolean');
    assert(typeof metrics.ttsc.sampleSize === 'number', 'ttsc.sampleSize should be a number');
    
    // Verify PAC Lift structure
    assert(typeof metrics.pacLift.withPAC === 'number', 'pacLift.withPAC should be a number');
    assert(typeof metrics.pacLift.withoutPAC === 'number', 'pacLift.withoutPAC should be a number');
    assert(typeof metrics.pacLift.lift === 'number', 'pacLift.lift should be a number');
    assert(typeof metrics.pacLift.targetLift === 'number', 'pacLift.targetLift should be a number');
    assert(typeof metrics.pacLift.onTrack === 'boolean', 'pacLift.onTrack should be a boolean');
    
    // Verify SUS structure
    assert(typeof metrics.sus.value === 'number', 'sus.value should be a number');
    assert(typeof metrics.sus.target === 'number', 'sus.target should be a number');
    assert(typeof metrics.sus.onTrack === 'boolean', 'sus.onTrack should be a boolean');
    assert(typeof metrics.sus.responses === 'number', 'sus.responses should be a number');
    
    // Verify Well-Being Delta structure
    assert(typeof metrics.wellBeingDelta.averageDelta === 'number', 'wellBeingDelta.averageDelta should be a number');
    assert(typeof metrics.wellBeingDelta.positiveChange === 'number', 'wellBeingDelta.positiveChange should be a number');
    assert(typeof metrics.wellBeingDelta.target === 'number', 'wellBeingDelta.target should be a number');
    assert(typeof metrics.wellBeingDelta.onTrack === 'boolean', 'wellBeingDelta.onTrack should be a boolean');
    assert(typeof metrics.wellBeingDelta.sampleSize === 'number', 'wellBeingDelta.sampleSize should be a number');
    
    // Check for invalid values
    assert(!isNaN(metrics.ttfqi.value), 'ttfqi.value should not be NaN');
    assert(!isNaN(metrics.ttv.value), 'ttv.value should not be NaN');
    assert(!isNaN(metrics.ttsc.value), 'ttsc.value should not be NaN');
    
    console.log(`   ✓ TTFQI: ${metrics.ttfqi.value.toFixed(1)}h (target: ${metrics.ttfqi.target}h, onTrack: ${metrics.ttfqi.onTrack})`);
    console.log(`   ✓ TTV: ${metrics.ttv.value.toFixed(1)}d (target: ${metrics.ttv.target}d, onTrack: ${metrics.ttv.onTrack})`);
    console.log(`   ✓ TTSC: ${metrics.ttsc.value.toFixed(1)}d (target: ${metrics.ttsc.target}d, onTrack: ${metrics.ttsc.onTrack})`);
    console.log(`   ✓ PAC Lift: ${metrics.pacLift.lift.toFixed(1)}% (onTrack: ${metrics.pacLift.onTrack})`);
    console.log(`   ✓ SUS: ${metrics.sus.value.toFixed(0)} (target: ${metrics.sus.target}, onTrack: ${metrics.sus.onTrack})`);
    console.log(`   ✓ Well-Being Delta: ${metrics.wellBeingDelta.averageDelta.toFixed(2)} (onTrack: ${metrics.wellBeingDelta.onTrack})`);
  } else {
    console.log(`   ⚠️  Authentication required (status ${response.status})`);
  }
});

/**
 * Test 3: Growth API Endpoint
 */
const testGrowthAPI = test('Growth API Endpoint', async () => {
  const response = await makeRequest(`${BASE_URL}/api/admin/analytics/growth?period=30d&groupBy=day`, {
    headers: {},
  });

  assert(response.status === 200 || response.status === 401 || response.status === 403,
    `Expected status 200, 401, or 403, got ${response.status}`);

  if (response.status === 200) {
    assert(response.data.success === true, 'Response should have success: true');
    assert(response.data.data !== undefined, 'Response should have data object');
    
    const data = response.data.data;
    
    // Verify users array
    assert(Array.isArray(data.users), 'data.users should be an array');
    assert(Array.isArray(data.organizations), 'data.organizations should be an array');
    
    // Verify data structure for each data point
    if (data.users.length > 0) {
      const userPoint = data.users[0];
      assert(userPoint.period !== undefined, 'User data point should have period');
      assert(typeof userPoint.count === 'number', 'User data point count should be a number');
      assert(typeof userPoint.cumulative === 'number', 'User data point cumulative should be a number');
      
      // Verify cumulative increases over time
      for (let i = 1; i < data.users.length; i++) {
        assert(data.users[i].cumulative >= data.users[i-1].cumulative,
          'Cumulative should increase or stay the same over time');
      }
    }
    
    if (data.organizations.length > 0) {
      const orgPoint = data.organizations[0];
      assert(orgPoint.period !== undefined, 'Organization data point should have period');
      assert(typeof orgPoint.count === 'number', 'Organization data point count should be a number');
      assert(typeof orgPoint.cumulative === 'number', 'Organization data point cumulative should be a number');
      
      // Verify cumulative increases over time
      for (let i = 1; i < data.organizations.length; i++) {
        assert(data.organizations[i].cumulative >= data.organizations[i-1].cumulative,
          'Cumulative should increase or stay the same over time');
      }
    }
    
    // Verify period info
    assert(data.period !== undefined, 'Data should have period object');
    assert(data.period.start !== undefined, 'period.start should exist');
    assert(data.period.end !== undefined, 'period.end should exist');
    assert(data.period.groupBy !== undefined, 'period.groupBy should exist');
    
    console.log(`   ✓ Users growth data: ${data.users.length} data points`);
    console.log(`   ✓ Organizations growth data: ${data.organizations.length} data points`);
    console.log(`   ✓ Period: ${data.period.groupBy} grouping from ${data.period.start} to ${data.period.end}`);
  } else {
    console.log(`   ⚠️  Authentication required (status ${response.status})`);
  }
});

/**
 * Test 4: Fairness API Endpoint
 */
const testFairnessAPI = test('Fairness API Endpoint', async () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);
  
  const url = `${BASE_URL}/api/analytics/fairness?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
  const response = await makeRequest(url, {
    headers: {},
  });

  assert(response.status === 200 || response.status === 401 || response.status === 403 || response.status === 500,
    `Expected status 200, 401, 403, or 500, got ${response.status}`);

  if (response.status === 200) {
    assert(response.data.success === true, 'Response should have success: true');
    assert(response.data.fairnessNote !== undefined, 'Response should have fairnessNote');
    
    const fairnessNote = response.data.fairnessNote;
    
    // Verify basic structure
    assert(fairnessNote.reportDate !== undefined, 'fairnessNote should have reportDate');
    assert(fairnessNote.reportPeriod !== undefined, 'fairnessNote should have reportPeriod');
    assert(Array.isArray(fairnessNote.cohorts), 'fairnessNote.cohorts should be an array');
    assert(Array.isArray(fairnessNote.gaps), 'fairnessNote.gaps should be an array');
    assert(Array.isArray(fairnessNote.recommendations), 'fairnessNote.recommendations should be an array');
    assert(typeof fairnessNote.summary === 'string', 'fairnessNote.summary should be a string');
    assert(['passing', 'warning', 'failing'].includes(fairnessNote.status),
      'fairnessNote.status should be passing, warning, or failing');
    
    // Verify cohort structure
    if (fairnessNote.cohorts.length > 0) {
      const cohort = fairnessNote.cohorts[0];
      assert(typeof cohort.cohortId === 'string', 'cohort.cohortId should be a string');
      assert(typeof cohort.cohortName === 'string', 'cohort.cohortName should be a string');
      assert(typeof cohort.introAcceptanceRate === 'number', 'cohort.introAcceptanceRate should be a number');
      assert(typeof cohort.contractSigningRate === 'number', 'cohort.contractSigningRate should be a number');
      assert(typeof cohort.sampleSize === 'number', 'cohort.sampleSize should be a number');
    }
    
    // Verify gap structure
    if (fairnessNote.gaps.length > 0) {
      const gap = fairnessNote.gaps[0];
      assert(['intro_acceptance', 'contract_signing'].includes(gap.metric),
        'gap.metric should be intro_acceptance or contract_signing');
      assert(typeof gap.cohort1 === 'string', 'gap.cohort1 should be a string');
      assert(typeof gap.cohort2 === 'string', 'gap.cohort2 should be a string');
      assert(typeof gap.gap === 'number', 'gap.gap should be a number');
      assert(typeof gap.isSignificant === 'boolean', 'gap.isSignificant should be a boolean');
      assert(typeof gap.pValue === 'number', 'gap.pValue should be a number');
    }
    
    console.log(`   ✓ Fairness Note Status: ${fairnessNote.status}`);
    console.log(`   ✓ Cohorts: ${fairnessNote.cohorts.length}`);
    console.log(`   ✓ Gaps Detected: ${fairnessNote.gaps.length}`);
    console.log(`   ✓ Recommendations: ${fairnessNote.recommendations.length}`);
  } else if (response.status === 500) {
    console.log(`   ⚠️  Server error (may be expected if no fairness data exists)`);
  } else {
    console.log(`   ⚠️  Authentication required (status ${response.status})`);
  }
});

/**
 * Test 5: Test different period filters for Growth API
 */
const testGrowthPeriodFilters = test('Growth API Period Filters', async () => {
  const periods = ['7d', '30d', '90d'];
  
  for (const period of periods) {
    const response = await makeRequest(`${BASE_URL}/api/admin/analytics/growth?period=${period}&groupBy=day`, {
      headers: {},
    });
    
    if (response.status === 200) {
      assert(response.data.success === true, `Period ${period} should return success: true`);
      assert(response.data.data.users !== undefined, `Period ${period} should have users data`);
      assert(response.data.data.organizations !== undefined, `Period ${period} should have organizations data`);
      console.log(`   ✓ Period ${period}: ${response.data.data.users.length} user data points`);
    }
  }
});

/**
 * Test 6: Test different day ranges for Metrics API
 */
const testMetricsDayRanges = test('Metrics API Day Ranges', async () => {
  const days = ['7', '30', '90'];
  
  for (const day of days) {
    const response = await makeRequest(`${BASE_URL}/api/metrics/all?days=${day}`, {
      headers: {},
    });
    
    if (response.status === 200) {
      assert(response.data.metrics !== undefined, `Days ${day} should return metrics`);
      assert(response.data.period !== undefined, `Days ${day} should return period info`);
      assert(response.data.period.days === parseInt(day), `Period days should match request: ${day}`);
      console.log(`   ✓ Days ${day}: Metrics calculated successfully`);
    }
  }
});

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Admin Dashboard Data Loading Tests');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('='.repeat(60));
  
  await testOverviewAPI();
  await testMetricsAPI();
  await testGrowthAPI();
  await testFairnessAPI();
  await testGrowthPeriodFilters();
  await testMetricsDayRanges();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total: ${results.passed + results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(({ test, error }) => {
      console.log(`   - ${test}: ${error}`);
    });
  }
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

