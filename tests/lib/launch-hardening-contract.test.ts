import { describe, expect, it } from 'vitest';

import {
  LAUNCH_MONITOR_DEFINITIONS,
  LAUNCH_SMOKE_CORRIDOR_VALUES,
  LAUNCH_SMOKE_MATRIX,
  REPO_READY_LAUNCH_SMOKE_SCENARIO_IDS,
  getLaunchSmokeMatrix,
  REQUIRED_SAFE_MODE_FLAGS,
  isLocalLaunchBaseUrl,
  normalizeLaunchBaseUrl,
} from '@/lib/launch/contracts';
import { CLIENT_FEATURE_FLAG_RESPONSE_MAP } from '@/lib/featureFlags';
import {
  SEEDED_PUBLIC_ORG_TRUST_PATH,
  SEEDED_PUBLIC_ORG_TRUST_MONITOR_KEY,
  shouldMonitorSeededPublicOrgTrustPage,
} from '@/lib/launch/public-org-trust-fixture';

describe('launch hardening contract', () => {
  it('defines the canonical smoke matrix for every launch-critical flow', () => {
    expect(LAUNCH_SMOKE_MATRIX.map((item) => item.id)).toEqual([
      'public_individual_portfolio_visible',
      'proof_creation_case',
      'public_org_trust_fixture_live',
      'full_org_corridor_review_to_engagement_verification',
      'hidden_portfolio_protected',
      'privacy_no_leak_case',
    ]);

    expect(Array.from(new Set(LAUNCH_SMOKE_MATRIX.map((item) => item.corridor))).sort()).toEqual(
      [...LAUNCH_SMOKE_CORRIDOR_VALUES].sort()
    );

    for (const scenario of LAUNCH_SMOKE_MATRIX) {
      expect(scenario.expectedState.length).toBeGreaterThan(0);
      if (scenario.runner.kind === 'vitest') {
        expect(scenario.runner.testFiles.length).toBeGreaterThan(0);
      } else {
        expect(scenario.runner.command.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps repo-ready smoke focused on fast repo-owned coverage while full launch stays strict', () => {
    expect(REPO_READY_LAUNCH_SMOKE_SCENARIO_IDS).toEqual([
      'public_individual_portfolio_visible',
      'proof_creation_case',
      'public_org_trust_fixture_live',
      'hidden_portfolio_protected',
      'privacy_no_leak_case',
    ]);

    expect(getLaunchSmokeMatrix('repo').map((item) => item.id)).toEqual(
      REPO_READY_LAUNCH_SMOKE_SCENARIO_IDS
    );
    expect(
      getLaunchSmokeMatrix('repo').some(
        (item) => item.id === 'full_org_corridor_review_to_engagement_verification'
      )
    ).toBe(false);
    expect(getLaunchSmokeMatrix('full').map((item) => item.id)).toEqual(
      LAUNCH_SMOKE_MATRIX.map((item) => item.id)
    );
  });

  it('keeps launch smoke command runners on existing local wrapper scripts', () => {
    const strictOrgCorridor = LAUNCH_SMOKE_MATRIX.find(
      (item) => item.id === 'full_org_corridor_review_to_engagement_verification'
    );

    expect(strictOrgCorridor?.runner.kind).toBe('command');
    if (strictOrgCorridor?.runner.kind === 'command') {
      expect(strictOrgCorridor.runner.command).toContain('./scripts/playwright-node24.mjs');
      expect(strictOrgCorridor.runner.command).not.toContain('./scripts/playwright-node20.mjs');
    }
  });

  it('keeps the seeded public org trust fixture inside the permanent smoke evidence pack', () => {
    const scenario = LAUNCH_SMOKE_MATRIX.find(
      (item) => item.id === 'public_org_trust_fixture_live'
    );

    expect(scenario).toBeDefined();
    expect(scenario?.corridor).toBe('organization');
    expect(scenario?.evidence).toEqual(
      expect.objectContaining({
        fixturePath: SEEDED_PUBLIC_ORG_TRUST_PATH,
      })
    );
    expect(scenario?.runner.kind).toBe('command');
    expect(scenario?.runner.preCommands?.[0]?.command).toEqual([
      'npm',
      'run',
      'seed:public-org-trust-fixture',
    ]);
  });

  it('maps endpoint and synthetic monitor coverage onto the full launch contract', () => {
    const monitorKeys = new Set(LAUNCH_MONITOR_DEFINITIONS.map((item) => item.monitorKey));

    expect(monitorKeys.has('site_root')).toBe(true);
    expect(monitorKeys.has('login_entry')).toBe(true);
    expect(monitorKeys.has('api_health')).toBe(true);
    expect(monitorKeys.has(SEEDED_PUBLIC_ORG_TRUST_MONITOR_KEY)).toBe(
      shouldMonitorSeededPublicOrgTrustPage()
    );

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

  it('normalizes launch base URLs and classifies local versus live targets', () => {
    expect(normalizeLaunchBaseUrl('https://proofound.io/launch/status')).toBe(
      'https://proofound.io'
    );
    expect(normalizeLaunchBaseUrl('http://localhost:3000/api/health')).toBe(
      'http://localhost:3000'
    );

    expect(isLocalLaunchBaseUrl('http://localhost:3000')).toBe(true);
    expect(isLocalLaunchBaseUrl('http://127.0.0.1:3000')).toBe(true);
    expect(isLocalLaunchBaseUrl('https://proofound.io')).toBe(false);
  });
});
