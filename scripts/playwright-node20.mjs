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

const REQUIRED_MAJOR = 20;
const currentMajor = Number.parseInt(process.versions.node.split('.')[0] || '0', 10);
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
if (currentMajor < REQUIRED_MAJOR && process.env.PROOFOUND_PLAYWRIGHT_NODE20_REEXEC !== '1') {
  const node20Path = process.env.PROOFOUND_NODE20_PATH || '/opt/homebrew/opt/node@20/bin/node';
  const env = { ...process.env, PROOFOUND_PLAYWRIGHT_NODE20_REEXEC: '1' };
  run(node20Path, [scriptPath, ...argv], env);
} else {
  const playwrightCli = path.join(process.cwd(), 'node_modules', '@playwright', 'test', 'cli.js');
  run(process.execPath, [playwrightCli, ...argv], process.env);
}

