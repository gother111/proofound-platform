#!/usr/bin/env node
/**
 * Run Playwright using Node 20+.
 *
 * Why: local shells may still default to Node 16, but Playwright requires Node 18+ and this repo targets Node 20.
 * This script re-execs itself with `/opt/homebrew/opt/node@20/bin/node` when needed.
 */

import { spawn } from 'child_process';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

// Keep in sync with package.json engines and .nvmrc intent:
// - require >= 20.20.0
// - require < 21 (avoid Node 21+ incompatibilities)
const REQUIRED_MAJOR = 20;
const REQUIRED_MINOR = 20;
const REQUIRED_PATCH = 0;

function parseVersion(version) {
  const [major, minor, patch] = String(version).split('.').map((part) => Number.parseInt(part, 10));
  return {
    major: Number.isFinite(major) ? major : 0,
    minor: Number.isFinite(minor) ? minor : 0,
    patch: Number.isFinite(patch) ? patch : 0,
  };
}

function isSupportedNode(version) {
  const { major, minor, patch } = parseVersion(version);
  if (major !== REQUIRED_MAJOR) return false;
  if (minor > REQUIRED_MINOR) return true;
  if (minor < REQUIRED_MINOR) return false;
  return patch >= REQUIRED_PATCH;
}

const argv = process.argv.slice(2);

const scriptPath = fileURLToPath(import.meta.url);

function run(cmd, args, env) {
  const child = spawn(cmd, args, { stdio: 'inherit', env });
  child.on('exit', (code, signal) => {
    if (typeof code === 'number') process.exit(code);
    process.exit(signal ? 1 : 0);
  });
  child.on('error', (err) => {
    console.error(err);
    process.exit(1);
  });
}

// Use a dedicated flag to avoid interfering with other Node20 wrapper scripts (e.g. next-dev-node20.mjs).
if (!isSupportedNode(process.versions.node) && process.env.PROOFOUND_PLAYWRIGHT_NODE20_REEXEC !== '1') {
  const node20Path = process.env.PROOFOUND_NODE20_PATH || '/opt/homebrew/opt/node@20/bin/node';
  const env = { ...process.env, PROOFOUND_PLAYWRIGHT_NODE20_REEXEC: '1' };
  run(node20Path, [scriptPath, ...argv], env);
} else {
  const playwrightCli = path.join(process.cwd(), 'node_modules', '@playwright', 'test', 'cli.js');
  run(process.execPath, [playwrightCli, ...argv], process.env);
}
