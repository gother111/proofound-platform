import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { normalizeLaunchBaseUrl } from '@/lib/launch/contracts';
import { validateLaunchSmokeArtifact } from '@/lib/launch/smoke-artifact';
import {
  REPO_READY_VALIDATION_FILE_NAME,
  runRepoReadyValidationBundle,
  type RepoReadyValidationBundle,
  type RepoReadyValidationGate,
} from '@/lib/launch/repo-ready-validation';

export const FULL_LAUNCH_GATE_SUMMARY_FILE_NAME = '24_gate_summary.json';

type FullLaunchValidationOptions = {
  workspaceRoot?: string;
  now?: Date;
  liveBaseUrl?: string | null;
  fetchImpl?: typeof fetch;
};

type FullLaunchGateStatus = 'PASS' | 'FAIL' | 'BLOCKED' | 'UNVERIFIED';

type FullLaunchGate = {
  id: string;
  status: FullLaunchGateStatus;
  summary: string;
  evidence: string[];
  [key: string]: unknown;
};

type FullLaunchValidationBundle = {
  generatedAt: string;
  workspace: string;
  branch: string;
  head: string;
  authoritativeBaseUrl: string | null;
  verdict: 'GO' | 'NO_GO';
  recommendation: string;
  blockingGateIds: string[];
  gates: FullLaunchGate[];
};

function commandBinary(name: string) {
  return process.platform === 'win32' ? `${name}.cmd` : name;
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
) {
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

async function writeJson(filePath: string, payload: unknown) {
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function writeLog(filePath: string, content: string) {
  await fs.writeFile(filePath, `${content.trim()}\n`, 'utf8');
}

function gateFromRepoReadyGate(
  gate: RepoReadyValidationGate | undefined,
  fallback: {
    id: string;
    summary: string;
  }
): FullLaunchGate {
  if (!gate) {
    return {
      id: fallback.id,
      status: 'UNVERIFIED',
      summary: fallback.summary,
      evidence: [],
    };
  }

  return {
    id: fallback.id,
    status: gate.status,
    summary: gate.summary,
    evidence: gate.evidence,
    command: gate.command,
  };
}

async function fetchJsonWithTimeout(fetchImpl: typeof fetch, url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      headers: {
        accept: 'application/json',
      },
      signal: controller.signal,
    });
    const text = await response.text();
    let payload: Record<string, unknown> | null = null;
    try {
      payload = text ? (JSON.parse(text) as Record<string, unknown>) : null;
    } catch {
      payload = null;
    }
    return {
      ok: response.ok,
      status: response.status,
      payload,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      payload: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveGitValue(args: string[], workspaceRoot: string) {
  const result = runCapturedCommand(['git', ...args], workspaceRoot);
  if (result.exitCode !== 0) {
    return 'unknown';
  }
  return result.output.split(/\r?\n/)[0]?.trim() || 'unknown';
}

function mapRepoReadyGates(bundle: RepoReadyValidationBundle) {
  return new Map(bundle.gates.map((gate) => [gate.id, gate] as const));
}

export async function runFullLaunchValidationBundle(options: FullLaunchValidationOptions = {}) {
  const workspaceRoot = options.workspaceRoot ?? process.cwd();
  const now = options.now ?? new Date();
  const generatedAt = now.toISOString();

  const repoReady = await runRepoReadyValidationBundle({ workspaceRoot, now });
  const outputDir = repoReady.outputDir;
  const repoGates = mapRepoReadyGates(repoReady.bundle);
  const gitHead = await resolveGitValue(['rev-parse', 'HEAD'], workspaceRoot);
  const gitBranch = await resolveGitValue(['rev-parse', '--abbrev-ref', 'HEAD'], workspaceRoot);

  const liveBaseUrl =
    options.liveBaseUrl != null
      ? normalizeLaunchBaseUrl(options.liveBaseUrl)
      : process.env.LAUNCH_CHECKLIST_LIVE_BASE_URL
        ? normalizeLaunchBaseUrl(process.env.LAUNCH_CHECKLIST_LIVE_BASE_URL)
        : process.env.BASE_URL
          ? normalizeLaunchBaseUrl(process.env.BASE_URL)
          : 'https://proofound.io';

  const gates: FullLaunchGate[] = [
    gateFromRepoReadyGate(repoGates.get('prod_build'), {
      id: 'prod_build',
      summary: 'Repo-ready build evidence was not available.',
    }),
    gateFromRepoReadyGate(repoGates.get('prod_boot'), {
      id: 'prod_boot',
      summary: 'Repo-ready production boot evidence was not available.',
    }),
    {
      id: 'local_api_health',
      status: repoGates.get('prod_boot')?.status === 'PASS' ? 'PASS' : 'BLOCKED',
      summary:
        repoGates.get('prod_boot')?.status === 'PASS'
          ? 'Local production boot reached a healthy `/api/health` response during repo-ready validation.'
          : 'Skipped because local production boot did not become healthy.',
      evidence: repoGates.get('prod_boot')?.evidence ?? [],
    },
    gateFromRepoReadyGate(repoGates.get('route_surface_and_archived_routes'), {
      id: 'route_surface_and_archived_routes',
      summary: 'Repo-ready route-surface evidence was not available.',
    }),
    gateFromRepoReadyGate(repoGates.get('private_context_scaffolding'), {
      id: 'private_context_scaffolding',
      summary: 'Repo-ready private context scaffolding evidence was not available.',
    }),
    gateFromRepoReadyGate(repoGates.get('manual_privacy_sweep'), {
      id: 'manual_privacy_sweep',
      summary: 'Repo-ready manual privacy evidence was not available.',
    }),
    gateFromRepoReadyGate(repoGates.get('workflow_email_privacy'), {
      id: 'workflow_email_privacy',
      summary: 'Repo-ready workflow email privacy evidence was not available.',
    }),
    gateFromRepoReadyGate(repoGates.get('internal_admin_surfaces'), {
      id: 'internal_admin_surfaces',
      summary: 'Repo-ready internal admin surface evidence was not available.',
    }),
  ];

  const smokeArtifactPath = path.join(outputDir, '21_live_launch_smoke_report.json');
  const smokeLogPath = path.join(outputDir, '21_live_launch_smoke.log');
  const smokeRun = runCapturedCommand(
    [
      'npm',
      'run',
      'test:launch:smoke',
      '--',
      '--scope',
      'full',
      '--base-url',
      liveBaseUrl,
      '--artifact',
      smokeArtifactPath,
    ],
    workspaceRoot,
    { BASE_URL: liveBaseUrl },
    900_000
  );
  await writeLog(smokeLogPath, smokeRun.output);

  let smokeArtifactEvidence: string[] = [
    path.relative(workspaceRoot, smokeLogPath).replace(/\\/g, '/'),
  ];
  let smokeArtifactSummary = 'Live-targeted launch smoke artifact refresh failed.';
  let publicOrgTrustSmokeGate: FullLaunchGate = {
    id: 'public_org_trust_smoke',
    status: smokeRun.exitCode === 0 ? 'PASS' : 'FAIL',
    summary: 'Public org trust smoke result could not be extracted from the full smoke artifact.',
    evidence: smokeArtifactEvidence,
  };
  let liveLaunchSmokeGate: FullLaunchGate = {
    id: 'live_launch_smoke_artifact_refresh',
    status: smokeRun.exitCode === 0 ? 'PASS' : 'FAIL',
    summary: smokeArtifactSummary,
    evidence: smokeArtifactEvidence,
  };

  try {
    const rawArtifact = await fs.readFile(smokeArtifactPath, 'utf8');
    const artifact = validateLaunchSmokeArtifact(JSON.parse(rawArtifact));
    smokeArtifactEvidence = [
      path.relative(workspaceRoot, smokeLogPath).replace(/\\/g, '/'),
      path.relative(workspaceRoot, smokeArtifactPath).replace(/\\/g, '/'),
    ];
    smokeArtifactSummary =
      artifact.overallStatus === 'pass'
        ? 'Live-targeted full launch smoke artifact refreshed successfully.'
        : 'Live-targeted full launch smoke artifact was refreshed but did not fully pass.';

    liveLaunchSmokeGate = {
      id: 'live_launch_smoke_artifact_refresh',
      status: artifact.overallStatus === 'pass' ? 'PASS' : 'FAIL',
      summary: smokeArtifactSummary,
      evidence: smokeArtifactEvidence,
      smokeChecks: artifact.checks.map((check) => ({
        id: check.id,
        status: check.status,
        durationMs: check.durationMs,
      })),
    };

    const orgTrustCheck = artifact.checks.find(
      (check) => check.id === 'public_org_trust_fixture_live'
    );
    publicOrgTrustSmokeGate = {
      id: 'public_org_trust_smoke',
      status: orgTrustCheck?.status === 'pass' ? 'PASS' : 'FAIL',
      summary:
        orgTrustCheck?.status === 'pass'
          ? 'Read-only public org trust smoke passed against the live site.'
          : (orgTrustCheck?.message ??
            'Public org trust smoke did not pass in the full live smoke artifact.'),
      evidence: smokeArtifactEvidence,
    };
  } catch {
    // Leave the smoke gates in their failure state with the log evidence only.
  }

  gates.push(publicOrgTrustSmokeGate, liveLaunchSmokeGate);

  if (options.fetchImpl) {
    const [healthResult, launchStatusResult] = await Promise.all([
      fetchJsonWithTimeout(options.fetchImpl, `${liveBaseUrl}/api/health`, 12_000),
      fetchJsonWithTimeout(
        options.fetchImpl,
        `${liveBaseUrl}/api/monitoring/launch-status`,
        15_000
      ),
    ]);

    const healthPath = path.join(outputDir, '20_live_health.json');
    const launchStatusPath = path.join(outputDir, '23_live_launch_status.json');
    await writeJson(healthPath, {
      url: `${liveBaseUrl}/api/health`,
      ...healthResult,
      observedAt: generatedAt,
    });
    await writeJson(launchStatusPath, {
      url: `${liveBaseUrl}/api/monitoring/launch-status`,
      ...launchStatusResult,
      observedAt: generatedAt,
    });

    gates.push(
      {
        id: 'live_api_health',
        status: healthResult.ok && healthResult.payload?.status === 'healthy' ? 'PASS' : 'FAIL',
        summary:
          healthResult.ok && healthResult.payload?.status === 'healthy'
            ? 'Live `/api/health` returned healthy.'
            : `Live \`/api/health\` did not return healthy.${
                healthResult.error ? ` ${healthResult.error}` : ''
              }`.trim(),
        evidence: [path.relative(workspaceRoot, healthPath).replace(/\\/g, '/')],
      },
      {
        id: 'live_launch_status',
        status:
          launchStatusResult.ok &&
          launchStatusResult.payload?.ok === true &&
          launchStatusResult.payload?.readinessState === 'ready'
            ? 'PASS'
            : 'FAIL',
        summary:
          launchStatusResult.ok &&
          launchStatusResult.payload?.ok === true &&
          launchStatusResult.payload?.readinessState === 'ready'
            ? 'Live `/api/monitoring/launch-status` reported ready.'
            : `Live \`/api/monitoring/launch-status\` did not report ready.${
                launchStatusResult.error ? ` ${launchStatusResult.error}` : ''
              }`.trim(),
        evidence: [path.relative(workspaceRoot, launchStatusPath).replace(/\\/g, '/')],
        readinessState: launchStatusResult.payload?.readinessState ?? null,
        notReadyReasonCodes: Array.isArray(launchStatusResult.payload?.notReadyReasons)
          ? (launchStatusResult.payload?.notReadyReasons as Array<Record<string, unknown>>).flatMap(
              (reason) => (typeof reason.code === 'string' ? [reason.code] : [])
            )
          : [],
      }
    );
  } else {
    gates.push(
      {
        id: 'live_api_health',
        status: 'UNVERIFIED',
        summary:
          'Live health endpoint was not checked because no fetch implementation was provided.',
        evidence: [],
      },
      {
        id: 'live_launch_status',
        status: 'UNVERIFIED',
        summary:
          'Live launch-status endpoint was not checked because no fetch implementation was provided.',
        evidence: [],
      }
    );
  }

  const blockingGateIds = gates
    .filter((gate) =>
      [
        'prod_build',
        'prod_boot',
        'route_surface_and_archived_routes',
        'private_context_scaffolding',
        'manual_privacy_sweep',
        'workflow_email_privacy',
        'internal_admin_surfaces',
        'live_launch_smoke_artifact_refresh',
        'live_launch_status',
      ].includes(gate.id)
    )
    .filter((gate) => gate.status !== 'PASS')
    .map((gate) => gate.id);

  const verdict = blockingGateIds.length === 0 ? 'GO' : 'NO_GO';
  const recommendation =
    verdict === 'GO'
      ? 'GO because repo-owned gates and live launch smoke/status evidence are green.'
      : `NO_GO because these full-launch gates remain open: ${blockingGateIds.join(', ')}.`;

  const bundle: FullLaunchValidationBundle = {
    generatedAt,
    workspace: workspaceRoot,
    branch: gitBranch,
    head: gitHead,
    authoritativeBaseUrl: liveBaseUrl,
    verdict,
    recommendation,
    blockingGateIds,
    gates,
  };

  const bundlePath = path.join(outputDir, FULL_LAUNCH_GATE_SUMMARY_FILE_NAME);
  await writeJson(bundlePath, bundle);

  return {
    bundle,
    bundlePath,
    outputDir,
    repoReadyBundlePath: path.join(outputDir, REPO_READY_VALIDATION_FILE_NAME),
  };
}
