import { describe, expect, it } from 'vitest';

import {
  LAUNCH_MONITOR_DEFINITIONS,
  LAUNCH_SMOKE_MATRIX,
  REQUIRED_SAFE_MODE_FLAGS,
} from '@/lib/launch/contracts';
import { CLIENT_FEATURE_FLAG_RESPONSE_MAP } from '@/lib/featureFlags';

describe('launch hardening contract', () => {
  it('defines the canonical smoke matrix for every launch-critical flow', () => {
    expect(LAUNCH_SMOKE_MATRIX.map((item) => item.id)).toEqual([
      'signup_auth',
      'portfolio_publish_render',
      'assignment_publish',
      'shortlist_generation',
      'invite_redemption',
      'verification_request',
      'feedback_submission',
      'export',
      'delete_unpublish',
    ]);

    for (const scenario of LAUNCH_SMOKE_MATRIX) {
      expect(scenario.testFiles.length).toBeGreaterThan(0);
      expect(scenario.expectedState.length).toBeGreaterThan(0);
    }
  });

  it('maps endpoint and synthetic monitor coverage onto the full launch contract', () => {
    const monitorKeys = new Set(LAUNCH_MONITOR_DEFINITIONS.map((item) => item.monitorKey));

    expect(monitorKeys.has('site_root')).toBe(true);
    expect(monitorKeys.has('login_entry')).toBe(true);
    expect(monitorKeys.has('api_health')).toBe(true);

    for (const scenario of LAUNCH_SMOKE_MATRIX) {
      expect(monitorKeys.has(scenario.id)).toBe(true);
    }
  });

  it('keeps the safe-mode flags exposed through the client feature-flag contract', () => {
    const exposedFlags = new Set(Object.values(CLIENT_FEATURE_FLAG_RESPONSE_MAP));
    for (const flag of REQUIRED_SAFE_MODE_FLAGS) {
      expect(exposedFlags.has(flag)).toBe(true);
    }
  });
});
