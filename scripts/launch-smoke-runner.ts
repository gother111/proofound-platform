#!/usr/bin/env node

import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import {
  LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES,
  LAUNCH_SMOKE_SCOPE_VALUES,
  getLaunchSmokeMatrix,
  isLocalLaunchBaseUrl,
  normalizeLaunchBaseUrl,
} from '../src/lib/launch/contracts';
import {
  aggregateLaunchSmokeStatus,
  buildLaunchSmokeCorridors,
  type LaunchSmokeCheckResult,
} from '../src/lib/launch/smoke-artifact';
import { buildAiLaunchSmokeState } from '../src/lib/launch/ai-smoke-state';

function readArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function readSmokeScope() {
  const rawScope = readArg('--scope')?.trim().toLowerCase();
  if (!rawScope) {
    return 'full' as const;
  }

  if ((LAUNCH_SMOKE_SCOPE_VALUES as readonly string[]).includes(rawScope)) {
    return rawScope as (typeof LAUNCH_SMOKE_SCOPE_VALUES)[number];
  }

  throw new Error(
    `Unsupported smoke scope "${rawScope}". Expected one of: ${LAUNCH_SMOKE_SCOPE_VALUES.join(', ')}`
  );
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

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getLocalBaseUrlSocket(baseUrl: string) {
  try {
    const parsed = new URL(baseUrl);
    const port = parsed.port
      ? Number.parseInt(parsed.port, 10)
      : parsed.protocol === 'https:'
        ? 443
        : 80;

    if (!Number.isFinite(port)) {
      return null;
    }

    return {
      host: parsed.hostname.replace(/^\[|\]$/g, ''),
      port,
    };
  } catch {
    return null;
  }
}

function isPortAcceptingConnections(host: string, port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;
    const finish = (result: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(250);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function waitForLocalPlaywrightServerRelease(baseUrl: string) {
  if (!isLocalLaunchBaseUrl(baseUrl)) {
    return;
  }

  const socket = getLocalBaseUrlSocket(baseUrl);
  if (!socket) {
    return;
  }

  const timeoutMs = Number.parseInt(
    process.env.LAUNCH_SMOKE_LOCAL_SERVER_RELEASE_TIMEOUT_MS || '10000',
    10
  );
  const deadline = Date.now() + Math.max(timeoutMs, 0);

  while (Date.now() < deadline) {
    if (!(await isPortAcceptingConnections(socket.host, socket.port))) {
      return;
    }
    await sleep(250);
  }
}

async function main() {
  const scope = readSmokeScope();
  const artifactPath =
    readArg('--artifact') ??
    process.env.LAUNCH_SMOKE_ARTIFACT_PATH ??
    '.artifacts/launch-smoke-report.json';
  const baseUrl = normalizeLaunchBaseUrl(
    readArg('--base-url') ?? process.env.BASE_URL ?? 'http://localhost:3000'
  );
  const executionMode = isLocalLaunchBaseUrl(baseUrl) ? 'local' : 'live';
  const reporter = process.env.LAUNCH_SMOKE_REPORTER ?? 'basic';
  const scenarios = getLaunchSmokeMatrix(scope);
  const checks: LaunchSmokeCheckResult[] = [];
  const sharedEnv = {
    BASE_URL: baseUrl,
    ...(executionMode === 'local'
      ? {
          PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK: '1',
          PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE: '1',
        }
      : {}),
  };
  const ai = buildAiLaunchSmokeState({ executionMode });

  console.log(`Running ${scope} launch smoke checks against ${baseUrl} (${executionMode})`);
  console.log(`AI assistant smoke state: ${ai.state}`);

  for (const scenario of scenarios) {
    const startedAt = Date.now();
    const outputSegments: string[] = [];
    let status: LaunchSmokeCheckResult['status'] = 'pass';
    let message: string | undefined;

    if (scenario.runner.kind === 'vitest') {
      const run = executeCommand(
        ['npx', 'vitest', 'run', ...scenario.runner.testFiles, '--reporter', reporter],
        sharedEnv
      );

      status = run.status === 0 ? 'pass' : 'fail';
      outputSegments.push(collectCommandOutput(run));
      if (status !== 'pass') {
        message = `${scenario.label} failed`;
      }
    } else {
      const scenarioEnv = {
        ...scenario.runner.env,
        ...sharedEnv,
      };

      for (const preCommand of scenario.runner.preCommands ?? []) {
        const run = executeCommand(preCommand.command, scenarioEnv);
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
        const run = executeCommand(scenario.runner.command, scenarioEnv);
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

    if (scenario.runner.kind === 'command') {
      await waitForLocalPlaywrightServerRelease(baseUrl);
    }
  }

  const generatedAt = new Date().toISOString();
  const freshnessThresholdMinutes = LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES;
  const artifact = {
    schemaVersion: 2 as const,
    scope,
    generatedAt,
    targetBaseUrl: baseUrl,
    executionMode,
    freshnessThresholdMinutes,
    expiresAt: new Date(Date.now() + freshnessThresholdMinutes * 60_000).toISOString(),
    overallStatus: aggregateLaunchSmokeStatus(checks),
    ai,
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
