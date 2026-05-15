#!/usr/bin/env node
/**
 * Run Playwright using Node 24.
 *
 * Why: local shells may still default to older or newer Node versions, but this repo targets Node 24 LTS.
 * This script re-execs itself with `/opt/homebrew/opt/node@24/bin/node` when needed.
 */

import { spawn } from 'child_process';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

// Keep in sync with package.json engines and .nvmrc intent:
// - require Node 24.x
const REQUIRED_MAJOR = 24;

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
  return major === REQUIRED_MAJOR && Number.isFinite(minor) && Number.isFinite(patch);
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

// Use a dedicated flag to avoid interfering with other Node 24 wrapper scripts.
if (!isSupportedNode(process.versions.node) && process.env.PROOFOUND_PLAYWRIGHT_NODE24_REEXEC !== '1') {
  const node24Path = process.env.PROOFOUND_NODE24_PATH || '/opt/homebrew/opt/node@24/bin/node';
  const env = { ...process.env, PROOFOUND_PLAYWRIGHT_NODE24_REEXEC: '1' };
  run(node24Path, [scriptPath, ...argv], env);
} else {
  const playwrightCli = path.join(process.cwd(), 'node_modules', '@playwright', 'test', 'cli.js');
  run(process.execPath, [playwrightCli, ...argv], process.env);
}
