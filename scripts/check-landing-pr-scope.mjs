#!/usr/bin/env node

import { execSync } from 'node:child_process';

const LANDING_SENSITIVE_EXACT = new Set([
  'src/app/page.tsx',
  'src/app/globals.css',
  'src/app/layout.tsx',
  'src/components/ProofoundLanding.tsx',
]);

const LANDING_SENSITIVE_PREFIXES = ['src/components/landing/'];

const LANDING_ALLOWED_EXACT = new Set([
  'e2e/landing-page.spec.ts',
  'e2e/landing-visual.spec.ts',
  'project/Documentation.md',
  'agent/scratchpad.md',
]);

const LANDING_ALLOWED_PREFIXES = ['e2e/landing-visual.spec.ts-snapshots/'];

function run(command) {
  return execSync(command, { encoding: 'utf8' }).trim();
}

function isLandingSensitive(path) {
  return (
    LANDING_SENSITIVE_EXACT.has(path) ||
    LANDING_SENSITIVE_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

function isAllowedInLandingPR(path) {
  return (
    isLandingSensitive(path) ||
    LANDING_ALLOWED_EXACT.has(path) ||
    LANDING_ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

function getChangedFiles() {
  const baseRef = process.env.GITHUB_BASE_REF;

  if (baseRef) {
    // Ensure base branch ref exists in shallow CI checkouts.
    run(`git fetch --no-tags --depth=50 origin ${baseRef}`);
    const mergeBase = run(`git merge-base origin/${baseRef} HEAD`);
    const out = run(`git diff --name-only ${mergeBase}..HEAD`);
    return out ? out.split('\n').filter(Boolean) : [];
  }

  // Local fallback for manual runs.
  let mergeBase = '';
  try {
    mergeBase = run('git merge-base origin/master HEAD');
  } catch {
    mergeBase = run('git rev-parse HEAD~1');
  }

  const out = run(`git diff --name-only ${mergeBase}..HEAD`);
  return out ? out.split('\n').filter(Boolean) : [];
}

function main() {
  const changed = getChangedFiles();
  const landingTouched = changed.some(isLandingSensitive);

  if (!landingTouched) {
    console.log('Landing scope check: pass (no landing-sensitive files changed).');
    return;
  }

  const disallowed = changed.filter((file) => !isAllowedInLandingPR(file));

  if (disallowed.length > 0) {
    console.error('Landing scope check: fail.');
    console.error('Landing-sensitive files were changed together with disallowed files.');
    console.error(
      'Landing changes must be isolated in a dedicated landing PR (plus landing tests/snapshots/docs logs only).'
    );
    console.error('\nDisallowed files:');
    disallowed.forEach((file) => console.error(`- ${file}`));
    process.exit(1);
  }

  console.log(
    'Landing scope check: pass (landing-sensitive changes are isolated to allowed landing files/tests/docs).'
  );
}

main();
