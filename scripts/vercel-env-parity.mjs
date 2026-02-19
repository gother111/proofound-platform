#!/usr/bin/env node

/**
 * Vercel env parity helper.
 *
 * Default behavior:
 * - Compare canonical project env against the legacy/decommissioned project `proofound`.
 * - If that project no longer exists, fall back to running `vercel-preflight` without comparison.
 *
 * Override:
 * - Pass `--compare-project <name>` or set `VERCEL_ENV_PARITY_PROJECT`.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';

const args = process.argv.slice(2);

function hasFlag(flag) {
  return args.includes(flag);
}

function readFlagValue(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

function runPreflight(extraArgs) {
  const scriptPath = path.join(process.cwd(), 'scripts', 'vercel-preflight.mjs');
  const result = spawnSync(process.execPath, [scriptPath, ...extraArgs], {
    env: process.env,
    encoding: 'utf8',
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  return { status: typeof result.status === 'number' ? result.status : 1, stderr: result.stderr || '' };
}

const explicitCompareProject = readFlagValue('--compare-project') ?? process.env.VERCEL_ENV_PARITY_PROJECT ?? null;
const defaultCompareProject = 'proofound';

const compareProject = explicitCompareProject ?? defaultCompareProject;
const compareWasImplicit = explicitCompareProject == null;

const preflightArgs = hasFlag('--compare-project')
  ? args
  : ['--compare-project', compareProject, ...args];

const first = runPreflight(preflightArgs);
if (first.status === 0) {
  process.exit(0);
}

const notFound =
  first.stderr.includes('was not found in Vercel account scope') ||
  first.stderr.includes('was not found');

if (compareWasImplicit && notFound) {
  console.warn(
    `\nEnv parity compare project "${compareProject}" not found. Falling back to canonical preflight only.`
  );
  const fallback = runPreflight([]);
  process.exit(fallback.status);
}

process.exit(first.status);

