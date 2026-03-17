#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import {
  LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES,
  LAUNCH_SMOKE_MATRIX,
} from '../src/lib/launch/contracts';
import {
  aggregateLaunchSmokeStatus,
  buildLaunchSmokeCorridors,
  type LaunchSmokeCheckResult,
} from '../src/lib/launch/smoke-artifact';

function readArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function command(name: string) {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}

function executeCommand(commandParts: string[], env?: Record<string, string>) {
  const [bin, ...args] = commandParts;
  return spawnSync(command(bin), args, {
    encoding: 'utf8',
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
    },
    maxBuffer: 1024 * 1024 * 20,
  });
}

function collectCommandOutput(run: ReturnType<typeof spawnSync>) {
  return `${run.stdout ?? ''}\n${run.stderr ?? ''}`.trim();
}

async function main() {
  const artifactPath =
    readArg('--artifact') ??
    process.env.LAUNCH_SMOKE_ARTIFACT_PATH ??
    '.artifacts/launch-smoke-report.json';
  const reporter = process.env.LAUNCH_SMOKE_REPORTER ?? 'basic';
  const checks: LaunchSmokeCheckResult[] = [];

  for (const scenario of LAUNCH_SMOKE_MATRIX) {
    const startedAt = Date.now();
    const outputSegments: string[] = [];
    let status: LaunchSmokeCheckResult['status'] = 'pass';
    let message: string | undefined;

    if (scenario.runner.kind === 'vitest') {
      const run = executeCommand(
        ['npx', 'vitest', 'run', ...scenario.runner.testFiles, '--reporter', reporter],
        undefined
      );

      status = run.status === 0 ? 'pass' : 'fail';
      outputSegments.push(collectCommandOutput(run));
      if (status !== 'pass') {
        message = `${scenario.label} failed`;
      }
    } else {
      for (const preCommand of scenario.runner.preCommands ?? []) {
        const run = executeCommand(preCommand.command, scenario.runner.env);
        outputSegments.push(
          [`[${preCommand.label}]`, collectCommandOutput(run)].filter(Boolean).join('\n')
        );
        if (run.status !== 0) {
          status = 'fail';
          message = `${scenario.label} failed during ${preCommand.label}`;
          break;
        }
      }

      if (status === 'pass') {
        const run = executeCommand(scenario.runner.command, scenario.runner.env);
        outputSegments.push(
          [`[${scenario.runner.label}]`, collectCommandOutput(run)].filter(Boolean).join('\n')
        );
        status = run.status === 0 ? 'pass' : 'fail';
        if (status !== 'pass') {
          message = `${scenario.label} failed`;
        }
      }
    }

    const outputSnippet = outputSegments.join('\n\n').trim().slice(-4000) || undefined;

    checks.push({
      id: scenario.id,
      corridor: scenario.corridor,
      label: scenario.label,
      runner: scenario.runner,
      status,
      expectedState: scenario.expectedState,
      durationMs: Date.now() - startedAt,
      message,
      outputSnippet,
      generatedAt: new Date().toISOString(),
      evidence: scenario.evidence,
    });

    const summaryLine = `${status === 'pass' ? 'PASS' : 'FAIL'} ${scenario.id}`;
    if (status === 'pass') {
      console.log(summaryLine);
    } else {
      console.error(summaryLine);
    }
  }

  const generatedAt = new Date().toISOString();
  const freshnessThresholdMinutes = LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES;
  const artifact = {
    schemaVersion: 2 as const,
    generatedAt,
    freshnessThresholdMinutes,
    expiresAt: new Date(Date.now() + freshnessThresholdMinutes * 60_000).toISOString(),
    overallStatus: aggregateLaunchSmokeStatus(checks),
    corridors: buildLaunchSmokeCorridors(checks, generatedAt),
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
