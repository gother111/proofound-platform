#!/usr/bin/env node

const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

const repoRoot = process.cwd();
const nextCli = path.join(repoRoot, 'node_modules', 'next', 'dist', 'bin', 'next');

if (!existsSync(nextCli)) {
  const lockfileExists = existsSync(path.join(repoRoot, 'package-lock.json'));
  const guidance = [
    'The Next.js CLI could not be found. This usually means dependencies are not installed.',
    'Run `npm install` from the repository root to download dependencies before running lint.',
  ];

  if (lockfileExists) {
    guidance.push(
      'If `npm install` fails with 403 errors from registry.npmjs.org, you need to provide credentials '
        + 'for the protected packages or run the install from an environment that can reach your npm registry.'
    );
  }

  guidance.push('Once dependencies are installed, retry `npm run lint`.');

  console.error(guidance.join('\n'));
  process.exit(1);
}

const lint = spawn('node', [nextCli, 'lint'], { stdio: 'inherit' });
lint.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
    return;
  }
  process.exit(code ?? 1);
});
