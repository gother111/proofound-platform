import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

import { getLaunchDateSlug } from '@/lib/launch/date-slug';

export const FINAL_LAUNCH_VALIDATION_SCHEMA_VERSION = 1;
export const FINAL_LAUNCH_VALIDATION_REPORT_FILE_NAME = 'launch-gate-status.md';

export type FinalLaunchGateStatus = 'PASS' | 'FAIL' | 'UNVERIFIED' | 'NOT APPLICABLE';
export type FinalLaunchGatePriority = 'P0' | 'P1';
export type FinalLaunchVerdict = 'GO' | 'NO_GO';

export type FinalLaunchCommandSpec = {
  command: string;
  args: string[];
  display: string;
  env?: Record<string, string>;
  timeoutMs?: number;
};

export type FinalLaunchGateDefinition = {
  id: string;
  label: string;
  priority: FinalLaunchGatePriority;
  command?: FinalLaunchCommandSpec;
  skip?: {
    status: Extract<FinalLaunchGateStatus, 'UNVERIFIED' | 'NOT APPLICABLE'>;
    reason: string;
  };
};

export type FinalLaunchGateResult = {
  id: string;
  label: string;
  priority: FinalLaunchGatePriority;
  status: FinalLaunchGateStatus;
  command: string | null;
  reason: string | null;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  durationMs: number;
  startedAt: string;
  endedAt: string;
  logPath: string | null;
};

export type FinalLaunchValidationBundle = {
  schemaVersion: typeof FINAL_LAUNCH_VALIDATION_SCHEMA_VERSION;
  kind: 'final_launch_validation';
  generatedAt: string;
  artifactDate: string;
  workspace: string;
  outputDir: string;
  verdict: FinalLaunchVerdict;
  statusCounts: Record<FinalLaunchGateStatus, number>;
  p0BlockingGateIds: string[];
  gates: FinalLaunchGateResult[];
};

export type CommandExecutionResult = {
  exitCode: number;
  signal: NodeJS.Signals | null;
  output: string;
  durationMs: number;
};

export type FinalLaunchValidationOptions = {
  workspaceRoot?: string;
  outputDir?: string;
  now?: Date;
  env?: NodeJS.ProcessEnv;
  executor?: (
    command: FinalLaunchCommandSpec,
    context: {
      workspaceRoot: string;
      env: NodeJS.ProcessEnv;
    }
  ) => Promise<CommandExecutionResult>;
};

const ONE_MINUTE = 60_000;

const exportDeleteTestFiles = [
  'tests/api/user-export-route.test.ts',
  'tests/api/portfolio-export-route.test.ts',
  'tests/api/portfolio-org-export-route.test.ts',
  'tests/api/public-portfolio-export-route.test.ts',
  'tests/api/user-account-lifecycle-routes.test.ts',
  'tests/api/expertise-user-skill-proof-delete-route.test.ts',
  'tests/api/expertise-verifications-sent-delete-route.test.ts',
  'tests/lib/export-download-filename.test.ts',
  'tests/lib/portfolio-export-data.test.ts',
  'tests/lib/uploads-export.test.ts',
];

const strictOrgCorridorRequiredEnvGroups = [
  ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'],
  ['SUPABASE_SERVICE_ROLE_KEY'],
  ['DATABASE_URL'],
  ['NEXT_PUBLIC_SITE_URL', 'SITE_URL'],
] as const;

function npmCommand(args: string[], timeoutMs?: number, env?: Record<string, string>) {
  return {
    command: 'npm',
    args,
    display: ['npm', ...args].join(' '),
    timeoutMs,
    env,
  } satisfies FinalLaunchCommandSpec;
}

function nodeCommand(args: string[], timeoutMs?: number, env?: Record<string, string>) {
  return {
    command: 'node',
    args,
    display: ['node', ...args].join(' '),
    timeoutMs,
    env,
  } satisfies FinalLaunchCommandSpec;
}

function getDateSlug(now: Date) {
  return getLaunchDateSlug(now);
}

function hasAnyEnv(env: NodeJS.ProcessEnv, names: readonly string[]) {
  return names.some((name) => Boolean(env[name]?.trim()));
}

function hasCronSecret(env: NodeJS.ProcessEnv) {
  const value = env.CRON_SECRET?.trim();
  return Boolean(value && value.toLowerCase() !== 'undefined' && value.toLowerCase() !== 'null');
}

export function environmentSupportsStrictOrgCorridor(env: NodeJS.ProcessEnv = process.env) {
  const missing = strictOrgCorridorRequiredEnvGroups.flatMap((group) =>
    hasAnyEnv(env, group) ? [] : [group.join('/')]
  );

  const mockMode = String(env.NEXT_PUBLIC_USE_MOCK_SUPABASE ?? '').toLowerCase() === 'true';
  if (mockMode) {
    missing.push('NEXT_PUBLIC_USE_MOCK_SUPABASE must not be true');
  }

  return {
    supported: missing.length === 0,
    missing,
  };
}

export function buildFinalLaunchValidationGates(
  options: {
    env?: NodeJS.ProcessEnv;
    outputDir?: string;
  } = {}
): FinalLaunchGateDefinition[] {
  const env = options.env ?? process.env;
  const baseUrl = env.BASE_URL?.trim();
  const outputDir = options.outputDir ?? '.artifacts/launch-validation-current';
  const launchSmokeArtifactPath = path.join(outputDir, 'launch-smoke-report.json');
  const strictOrgSupport = environmentSupportsStrictOrgCorridor(env);
  const cronSecretConfigured = hasCronSecret(env);
  const protectedLaunchGateSkip = baseUrl
    ? cronSecretConfigured
      ? undefined
      : {
          status: 'UNVERIFIED' as const,
          reason:
            'CRON_SECRET is required for authenticated production-candidate launch-status, monitor, and go/no-go gates.',
        }
    : {
        status: 'NOT APPLICABLE' as const,
        reason: 'BASE_URL is not configured, so this production-candidate gate is not run.',
      };

  return [
    {
      id: 'deploy_readiness',
      label: 'Env and deploy readiness check',
      priority: 'P0',
      command: nodeCommand(['./scripts/check-deploy-readiness.mjs'], ONE_MINUTE, {
        FORCE_STRICT_DEPLOY_CHECK: 'true',
      }),
    },
    {
      id: 'lint',
      label: 'Lint',
      priority: 'P0',
      command: npmCommand(['run', 'lint'], 10 * ONE_MINUTE),
    },
    {
      id: 'typecheck',
      label: 'Typecheck',
      priority: 'P0',
      command: npmCommand(['run', 'typecheck'], 10 * ONE_MINUTE),
    },
    {
      id: 'production_build',
      label: 'Production build',
      priority: 'P0',
      command: npmCommand(['run', 'build'], 20 * ONE_MINUTE),
    },
    {
      id: 'launch_surface_inventory_tests',
      label: 'Launch surface inventory tests',
      priority: 'P0',
      command: npmCommand(['run', 'test:launch:routes'], 5 * ONE_MINUTE),
    },
    {
      id: 'launch_page_inventory_tests',
      label: 'Launch page inventory tests',
      priority: 'P0',
      command: npmCommand(['run', 'test:launch:routes'], 5 * ONE_MINUTE),
    },
    {
      id: 'privacy_rls_baseline_tests',
      label: 'Privacy/RLS baseline tests',
      priority: 'P0',
      command: npmCommand(['run', 'test:privacy'], 10 * ONE_MINUTE),
    },
    {
      id: 'privacy_rls_extended_tests',
      label: 'Privacy/RLS extended tests',
      priority: 'P0',
      command: npmCommand(['run', 'test:privacy:extended'], 10 * ONE_MINUTE),
    },
    {
      id: 'upload_privacy_tests',
      label: 'Upload privacy tests',
      priority: 'P0',
      command: npmCommand(['run', 'test:launch:upload'], 10 * ONE_MINUTE),
    },
    {
      id: 'org_corridor_workflow_tests',
      label: 'Org review/reveal/decision/engagement tests',
      priority: 'P0',
      command: npmCommand(['run', 'test:launch:workflow'], 15 * ONE_MINUTE),
    },
    {
      id: 'export_delete_tests',
      label: 'Export/delete tests',
      priority: 'P0',
      command: npmCommand(['run', 'test', '--', ...exportDeleteTestFiles], 10 * ONE_MINUTE),
    },
    {
      id: 'strict_org_corridor_e2e',
      label: 'Strict org corridor E2E',
      priority: 'P0',
      command: strictOrgSupport.supported
        ? npmCommand(['run', 'test:e2e:org:strict'], 20 * ONE_MINUTE, {
            NEXT_PUBLIC_USE_MOCK_SUPABASE: 'false',
          })
        : undefined,
      skip: strictOrgSupport.supported
        ? undefined
        : {
            status: 'UNVERIFIED',
            reason: `Strict org corridor E2E requires launch/staging env support. Missing: ${strictOrgSupport.missing.join(', ')}`,
          },
    },
    {
      id: 'launch_smoke',
      label: 'Launch smoke',
      priority: 'P0',
      command: baseUrl
        ? npmCommand(
            [
              'run',
              'test:launch:smoke',
              '--',
              '--base-url',
              baseUrl,
              '--artifact',
              launchSmokeArtifactPath,
            ],
            15 * ONE_MINUTE,
            { BASE_URL: baseUrl }
          )
        : undefined,
      skip: baseUrl
        ? undefined
        : {
            status: 'NOT APPLICABLE',
            reason: 'BASE_URL is not configured, so launch smoke is not run by this command.',
          },
    },
    {
      id: 'perf_budgets',
      label: 'Performance budgets',
      priority: 'P0',
      command: baseUrl
        ? npmCommand(['run', 'perf:budgets'], 10 * ONE_MINUTE, { BASE_URL: baseUrl })
        : undefined,
      skip: baseUrl
        ? undefined
        : {
            status: 'NOT APPLICABLE',
            reason:
              'BASE_URL is not configured, so performance budgets are not run by this command.',
          },
    },
    {
      id: 'launch_synthetics',
      label: 'Launch synthetic monitors',
      priority: 'P0',
      command:
        baseUrl && cronSecretConfigured
          ? npmCommand(
              [
                'run',
                'monitor:launch',
                '--',
                '--base-url',
                baseUrl,
                '--artifact',
                launchSmokeArtifactPath,
              ],
              10 * ONE_MINUTE,
              {
                BASE_URL: baseUrl,
                LAUNCH_SMOKE_ARTIFACT_PATH: launchSmokeArtifactPath,
              }
            )
          : undefined,
      skip: protectedLaunchGateSkip,
    },
    {
      id: 'launch_status',
      label: 'Authenticated launch status',
      priority: 'P0',
      command:
        baseUrl && cronSecretConfigured
          ? npmCommand(['run', 'launch:status'], 5 * ONE_MINUTE, {
              BASE_URL: baseUrl,
              LAUNCH_SMOKE_ARTIFACT_PATH: launchSmokeArtifactPath,
            })
          : undefined,
      skip: protectedLaunchGateSkip,
    },
    {
      id: 'go_no_go',
      label: 'Go/No-Go',
      priority: 'P0',
      command:
        baseUrl && cronSecretConfigured
          ? npmCommand(['run', 'go:no-go'], 10 * ONE_MINUTE, {
              BASE_URL: baseUrl,
              LAUNCH_SMOKE_ARTIFACT_PATH: launchSmokeArtifactPath,
            })
          : undefined,
      skip: protectedLaunchGateSkip,
    },
    {
      id: 'production_dependency_audit',
      label: 'Production dependency audit',
      priority: 'P0',
      command: npmCommand(['audit', '--omit=dev'], 5 * ONE_MINUTE),
    },
  ];
}

function commandBinary(name: string) {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}

export function redactSensitiveOutput(output: string) {
  const sensitiveKey =
    '(?:[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE|DATABASE_URL|SERVICE_ROLE|CLIENT_SECRET|API_KEY|AUTH)[A-Z0-9_]*)';

  return output
    .replace(new RegExp(`(${sensitiveKey}\\s*=\\s*)[^\\s]+`, 'gi'), '$1[REDACTED]')
    .replace(new RegExp(`("${sensitiveKey}"\\s*:\\s*)"[^"]*"`, 'gi'), '$1"[REDACTED]"')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[REDACTED]')
    .replace(/:\/\/([^:\s/@]+):([^@\s/]+)@/g, '://[REDACTED]@');
}

async function defaultCommandExecutor(
  spec: FinalLaunchCommandSpec,
  context: {
    workspaceRoot: string;
    env: NodeJS.ProcessEnv;
  }
): Promise<CommandExecutionResult> {
  const startedAt = Date.now();

  return await new Promise((resolve, reject) => {
    const child = spawn(commandBinary(spec.command), spec.args, {
      cwd: context.workspaceRoot,
      env: {
        ...context.env,
        ...spec.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    let timedOut = false;
    const timeout =
      spec.timeoutMs && spec.timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            child.kill('SIGTERM');
          }, spec.timeoutMs)
        : null;

    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();
      process.stdout.write(chunk);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      output += chunk.toString();
      process.stderr.write(chunk);
    });

    child.on('error', (error) => {
      if (timeout) clearTimeout(timeout);
      reject(error);
    });

    child.on('exit', (code, signal) => {
      if (timeout) clearTimeout(timeout);
      const timeoutMessage = timedOut
        ? `\nCommand timed out after ${spec.timeoutMs}ms and was terminated.\n`
        : '';
      resolve({
        exitCode: code ?? 1,
        signal,
        output: `${output}${timeoutMessage}`,
        durationMs: Date.now() - startedAt,
      });
    });
  });
}

async function writeGateLog(
  workspaceRoot: string,
  outputDir: string,
  gateId: string,
  output: string
) {
  const logPath = path.join(outputDir, `${gateId}.log`);
  const safeOutput = redactSensitiveOutput(output).trim() || 'No output captured.';
  await fs.writeFile(logPath, `${safeOutput}\n`, 'utf8');
  return path.relative(workspaceRoot, logPath).replace(/\\/g, '/');
}

export function countFinalLaunchStatuses(gates: FinalLaunchGateResult[]) {
  const counts: Record<FinalLaunchGateStatus, number> = {
    PASS: 0,
    FAIL: 0,
    UNVERIFIED: 0,
    'NOT APPLICABLE': 0,
  };

  for (const gate of gates) {
    counts[gate.status] += 1;
  }

  return counts;
}

export function computeFinalLaunchVerdict(gates: FinalLaunchGateResult[]) {
  const p0BlockingGateIds = gates.flatMap((gate) =>
    gate.priority === 'P0' && (gate.status === 'FAIL' || gate.status === 'UNVERIFIED')
      ? [gate.id]
      : []
  );

  return {
    verdict: p0BlockingGateIds.length === 0 ? ('GO' as const) : ('NO_GO' as const),
    p0BlockingGateIds,
  };
}

function renderMarkdownReport(bundle: FinalLaunchValidationBundle) {
  const gateRows = bundle.gates
    .map((gate, index) => {
      const evidence = gate.logPath ?? gate.reason ?? '-';
      return `| ${index + 1} | ${gate.priority} | ${gate.label} | ${gate.status} | ${gate.command ?? '-'} | ${evidence} |`;
    })
    .join('\n');

  const blocking =
    bundle.p0BlockingGateIds.length > 0
      ? bundle.p0BlockingGateIds.map((id) => `- ${id}`).join('\n')
      : '- None';

  return `# Final Launch Checklist Status

Generated at: ${bundle.generatedAt}

Workspace: ${bundle.workspace}

Verdict: ${bundle.verdict}

Artifact directory: ${bundle.outputDir}

## Status Counts

- PASS: ${bundle.statusCounts.PASS}
- FAIL: ${bundle.statusCounts.FAIL}
- UNVERIFIED: ${bundle.statusCounts.UNVERIFIED}
- NOT APPLICABLE: ${bundle.statusCounts['NOT APPLICABLE']}

## P0 Blocking Gates

${blocking}

## Gates

| # | Priority | Gate | Status | Command | Evidence |
| - | - | - | - | - | - |
${gateRows}

## Notes

- P0 \`FAIL\` and P0 \`UNVERIFIED\` both produce a \`NO_GO\` verdict.
- \`NOT APPLICABLE\` is only used for gates whose trigger is intentionally absent, such as launch smoke without \`BASE_URL\`.
- Command logs are redacted before writing to this artifact directory.
`;
}

export async function runFinalLaunchValidation(options: FinalLaunchValidationOptions = {}) {
  const workspaceRoot = options.workspaceRoot ?? process.cwd();
  const env = options.env ?? process.env;
  const now = options.now ?? new Date();
  const generatedAt = now.toISOString();
  const artifactDate = getDateSlug(now);
  const outputDir = path.resolve(
    workspaceRoot,
    options.outputDir ?? path.join(workspaceRoot, '.artifacts', `launch-validation-${artifactDate}`)
  );
  const executor = options.executor ?? defaultCommandExecutor;
  const gates = buildFinalLaunchValidationGates({ env, outputDir });
  const results: FinalLaunchGateResult[] = [];

  await fs.mkdir(outputDir, { recursive: true });

  for (const gate of gates) {
    const startedAtDate = new Date();
    const startedAt = startedAtDate.toISOString();

    if (gate.skip || !gate.command) {
      const endedAt = new Date().toISOString();
      results.push({
        id: gate.id,
        label: gate.label,
        priority: gate.priority,
        status: gate.skip?.status ?? 'UNVERIFIED',
        command: gate.command?.display ?? null,
        reason: gate.skip?.reason ?? 'No command was configured for this gate.',
        exitCode: null,
        signal: null,
        durationMs: Date.now() - startedAtDate.getTime(),
        startedAt,
        endedAt,
        logPath: null,
      });
      continue;
    }

    console.log(`\n[launch:validate] ${gate.label}: ${gate.command.display}`);

    try {
      const execution = await executor(gate.command, { workspaceRoot, env });
      const logPath = await writeGateLog(workspaceRoot, outputDir, gate.id, execution.output);
      const endedAt = new Date().toISOString();
      results.push({
        id: gate.id,
        label: gate.label,
        priority: gate.priority,
        status: execution.exitCode === 0 ? 'PASS' : 'FAIL',
        command: gate.command.display,
        reason: execution.exitCode === 0 ? null : `Command exited with ${execution.exitCode}.`,
        exitCode: execution.exitCode,
        signal: execution.signal,
        durationMs: execution.durationMs,
        startedAt,
        endedAt,
        logPath,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const logPath = await writeGateLog(workspaceRoot, outputDir, gate.id, message);
      const endedAt = new Date().toISOString();
      results.push({
        id: gate.id,
        label: gate.label,
        priority: gate.priority,
        status: 'FAIL',
        command: gate.command.display,
        reason: message,
        exitCode: 1,
        signal: null,
        durationMs: Date.now() - startedAtDate.getTime(),
        startedAt,
        endedAt,
        logPath,
      });
    }
  }

  const statusCounts = countFinalLaunchStatuses(results);
  const { verdict, p0BlockingGateIds } = computeFinalLaunchVerdict(results);
  const bundle: FinalLaunchValidationBundle = {
    schemaVersion: FINAL_LAUNCH_VALIDATION_SCHEMA_VERSION,
    kind: 'final_launch_validation',
    generatedAt,
    artifactDate,
    workspace: workspaceRoot,
    outputDir: path.relative(workspaceRoot, outputDir).replace(/\\/g, '/') || '.',
    verdict,
    statusCounts,
    p0BlockingGateIds,
    gates: results,
  };

  await fs.writeFile(
    path.join(outputDir, 'commands.json'),
    `${JSON.stringify(bundle, null, 2)}\n`,
    'utf8'
  );
  await fs.writeFile(
    path.join(outputDir, FINAL_LAUNCH_VALIDATION_REPORT_FILE_NAME),
    renderMarkdownReport(bundle),
    'utf8'
  );

  return {
    bundle,
    outputDir,
    commandsPath: path.join(outputDir, 'commands.json'),
    reportPath: path.join(outputDir, FINAL_LAUNCH_VALIDATION_REPORT_FILE_NAME),
  };
}

export function getDefaultTempValidationDir() {
  return path.join(os.tmpdir(), `proofound-launch-validation-${Date.now()}`);
}
