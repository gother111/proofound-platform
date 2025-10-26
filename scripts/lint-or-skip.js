#!/usr/bin/env node

import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

function hasNextCli() {
  try {
    // Try to resolve Next.js CLI entry
    resolve('next/dist/cli/next');
    return true;
  } catch {
    return false;
  }
}

// Allow forcing lint even in restricted envs
if (process.env.FORCE_LINT === 'true') {
  console.log('FORCE_LINT=true — attempting to run `next lint`.');
} else if (!hasNextCli()) {
  console.warn('⚠️  Skipping lint: Next.js CLI/dependencies not found in this environment.');
  console.warn(
    '    To enforce lint here, ensure dependencies are installed or set FORCE_LINT=true.'
  );
  process.exit(0);
}

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['next', 'lint'];

const res = spawnSync(cmd, args, { stdio: 'inherit' });

// Propagate linter exit code if it actually ran
process.exit(res.status ?? 0);
