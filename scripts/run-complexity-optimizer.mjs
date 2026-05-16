#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const codexHome = process.env.CODEX_HOME || path.join(homedir(), '.codex');
const scannerPath = path.join(
  codexHome,
  'skills',
  'complexity-optimizer',
  'scripts',
  'analyze_complexity.py'
);

if (!existsSync(scannerPath)) {
  console.error(`Missing complexity optimizer scanner: ${scannerPath}`);
  console.error('Install the skill first:');
  console.error(
    '  python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo Kappaemme-git/codex-complexity-optimizer --path complexity-optimizer'
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const forwardedArgs = [];
let root = path.join(repoRoot, 'src');

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--root') {
    const value = args[index + 1];
    if (!value) {
      console.error('Expected a path after --root.');
      process.exit(1);
    }
    root = path.resolve(repoRoot, value);
    index += 1;
    continue;
  }
  forwardedArgs.push(arg);
}

const generatedExcludes = [
  '.artifacts',
  'artifacts',
  '.pytest_cache',
  '.vercel',
  'output',
  'playwright-report',
  'test-results',
];

const dynamicExcludes = readdirSync(repoRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => name.startsWith('.next-dev-') || /^\.venv\d+$/.test(name));

const excludeArgs = [...generatedExcludes, ...dynamicExcludes].flatMap((name) => [
  '--exclude',
  name,
]);

const result = spawnSync(
  'python3',
  [scannerPath, root, '--format', 'markdown', ...excludeArgs, ...forwardedArgs],
  {
    cwd: repoRoot,
    stdio: 'inherit',
  }
);

process.exit(result.status ?? 1);
