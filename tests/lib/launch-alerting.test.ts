import { describe, expect, it } from 'vitest';

import {
  classifyLaunchAlertStatus,
  classifyQueueBacklog,
  LAUNCH_ALERT_POLICY,
} from '@/lib/launch/alerting';

describe('launch alerting policy', () => {
  it('escalates p1 failures immediately', () => {
    expect(
      classifyLaunchAlertStatus({
        definition: {
          severity: 'p1',
          alertAfterConsecutiveFailures: 1,
        },
        status: 'fail',
        consecutiveFailures: 1,
      })
    ).toBe('p1');
  });

  it('waits for the p2 threshold before escalation', () => {
    expect(
      classifyLaunchAlertStatus({
        definition: {
          severity: 'p2',
          alertAfterConsecutiveFailures: 2,
        },
        status: 'fail',
        consecutiveFailures: 1,
      })
    ).toBe('healthy');

    expect(
      classifyLaunchAlertStatus({
        definition: {
          severity: 'p2',
          alertAfterConsecutiveFailures: 2,
        },
        status: 'fail',
        consecutiveFailures: 2,
      })
    ).toBe('p2');
  });

  it('marks queue backlog breaches as p2', () => {
    expect(
      classifyQueueBacklog(
        'verification_pending_manual',
        LAUNCH_ALERT_POLICY.queueBacklogThresholds.verification_pending_manual
      )
    ).toBe('p2');
  });
});
