#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (!existsSync('.git')) {
  console.log('Skipping husky install: .git directory not found.');
  process.exit(0);
}

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(cmd, ['husky', 'install'], { stdio: 'inherit' });

process.exit(result.status ?? 0);
