#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { LAUNCH_SMOKE_MATRIX } from '../src/lib/launch/contracts';
import { aggregateLaunchSmokeStatus } from '../src/lib/launch/smoke-artifact';

function readArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function command(name: string) {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}

async function main() {
  const artifactPath =
    readArg('--artifact') ??
    process.env.LAUNCH_SMOKE_ARTIFACT_PATH ??
    '.artifacts/launch-smoke-report.json';
  const reporter = process.env.LAUNCH_SMOKE_REPORTER ?? 'basic';
  const checks = [];

  for (const scenario of LAUNCH_SMOKE_MATRIX) {
    const startedAt = Date.now();
    const run = spawnSync(
      command('npx'),
      ['vitest', 'run', ...scenario.testFiles, '--reporter', reporter],
      {
        encoding: 'utf8',
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 20,
      }
    );
    const status = run.status === 0 ? 'pass' : 'fail';
    const output = `${run.stdout ?? ''}\n${run.stderr ?? ''}`.trim();
    const outputSnippet = output.slice(-2000) || undefined;

    checks.push({
      id: scenario.id,
      label: scenario.label,
      status,
      expectedState: scenario.expectedState,
      durationMs: Date.now() - startedAt,
      testFiles: scenario.testFiles,
      message: status === 'pass' ? undefined : `${scenario.label} failed`,
      outputSnippet,
      generatedAt: new Date().toISOString(),
    });

    const summaryLine = `${status === 'pass' ? 'PASS' : 'FAIL'} ${scenario.id} (${scenario.testFiles.join(', ')})`;
    if (status === 'pass') {
      console.log(summaryLine);
    } else {
      console.error(summaryLine);
    }
  }

  const artifact = {
    schemaVersion: 1 as const,
    generatedAt: new Date().toISOString(),
    overallStatus: aggregateLaunchSmokeStatus(checks),
    checks,
  };

  await fs.mkdir(path.dirname(artifactPath), { recursive: true });
  await fs.writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');

  console.log(`Launch smoke artifact written to ${artifactPath}`);

  if (artifact.overallStatus !== 'pass') {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(
    'Launch smoke runner failed:',
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});
