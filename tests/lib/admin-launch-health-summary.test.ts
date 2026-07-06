import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { getAdminLaunchHealthSummary } from '@/lib/launch/admin-health-summary';

async function makeTempArtifactRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'proofound-admin-launch-health-'));
}

describe('admin launch health summary', () => {
  it('reads the latest launch checklist artifact without exposing raw checklist payloads', async () => {
    const artifactRoot = await makeTempArtifactRoot();
    const olderDir = path.join(artifactRoot, 'launch-validation-2026-05-19');
    const latestDir = path.join(artifactRoot, 'launch-validation-2026-05-20');
    await fs.mkdir(olderDir, { recursive: true });
    await fs.mkdir(latestDir, { recursive: true });
    await fs.writeFile(
      path.join(olderDir, 'final-launch-checklist-status.json'),
      JSON.stringify({
        generatedAt: '2026-05-19T10:00:00.000Z',
        verdict: 'NOT_READY',
        statusCounts: { PASS: 20, FAIL: 1, BLOCKED: 0, UNVERIFIED: 3 },
        trueBlockers: [{ label: 'Old blocker' }],
        externalPrerequisites: [],
      })
    );
    await fs.writeFile(
      path.join(latestDir, 'final-launch-checklist-status.json'),
      JSON.stringify({
        generatedAt: '2026-05-20T02:58:33.442Z',
        verdict: 'READY',
        statusCounts: { PASS: 36, FAIL: 0, BLOCKED: 0, UNVERIFIED: 4 },
        trueBlockers: [],
        externalPrerequisites: [
          {
            label: 'Incident owner / support lead roles are assigned',
            status: 'UNVERIFIED',
            evidence: [{ path: 'docs/internal-ops/index.md' }],
          },
          {
            label: 'Already resolved item',
            status: 'PASS',
            sensitiveMetadata: 'do not return',
          },
        ],
        items: [{ label: 'full row not needed by admin card' }],
      })
    );

    const summary = await getAdminLaunchHealthSummary({ artifactRoot });

    expect(summary).toEqual(
      expect.objectContaining({
        status: 'ready',
        verdict: 'READY',
        generatedAt: '2026-05-20T02:58:33.442Z',
        counts: {
          pass: 36,
          fail: 0,
          blocked: 0,
          unverified: 4,
        },
        trueBlockers: [],
        externalPrerequisites: ['Incident owner / support lead roles are assigned'],
      })
    );
    expect(JSON.stringify(summary)).not.toContain('do not return');
    expect(JSON.stringify(summary)).not.toContain('full row not needed');
  });

  it('returns an unavailable state when no launch checklist artifact exists', async () => {
    const artifactRoot = await makeTempArtifactRoot();

    await expect(getAdminLaunchHealthSummary({ artifactRoot })).resolves.toEqual({
      status: 'unavailable',
      verdict: 'UNAVAILABLE',
      generatedAt: null,
      artifactPath: null,
      counts: {
        pass: 0,
        fail: 0,
        blocked: 0,
        unverified: 0,
      },
      trueBlockers: [],
      externalPrerequisites: [],
    });
  });
});
