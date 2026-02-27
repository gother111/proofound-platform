import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateVision,
  replaceValues,
  updateMission,
  getProfileData,
  requestImpactStoryVerification,
  updateImpactStory,
  updateExperience,
  updateEducation,
  updateVolunteering,
} from '@/actions/profile';
import { db } from '@/db';
import {
  education,
  experiences,
  impactStories,
  impactStoryVerificationRequests,
  individualProfiles,
  volunteering,
} from '@/db/schema';

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

vi.mock('@/lib/audit/purpose-log', () => ({
  logPurposeEdit: vi.fn(),
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
      hasPurpose: false,
      hasConstraints: false,
      proofCount: 0,
    },
    nextTierTarget: null,
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

function mockCurrentProfileRow(row: {
  value: string | null;
  fieldVisibility: Record<string, unknown>;
  values: unknown[];
  causes: string[];
  missionLinks?: unknown;
  visionLinks?: unknown;
}) {
  const limit = vi.fn().mockResolvedValue([row]);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  mockDb.select.mockReturnValue({ from });
}

function mockUpdateSuccess() {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn().mockReturnValue({ where });
  mockDb.update.mockReturnValue({ set });
  return { set, where };
}

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
  });

  it('updates mission when at least one value and one cause exist', async () => {
    mockCurrentProfileRow({
      value: null,
      fieldVisibility: {},
      values: [{ id: 'v1', label: 'Integrity' }],
      causes: ['Climate Justice'],
      missionLinks: { values: ['Integrity'], causes: ['Climate Justice'] },
    });
    const { set } = mockUpdateSuccess();

    await updateMission('Build trustworthy systems', {
      values: ['Integrity'],
      causes: ['Climate Justice'],
    });

    expect(db.update).toHaveBeenCalledWith(individualProfiles);
    expect(set).toHaveBeenCalledWith({
      mission: 'Build trustworthy systems',
      missionLinks: { values: ['Integrity'], causes: ['Climate Justice'] },
    });
  });

  it('rejects mission update when values are missing', async () => {
    mockCurrentProfileRow({
      value: null,
      fieldVisibility: {},
      values: [],
      causes: ['Climate Justice'],
    });
    mockUpdateSuccess();

    await expect(
      updateMission('Build trustworthy systems', {
        values: ['Integrity'],
        causes: ['Climate Justice'],
      })
    ).rejects.toThrow('Add at least one value before updating your mission.');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('rejects mission update when causes are missing', async () => {
    mockCurrentProfileRow({
      value: null,
      fieldVisibility: {},
      values: [{ id: 'v1', label: 'Integrity' }],
      causes: [],
    });
    mockUpdateSuccess();

    await expect(
      updateMission('Build trustworthy systems', {
        values: ['Integrity'],
        causes: ['Climate Justice'],
      })
    ).rejects.toThrow('Add at least one cause before updating your mission.');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('rejects vision update when prerequisites are missing', async () => {
    mockCurrentProfileRow({
      value: null,
      fieldVisibility: {},
      values: [],
      causes: [],
    });
    mockUpdateSuccess();

    await expect(
      updateVision('A fair and open future', {
        values: ['Integrity'],
        causes: ['Climate Justice'],
      })
    ).rejects.toThrow('Add at least one value and at least one cause before updating your vision.');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('rejects mission update when links are missing', async () => {
    mockCurrentProfileRow({
      value: null,
      fieldVisibility: {},
      values: [{ id: 'v1', label: 'Integrity' }],
      causes: ['Climate Justice'],
      missionLinks: null,
    });
    mockUpdateSuccess();

    await expect(updateMission('Build trustworthy systems')).rejects.toThrow(
      'Select at least one linked value and one linked cause before updating your mission.'
    );
    expect(db.update).not.toHaveBeenCalled();
  });

  it('rejects mission update when links are outside available values/causes', async () => {
    mockCurrentProfileRow({
      value: null,
      fieldVisibility: {},
      values: [{ id: 'v1', label: 'Integrity' }],
      causes: ['Climate Justice'],
      missionLinks: { values: [], causes: [] },
    });
    mockUpdateSuccess();

    await expect(
      updateMission('Build trustworthy systems', {
        values: ['Courage'],
        causes: ['Housing'],
      })
    ).rejects.toThrow(
      'Select at least one linked value and one linked cause before updating your mission.'
    );
    expect(db.update).not.toHaveBeenCalled();
  });

  it('auto-prunes mission/vision links when values are replaced', async () => {
    const limit = vi.fn().mockResolvedValue([
      {
        values: [
          { id: 'v1', label: 'Integrity' },
          { id: 'v2', label: 'Transparency' },
        ],
        causes: ['Climate Justice'],
        missionLinks: {
          values: ['Integrity', 'Transparency'],
          causes: ['Climate Justice'],
        },
        visionLinks: {
          values: ['Transparency'],
          causes: ['Climate Justice'],
        },
      },
    ]);
    const whereSelect = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where: whereSelect });
    mockDb.select.mockReturnValue({ from });

    const whereUpdate = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where: whereUpdate });
    mockDb.update.mockReturnValue({ set });

    await replaceValues([{ id: 'v1', label: 'Integrity', icon: 'Shield', verified: false }]);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        values: [{ id: 'v1', label: 'Integrity', icon: 'Shield', verified: false }],
        missionLinks: {
          values: ['Integrity'],
          causes: ['Climate Justice'],
        },
        visionLinks: {
          values: [],
          causes: ['Climate Justice'],
        },
      })
    );
  });

  it('falls back to values-only update when purpose link columns are missing', async () => {
    const nextValues = [{ id: 'v1', label: 'Integrity', icon: 'Shield', verified: false }];

    const limit = vi.fn().mockResolvedValue([
      {
        values: nextValues,
        causes: ['Climate Justice'],
        missionLinks: {
          values: ['Integrity'],
          causes: ['Climate Justice'],
        },
        visionLinks: {
          values: ['Integrity'],
          causes: ['Climate Justice'],
        },
      },
    ]);
    const whereSelect = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where: whereSelect });
    mockDb.select.mockReturnValue({ from });

    const whereWithLinks = vi.fn().mockRejectedValue({
      code: '42703',
      message: 'column "mission_links" does not exist',
    });
    const setWithLinks = vi.fn().mockReturnValue({ where: whereWithLinks });

    const whereFallback = vi.fn().mockResolvedValue(undefined);
    const setFallback = vi.fn().mockReturnValue({ where: whereFallback });

    mockDb.update
      .mockReturnValueOnce({ set: setWithLinks })
      .mockReturnValueOnce({ set: setFallback });

    await replaceValues(nextValues as any);

    expect(setFallback).toHaveBeenCalledWith({ values: nextValues });
    expect(whereFallback).toHaveBeenCalledTimes(1);
  });

  it('normalizes legacy JSON string shapes when reading profile data', async () => {
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

    expect(profile.values).toEqual([
      { id: 'v1', icon: 'Shield', label: 'Integrity', verified: true },
      { id: 'legacy-1-trust', icon: 'Heart', label: 'Trust', verified: false },
    ]);
    expect(profile.missionLinks).toEqual({
      values: ['Integrity'],
      causes: ['Climate Justice'],
    });
    expect(profile.visionLinks).toEqual({
      values: ['Trust'],
      causes: ['Climate Justice'],
    });
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
    mockSelectWithWhere([
      {
        impactStoryId: 'impact-1',
        status: 'failed',
        verifierEmail: 'verifier@example.com',
        createdAt: new Date('2026-02-27T09:00:00.000Z'),
        emailSentAt: null,
        emailError: 'Resend unavailable',
      },
      {
        impactStoryId: 'impact-1',
        status: 'pending',
        verifierEmail: 'older@example.com',
        createdAt: new Date('2026-02-26T09:00:00.000Z'),
        emailSentAt: new Date('2026-02-26T09:01:00.000Z'),
        emailError: null,
      },
    ]); // impact verification summaries
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
      expect(setMock).toHaveBeenCalledWith(payload);
      expect(whereMock).toHaveBeenCalledTimes(1);
      expect(returningMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: 'edu-1' });
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

      const insertPayloads: any[] = [];
      mockDb.insert.mockImplementation((table: unknown) => ({
        values: vi.fn((payload: any) => {
          insertPayloads.push({ table, payload });
          return {
            returning: vi.fn().mockResolvedValue([
              {
                id: 'request-1',
                integrityStatus: 'clear',
                createdAt: new Date('2026-02-27T09:00:00.000Z'),
              },
            ]),
          };
        }),
      }));

      const updateWhereMock = vi.fn().mockResolvedValue(undefined);
      const updateSetMock = vi.fn().mockReturnValue({ where: updateWhereMock });
      mockDb.update.mockReturnValue({ set: updateSetMock });

      const result = await requestImpactStoryVerification({
        storyId: 'impact-1',
        verificationRequest: {
          verifierEmail: 'Verifier@Example.com',
          verifierName: 'Verifier Name',
        },
      });

      expect(insertPayloads[0]).toMatchObject({
        table: impactStoryVerificationRequests,
        payload: expect.objectContaining({
          impactStoryId: 'impact-1',
          verifierEmail: 'verifier@example.com',
          status: 'pending',
        }),
      });
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'verifier@example.com',
        })
      );
      expect(updateSetMock).toHaveBeenCalledWith(
        expect.objectContaining({
          emailSentAt: expect.any(Date),
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

      const insertPayloads: any[] = [];
      mockDb.insert.mockImplementation((table: unknown) => ({
        values: vi.fn((payload: any) => {
          insertPayloads.push({ table, payload });
          return {
            returning: vi.fn().mockResolvedValue([
              {
                id: 'request-3',
                integrityStatus: 'clear',
                createdAt: new Date('2026-02-27T09:30:00.000Z'),
              },
            ]),
          };
        }),
      }));

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

      expect(insertPayloads[0]).toMatchObject({
        table: impactStoryVerificationRequests,
        payload: expect.objectContaining({
          impactStoryId: 'impact-3',
          claimSnapshot: expect.objectContaining({
            outcomeClaims: expect.arrayContaining([
              expect.objectContaining({
                id: 'outcome:outcome-new',
                outcomeId: 'outcome-new',
              }),
            ]),
          }),
        }),
      });

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

      mockDb.insert.mockReturnValue({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'request-2',
              integrityStatus: 'clear',
              createdAt: new Date('2026-02-27T09:00:00.000Z'),
            },
          ]),
        })),
      });

      const updateSetCalls: any[] = [];
      const updateWhereMock = vi.fn().mockResolvedValue(undefined);
      mockDb.update.mockReturnValue({
        set: vi.fn((payload: any) => {
          updateSetCalls.push(payload);
          return { where: updateWhereMock };
        }),
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
      expect(updateSetCalls[0]).toMatchObject({
        status: 'failed',
        emailError: 'Resend unavailable',
      });
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
      expect(setMock).toHaveBeenCalledWith(payload);
      expect(whereMock).toHaveBeenCalledTimes(1);
      expect(returningMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: 'vol-1' });
    });
  });
});
