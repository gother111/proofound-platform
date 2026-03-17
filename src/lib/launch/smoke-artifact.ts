import {
  LAUNCH_MONITOR_STATUS_VALUES,
  LAUNCH_SMOKE_CORRIDOR_VALUES,
  LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES,
  LAUNCH_SMOKE_MATRIX,
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

export function hasPassingLaunchSmokeArtifact(artifact: LaunchSmokeArtifact): boolean {
  const checkById = new Map(artifact.checks.map((check) => [check.id, check] as const));

  return (
    artifact.overallStatus === 'pass' &&
    LAUNCH_SMOKE_MATRIX.every((scenario) => checkById.get(scenario.id)?.status === 'pass')
  );
}

export function getLaunchSmokeAgeMinutes(artifact: LaunchSmokeArtifact, now = new Date()): number {
  return Math.max(
    0,
    Math.round((now.getTime() - new Date(artifact.generatedAt).getTime()) / 60_000)
  );
}
