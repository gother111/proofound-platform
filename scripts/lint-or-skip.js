#!/usr/bin/env node

import { spawnSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function hasDependency(modulePath) {
  try {
    require.resolve(modulePath);
    return true;
  } catch {
    return false;
  }
}

// Allow forcing lint even in restricted envs
if (process.env.FORCE_LINT === 'true') {
  console.log('FORCE_LINT=true - attempting to run eslint.');
} else if (!hasDependency('eslint/package.json')) {
  console.warn('Skipping lint: eslint is not installed in this environment.');
  console.warn('To enforce lint here, ensure dependencies are installed or set FORCE_LINT=true.');
  process.exit(0);
}

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['eslint', '.', '--ext', '.js,.jsx,.ts,.tsx'];

const res = spawnSync(cmd, args, { stdio: 'inherit' });

// Propagate linter exit code if it actually ran
process.exit(res.status ?? 0);
