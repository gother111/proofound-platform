import { z } from 'zod';

import {
  LAUNCH_MONITOR_STATUS_VALUES,
  LAUNCH_SMOKE_MATRIX,
  type LaunchMonitorStatus,
} from '@/lib/launch/contracts';

const LaunchSmokeCheckSchema = z.object({
  id: z.enum(LAUNCH_SMOKE_MATRIX.map((item) => item.id) as [string, ...string[]]),
  label: z.string().min(1),
  status: z.enum(LAUNCH_MONITOR_STATUS_VALUES),
  expectedState: z.string().min(1),
  durationMs: z.number().int().nonnegative(),
  testFiles: z.array(z.string().min(1)).min(1),
  message: z.string().optional(),
  outputSnippet: z.string().optional(),
  generatedAt: z.string().datetime(),
});

export const LaunchSmokeArtifactSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string().datetime(),
  overallStatus: z.enum(LAUNCH_MONITOR_STATUS_VALUES),
  checks: z.array(LaunchSmokeCheckSchema),
});

export type LaunchSmokeCheckResult = z.infer<typeof LaunchSmokeCheckSchema>;
export type LaunchSmokeArtifact = z.infer<typeof LaunchSmokeArtifactSchema>;

export function validateLaunchSmokeArtifact(value: unknown): LaunchSmokeArtifact {
  return LaunchSmokeArtifactSchema.parse(value);
}

export function getLaunchSmokeCheckStatus(
  artifact: LaunchSmokeArtifact,
  scenarioId: LaunchSmokeCheckResult['id']
): LaunchSmokeCheckResult | null {
  return artifact.checks.find((check) => check.id === scenarioId) ?? null;
}

export function hasPassingLaunchSmokeArtifact(artifact: LaunchSmokeArtifact): boolean {
  return (
    artifact.overallStatus === 'pass' && artifact.checks.every((check) => check.status === 'pass')
  );
}

export function getLaunchSmokeAgeMinutes(artifact: LaunchSmokeArtifact, now = new Date()): number {
  return Math.max(
    0,
    Math.round((now.getTime() - new Date(artifact.generatedAt).getTime()) / 60_000)
  );
}

export function aggregateLaunchSmokeStatus(
  checks: Array<Pick<LaunchSmokeCheckResult, 'status'>>
): LaunchMonitorStatus {
  if (checks.some((check) => check.status === 'fail')) return 'fail';
  if (checks.some((check) => check.status === 'degraded')) return 'degraded';
  return 'pass';
}
