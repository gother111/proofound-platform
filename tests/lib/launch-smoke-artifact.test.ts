import { describe, expect, it } from 'vitest';

import {
  buildLaunchSmokeCorridors,
  evaluateLaunchSmokeArtifact,
  getLaunchSmokeFreshnessThresholdMinutes,
  getLaunchSmokeTargetBaseUrl,
  hasPassingLaunchSmokeArtifact,
  isLaunchSmokeArtifactForBaseUrl,
  validateLaunchSmokeArtifact,
  type LaunchSmokeCheckResult,
} from '@/lib/launch/smoke-artifact';

describe('launch smoke artifact', () => {
  it('normalizes legacy v1 smoke artifacts into the v2 shape', () => {
    const artifact = validateLaunchSmokeArtifact({
      schemaVersion: 1,
      generatedAt: '2026-03-16T10:00:00.000Z',
      overallStatus: 'pass',
      checks: [
        {
          id: 'public_portfolio_publish',
          label: 'Public portfolio publish',
          status: 'pass',
          expectedState: 'public_portfolio_live',
          durationMs: 100,
          testFiles: ['tests/api/public-portfolio-summary-route.test.ts'],
          generatedAt: '2026-03-16T10:00:00.000Z',
        },
      ],
    });

    expect(artifact.schemaVersion).toBe(2);
    expect(artifact.freshnessThresholdMinutes).toBe(60);
    expect(artifact.corridors.find((corridor) => corridor.id === 'individual')).toEqual(
      expect.objectContaining({
        status: 'pass',
        checkIds: ['public_portfolio_publish'],
      })
    );
  });

  it('requires the current smoke matrix to be fully present before go/no-go treats the artifact as passing', () => {
    const artifact = validateLaunchSmokeArtifact({
      schemaVersion: 2,
      generatedAt: '2026-03-16T10:00:00.000Z',
      freshnessThresholdMinutes: 60,
      expiresAt: '2026-03-16T11:00:00.000Z',
      overallStatus: 'pass',
      corridors: [],
      checks: [
        {
          id: 'public_individual_portfolio_visible',
          corridor: 'individual',
          label: 'Public individual portfolio visible case',
          runner: {
            kind: 'vitest',
            label: 'vitest',
            testFiles: ['tests/ui/public-portfolio-access-consistency.test.tsx'],
          },
          status: 'pass',
          expectedState: 'public_individual_portfolio_visible',
          durationMs: 100,
          generatedAt: '2026-03-16T10:00:00.000Z',
        },
      ],
    });

    expect(getLaunchSmokeFreshnessThresholdMinutes(artifact)).toBe(60);
    expect(hasPassingLaunchSmokeArtifact(artifact)).toBe(false);
    expect(
      evaluateLaunchSmokeArtifact(artifact, {
        now: new Date('2026-03-16T10:30:00.000Z'),
      }).state
    ).toBe('fresh_failing');
  });

  it('builds corridor rollups from per-check evidence', () => {
    const checks: LaunchSmokeCheckResult[] = [
      {
        id: 'public_individual_portfolio_visible',
        corridor: 'individual',
        label: 'Public individual portfolio visible case',
        runner: {
          kind: 'vitest',
          label: 'vitest',
          testFiles: ['tests/ui/public-portfolio-access-consistency.test.tsx'],
        },
        status: 'pass',
        expectedState: 'public_individual_portfolio_visible',
        durationMs: 100,
        generatedAt: '2026-03-16T10:00:00.000Z',
      },
      {
        id: 'hidden_portfolio_protected',
        corridor: 'trust_privacy',
        label: 'Hidden portfolio protected case',
        runner: {
          kind: 'vitest',
          label: 'vitest',
          testFiles: ['tests/ui/public-portfolio-access-consistency.test.tsx'],
        },
        status: 'degraded',
        expectedState: 'hidden_portfolio_protected',
        durationMs: 100,
        generatedAt: '2026-03-16T10:00:00.000Z',
      },
    ];

    expect(buildLaunchSmokeCorridors(checks, '2026-03-16T10:00:00.000Z')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'individual',
          status: 'pass',
          checkIds: ['public_individual_portfolio_visible'],
        }),
        expect.objectContaining({
          id: 'trust_privacy',
          status: 'degraded',
          checkIds: ['hidden_portfolio_protected'],
        }),
      ])
    );
  });

  it('binds smoke artifacts to a canonical target base URL', () => {
    const artifact = validateLaunchSmokeArtifact({
      schemaVersion: 2,
      generatedAt: '2026-03-16T10:00:00.000Z',
      targetBaseUrl: 'https://proofound.io/launch',
      executionMode: 'live',
      freshnessThresholdMinutes: 60,
      expiresAt: '2026-03-16T11:00:00.000Z',
      overallStatus: 'pass',
      corridors: [],
      checks: [],
    });

    expect(getLaunchSmokeTargetBaseUrl(artifact)).toBe('https://proofound.io');
    expect(isLaunchSmokeArtifactForBaseUrl(artifact, 'https://proofound.io/api/health')).toBe(true);
    expect(isLaunchSmokeArtifactForBaseUrl(artifact, 'https://staging.proofound.io')).toBe(false);
  });

  it('treats pre-target-binding artifacts as backward compatible', () => {
    const artifact = validateLaunchSmokeArtifact({
      schemaVersion: 2,
      generatedAt: '2026-03-16T10:00:00.000Z',
      freshnessThresholdMinutes: 60,
      expiresAt: '2026-03-16T11:00:00.000Z',
      overallStatus: 'pass',
      corridors: [],
      checks: [],
    });

    expect(getLaunchSmokeTargetBaseUrl(artifact)).toBeNull();
    expect(isLaunchSmokeArtifactForBaseUrl(artifact, 'https://proofound.io')).toBe(true);
  });

  it('evaluates a complete passing artifact as fresh passing', () => {
    const generatedAt = '2026-03-16T10:00:00.000Z';
    const checks: LaunchSmokeCheckResult[] = [
      {
        id: 'public_individual_portfolio_visible',
        corridor: 'individual',
        label: 'Public individual portfolio visible case',
        runner: {
          kind: 'vitest',
          label: 'vitest',
          testFiles: ['tests/ui/public-portfolio-access-consistency.test.tsx'],
        },
        status: 'pass',
        expectedState: 'public_individual_portfolio_visible',
        durationMs: 100,
        generatedAt,
      },
      {
        id: 'proof_creation_case',
        corridor: 'individual',
        label: 'Proof creation case',
        runner: {
          kind: 'vitest',
          label: 'vitest',
          testFiles: ['tests/api/expertise-user-skill-proofs-route.test.ts'],
        },
        status: 'pass',
        expectedState: 'proof_creation_case_live',
        durationMs: 100,
        generatedAt,
      },
      {
        id: 'public_org_trust_fixture_live',
        corridor: 'organization',
        label: 'Seeded public org trust fixture live',
        runner: {
          kind: 'command',
          label: 'seeded_public_org_trust_smoke',
          command: ['npm', 'run', 'test:e2e:org-trust:smoke'],
        },
        status: 'pass',
        expectedState: 'public_org_trust_fixture_live',
        durationMs: 100,
        generatedAt,
      },
      {
        id: 'full_org_corridor_review_to_engagement_verification',
        corridor: 'organization',
        label: 'Full org corridor review to engagement verification case',
        runner: {
          kind: 'command',
          label: 'strict_org_corridor_smoke',
          command: ['npm', 'run', 'test:e2e:org:strict'],
        },
        status: 'pass',
        expectedState: 'full_org_corridor_review_to_engagement_verification_live',
        durationMs: 100,
        generatedAt,
      },
      {
        id: 'hidden_portfolio_protected',
        corridor: 'trust_privacy',
        label: 'Hidden portfolio protected case',
        runner: {
          kind: 'vitest',
          label: 'vitest',
          testFiles: ['tests/ui/public-portfolio-access-consistency.test.tsx'],
        },
        status: 'pass',
        expectedState: 'hidden_portfolio_protected',
        durationMs: 100,
        generatedAt,
      },
      {
        id: 'privacy_no_leak_case',
        corridor: 'trust_privacy',
        label: 'Privacy no-leak case',
        runner: {
          kind: 'vitest',
          label: 'vitest',
          testFiles: ['tests/api/org-match-review-route.test.ts'],
        },
        status: 'pass',
        expectedState: 'privacy_no_leak_enforced',
        durationMs: 100,
        generatedAt,
      },
    ];

    const artifact = validateLaunchSmokeArtifact({
      schemaVersion: 2,
      generatedAt,
      targetBaseUrl: 'https://proofound.io',
      executionMode: 'live',
      freshnessThresholdMinutes: 60,
      expiresAt: '2026-03-16T11:00:00.000Z',
      overallStatus: 'pass',
      corridors: buildLaunchSmokeCorridors(checks, generatedAt),
      checks,
    });

    expect(
      evaluateLaunchSmokeArtifact(artifact, { now: new Date('2026-03-16T10:30:00.000Z') })
    ).toEqual(
      expect.objectContaining({
        state: 'fresh_passing',
        passes: true,
        blocking: false,
        fresh: true,
        stale: false,
      })
    );
  });

  it('evaluates a fresh artifact with a failing corridor as fresh failing', () => {
    const artifact = validateLaunchSmokeArtifact({
      schemaVersion: 2,
      generatedAt: '2026-03-16T10:00:00.000Z',
      freshnessThresholdMinutes: 60,
      expiresAt: '2026-03-16T11:00:00.000Z',
      overallStatus: 'fail',
      corridors: [],
      checks: [
        {
          id: 'public_individual_portfolio_visible',
          corridor: 'individual',
          label: 'Public individual portfolio visible case',
          runner: {
            kind: 'vitest',
            label: 'vitest',
            testFiles: ['tests/ui/public-portfolio-access-consistency.test.tsx'],
          },
          status: 'fail',
          expectedState: 'public_individual_portfolio_visible',
          durationMs: 100,
          generatedAt: '2026-03-16T10:00:00.000Z',
          message: 'Portfolio route failed',
        },
      ],
    });

    expect(
      evaluateLaunchSmokeArtifact(artifact, {
        now: new Date('2026-03-16T10:30:00.000Z'),
      })
    ).toEqual(
      expect.objectContaining({
        state: 'fresh_failing',
        passes: false,
        blocking: true,
      })
    );
  });

  it('evaluates a stale artifact as blocked even when checks were green', () => {
    const artifact = validateLaunchSmokeArtifact({
      schemaVersion: 2,
      generatedAt: '2026-03-16T10:00:00.000Z',
      freshnessThresholdMinutes: 60,
      expiresAt: '2026-03-16T11:00:00.000Z',
      overallStatus: 'pass',
      corridors: [],
      checks: [],
    });

    expect(
      evaluateLaunchSmokeArtifact(artifact, {
        now: new Date('2026-03-16T11:01:00.000Z'),
      })
    ).toEqual(
      expect.objectContaining({
        state: 'stale',
        passes: false,
        blocking: true,
        stale: true,
      })
    );
  });

  it('evaluates a target mismatch as blocking', () => {
    const artifact = validateLaunchSmokeArtifact({
      schemaVersion: 2,
      generatedAt: '2026-03-16T10:00:00.000Z',
      targetBaseUrl: 'https://proofound.io',
      executionMode: 'live',
      freshnessThresholdMinutes: 60,
      expiresAt: '2026-03-16T11:00:00.000Z',
      overallStatus: 'pass',
      corridors: [],
      checks: [],
    });

    expect(
      evaluateLaunchSmokeArtifact(artifact, {
        baseUrl: 'https://staging.proofound.io',
      })
    ).toEqual(
      expect.objectContaining({
        state: 'wrong_target',
        passes: false,
        blocking: true,
      })
    );
  });

  it('blocks production-candidate evaluation when target binding is required but missing', () => {
    const artifact = validateLaunchSmokeArtifact({
      schemaVersion: 2,
      generatedAt: '2026-03-16T10:00:00.000Z',
      freshnessThresholdMinutes: 60,
      expiresAt: '2026-03-16T11:00:00.000Z',
      overallStatus: 'pass',
      corridors: [],
      checks: [],
    });

    expect(
      evaluateLaunchSmokeArtifact(artifact, {
        baseUrl: 'https://preview.proofound.example',
        requireTargetBaseUrl: true,
      })
    ).toEqual(
      expect.objectContaining({
        state: 'missing_target',
        passes: false,
        blocking: true,
        targetBaseUrl: null,
        requestedBaseUrl: 'https://preview.proofound.example',
      })
    );
  });
});
