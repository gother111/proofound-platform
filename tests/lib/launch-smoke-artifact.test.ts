import { describe, expect, it } from 'vitest';

import {
  buildLaunchSmokeCorridors,
  getLaunchSmokeFreshnessThresholdMinutes,
  hasPassingLaunchSmokeArtifact,
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
});
