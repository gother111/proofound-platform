import type {
  LaunchAlertSeverity,
  LaunchMonitorDefinition,
  LaunchMonitorStatus,
} from '@/lib/launch/contracts';

export const LAUNCH_ALERT_POLICY = {
  p1: {
    acknowledgeWithinMinutes: 15,
    defaultConsecutiveFailures: 1,
  },
  p2: {
    acknowledgeWithinMinutes: 4 * 60,
    defaultConsecutiveFailures: 2,
  },
  queueBacklogThresholds: {
    verification_pending_manual: 25,
    intro_hold: 10,
    fairness_remediation: 5,
    feedback_pending: 50,
  },
} as const;

export function classifyLaunchAlertStatus(params: {
  definition: Pick<LaunchMonitorDefinition, 'severity' | 'alertAfterConsecutiveFailures'>;
  status: LaunchMonitorStatus;
  consecutiveFailures: number;
}): 'healthy' | LaunchAlertSeverity {
  const { definition, status, consecutiveFailures } = params;

  if (status === 'pass') return 'healthy';

  const threshold =
    definition.alertAfterConsecutiveFailures ||
    LAUNCH_ALERT_POLICY[definition.severity].defaultConsecutiveFailures;

  if (status === 'fail' && consecutiveFailures >= threshold) {
    return definition.severity;
  }

  if (status === 'degraded' && definition.severity === 'p1' && consecutiveFailures >= threshold) {
    return 'p1';
  }

  if (status === 'degraded' && consecutiveFailures >= threshold) {
    return 'p2';
  }

  return 'healthy';
}

export function classifyQueueBacklog(
  queueKey: keyof typeof LAUNCH_ALERT_POLICY.queueBacklogThresholds,
  depth: number
) {
  const threshold = LAUNCH_ALERT_POLICY.queueBacklogThresholds[queueKey];
  return depth >= threshold ? 'p2' : 'healthy';
}
