import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findEngagementVerification: vi.fn(),
  findMatchingProfile: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  attachUploadedFile: vi.fn(),
  ensureInternalOpsQueueItem: vi.fn(),
  logInfo: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      engagementVerifications: {
        findFirst: mocks.findEngagementVerification,
      },
      matchingProfiles: {
        findFirst: mocks.findMatchingProfile,
      },
    },
    insert: mocks.insert,
    update: mocks.update,
  },
}));

vi.mock('@/lib/uploads/lifecycle', () => ({
  attachUploadedFile: mocks.attachUploadedFile,
}));

vi.mock('@/lib/internal-ops/queue', () => ({
  ensureInternalOpsQueueItem: mocks.ensureInternalOpsQueueItem,
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
  },
}));

import {
  confirmEngagementVerification,
  deriveEngagementVerificationState,
  ensureEngagementVerificationForDecision,
  normalizeEngagementType,
} from '@/lib/engagement-verifications/service';
import { engagementVerificationStateTransitions, engagementVerifications } from '@/db/schema';

describe('engagement verification service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.attachUploadedFile.mockResolvedValue({ id: 'upload-1' });
    mocks.ensureInternalOpsQueueItem.mockResolvedValue({
      id: 'queue-1',
      queueType: 'pilot_ops',
    });
  });

  it.each([
    ['full_time', 'full_time'],
    ['part_time', 'part_time'],
    ['contract', 'contract_consulting'],
    ['consulting', 'contract_consulting'],
    ['fractional', 'fractional_project'],
    ['project_based', 'fractional_project'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeEngagementType(input)).toBe(expected);
  });

  it('derives a pending or verified state from separate confirmations', () => {
    expect(
      deriveEngagementVerificationState({
        candidateConfirmed: false,
        organizationConfirmed: false,
      })
    ).toBe('pending_both_confirmations');
    expect(
      deriveEngagementVerificationState({
        candidateConfirmed: true,
        organizationConfirmed: false,
      })
    ).toBe('pending_organization_confirmation');
    expect(
      deriveEngagementVerificationState({
        candidateConfirmed: false,
        organizationConfirmed: true,
      })
    ).toBe('pending_candidate_confirmation');
    expect(
      deriveEngagementVerificationState({
        candidateConfirmed: true,
        organizationConfirmed: true,
      })
    ).toBe('verified');
  });

  it('creates a pending engagement verification corridor after hire without auto-verifying it', async () => {
    const transitionValues = vi.fn().mockResolvedValue(undefined);
    const returning = vi.fn().mockResolvedValue([
      {
        id: 'engagement-1',
        decisionId: 'decision-1',
        introId: 'intro-1',
        assignmentId: 'assignment-1',
        candidateProfileId: 'candidate-1',
        orgId: 'org-1',
        engagementType: 'contract_consulting',
        state: 'pending_both_confirmations',
        candidateConfirmed: false,
        candidateConfirmedAt: null,
        organizationConfirmed: false,
        organizationConfirmedAt: null,
        uploadedFileId: null,
        proofHookStatus: 'not_ready',
        verifiedAt: null,
      },
    ]);
    const engagementValues = vi.fn().mockReturnValue({ returning });

    mocks.findEngagementVerification.mockResolvedValueOnce(null);
    mocks.findMatchingProfile.mockResolvedValueOnce({
      engagementType: 'contract',
    });
    mocks.insert.mockImplementation((table: unknown) => {
      if (table === engagementVerifications) {
        return { values: engagementValues };
      }

      if (table === engagementVerificationStateTransitions) {
        return { values: transitionValues };
      }

      throw new Error('Unexpected insert target');
    });

    const result = await ensureEngagementVerificationForDecision({
      decision: {
        id: 'decision-1',
        introId: 'intro-1',
        assignmentId: 'assignment-1',
        candidateProfileId: 'candidate-1',
        orgId: 'org-1',
      },
      actorType: 'organization_member',
      actorId: 'owner-1',
    });

    expect(result.status).toBe('pending_both_confirmations');
    expect(result.engagementType).toBe('contract_consulting');
    expect(result.proofHookStatus).toBe('not_ready');
    expect(result.verifiedAt).toBeNull();
    expect(engagementValues).toHaveBeenCalledWith(
      expect.objectContaining({
        decisionId: 'decision-1',
        state: 'pending_both_confirmations',
        candidateConfirmed: false,
        organizationConfirmed: false,
      })
    );
    expect(transitionValues).toHaveBeenCalledWith(
      expect.objectContaining({
        toState: 'pending_both_confirmations',
      })
    );
    expect(mocks.ensureInternalOpsQueueItem).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedEntityId: 'engagement-1',
        linkedEntityType: 'engagement_verification',
        queueType: 'pilot_ops',
      })
    );
  });

  it.each([
    ['candidate', 'organization_member'],
    ['organization_member', 'candidate'],
  ] as const)(
    'updates the same record when confirmations happen in %s then %s order',
    async (firstActor, secondActor) => {
      const baseRecord = {
        id: 'engagement-1',
        decisionId: 'decision-1',
        introId: 'intro-1',
        assignmentId: 'assignment-1',
        candidateProfileId: 'candidate-1',
        orgId: 'org-1',
        engagementType: 'fractional_project',
        state: 'pending_both_confirmations',
        candidateConfirmed: false,
        candidateConfirmedAt: null,
        candidateConfirmedBy: null,
        organizationConfirmed: false,
        organizationConfirmedAt: null,
        organizationConfirmedBy: null,
        uploadedFileId: null,
        evidenceNote: null,
        proofHookStatus: 'not_ready',
        proofHookEligibleAt: null,
        verifiedAt: null,
      };
      const firstUpdated =
        firstActor === 'candidate'
          ? {
              ...baseRecord,
              state: 'pending_organization_confirmation',
              candidateConfirmed: true,
              candidateConfirmedAt: new Date('2026-03-12T10:00:00.000Z'),
              candidateConfirmedBy: 'candidate-1',
              uploadedFileId: 'upload-1',
              evidenceNote: 'Signed offer letter',
            }
          : {
              ...baseRecord,
              state: 'pending_candidate_confirmation',
              organizationConfirmed: true,
              organizationConfirmedAt: new Date('2026-03-12T10:00:00.000Z'),
              organizationConfirmedBy: 'owner-1',
            };
      const secondUpdated = {
        ...firstUpdated,
        state: 'verified',
        candidateConfirmed: true,
        candidateConfirmedAt:
          firstUpdated.candidateConfirmedAt ?? new Date('2026-03-12T11:00:00.000Z'),
        candidateConfirmedBy: firstUpdated.candidateConfirmedBy ?? 'candidate-1',
        organizationConfirmed: true,
        organizationConfirmedAt:
          firstUpdated.organizationConfirmedAt ?? new Date('2026-03-12T11:00:00.000Z'),
        organizationConfirmedBy: firstUpdated.organizationConfirmedBy ?? 'owner-1',
        proofHookStatus: 'eligible',
        proofHookEligibleAt: new Date('2026-03-12T11:00:00.000Z'),
        verifiedAt: new Date('2026-03-12T11:00:00.000Z'),
      };

      const transitionValues = vi.fn().mockResolvedValue(undefined);
      const returning = vi
        .fn()
        .mockResolvedValueOnce([firstUpdated])
        .mockResolvedValueOnce([secondUpdated]);
      const where = vi.fn().mockReturnValue({ returning });
      const set = vi.fn().mockReturnValue({ where });

      mocks.findEngagementVerification
        .mockResolvedValueOnce(baseRecord)
        .mockResolvedValueOnce(firstUpdated);
      mocks.insert.mockImplementation((table: unknown) => {
        if (table === engagementVerificationStateTransitions) {
          return { values: transitionValues };
        }

        throw new Error('Unexpected insert target');
      });
      mocks.update.mockImplementation((table: unknown) => {
        if (table === engagementVerifications) {
          return { set };
        }

        throw new Error('Unexpected update target');
      });

      const firstResult = await confirmEngagementVerification({
        engagementVerificationId: 'engagement-1',
        actorType: firstActor,
        actorId: firstActor === 'candidate' ? 'candidate-1' : 'owner-1',
        engagementType: firstActor === 'candidate' ? 'project_based' : undefined,
        uploadedFileId: firstActor === 'candidate' ? 'upload-1' : undefined,
        evidenceNote: firstActor === 'candidate' ? 'Signed offer letter' : undefined,
      });
      const secondResult = await confirmEngagementVerification({
        engagementVerificationId: 'engagement-1',
        actorType: secondActor,
        actorId: secondActor === 'candidate' ? 'candidate-1' : 'owner-1',
      });

      expect(firstResult.status).toBe(
        firstActor === 'candidate'
          ? 'pending_organization_confirmation'
          : 'pending_candidate_confirmation'
      );
      expect(secondResult.status).toBe('verified');
      expect(secondResult.proofHookStatus).toBe('eligible');
      expect(mocks.findEngagementVerification).toHaveBeenCalledTimes(2);
      expect(transitionValues).toHaveBeenCalledTimes(2);

      if (firstActor === 'candidate') {
        expect(mocks.attachUploadedFile).toHaveBeenCalledWith(
          'upload-1',
          'candidate-1',
          'engagement_verification',
          'engagement-1'
        );
        expect(firstResult.uploadedEvidencePresent).toBe(true);
      }
    }
  );
});
