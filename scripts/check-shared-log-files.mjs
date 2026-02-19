#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

const SHARED_LOG_FILES = new Set(['agent/scratchpad.md', 'project/Documentation.md']);

const DOCS_GOVERNANCE_ALLOWED_EXACT = new Set([
  '.gitattributes',
  'AGENTS.md',
  '.github/workflows/ci.yml',
  'package.json',
  'package-lock.json',
  'agent/scratchpad.md',
  'project/Documentation.md',
  'agent/scratchpad/README.md',
  'project/changes/README.md',
  'scripts/new-session-log.mjs',
  'scripts/check-shared-log-files.mjs',
  'scripts/docs-freshness-check.mjs',
  'scripts/check-landing-pr-scope.mjs',
  'agent/checklists/preflight.md',
  'agent/checklists/verification.md',
  'project/Implement.md',
  'docs/DOCS_REGISTRY.md',
]);

const DOCS_GOVERNANCE_ALLOWED_PREFIXES = [
  'agent/scratchpad/entries/',
  'project/changes/entries/',
  'docs/',
  'project/',
  'agent/',
  'scripts/',
  '.github/workflows/',
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

function parseLines(text) {
  return text ? text.split('\n').map((line) => line.trim()).filter(Boolean) : [];
}

function isRootMarkdown(path) {
  return !path.includes('/') && path.endsWith('.md');
}

function isDocsGovernanceAllowed(path) {
  if (DOCS_GOVERNANCE_ALLOWED_EXACT.has(path)) {
    return true;
  }

  if (DOCS_GOVERNANCE_ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return true;
  }

  return isRootMarkdown(path);
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

  run(`git fetch --no-tags --depth=1 origin ${quote(baseSha)}`, { allowFailure: true });

  if (!hasCommit(`${baseSha}^{commit}`)) {
    throw new Error(`Unable to locate base commit ${baseSha} for shared-log scope diff.`);
  }
}

function diffAgainstBase(baseSha) {
  const outTripleDot = run(`git diff --name-only ${quote(`${baseSha}...HEAD`)}`, { allowFailure: true });
  if (outTripleDot) {
    return parseLines(outTripleDot);
  }

  const outDoubleDot = run(`git diff --name-only ${quote(`${baseSha}..HEAD`)}`, { allowFailure: true });
  return parseLines(outDoubleDot);
}

function getChangedFiles() {
  const prBase = readPullRequestBaseFromEvent();
  if (prBase?.sha) {
    ensureBaseCommitAvailable(prBase.sha, prBase.ref);
    const changed = diffAgainstBase(prBase.sha);
    if (changed.length > 0) {
      return changed;
    }
  }

  const baseRef = process.env.GITHUB_BASE_REF;
  if (baseRef) {
    run(`git fetch --no-tags --depth=200 origin ${quote(baseRef)}`, { allowFailure: true });
    const out = run(`git diff --name-only ${quote(`origin/${baseRef}...HEAD`)}`, { allowFailure: true });
    const changed = parseLines(out);
    if (changed.length > 0) {
      return changed;
    }
  }

  const againstMaster = run("git diff --name-only 'origin/master...HEAD'", { allowFailure: true });
  const changedAgainstMaster = parseLines(againstMaster);
  if (changedAgainstMaster.length > 0) {
    return changedAgainstMaster;
  }

  return parseLines(run("git diff --name-only 'HEAD~1..HEAD'", { allowFailure: true }));
}

function main() {
  const changed = getChangedFiles();
  const sharedTouched = changed.some((file) => SHARED_LOG_FILES.has(file));

  if (process.argv[2] === '--print-shared-log-touched') {
    console.log(sharedTouched ? 'true' : 'false');
    return;
  }

  if (!sharedTouched) {
    console.log('Shared log scope check: pass (no shared legacy log files changed).');
    return;
  }

  const disallowed = changed.filter((file) => !isDocsGovernanceAllowed(file));

  if (disallowed.length > 0) {
    console.error('Shared log scope check: fail.');
    console.error('Legacy shared log files were changed together with non-governance files.');
    console.error('Use sharded entry files instead of modifying shared files in feature PRs.');
    console.error('\nDisallowed files:');
    disallowed.forEach((file) => console.error(`- ${file}`));
    process.exit(1);
  }

  console.log('Shared log scope check: pass (legacy shared log files changed only with governance/docs/tooling files).');
}

main();
