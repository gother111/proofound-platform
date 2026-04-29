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
  execute: vi.fn(),
  resolveLifecycleTarget: vi.fn(),
  eq: vi.fn(),
  inArray: vi.fn(),
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args) => ({ op: 'and', args })),
  eq: mocks.eq,
  inArray: mocks.inArray,
  isNull: vi.fn((column) => ({ op: 'isNull', column })),
  sql: vi.fn((strings, ...values) => ({ strings, values })),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: mocks.requireApiAuthContext,
}));

vi.mock('@/db', () => ({
  db: {
    select: mocks.select,
    execute: mocks.execute,
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
  resolveLifecycleTarget: mocks.resolveLifecycleTarget,
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

function queueSelectResult(result: unknown[]) {
  mocks.select.mockImplementationOnce(() => ({
    from: vi.fn(() => {
      const terminal = {
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(() => Promise.resolve(result)),
        then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
      };
      terminal.where.mockReturnValue(terminal);
      terminal.orderBy.mockReturnValue(terminal);
      return terminal;
    }),
  }));
}

describe('/api/user/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eq.mockImplementation((left, right) => ({ op: 'eq', left, right }));
    mocks.inArray.mockImplementation((left, values) => ({ op: 'inArray', left, values }));
    mocks.createLifecycleOperation.mockResolvedValue({ id: 'operation-1' });
    mocks.createDataPortabilityExport.mockResolvedValue({ id: 'export-1' });
    mocks.updateDataPortabilityExportState.mockResolvedValue(undefined);
    mocks.finalizeLifecycleOperation.mockResolvedValue(undefined);
    mocks.resolveLifecycleTarget.mockResolvedValue(undefined);
    mocks.getLatestProfileDeletionRequest.mockResolvedValue(null);
    mocks.listCanonicalProofPackAggregatesForOwner.mockResolvedValue([]);
    mocks.buildPortableUploadManifest.mockReturnValue({
      includedFiles: [],
      omittedFiles: [],
    });
    mocks.getRows.mockReturnValue([]);
    mocks.execute.mockResolvedValue({ rows: [] });
    mocks.buildExperienceTimeline.mockImplementation((input) => ({
      startDate: input.startDate,
      endDate: input.endDate,
    }));
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

  it('blocks export after deletion has failed into manual review', async () => {
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mockProfileStatus({
      deletionRequestedAt: null,
      deleted: false,
    });
    mocks.getLatestProfileDeletionRequest.mockResolvedValue({
      lifecycleState: 'failed_requires_manual_review',
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('Export unavailable during deletion');
    expect(mocks.createLifecycleOperation).not.toHaveBeenCalled();
    expect(mocks.createDataPortabilityExport).not.toHaveBeenCalled();
  });

  it('exports the authenticated owner profile, proof, private context, and owner-only upload manifest', async () => {
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });

    queueSelectResult([{ deletionRequestedAt: null, deleted: false }]);
    queueSelectResult([{ id: 'user-1', displayName: 'Jane Owner' }]);
    queueSelectResult([{ headline: 'Proof builder', bio: 'Owner bio' }]);
    queueSelectResult([
      {
        skillCode: 'research',
        skillId: 'legacy-research',
        level: 4,
        lastUsedAt: new Date('2026-04-01T00:00:00.000Z'),
      },
    ]);
    queueSelectResult([]);
    queueSelectResult([]);
    queueSelectResult([]);
    queueSelectResult([
      {
        organizationName: 'Owner Org',
        orgDescription: null,
        title: 'Builder',
        duration: '2025',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        outcomes: 'Shipped a proof pack',
        achievements: null,
        projects: null,
        colleagues: null,
      },
    ]);
    queueSelectResult([]);
    queueSelectResult([]);
    queueSelectResult([]);
    queueSelectResult([]);
    queueSelectResult([]);
    queueSelectResult([]);
    queueSelectResult([
      {
        id: 'artifact-1',
        ownerType: 'individual_profile',
        ownerId: 'user-1',
        deletedAt: null,
        revokedAt: null,
      },
    ]);
    queueSelectResult([
      {
        id: 'pack-1',
        ownerType: 'individual_profile',
        ownerId: 'user-1',
        deletedAt: null,
      },
    ]);
    queueSelectResult([
      {
        id: 'verification-1',
        ownerType: 'individual_profile',
        ownerId: 'user-1',
      },
    ]);
    queueSelectResult([]);
    queueSelectResult([]);
    queueSelectResult([
      {
        id: 'verification-log-1',
        verificationRecordId: 'verification-1',
        actorId: 'reviewer-1',
        metadata: {
          publicStatus: 'verified',
          reviewerEmail: 'reviewer@example.com',
          nested: {
            hiddenReviewerNote: 'private reviewer note',
          },
        },
      },
    ]);
    mocks.buildPortableUploadManifest.mockReturnValue({
      includedFiles: [
        {
          fileId: 'file-1',
          uploadKind: 'document',
          displayLabel: 'Uploaded PDF document',
          originalFilename: 'Sensitive original.pdf',
          originalFilenameSensitive: true,
          storagePath: 'private/user-1/file.pdf',
        },
      ],
      omittedFiles: [],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.userId).toBe('user-1');
    expect(body.profile).toEqual({
      headline: 'Proof builder',
      bio: 'Owner bio',
    });
    expect(body.skills).toEqual([
      {
        skillCode: 'research',
        level: 4,
        lastUsed: '2026-04-01T00:00:00.000Z',
      },
    ]);
    expect(body.experiences).toEqual([
      {
        type: 'work',
        organization: 'Owner Org',
        role: 'Builder',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        description: 'Shipped a proof pack',
      },
    ]);
    expect(body.proof.ownerType).toBe('individual_profile');
    expect(body.proof.ownerId).toBe('user-1');
    expect(body.proof.verificationLogEntries).toEqual([
      {
        id: 'verification-log-1',
        verificationRecordId: 'verification-1',
        actorId: null,
        metadata: {
          publicStatus: 'verified',
          reviewerEmail: '[redacted_for_owner_export]',
          nested: {
            hiddenReviewerNote: '[redacted_for_owner_export]',
          },
        },
      },
    ]);
    expect(body.manifest.includedFiles).toEqual([
      {
        fileId: 'file-1',
        uploadKind: 'document',
        displayLabel: 'Uploaded PDF document',
        originalFilename: 'Sensitive original.pdf',
        originalFilenameSensitive: true,
        storagePath: 'private/user-1/file.pdf',
      },
    ]);
    expect(mocks.eq).toHaveBeenCalledWith('profiles.id', 'user-1');
    expect(mocks.eq).toHaveBeenCalledWith('individualProfiles.userId', 'user-1');
    expect(mocks.eq).toHaveBeenCalledWith('proofArtifacts.ownerId', 'user-1');
    expect(mocks.eq).toHaveBeenCalledWith('proofPacks.ownerId', 'user-1');
    expect(mocks.eq).not.toHaveBeenCalledWith(expect.anything(), 'other-user');
  });
});
