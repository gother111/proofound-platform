#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const packageDir = path.join(root, '.artifacts', 'project-source-refresh-2026-05-14');
const workspace = path.join(packageDir, `api-reference-generation-workspace-${Date.now()}`);
const technicalDir = path.join(packageDir, 'CURRENT_TECHNICAL_REFERENCES');

await fs.mkdir(path.join(workspace, 'src', 'app'), { recursive: true });
await fs.mkdir(path.join(workspace, 'scripts'), { recursive: true });
await fs.mkdir(path.join(workspace, 'docs'), { recursive: true });

await fs.cp(path.join(root, 'src', 'app', 'api'), path.join(workspace, 'src', 'app', 'api'), {
  recursive: true,
});
await fs.copyFile(
  path.join(root, 'scripts', 'generate-api-reference.mjs'),
  path.join(workspace, 'scripts', 'generate-api-reference.mjs')
);

const run = spawnSync('node', ['scripts/generate-api-reference.mjs'], {
  cwd: workspace,
  encoding: 'utf8',
  env: process.env,
});

process.stdout.write(run.stdout ?? '');
process.stderr.write(run.stderr ?? '');

await fs.mkdir(technicalDir, { recursive: true });
await fs.copyFile(
  path.join(workspace, 'docs', 'API_REFERENCE.md'),
  path.join(technicalDir, 'API_REFERENCE.regenerated.md')
);

if (run.status !== 0) {
  process.exit(run.status ?? 1);
}
