import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateVision,
  replaceValues,
  replaceCauses,
  updateMission,
  getProfileData,
  requestImpactStoryVerification,
  createExperience,
  updateImpactStory,
  updateExperience,
  updateEducation,
  updateVolunteering,
} from '@/actions/profile';
import { db } from '@/db';
import { education, experiences, impactStories, volunteering } from '@/db/schema';

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
}));

const mockRequireAuth = vi.hoisted(() => vi.fn());
const mockSendEmail = vi.hoisted(() => vi.fn());
const mockCreateClient = vi.hoisted(() => vi.fn());
const mockHeaders = vi.hoisted(() => vi.fn());
const mockAssessVerificationRequestIntegrity = vi.hoisted(() => vi.fn());
const mockWriteVerificationAuditLog = vi.hoisted(() => vi.fn());
const mockListCanonicalSkillProofSummariesForOwner = vi.hoisted(() => vi.fn());
const mockCreateCanonicalImpactVerificationRequest = vi.hoisted(() => vi.fn());
const mockFindExistingCanonicalImpactVerificationRequest = vi.hoisted(() => vi.fn());
const mockListCanonicalImpactVerificationRequestsForOwner = vi.hoisted(() => vi.fn());
const mockUpdateCanonicalImpactVerificationRequest = vi.hoisted(() => vi.fn());

vi.mock('@/db', () => ({
  db: {
    select: mockDb.select,
    update: mockDb.update,
    insert: mockDb.insert,
  },
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock('@/lib/email/sender', () => ({
  sendEmail: mockSendEmail,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

vi.mock('next/headers', () => ({
  headers: mockHeaders,
}));

vi.mock('@/lib/verification/integrity', () => ({
  VERIFICATION_INTEGRITY_REASONS: {
    SELF_VERIFICATION_BLOCKED: 'self_verification_blocked',
  },
  assessVerificationRequestIntegrity: mockAssessVerificationRequestIntegrity,
  normalizeEmail: (value: string | null | undefined) => {
    if (!value || typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;
    return normalized.replace(/(\+[^@]+)(?=@)/, '');
  },
  writeVerificationAuditLog: mockWriteVerificationAuditLog,
}));

vi.mock('@/lib/proofs/canonical-pack', async () => {
  const actual = await vi.importActual<typeof import('@/lib/proofs/canonical-pack')>(
    '@/lib/proofs/canonical-pack'
  );

  return {
    ...actual,
    listCanonicalProofPackAggregatesForOwner: vi.fn().mockResolvedValue([]),
    listCanonicalSkillProofSummariesForOwner: mockListCanonicalSkillProofSummariesForOwner,
  };
});

vi.mock('@/lib/verification/canonical-impact-requests', () => ({
  createCanonicalImpactVerificationRequest: mockCreateCanonicalImpactVerificationRequest,
  findExistingCanonicalImpactVerificationRequest:
    mockFindExistingCanonicalImpactVerificationRequest,
  listCanonicalImpactVerificationRequestsForOwner:
    mockListCanonicalImpactVerificationRequestsForOwner,
  mapCanonicalImpactVerificationRequestRecord: vi.fn((record: any) => record),
  updateCanonicalImpactVerificationRequest: mockUpdateCanonicalImpactVerificationRequest,
}));

vi.mock('@/lib/analytics/events', () => ({
  emitEvent: vi.fn(),
  emitProfileActivated: vi.fn(),
}));

vi.mock('@/lib/matching/eligibility', () => ({
  evaluateIndividualMatchability: vi.fn().mockResolvedValue({
    eligible: false,
    tier: 'baseline',
    counts: {
      skillsWithRecency: 0,
      hasIntentSignal: false,
      hasConstraints: false,
      proofCount: 0,
    },
    nextTierTarget: null,
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

function mockSelectWithLimit(result: unknown[]) {
  const limit = vi.fn().mockResolvedValue(result);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  mockDb.select.mockReturnValueOnce({ from });
}

function mockSelectWithWhere(result: unknown[]) {
  const where = vi.fn().mockResolvedValue(result);
  const chain = {
    leftJoin: vi.fn(),
    where,
  };
  chain.leftJoin.mockReturnValue(chain);

  const from = vi.fn().mockReturnValue(chain);
  mockDb.select.mockReturnValueOnce({ from });
}

describe('profile purpose actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReset();
    mockDb.update.mockReset();
    mockDb.insert.mockReset();
    mockRequireAuth.mockResolvedValue({ id: 'test-user-id' });
    mockSendEmail.mockResolvedValue({ success: true, id: 'email-1' });
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: 'requester@example.com' } },
          error: null,
        }),
      },
    });
    mockHeaders.mockResolvedValue(new Headers());
    mockAssessVerificationRequestIntegrity.mockResolvedValue({
      normalizedRequesterEmail: 'requester@example.com',
      requesterDomain: 'example.com',
      verifierDomain: 'example.com',
      verifierProfileId: null,
      riskSignals: {},
      requesterFingerprints: {
        ipHash: null,
        userAgentHash: null,
      },
      policy: {
        blockSelf: false,
        requiresAuthenticatedVerifier: false,
        integrityStatus: 'clear',
        integrityReason: null,
      },
    });
    mockWriteVerificationAuditLog.mockResolvedValue(undefined);
    mockListCanonicalSkillProofSummariesForOwner.mockResolvedValue([]);
    mockFindExistingCanonicalImpactVerificationRequest.mockResolvedValue(null);
    mockListCanonicalImpactVerificationRequestsForOwner.mockResolvedValue([]);
    mockCreateCanonicalImpactVerificationRequest.mockResolvedValue({
      record: {
        id: 'request-1',
        integrityStatus: 'clear',
        createdAt: new Date('2026-02-27T09:00:00.000Z'),
      },
      rawToken: 'a'.repeat(64),
      expiresAt: new Date('2026-03-13T09:00:00.000Z'),
    });
    mockUpdateCanonicalImpactVerificationRequest.mockResolvedValue({});
  });

  it('hard-gates individual purpose mutations for the MVP', async () => {
    const archivedPurposeMessage =
      'Individual mission, vision, values, and causes are archived for the MVP.';

    await expect(updateMission('Build trustworthy systems')).rejects.toThrow(
      archivedPurposeMessage
    );
    await expect(updateVision('A fair and open future')).rejects.toThrow(archivedPurposeMessage);
    await expect(
      replaceValues([{ id: 'v1', label: 'Integrity', icon: 'Shield', verified: false }])
    ).rejects.toThrow(archivedPurposeMessage);
    await expect(replaceCauses(['Climate Justice'])).rejects.toThrow(archivedPurposeMessage);

    expect(db.select).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it('returns legacy purpose data as inert archived fields when reading profile data', async () => {
    const profileRow = {
      values: JSON.stringify([
        { id: 'v1', icon: 'Shield', label: 'Integrity', verified: true },
        'Trust',
        { label: 'Integrity', icon: 'Leaf', verified: false },
      ]),
      causes: ['Climate Justice'],
      mission: 'Build trust',
      vision: 'Expand trust',
      missionLinks: JSON.stringify({
        values: ['Integrity', 'Unknown'],
        causes: ['Climate Justice', 'Unknown Cause'],
      }),
      visionLinks: JSON.stringify({
        values: ['Trust'],
        causes: ['Climate Justice'],
      }),
      tagline: null,
      location: null,
      coverImageUrl: null,
      fieldVisibility: {
        mission: 'public',
        vision: 'public',
        values: 'public',
        causes: 'public',
        skills: 'public',
      },
      redactMode: false,
    };

    mockRequireAuth.mockResolvedValue({
      id: 'test-user-id',
      displayName: 'Auth User',
      avatarUrl: null,
      persona: 'individual',
      locale: 'en',
    });

    const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);
    const insertValues = vi.fn().mockReturnValue({ onConflictDoNothing });
    mockDb.insert.mockReturnValue({ values: insertValues });

    mockSelectWithLimit([profileRow]); // initial profile row check
    mockSelectWithLimit([profileRow]); // profile fetch
    mockSelectWithLimit([
      {
        displayName: 'Test User',
        avatarUrl: null,
        createdAt: new Date('2025-01-01T00:00:00Z'),
      },
    ]);
    mockSelectWithWhere([]); // impact stories
    mockSelectWithWhere([]); // experiences
    mockSelectWithWhere([]); // education
    mockSelectWithWhere([]); // volunteering
    mockSelectWithWhere([]); // skills
    mockSelectWithWhere([]); // impact verification summaries
    mockSelectWithWhere([]); // proofs
    mockSelectWithWhere([]); // accepted verifications

    const profile = await getProfileData();

    expect(profile.mission).toBeNull();
    expect(profile.vision).toBeNull();
    expect(profile.values).toEqual([]);
    expect(profile.causes).toEqual([]);
    expect(profile.missionLinks).toEqual({ values: [], causes: [] });
    expect(profile.visionLinks).toEqual({ values: [], causes: [] });
    expect(profile.fieldVisibility).toMatchObject({
      experiences: 'private',
      education: 'private',
      volunteering: 'private',
      skills: 'public',
    });
    expect(profile.fieldVisibility).not.toHaveProperty('mission');
    expect(profile.fieldVisibility).not.toHaveProperty('vision');
    expect(profile.fieldVisibility).not.toHaveProperty('values');
    expect(profile.fieldVisibility).not.toHaveProperty('causes');
  });

  it('attaches latest impact verification summary to impact stories', async () => {
    const profileRow = {
      values: [],
      causes: [],
      mission: null,
      vision: null,
      missionLinks: null,
      visionLinks: null,
      tagline: null,
      location: null,
      coverImageUrl: null,
      fieldVisibility: null,
      redactMode: false,
    };

    mockRequireAuth.mockResolvedValue({
      id: 'test-user-id',
      displayName: 'Auth User',
      avatarUrl: null,
      persona: 'individual',
      locale: 'en',
    });

    mockDb.insert.mockReturnValue({
      values: vi
        .fn()
        .mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue(undefined) }),
    });

    mockSelectWithLimit([profileRow]); // initial profile row check
    mockSelectWithLimit([profileRow]); // profile fetch
    mockSelectWithLimit([
      {
        displayName: 'Test User',
        avatarUrl: null,
        createdAt: new Date('2025-01-01T00:00:00Z'),
      },
    ]);
    mockSelectWithWhere([
      {
        id: 'impact-1',
        title: 'Impact',
        orgDescription: 'Org',
        impact: 'Impact',
        businessValue: 'Value',
        outcomes: 'Outcome',
        timeline: '2024',
        timelineStructured: { mode: 'single', precision: 'year', start: '2024' },
        affiliationType: 'organization',
        affiliationDetails: 'Org',
        roleTitle: 'Lead',
        roleScope: 'owned',
        primaryCause: 'education',
        secondaryCauses: [],
        measuredOutcomes: [],
        supportingArtifacts: [],
        verified: false,
      },
    ]); // impact stories
    mockSelectWithWhere([]); // experiences
    mockSelectWithWhere([]); // education
    mockSelectWithWhere([]); // volunteering
    mockSelectWithWhere([]); // skills
    mockListCanonicalImpactVerificationRequestsForOwner.mockResolvedValue([
      {
        impact_story_id: 'impact-1',
        status: 'failed',
        verifier_email: 'verifier@example.com',
        created_at: new Date('2026-02-27T09:00:00.000Z'),
        email_sent: false,
        email_error: 'Resend unavailable',
      },
      {
        impact_story_id: 'impact-1',
        status: 'pending',
        verifier_email: 'older@example.com',
        created_at: new Date('2026-02-26T09:00:00.000Z'),
        email_sent: true,
        email_error: null,
      },
    ]);
    mockSelectWithWhere([]); // proofs
    mockSelectWithWhere([]); // accepted verifications

    const profile = await getProfileData();

    expect(profile.impactStories).toHaveLength(1);
    expect(profile.impactStories[0]).toMatchObject({
      id: 'impact-1',
      verificationRequestStatus: 'failed',
      verificationVerifierEmail: 'verifier@example.com',
      verificationEmailError: 'Resend unavailable',
    });
    expect(profile.impactStories[0].verificationRequestedAt).toBeTruthy();
  });

  describe('updateEducation', () => {
    it('should update the education row for the authenticated user', async () => {
      const returningMock = vi.fn(() => Promise.resolve([{ id: 'edu-1' }]));
      const whereMock = vi.fn(() => ({ returning: returningMock }));
      const setMock = vi.fn(() => ({ where: whereMock }));
      (db.update as any).mockReturnValue({ set: setMock });

      const payload = {
        institution: 'Updated Institute',
        degree: 'Updated Degree',
        duration: '2020 - 2022',
        skills: 'React',
        projects: 'Capstone',
        verified: false,
      };

      const result = await updateEducation('edu-1', payload);

      expect(db.update).toHaveBeenCalledWith(education);
      expect(setMock).toHaveBeenCalledWith(expect.objectContaining(payload));
      expect(whereMock).toHaveBeenCalledTimes(1);
      expect(returningMock).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ id: 'edu-1' });
    });
  });

  describe('updateImpactStory', () => {
    it('should update the impact story row for the authenticated user', async () => {
      const returningMock = vi.fn(() => Promise.resolve([{ id: 'impact-1' }]));
      const whereMock = vi.fn(() => ({ returning: returningMock }));
      const setMock = vi.fn(() => ({ where: whereMock }));
      (db.update as any).mockReturnValue({ set: setMock });

      const payload = {
        title: 'Updated impact',
        orgDescription: 'Org',
        impact: 'Impact',
        businessValue: 'Business value',
        outcomes: 'Outcome',
        timeline: '2024',
        timelineStructured: {
          mode: 'single' as const,
          precision: 'year' as const,
          start: '2024',
          end: null,
          ongoing: false,
        },
        affiliationType: 'organization' as const,
        affiliationDetails: 'Org details',
        roleTitle: 'Lead',
        roleScope: 'owned' as const,
        primaryCause: 'education',
        secondaryCauses: [],
        measuredOutcomes: [],
        supportingArtifacts: [],
        verificationRequest: null,
        verified: true,
      };

      const result = await updateImpactStory('impact-1', payload);

      expect(db.update).toHaveBeenCalledWith(impactStories);
      expect(setMock).toHaveBeenCalledTimes(1);
      expect(whereMock).toHaveBeenCalledTimes(1);
      expect(returningMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: 'impact-1' });
    });
  });

  describe('requestImpactStoryVerification', () => {
    it('sends verification request for existing impact story and returns pending status', async () => {
      mockRequireAuth.mockResolvedValueOnce({
        id: 'test-user-id',
        displayName: 'Pavlo Samoshko',
      });

      const storyRow = {
        id: 'impact-1',
        title: 'Saved impact',
        orgDescription: 'Org',
        impact: 'Impact',
        businessValue: 'Value',
        outcomes: 'Outcome',
        timeline: '2024',
        timelineStructured: {
          mode: 'single',
          precision: 'year',
          start: '2024',
        },
        affiliationType: 'organization',
        affiliationDetails: 'Org details',
        roleTitle: 'Lead',
        roleScope: 'owned',
        primaryCause: 'education',
        secondaryCauses: [],
        measuredOutcomes: [],
        supportingArtifacts: [],
        verified: false,
      };

      const selectLimitMock = vi.fn().mockResolvedValue([storyRow]);
      const selectWhereMock = vi.fn().mockReturnValue({ limit: selectLimitMock });
      const selectFromMock = vi.fn().mockReturnValue({ where: selectWhereMock });
      mockDb.select.mockReturnValueOnce({ from: selectFromMock });
      mockSelectWithLimit([]);

      mockSelectWithLimit([]);

      const result = await requestImpactStoryVerification({
        storyId: 'impact-1',
        verificationRequest: {
          verifierEmail: 'Verifier@Example.com',
          verifierName: 'Verifier Name',
        },
      });

      expect(mockCreateCanonicalImpactVerificationRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'test-user-id',
          impactStoryId: 'impact-1',
          verifierEmail: 'verifier@example.com',
          claimSnapshot: expect.objectContaining({
            context: expect.objectContaining({
              requesterName: 'Pavlo Samoshko',
            }),
          }),
        })
      );
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'verifier@example.com',
        })
      );
      expect(mockUpdateCanonicalImpactVerificationRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'request-1',
          status: 'pending',
          emailSent: true,
        })
      );
      expect(result.story.id).toBe('impact-1');
      expect(result.verification).toMatchObject({
        requestId: 'request-1',
        status: 'pending',
        emailSent: true,
      });
    });

    it('persists existing story draft before sending and snapshots updated outcomes', async () => {
      const updatedStoryRow = {
        id: 'impact-3',
        title: 'Updated draft title',
        orgDescription: 'Org',
        impact: 'Impact',
        businessValue: 'Value',
        outcomes: 'Draft outcomes text',
        timeline: '2025',
        timelineStructured: {
          mode: 'single',
          precision: 'year',
          start: '2025',
        },
        affiliationType: 'organization',
        affiliationDetails: 'Org details',
        roleTitle: 'Director',
        roleScope: 'owned',
        primaryCause: 'education',
        secondaryCauses: [],
        measuredOutcomes: [
          {
            id: 'outcome-new',
            label: 'Families reached',
            value: 42,
            unit: 'families',
            valueMode: 'absolute',
            timeframe: 'Q2 2025',
            baseline: null,
            after: null,
            confidence: 'exact',
          },
        ],
        supportingArtifacts: [],
        verified: false,
      };

      const updateCalls: Array<{ table: unknown; payload: any }> = [];
      mockDb.update.mockImplementation((table: unknown) => ({
        set: vi.fn((payload: any) => {
          updateCalls.push({ table, payload });

          if (table === impactStories) {
            return {
              where: vi.fn(() => ({
                returning: vi.fn().mockResolvedValue([updatedStoryRow]),
              })),
            };
          }

          return {
            where: vi.fn().mockResolvedValue(undefined),
          };
        }),
      }));

      mockCreateCanonicalImpactVerificationRequest.mockResolvedValueOnce({
        record: {
          id: 'request-3',
          integrityStatus: 'clear',
          createdAt: new Date('2026-02-27T09:30:00.000Z'),
        },
        rawToken: 'b'.repeat(64),
        expiresAt: new Date('2026-03-13T09:30:00.000Z'),
      });
      mockSelectWithLimit([]);

      const result = await requestImpactStoryVerification({
        storyId: 'impact-3',
        storyDraft: {
          title: 'Updated draft title',
          orgDescription: 'Org',
          impact: 'Impact',
          businessValue: 'Value',
          outcomes: 'Draft outcomes text',
          timeline: '2025',
          timelineStructured: {
            mode: 'single',
            precision: 'year',
            start: '2025',
          },
          affiliationType: 'organization',
          affiliationDetails: 'Org details',
          roleTitle: 'Director',
          roleScope: 'owned',
          primaryCause: 'education',
          secondaryCauses: [],
          measuredOutcomes: [
            {
              id: 'outcome-new',
              label: 'Families reached',
              value: 42,
              unit: 'families',
              valueMode: 'absolute',
              timeframe: 'Q2 2025',
              baseline: null,
              after: null,
              confidence: 'exact',
            },
          ],
          supportingArtifacts: [],
          verified: false,
          verificationRequest: null,
        },
        verificationRequest: {
          verifierEmail: 'draft-verifier@example.com',
        },
      });

      expect(updateCalls[0]).toMatchObject({
        table: impactStories,
        payload: expect.objectContaining({
          title: 'Updated draft title',
          measuredOutcomes: expect.arrayContaining([
            expect.objectContaining({
              id: 'outcome-new',
              label: 'Families reached',
            }),
          ]),
        }),
      });

      expect(mockCreateCanonicalImpactVerificationRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          impactStoryId: 'impact-3',
          claimSnapshot: expect.objectContaining({
            outcomeClaims: expect.arrayContaining([
              expect.objectContaining({
                id: 'outcome:outcome-new',
                outcomeId: 'outcome-new',
              }),
            ]),
          }),
        })
      );

      expect(result.story.title).toBe('Updated draft title');
      expect(result.verification.status).toBe('pending');
    });

    it('marks request as failed when receiver email send fails', async () => {
      const storyRow = {
        id: 'impact-2',
        title: 'Saved impact',
        orgDescription: 'Org',
        impact: 'Impact',
        businessValue: 'Value',
        outcomes: 'Outcome',
        timeline: '2024',
        timelineStructured: {
          mode: 'single',
          precision: 'year',
          start: '2024',
        },
        affiliationType: 'organization',
        affiliationDetails: 'Org details',
        roleTitle: 'Lead',
        roleScope: 'owned',
        primaryCause: 'education',
        secondaryCauses: [],
        measuredOutcomes: [],
        supportingArtifacts: [],
        verified: false,
      };

      const selectLimitMock = vi.fn().mockResolvedValue([storyRow]);
      const selectWhereMock = vi.fn().mockReturnValue({ limit: selectLimitMock });
      const selectFromMock = vi.fn().mockReturnValue({ where: selectWhereMock });
      mockDb.select.mockReturnValueOnce({ from: selectFromMock });
      mockSelectWithLimit([]);

      mockCreateCanonicalImpactVerificationRequest.mockResolvedValueOnce({
        record: {
          id: 'request-2',
          integrityStatus: 'clear',
          createdAt: new Date('2026-02-27T09:00:00.000Z'),
        },
        rawToken: 'c'.repeat(64),
        expiresAt: new Date('2026-03-13T09:00:00.000Z'),
      });
      mockSendEmail.mockResolvedValueOnce({ success: false, error: 'Resend unavailable' });

      const result = await requestImpactStoryVerification({
        storyId: 'impact-2',
        verificationRequest: {
          verifierEmail: 'Verifier@Example.com',
        },
      });

      expect(result.verification).toMatchObject({
        status: 'failed',
        emailSent: false,
        emailError: 'Resend unavailable',
      });
      expect(mockUpdateCanonicalImpactVerificationRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'request-2',
          status: 'failed',
          emailError: 'Resend unavailable',
        })
      );
    });
  });

  describe('updateExperience', () => {
    it('should update the experience row for the authenticated user', async () => {
      const returningMock = vi.fn(() =>
        Promise.resolve([
          {
            id: 'exp-1',
            title: 'Updated role',
            orgDescription: 'Org',
            duration: 'Jan 2024 - Present',
            startDate: '2024-01-01',
            endDate: null,
            outcomes: 'Outcomes',
            projects: 'Projects',
            colleagues: 'Colleagues',
            achievements: 'Achievements',
            verified: true,
          },
        ])
      );
      const whereMock = vi.fn(() => ({ returning: returningMock }));
      const setMock = vi.fn(() => ({ where: whereMock }));
      (db.update as any).mockReturnValue({ set: setMock });

      const payload = {
        title: 'Updated role',
        orgDescription: 'Org',
        duration: 'Jan 2024 - Present',
        startDate: '2024-01-01',
        endDate: null,
        outcomes: 'Outcomes',
        projects: 'Projects',
        colleagues: 'Colleagues',
        achievements: 'Achievements',
        verified: true,
      };

      const result = await updateExperience('exp-1', payload);

      expect(db.update).toHaveBeenCalledWith(experiences);
      expect(setMock).toHaveBeenCalledTimes(1);
      expect(whereMock).toHaveBeenCalledTimes(1);
      expect(returningMock).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ id: 'exp-1', startDate: '2024-01-01', endDate: null });
    });
  });

  describe('createExperience', () => {
    it('should persist measured outcomes and project entries as jsonb expressions', async () => {
      const returningMock = vi.fn(() =>
        Promise.resolve([
          {
            id: 'exp-1',
            title: 'Senior Product Engineer',
            orgDescription: 'Proofound Testing Studio',
            duration: 'Jan 2024 - Present',
            startDate: '2024-01-01',
            endDate: null,
            outcomes: 'Deployment stability',
            projects: 'Migration readiness sprint',
            colleagues: 'Team',
            achievements: 'Completed transition',
            verified: true,
            measuredOutcomes: [],
            projectEntries: [],
          },
        ])
      );
      const valuesMock = vi.fn(() => ({ returning: returningMock }));
      (db.insert as any).mockReturnValue({ values: valuesMock });

      await createExperience({
        title: 'Senior Product Engineer',
        organizationName: 'Proofound Testing Studio',
        orgDescription: '',
        duration: 'Jan 2024 - Present',
        outcomes: 'Deployment stability',
        projects: 'Migration readiness sprint',
        colleagues: 'Team',
        achievements: 'Completed transition',
        verified: true,
        measuredOutcomes: [{ id: 'out-1', name: 'Deployments', value: 12, unit: 'units' }],
        projectEntries: [
          {
            id: 'proj-1',
            name: 'Migration readiness sprint',
            participationCapacity: 'contributed',
            duration: '3 months',
          },
        ],
      } as any);

      expect(db.insert).toHaveBeenCalledWith(experiences);
      expect(valuesMock).toHaveBeenCalledTimes(1);
      const persistencePayload = valuesMock.mock.calls[0][0];

      expect(persistencePayload.measuredOutcomes).toHaveProperty('queryChunks');
      expect(persistencePayload.projectEntries).toHaveProperty('queryChunks');
      expect(Array.isArray(persistencePayload.measuredOutcomes)).toBe(false);
      expect(Array.isArray(persistencePayload.projectEntries)).toBe(false);
    });
  });

  describe('updateVolunteering', () => {
    it('should update the volunteering row for the authenticated user', async () => {
      const returningMock = vi.fn(() => Promise.resolve([{ id: 'vol-1' }]));
      const whereMock = vi.fn(() => ({ returning: returningMock }));
      const setMock = vi.fn(() => ({ where: whereMock }));
      (db.update as any).mockReturnValue({ set: setMock });

      const payload = {
        title: 'Updated Role',
        orgDescription: 'Org',
        duration: '2021 - Present',
        cause: 'Cause',
        impact: 'Impact',
        skillsDeployed: 'React',
        personalWhy: 'Why',
        verified: false,
      };

      const result = await updateVolunteering('vol-1', payload);

      expect(db.update).toHaveBeenCalledWith(volunteering);
      expect(setMock).toHaveBeenCalledWith(expect.objectContaining(payload));
      expect(whereMock).toHaveBeenCalledTimes(1);
      expect(returningMock).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ id: 'vol-1' });
    });
  });
});
