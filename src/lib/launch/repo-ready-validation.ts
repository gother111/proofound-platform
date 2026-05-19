import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';

import { REPO_READY_LAUNCH_SMOKE_SCENARIO_IDS } from '@/lib/launch/contracts';

export const REPO_READY_VALIDATION_SCHEMA_VERSION = 1;
export const REPO_READY_VALIDATION_FILE_NAME = 'repo-ready-validation.json';

export type RepoReadyValidationGateStatus = 'PASS' | 'FAIL';

export type RepoReadyValidationGate = {
  id: string;
  status: RepoReadyValidationGateStatus;
  summary: string;
  evidence: string[];
  command?: string;
  observedAt: string;
};

export type RepoReadyValidationBundle = {
  schemaVersion: typeof REPO_READY_VALIDATION_SCHEMA_VERSION;
  kind: 'repo_ready_validation';
  scope: 'repo';
  generatedAt: string;
  authoritativeBaseUrl: string | null;
  verdict: 'READY' | 'NOT_READY';
  gates: RepoReadyValidationGate[];
};

type RepoReadyValidationOptions = {
  workspaceRoot?: string;
  now?: Date;
};

type CapturedCommandResult = {
  exitCode: number;
  output: string;
};

type RepoValidationCommand = {
  gateId: string;
  command: string[];
  logFileName: string;
  passSummary: string;
  failSummary: string;
  timeoutMs?: number;
};

function commandBinary(name: string) {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}

function getCurrentDate(now: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: process.env.TZ || 'UTC',
  }).format(now);
}

function buildCommandString(command: string[]) {
  return command.join(' ');
}

function collectOutput(stdout: string | null | undefined, stderr: string | null | undefined) {
  return `${stdout ?? ''}\n${stderr ?? ''}`.trim();
}

function runCapturedCommand(
  command: string[],
  cwd: string,
  env: Record<string, string> = {},
  timeoutMs?: number
): CapturedCommandResult {
  const [bin, ...args] = command;
  const result = spawnSync(commandBinary(bin), args, {
    cwd,
    env: {
      ...process.env,
      ...env,
    },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
    timeout: timeoutMs,
  });

  return {
    exitCode: result.status ?? 1,
    output: [
      collectOutput(result.stdout, result.stderr),
      result.signal ? `Command terminated with signal ${result.signal}.` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

async function writeCommandLog(outputDir: string, fileName: string, content: string) {
  const logPath = path.join(outputDir, fileName);
  await fs.writeFile(logPath, `${content.trim()}\n`, 'utf8');
  return logPath;
}

async function runValidationCommand(
  outputDir: string,
  cwd: string,
  now: Date,
  definition: RepoValidationCommand
) {
  const result = runCapturedCommand(definition.command, cwd, {}, definition.timeoutMs);
  const logPath = await writeCommandLog(outputDir, definition.logFileName, result.output);
  const observedAt = now.toISOString();

  return {
    gate: {
      id: definition.gateId,
      status: result.exitCode === 0 ? 'PASS' : 'FAIL',
      summary: result.exitCode === 0 ? definition.passSummary : definition.failSummary,
      evidence: [path.relative(cwd, logPath).replace(/\\/g, '/')],
      command: buildCommandString(definition.command),
      observedAt,
    } satisfies RepoReadyValidationGate,
    exitCode: result.exitCode,
    logPath,
  };
}

async function findFreePort() {
  return await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to resolve a free localhost port.'));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealthyServer(baseUrl: string, timeoutMs = 45_000) {
  const startedAt = Date.now();
  let lastError = 'Health endpoint did not become ready in time.';

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        headers: {
          accept: 'application/json',
        },
      });
      const text = await response.text();
      const payload = text ? (JSON.parse(text) as Record<string, unknown>) : null;

      if (response.ok && payload?.status === 'ok') {
        return {
          ok: true,
          payload,
        };
      }

      lastError = response.ok
        ? 'Health endpoint responded without ok status.'
        : `Health endpoint returned HTTP ${response.status}.`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await delay(1_000);
  }

  return {
    ok: false,
    payload: null,
    error: lastError,
  };
}

async function startProductionServer(workspaceRoot: string, outputDir: string, now: Date) {
  const port = await findFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const logPath = path.join(outputDir, 'repo-ready-prod-start.log');
  const command = ['npm', 'run', 'start', '--', '-p', String(port)];
  const child = spawn(commandBinary(command[0]!), command.slice(1), {
    cwd: workspaceRoot,
    env: {
      ...process.env,
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  const append = (chunk: Buffer | string) => {
    output += chunk.toString();
  };

  child.stdout.on('data', append);
  child.stderr.on('data', append);

  const health = await waitForHealthyServer(baseUrl);
  await fs.writeFile(logPath, output.trimEnd() ? `${output.trimEnd()}\n` : '', 'utf8');

  const healthPayloadPath = path.join(outputDir, 'repo-ready-prod-health.json');
  if (health.payload) {
    await fs.writeFile(
      healthPayloadPath,
      `${JSON.stringify(
        {
          url: `${baseUrl}/api/health`,
          observedAt: now.toISOString(),
          payload: health.payload,
        },
        null,
        2
      )}\n`,
      'utf8'
    );
  }

  const gate: RepoReadyValidationGate = {
    id: 'prod_boot',
    status: health.ok ? 'PASS' : 'FAIL',
    summary: health.ok
      ? '`npm run start` booted successfully and `/api/health` returned ok.'
      : `Production boot failed or never became healthy. ${health.error ?? ''}`.trim(),
    evidence: [
      path.relative(workspaceRoot, logPath).replace(/\\/g, '/'),
      ...(health.payload
        ? [path.relative(workspaceRoot, healthPayloadPath).replace(/\\/g, '/')]
        : []),
    ],
    command: 'npm run start -- -p <dynamic-port> && curl /api/health',
    observedAt: now.toISOString(),
  };

  return {
    child,
    gate,
    baseUrl,
    health,
  };
}

async function stopProductionServer(child: ChildProcess | null) {
  if (!child || child.killed) {
    return;
  }

  child.kill('SIGTERM');
  await Promise.race([
    new Promise<void>((resolve) => {
      child.once('exit', () => resolve());
    }),
    delay(5_000),
  ]);

  if (!child.killed) {
    child.kill('SIGKILL');
  }
}

async function addSmokeArtifactGates(params: {
  workspaceRoot: string;
  outputDir: string;
  now: Date;
  baseUrl: string;
}) {
  const smokeArtifactPath = path.join(params.outputDir, 'repo-ready-launch-smoke-report.json');
  const smokeResult = await runValidationCommand(
    params.outputDir,
    params.workspaceRoot,
    params.now,
    {
      gateId: 'live_launch_smoke_artifact_refresh',
      command: [
        'npm',
        'run',
        'test:launch:smoke',
        '--',
        '--scope',
        'repo',
        '--base-url',
        params.baseUrl,
        '--artifact',
        smokeArtifactPath,
      ],
      logFileName: 'repo-ready-launch-smoke.log',
      passSummary: 'Launch smoke runner passed and refreshed local smoke evidence.',
      failSummary: 'Launch smoke runner failed or did not refresh a green smoke artifact.',
      timeoutMs: 180_000,
    }
  );

  const gates: RepoReadyValidationGate[] = [smokeResult.gate];
  try {
    const raw = await fs.readFile(smokeArtifactPath, 'utf8');
    const artifact = JSON.parse(raw) as {
      checks?: Array<{
        id?: string;
        status?: string;
        message?: string;
      }>;
    };
    const checks = Array.isArray(artifact.checks) ? artifact.checks : [];
    const repoScenarioIds = new Set<string>(REPO_READY_LAUNCH_SMOKE_SCENARIO_IDS);
    const coveredScenarioIds = new Set(
      checks.flatMap((check) => (check.id && repoScenarioIds.has(check.id) ? [check.id] : []))
    );
    const missingScenarioIds = REPO_READY_LAUNCH_SMOKE_SCENARIO_IDS.filter(
      (scenarioId) => !coveredScenarioIds.has(scenarioId)
    );
    const failingChecks = checks.filter(
      (check) => check.id && repoScenarioIds.has(check.id) && check.status !== 'pass'
    );
    const repoSmokePassed =
      smokeResult.gate.status === 'PASS' &&
      missingScenarioIds.length === 0 &&
      failingChecks.length === 0;
    gates[0] = {
      ...gates[0],
      status: repoSmokePassed ? 'PASS' : 'FAIL',
      summary: repoSmokePassed
        ? 'Repo launch smoke runner passed and refreshed fresh repo-scoped smoke evidence.'
        : missingScenarioIds.length > 0
          ? `Repo launch smoke artifact was missing required scenarios: ${missingScenarioIds.join(', ')}.`
          : failingChecks.length > 0
            ? `Repo launch smoke artifact still contains failing scenarios: ${failingChecks
                .map((check) => check.id)
                .join(', ')}.`
            : gates[0].summary,
      evidence: [
        path.relative(params.workspaceRoot, smokeArtifactPath).replace(/\\/g, '/'),
        ...smokeResult.gate.evidence,
      ],
    };

    const orgTrustCheck = checks.find((check) => check.id === 'public_org_trust_fixture_live');

    gates.push({
      id: 'public_org_trust_smoke',
      status: orgTrustCheck?.status === 'pass' ? 'PASS' : 'FAIL',
      summary:
        orgTrustCheck?.status === 'pass'
          ? 'Public org trust smoke scenario passed in the fresh launch smoke artifact.'
          : (orgTrustCheck?.message ??
            'Public org trust smoke scenario did not pass in the fresh launch smoke artifact.'),
      evidence: [
        path.relative(params.workspaceRoot, smokeArtifactPath).replace(/\\/g, '/'),
        ...smokeResult.gate.evidence,
      ],
      command: gates[0].command,
      observedAt: params.now.toISOString(),
    });
  } catch {
    gates.push({
      id: 'public_org_trust_smoke',
      status: 'FAIL',
      summary:
        'Public org trust smoke could not be confirmed because the smoke artifact was unreadable.',
      evidence: smokeResult.gate.evidence,
      command: smokeResult.gate.command,
      observedAt: params.now.toISOString(),
    });
  }

  return gates;
}

export async function runRepoReadyValidationBundle(options: RepoReadyValidationOptions = {}) {
  const workspaceRoot = options.workspaceRoot ?? process.cwd();
  const now = options.now ?? new Date();
  const currentDate = getCurrentDate(now);
  const outputDir = path.join(workspaceRoot, '.artifacts', `launch-validation-${currentDate}`);
  await fs.mkdir(outputDir, { recursive: true });

  const gates: RepoReadyValidationGate[] = [];
  let server: ChildProcess | null = null;
  let baseUrl: string | null = null;

  try {
    gates.push(
      (
        await runValidationCommand(outputDir, workspaceRoot, now, {
          gateId: 'prod_build',
          command: ['npm', 'run', 'build'],
          logFileName: 'repo-ready-build.log',
          passSummary: '`npm run build` passed under the launch Node/runtime configuration.',
          failSummary: '`npm run build` failed under the launch Node/runtime configuration.',
        })
      ).gate
    );

    if (gates.find((gate) => gate.id === 'prod_build')?.status === 'PASS') {
      try {
        const started = await startProductionServer(workspaceRoot, outputDir, now);
        server = started.child;
        baseUrl = started.baseUrl;
        gates.push(started.gate);
      } catch (error) {
        const bootErrorPath = path.join(outputDir, 'repo-ready-prod-boot-error.log');
        await fs.writeFile(
          bootErrorPath,
          `${error instanceof Error ? error.stack || error.message : String(error)}\n`,
          'utf8'
        );
        gates.push({
          id: 'prod_boot',
          status: 'FAIL',
          summary:
            'Production boot could not start in this environment; review the captured boot error and rerun on a host that can bind localhost.',
          evidence: [path.relative(workspaceRoot, bootErrorPath).replace(/\\/g, '/')],
          command: 'npm run start -- -p <dynamic-port> && curl /api/health',
          observedAt: now.toISOString(),
        });
      }
    } else {
      gates.push({
        id: 'prod_boot',
        status: 'FAIL',
        summary: 'Skipped production boot because the build step failed.',
        evidence: ['.artifacts/launch-validation-' + currentDate + '/repo-ready-build.log'],
        command: 'npm run start -- -p <dynamic-port> && curl /api/health',
        observedAt: now.toISOString(),
      });
    }

    const validationCommands: RepoValidationCommand[] = [
      {
        gateId: 'route_surface_and_archived_routes',
        command: [
          'npm',
          'run',
          'test',
          '--',
          'tests/api/launch-surface-inventory.test.ts',
          'tests/api/launch-page-inventory.test.ts',
        ],
        logFileName: 'repo-ready-route-surface.log',
        passSummary: 'Launch route and page inventory tests passed against the current repo state.',
        failSummary: 'Launch route and page inventory tests failed against the current repo state.',
      },
      {
        gateId: 'launch_status_route_logic',
        command: [
          'npm',
          'run',
          'test',
          '--',
          'src/app/api/monitoring/__tests__/launch-status-route.test.ts',
        ],
        logFileName: 'repo-ready-launch-status-route.log',
        passSummary: 'Launch-status route tests passed with current persisted/live monitor logic.',
        failSummary:
          'Launch-status route tests failed for the current persisted/live monitor logic.',
      },
      {
        gateId: 'public_portfolio_safe',
        command: [
          'npm',
          'run',
          'test',
          '--',
          'tests/ui/public-portfolio-access-consistency.test.tsx',
          'tests/ui/public-portfolio-page.test.tsx',
          'tests/lib/public-portfolio-projection.test.ts',
        ],
        logFileName: 'repo-ready-public-portfolio.log',
        passSummary:
          'Public portfolio page, access consistency, and projection tests passed for public-safe direct-link behavior.',
        failSummary:
          'Public portfolio page, access consistency, or projection tests failed for public-safe direct-link behavior.',
      },
      {
        gateId: 'private_context_scaffolding',
        command: [
          'npm',
          'run',
          'test',
          '--',
          'tests/ui/profile-dialogs-edit-routing.test.tsx',
          'tests/ui/education-form-skill-picker.test.tsx',
          'tests/actions/onboarding-private-context-scaffolding.test.ts',
        ],
        logFileName: 'repo-ready-private-context.log',
        passSummary: 'Private work, education, and volunteering context scaffolding tests passed.',
        failSummary: 'Private work, education, and volunteering context scaffolding tests failed.',
      },
      {
        gateId: 'workflow_email_privacy',
        command: ['npm', 'run', 'test', '--', 'tests/lib/workflow-email-privacy.test.ts'],
        logFileName: 'repo-ready-workflow-email-privacy.log',
        passSummary: 'Workflow email privacy tests passed for masked and pre-reveal flows.',
        failSummary: 'Workflow email privacy tests failed for masked or pre-reveal flows.',
      },
      {
        gateId: 'manual_privacy_sweep',
        command: [
          'npm',
          'run',
          'test',
          '--',
          'tests/api/org-match-review-route.test.ts',
          'tests/lib/uploads-privacy.test.ts',
          'src/lib/__tests__/middleware-launch-archive.test.ts',
        ],
        logFileName: 'repo-ready-manual-privacy.log',
        passSummary:
          'Privacy-sensitive review, uploads, and launch archive protection tests passed.',
        failSummary:
          'Privacy-sensitive review, uploads, or launch archive protection tests failed.',
      },
      {
        gateId: 'internal_admin_surfaces',
        command: [
          'npm',
          'run',
          'test',
          '--',
          'tests/api/admin-internal-ops-queue-route.test.ts',
          'tests/ui/admin-dashboard-launch-links.test.tsx',
          'src/lib/__tests__/middleware-launch-archive.test.ts',
        ],
        logFileName: 'repo-ready-internal-admin.log',
        passSummary:
          'Internal admin surface tests passed for route protection, queue APIs, and dashboard links.',
        failSummary:
          'Internal admin surface tests failed for route protection, queue APIs, or dashboard links.',
      },
    ];

    for (const command of validationCommands) {
      gates.push((await runValidationCommand(outputDir, workspaceRoot, now, command)).gate);
    }

    if (baseUrl) {
      gates.push(...(await addSmokeArtifactGates({ workspaceRoot, outputDir, now, baseUrl })));
    } else {
      gates.push({
        id: 'live_launch_smoke_artifact_refresh',
        status: 'FAIL',
        summary: 'Skipped launch smoke runner because production boot was unavailable.',
        evidence: [
          path
            .relative(workspaceRoot, path.join(outputDir, 'repo-ready-build.log'))
            .replace(/\\/g, '/'),
        ],
        command: 'npm run test:launch:smoke -- --base-url <local-prod-url>',
        observedAt: now.toISOString(),
      });
      gates.push({
        id: 'public_org_trust_smoke',
        status: 'FAIL',
        summary: 'Skipped public org trust smoke because production boot was unavailable.',
        evidence: [
          path
            .relative(workspaceRoot, path.join(outputDir, 'repo-ready-build.log'))
            .replace(/\\/g, '/'),
        ],
        command: 'npm run test:launch:smoke -- --base-url <local-prod-url>',
        observedAt: now.toISOString(),
      });
    }

    const verdict = gates.every((gate) => gate.status === 'PASS') ? 'READY' : 'NOT_READY';
    const bundle: RepoReadyValidationBundle = {
      schemaVersion: REPO_READY_VALIDATION_SCHEMA_VERSION,
      kind: 'repo_ready_validation',
      scope: 'repo',
      generatedAt: now.toISOString(),
      authoritativeBaseUrl: baseUrl,
      verdict,
      gates,
    };

    const bundlePath = path.join(outputDir, REPO_READY_VALIDATION_FILE_NAME);
    await fs.writeFile(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');

    return {
      bundle,
      bundlePath,
      outputDir,
    };
  } finally {
    await stopProductionServer(server);
  }
}
