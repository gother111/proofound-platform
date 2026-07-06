#!/usr/bin/env node

import { checkDeploymentQuota } from './lib/vercel-deploy-quota-check.mjs';

function outputValue(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\r?\n/g, ' ');
}

function printGitHubOutputs(result) {
  console.log(`available=${result.available ? 'true' : 'false'}`);
  console.log(`reason=${outputValue(result.reason)}`);
  console.log(`count=${outputValue(result.count)}`);
  console.log(`oldest_created_at=${outputValue(result.oldestCreatedAt)}`);
}

try {
  const result = await checkDeploymentQuota();
  printGitHubOutputs(result);

  if (!result.available) {
    console.error(
      `[vercel-deploy-quota-check] daily deployment quota appears exhausted (${result.count} deployments in the current window).`
    );
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[vercel-deploy-quota-check] ${message}`);
  printGitHubOutputs({
    available: true,
    reason: 'quota-check-unavailable',
    count: 0,
    oldestCreatedAt: null,
  });
}
