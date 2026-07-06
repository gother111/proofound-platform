import {
  LAUNCH_MONITOR_STATUS_VALUES,
  LAUNCH_SMOKE_CORRIDOR_VALUES,
  LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES,
  LAUNCH_SMOKE_MATRIX,
  normalizeLaunchBaseUrl,
  type LaunchMonitorStatus,
  type LaunchSmokeCorridor,
} from '@/lib/launch/contracts';
import { z } from 'zod';

const LegacyLaunchSmokeCheckSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(LAUNCH_MONITOR_STATUS_VALUES),
  expectedState: z.string().min(1),
  durationMs: z.number().int().nonnegative(),
  testFiles: z.array(z.string().min(1)).min(1),
  message: z.string().optional(),
  outputSnippet: z.string().optional(),
  generatedAt: z.string().datetime(),
});

const LegacyLaunchSmokeArtifactSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string().datetime(),
  overallStatus: z.enum(LAUNCH_MONITOR_STATUS_VALUES),
  checks: z.array(LegacyLaunchSmokeCheckSchema),
});

const LaunchSmokeRunnerSchema = z.union([
  z.object({
    kind: z.literal('vitest'),
    label: z.literal('vitest'),
    testFiles: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    kind: z.literal('command'),
    label: z.string().min(1),
    command: z.array(z.string().min(1)).min(1),
    preCommands: z
      .array(
        z.object({
          label: z.string().min(1),
          command: z.array(z.string().min(1)).min(1),
        })
      )
      .optional(),
    env: z.record(z.string()).optional(),
  }),
]);

const LaunchSmokeCheckSchema = z.object({
  id: z.string().min(1),
  corridor: z.enum(LAUNCH_SMOKE_CORRIDOR_VALUES),
  label: z.string().min(1),
  runner: LaunchSmokeRunnerSchema,
  status: z.enum(LAUNCH_MONITOR_STATUS_VALUES),
  expectedState: z.string().min(1),
  durationMs: z.number().int().nonnegative(),
  generatedAt: z.string().datetime(),
  message: z.string().optional(),
  outputSnippet: z.string().optional(),
  evidence: z.record(z.string()).optional(),
});

const LaunchSmokeCorridorSchema = z.object({
  id: z.enum(LAUNCH_SMOKE_CORRIDOR_VALUES),
  label: z.string().min(1),
  status: z.enum(LAUNCH_MONITOR_STATUS_VALUES),
  checkIds: z.array(z.string().min(1)),
  generatedAt: z.string().datetime(),
});

const LaunchSmokeArtifactV2Schema = z.object({
  schemaVersion: z.literal(2),
  generatedAt: z.string().datetime(),
  targetBaseUrl: z.string().url().optional(),
  executionMode: z.enum(['local', 'live']).optional(),
  freshnessThresholdMinutes: z.number().int().positive(),
  expiresAt: z.string().datetime(),
  overallStatus: z.enum(LAUNCH_MONITOR_STATUS_VALUES),
  corridors: z.array(LaunchSmokeCorridorSchema),
  checks: z.array(LaunchSmokeCheckSchema),
});

const LEGACY_CHECK_CORRIDOR_MAP: Record<string, LaunchSmokeCorridor> = {
  first_proof_first_individual: 'individual',
  public_portfolio_publish: 'individual',
  privacy_reveal_enforcement: 'trust_privacy',
  assignment_publish: 'organization',
  intro_reveal_interview_decision: 'organization',
  engagement_verification: 'organization',
};

export type LaunchSmokeCheckResult = z.infer<typeof LaunchSmokeCheckSchema>;
export type LaunchSmokeArtifact = z.infer<typeof LaunchSmokeArtifactV2Schema>;
export type LaunchSmokeCorridorResult = z.infer<typeof LaunchSmokeCorridorSchema>;
export type LaunchSmokeArtifactEvaluationState =
  | 'fresh_passing'
  | 'fresh_failing'
  | 'stale'
  | 'missing_target'
  | 'wrong_target';
export type LaunchSmokeArtifactEvaluation = {
  state: LaunchSmokeArtifactEvaluationState;
  passes: boolean;
  blocking: boolean;
  fresh: boolean;
  stale: boolean;
  ageMinutes: number;
  freshnessThresholdMinutes: number;
  targetBaseUrl: string | null;
  requestedBaseUrl: string | null;
  overallStatus: LaunchMonitorStatus;
  failingScenarioIds: LaunchSmokeCheckResult['id'][];
  incompleteScenarioIds: LaunchSmokeCheckResult['id'][];
  message: string;
};

type LaunchSmokeScenarioId = LaunchSmokeCheckResult['id'];

function getRequiredLaunchSmokeScenarioIds(): LaunchSmokeScenarioId[] {
  return LAUNCH_SMOKE_MATRIX.map((scenario) => scenario.id);
}

function getIncompleteLaunchSmokeScenarioIds(
  artifact: LaunchSmokeArtifact
): LaunchSmokeScenarioId[] {
  const checkIds = new Set(artifact.checks.map((check) => check.id));

  return getRequiredLaunchSmokeScenarioIds().filter((scenarioId) => !checkIds.has(scenarioId));
}

function getFailingLaunchSmokeScenarioIds(artifact: LaunchSmokeArtifact): LaunchSmokeScenarioId[] {
  const checkById = new Map(artifact.checks.map((check) => [check.id, check] as const));

  return getRequiredLaunchSmokeScenarioIds().filter(
    (scenarioId) => checkById.get(scenarioId)?.status !== 'pass'
  );
}

function getScenarioCorridor(id: string): LaunchSmokeCorridor | null {
  const current = LAUNCH_SMOKE_MATRIX.find((item) => item.id === id);
  if (current) {
    return current.corridor;
  }

  return LEGACY_CHECK_CORRIDOR_MAP[id] ?? null;
}

export function getLaunchSmokeCorridorLabel(corridor: LaunchSmokeCorridor): string {
  switch (corridor) {
    case 'individual':
      return 'Individual corridor';
    case 'organization':
      return 'Organization corridor';
    case 'trust_privacy':
      return 'Trust / privacy corridor';
  }
}

export function aggregateLaunchSmokeStatus(
  checks: Array<Pick<LaunchSmokeCheckResult, 'status'>>
): LaunchMonitorStatus {
  if (checks.some((check) => check.status === 'fail')) return 'fail';
  if (checks.some((check) => check.status === 'degraded')) return 'degraded';
  return 'pass';
}

export function buildLaunchSmokeCorridors(
  checks: LaunchSmokeCheckResult[],
  generatedAt: string
): LaunchSmokeCorridorResult[] {
  return LAUNCH_SMOKE_CORRIDOR_VALUES.map((corridor) => {
    const corridorChecks = checks.filter((check) => check.corridor === corridor);

    return {
      id: corridor,
      label: getLaunchSmokeCorridorLabel(corridor),
      status: aggregateLaunchSmokeStatus(corridorChecks),
      checkIds: corridorChecks.map((check) => check.id),
      generatedAt,
    };
  });
}

function normalizeLegacyArtifact(
  artifact: z.infer<typeof LegacyLaunchSmokeArtifactSchema>
): LaunchSmokeArtifact {
  const freshnessThresholdMinutes = LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES;
  const checks: LaunchSmokeCheckResult[] = artifact.checks.map((check) => ({
    id: check.id,
    corridor: getScenarioCorridor(check.id) ?? 'trust_privacy',
    label: check.label,
    runner: {
      kind: 'vitest',
      label: 'vitest',
      testFiles: check.testFiles,
    },
    status: check.status,
    expectedState: check.expectedState,
    durationMs: check.durationMs,
    generatedAt: check.generatedAt,
    message: check.message,
    outputSnippet: check.outputSnippet,
  }));

  return LaunchSmokeArtifactV2Schema.parse({
    schemaVersion: 2,
    generatedAt: artifact.generatedAt,
    freshnessThresholdMinutes,
    expiresAt: new Date(
      new Date(artifact.generatedAt).getTime() + freshnessThresholdMinutes * 60_000
    ).toISOString(),
    overallStatus: artifact.overallStatus,
    corridors: buildLaunchSmokeCorridors(checks, artifact.generatedAt),
    checks,
  });
}

export function validateLaunchSmokeArtifact(value: unknown): LaunchSmokeArtifact {
  const parsedV2 = LaunchSmokeArtifactV2Schema.safeParse(value);
  if (parsedV2.success) {
    return parsedV2.data;
  }

  const parsedLegacy = LegacyLaunchSmokeArtifactSchema.safeParse(value);
  if (parsedLegacy.success) {
    return normalizeLegacyArtifact(parsedLegacy.data);
  }

  throw parsedV2.error;
}

export function getLaunchSmokeCheckStatus(artifact: LaunchSmokeArtifact, scenarioId: string) {
  return artifact.checks.find((check) => check.id === scenarioId) ?? null;
}

export function getLaunchSmokeFreshnessThresholdMinutes(artifact: LaunchSmokeArtifact): number {
  return artifact.freshnessThresholdMinutes;
}

export function getLaunchSmokeTargetBaseUrl(artifact: LaunchSmokeArtifact): string | null {
  if (!artifact.targetBaseUrl) {
    return null;
  }

  return normalizeLaunchBaseUrl(artifact.targetBaseUrl);
}

export function isLaunchSmokeArtifactForBaseUrl(
  artifact: LaunchSmokeArtifact,
  baseUrl: string
): boolean {
  const artifactBaseUrl = getLaunchSmokeTargetBaseUrl(artifact);
  if (!artifactBaseUrl) {
    // Backward-compatibility for artifacts written before target binding was added.
    return true;
  }

  return artifactBaseUrl === normalizeLaunchBaseUrl(baseUrl);
}

export function hasPassingLaunchSmokeArtifact(artifact: LaunchSmokeArtifact): boolean {
  return evaluateLaunchSmokeArtifact(artifact).state === 'fresh_passing';
}

export function getLaunchSmokeAgeMinutes(artifact: LaunchSmokeArtifact, now = new Date()): number {
  return Math.max(
    0,
    Math.round((now.getTime() - new Date(artifact.generatedAt).getTime()) / 60_000)
  );
}

export function evaluateLaunchSmokeArtifact(
  artifact: LaunchSmokeArtifact,
  options: {
    now?: Date;
    baseUrl?: string;
    requireTargetBaseUrl?: boolean;
  } = {}
): LaunchSmokeArtifactEvaluation {
  const now = options.now ?? new Date();
  const ageMinutes = getLaunchSmokeAgeMinutes(artifact, now);
  const freshnessThresholdMinutes = getLaunchSmokeFreshnessThresholdMinutes(artifact);
  const targetBaseUrl = getLaunchSmokeTargetBaseUrl(artifact);
  const requestedBaseUrl = options.baseUrl ? normalizeLaunchBaseUrl(options.baseUrl) : null;
  const incompleteScenarioIds = getIncompleteLaunchSmokeScenarioIds(artifact);
  const failingScenarioIds = getFailingLaunchSmokeScenarioIds(artifact);
  const stale = ageMinutes > freshnessThresholdMinutes;
  const targetMismatch =
    requestedBaseUrl != null && !isLaunchSmokeArtifactForBaseUrl(artifact, requestedBaseUrl);
  const missingRequiredTarget = options.requireTargetBaseUrl === true && !targetBaseUrl;

  if (missingRequiredTarget) {
    return {
      state: 'missing_target',
      passes: false,
      blocking: true,
      fresh: false,
      stale: false,
      ageMinutes,
      freshnessThresholdMinutes,
      targetBaseUrl,
      requestedBaseUrl,
      overallStatus: artifact.overallStatus,
      failingScenarioIds,
      incompleteScenarioIds,
      message:
        'launch smoke artifact is missing targetBaseUrl and cannot prove production-candidate launch readiness',
    };
  }

  if (targetMismatch) {
    return {
      state: 'wrong_target',
      passes: false,
      blocking: true,
      fresh: false,
      stale: false,
      ageMinutes,
      freshnessThresholdMinutes,
      targetBaseUrl,
      requestedBaseUrl,
      overallStatus: artifact.overallStatus,
      failingScenarioIds,
      incompleteScenarioIds,
      message: `launch smoke artifact target (${targetBaseUrl ?? 'unknown'}) does not match requested BASE_URL (${requestedBaseUrl})`,
    };
  }

  if (stale) {
    return {
      state: 'stale',
      passes: false,
      blocking: true,
      fresh: false,
      stale: true,
      ageMinutes,
      freshnessThresholdMinutes,
      targetBaseUrl,
      requestedBaseUrl,
      overallStatus: artifact.overallStatus,
      failingScenarioIds,
      incompleteScenarioIds,
      message:
        'launch smoke artifact is stale and must be refreshed before launch readiness can go green',
    };
  }

  if (
    artifact.overallStatus !== 'pass' ||
    failingScenarioIds.length > 0 ||
    incompleteScenarioIds.length > 0
  ) {
    const detailSegments: string[] = [];

    if (failingScenarioIds.length > 0) {
      detailSegments.push(`failing scenarios: ${failingScenarioIds.join(', ')}`);
    }

    if (incompleteScenarioIds.length > 0) {
      detailSegments.push(`missing scenarios: ${incompleteScenarioIds.join(', ')}`);
    }

    return {
      state: 'fresh_failing',
      passes: false,
      blocking: true,
      fresh: true,
      stale: false,
      ageMinutes,
      freshnessThresholdMinutes,
      targetBaseUrl,
      requestedBaseUrl,
      overallStatus: artifact.overallStatus,
      failingScenarioIds,
      incompleteScenarioIds,
      message: [
        'launch smoke artifact is fresh but failing and blocks launch readiness',
        detailSegments.length > 0 ? `(${detailSegments.join('; ')})` : '',
      ]
        .filter(Boolean)
        .join(' '),
    };
  }

  return {
    state: 'fresh_passing',
    passes: true,
    blocking: false,
    fresh: true,
    stale: false,
    ageMinutes,
    freshnessThresholdMinutes,
    targetBaseUrl,
    requestedBaseUrl,
    overallStatus: artifact.overallStatus,
    failingScenarioIds: [],
    incompleteScenarioIds: [],
    message: 'launch smoke artifact is fresh and passing',
  };
}
