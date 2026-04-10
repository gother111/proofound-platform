import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  getLatestProfileDeletionRequest: vi.fn(),
  createLifecycleOperation: vi.fn(),
  createDataPortabilityExport: vi.fn(),
  updateDataPortabilityExportState: vi.fn(),
  finalizeLifecycleOperation: vi.fn(),
  buildExperienceTimeline: vi.fn(),
  getRows: vi.fn(),
  listCanonicalProofPackAggregatesForOwner: vi.fn(),
  buildPortableUploadManifest: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn(),
  select: vi.fn(),
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn(() => 'and'),
  eq: vi.fn(() => 'eq'),
  inArray: vi.fn(() => 'inArray'),
  isNull: vi.fn(() => 'isNull'),
  sql: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: mocks.requireApiAuthContext,
}));

vi.mock('@/db', () => ({
  db: {
    select: mocks.select,
  },
}));

vi.mock('@/db/schema', () => {
  const makeTable = (name: string) =>
    new Proxy(
      {},
      {
        get: (_target, prop) => `${name}.${String(prop)}`,
      }
    );

  return {
    profiles: makeTable('profiles'),
    individualProfiles: makeTable('individualProfiles'),
    skills: makeTable('skills'),
    capabilities: makeTable('capabilities'),
    evidence: makeTable('evidence'),
    projects: makeTable('projects'),
    experiences: makeTable('experiences'),
    education: makeTable('education'),
    volunteering: makeTable('volunteering'),
    impactStories: makeTable('impactStories'),
    matches: makeTable('matches'),
    matchInterest: makeTable('matchInterest'),
    analyticsEvents: makeTable('analyticsEvents'),
    proofArtifacts: makeTable('proofArtifacts'),
    proofPacks: makeTable('proofPacks'),
    proofPackItems: makeTable('proofPackItems'),
    submissions: makeTable('submissions'),
    submissionArtifacts: makeTable('submissionArtifacts'),
    verificationRecords: makeTable('verificationRecords'),
    verificationLogEntries: makeTable('verificationLogEntries'),
  };
});

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    error: mocks.logError,
  },
}));

vi.mock('@/lib/profile/experience-timeline', () => ({
  buildExperienceTimeline: mocks.buildExperienceTimeline,
}));

vi.mock('@/lib/lifecycle/reconciliation', () => ({
  createLifecycleOperation: mocks.createLifecycleOperation,
  finalizeLifecycleOperation: mocks.finalizeLifecycleOperation,
  resolveLifecycleTarget: vi.fn(),
}));

vi.mock('@/lib/lifecycle/residual', () => ({
  createDataPortabilityExport: mocks.createDataPortabilityExport,
  getLatestProfileDeletionRequest: mocks.getLatestProfileDeletionRequest,
  updateDataPortabilityExportState: mocks.updateDataPortabilityExportState,
}));

vi.mock('@/lib/db/rows', () => ({
  getRows: mocks.getRows,
}));

vi.mock('@/lib/proofs/canonical-pack', () => ({
  listCanonicalProofPackAggregatesForOwner: mocks.listCanonicalProofPackAggregatesForOwner,
}));

vi.mock('@/lib/proofs/pack-anchor', () => ({
  isQuarantinedProofPack: vi.fn(() => false),
  validateProofPackAnchor: vi.fn(() => ({ ok: true })),
}));

vi.mock('@/lib/uploads/export', () => ({
  buildPortableUploadManifest: mocks.buildPortableUploadManifest,
}));

vi.mock('@/lib/privacy/export-download', () => ({
  buildUserExportDownloadFilename: vi.fn(() => 'proofound-data-export-2026-04-09.json'),
}));

import { GET } from '@/app/api/user/export/route';

function mockProfileStatus(profile: Record<string, unknown> | undefined) {
  const limit = vi.fn().mockResolvedValue(profile ? [profile] : []);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  mocks.select.mockReturnValue({ from });
}

describe('/api/user/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks export while account deletion is pending', async () => {
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mockProfileStatus({
      deletionRequestedAt: null,
      deleted: false,
    });
    mocks.getLatestProfileDeletionRequest.mockResolvedValue({
      lifecycleState: 'processing',
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      error: 'Export unavailable during deletion',
      message: 'Data export is blocked while account deletion is pending or completed.',
    });
    expect(mocks.createLifecycleOperation).not.toHaveBeenCalled();
    expect(mocks.createDataPortabilityExport).not.toHaveBeenCalled();
  });
});
