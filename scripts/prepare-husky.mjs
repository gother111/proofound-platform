#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function isInsideGitWorkTree() {
  const result = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
    stdio: 'pipe',
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    return false;
  }

  return result.stdout.trim() === 'true';
}

if (!existsSync('.git') || !isInsideGitWorkTree()) {
  console.log('Skipping husky install: not a valid git worktree.');
  process.exit(0);
}

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(cmd, ['husky', 'install'], { stdio: 'inherit' });

process.exit(result.status ?? 0);
