#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

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

const LANDING_ALLOWED_PREFIXES = [
  'e2e/landing-visual.spec.ts-snapshots/',
  'agent/scratchpad/entries/',
  'project/changes/entries/',
];

function run(command, { allowFailure = false } = {}) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    if (allowFailure) {
      return '';
    }
    throw error;
  }
}

function quote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function hasCommit(commitExpr) {
  return run(`git cat-file -e ${quote(commitExpr)} && echo ok`, { allowFailure: true }) === 'ok';
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

function parseLines(text) {
  return text ? text.split('\n').map((line) => line.trim()).filter(Boolean) : [];
}

function readPullRequestBaseFromEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) {
    return null;
  }

  try {
    const event = JSON.parse(readFileSync(eventPath, 'utf8'));
    const base = event?.pull_request?.base;
    if (!base?.sha) {
      return null;
    }
    return { sha: base.sha, ref: base.ref || process.env.GITHUB_BASE_REF || '' };
  } catch {
    return null;
  }
}

function ensureBaseCommitAvailable(baseSha, baseRef) {
  if (!baseSha) {
    return;
  }

  if (hasCommit(`${baseSha}^{commit}`)) {
    return;
  }

  if (baseRef) {
    run(`git fetch --no-tags --depth=200 origin ${quote(baseRef)}`, { allowFailure: true });
  }

  // Fallback to SHA fetch when shallow history still misses the base commit.
  run(`git fetch --no-tags --depth=1 origin ${quote(baseSha)}`, { allowFailure: true });

  if (!hasCommit(`${baseSha}^{commit}`)) {
    throw new Error(
      `Unable to locate base commit ${baseSha} for landing scope diff. ` +
        `Ensure checkout history is available in CI.`
    );
  }
}

function diffAgainstBase(baseSha) {
  const outTripleDot = run(`git diff --name-only ${quote(`${baseSha}...HEAD`)}`, {
    allowFailure: true,
  });
  if (outTripleDot) {
    return parseLines(outTripleDot);
  }

  const outDoubleDot = run(`git diff --name-only ${quote(`${baseSha}..HEAD`)}`, {
    allowFailure: true,
  });
  return parseLines(outDoubleDot);
}

function getChangedFiles() {
  // Primary CI path for pull_request events.
  const prBase = readPullRequestBaseFromEvent();
  if (prBase?.sha) {
    ensureBaseCommitAvailable(prBase.sha, prBase.ref);
    const changed = diffAgainstBase(prBase.sha);
    if (changed.length > 0) {
      return changed;
    }
  }

  // Secondary CI path when only base ref is available.
  const baseRef = process.env.GITHUB_BASE_REF;
  if (baseRef) {
    run(`git fetch --no-tags --depth=200 origin ${quote(baseRef)}`, { allowFailure: true });
    const out = run(`git diff --name-only ${quote(`origin/${baseRef}...HEAD`)}`, {
      allowFailure: true,
    });
    const changed = parseLines(out);
    if (changed.length > 0) {
      return changed;
    }
  }

  // Local fallback for manual runs.
  try {
    const out = run("git diff --name-only 'origin/master...HEAD'", { allowFailure: true });
    const changed = parseLines(out);
    if (changed.length > 0) {
      return changed;
    }
  } catch {
    // Ignore and continue to minimal fallback.
  }

  const out = run("git diff --name-only 'HEAD~1..HEAD'", { allowFailure: true });
  return parseLines(out);
}

function main() {
  const changed = getChangedFiles();
  const landingTouched = changed.some(isLandingSensitive);
  const mode = process.argv[2] || '';

  if (mode === '--print-landing-touched') {
    console.log(landingTouched ? 'true' : 'false');
    return;
  }

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
