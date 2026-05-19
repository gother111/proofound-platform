/**
 * Admin Launch Ops Data Probe
 *
 * This script checks only the active admin/internal-ops launch corridor against
 * a running local or target app. It does not validate retired broad admin
 * analytics, user-management, organization-management, or fairness dashboards.
 *
 * Usage: NEXT_PUBLIC_APP_URL=http://localhost:3000 node scripts/test-admin-dashboard-data.js
 */

import http from 'node:http';
import https from 'node:https';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const results = {
  passed: 0,
  failed: 0,
  errors: [],
};

const routeChecks = [
  {
    name: 'Internal ops queues',
    path: '/api/admin/internal-ops/queues',
    validateJson: (body) => {
      if (!Array.isArray(body.queues)) {
        throw new Error('Expected response body to include a queues array.');
      }

      const queueIds = body.queues.map((queue) => queue.id).sort();
      const expectedIds = [
        'correction_revocation',
        'pilot_ops',
        'privacy_reveal_exception',
        'verification',
      ];

      for (const expectedId of expectedIds) {
        if (!queueIds.includes(expectedId)) {
          throw new Error(`Missing expected queue: ${expectedId}`);
        }
      }
    },
  },
  {
    name: 'Admin audit log',
    path: '/api/admin/audit?page=1&limit=20&search=',
    validateJson: (body) => {
      if (!Array.isArray(body.logs)) {
        throw new Error('Expected response body to include a logs array.');
      }
    },
  },
];

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          Accept: 'application/json',
          ...options.headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data ? JSON.parse(data) : {},
            });
          } catch {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data,
            });
          }
        });
      }
    );

    req.on('error', reject);
    req.end();
  });
}

async function runCheck({ name, path, validateJson }) {
  const response = await makeRequest(`${BASE_URL}${path}`);

  if ([401, 403].includes(response.status)) {
    console.log(`PASS ${name}: protected (${response.status})`);
    results.passed += 1;
    return;
  }

  if (response.status !== 200) {
    throw new Error(`Expected status 200, 401, or 403; got ${response.status}.`);
  }

  validateJson(response.data);
  console.log(`PASS ${name}: returned launch-safe JSON.`);
  results.passed += 1;
}

async function main() {
  console.log('Starting Admin Launch Ops Data Probe');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('Expected active routes: /admin, /admin/verification, /admin/audit');

  for (const routeCheck of routeChecks) {
    try {
      await runCheck(routeCheck);
    } catch (error) {
      results.failed += 1;
      results.errors.push({ test: routeCheck.name, error: error.message });
      console.error(`FAIL ${routeCheck.name}: ${error.message}`);
    }
  }

  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    for (const { test, error } of results.errors) {
      console.log(`- ${test}: ${error}`);
    }
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error running admin launch ops data probe:', error);
  process.exit(1);
});
