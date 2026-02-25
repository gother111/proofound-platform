import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateVision,
  replaceValues,
  updateMission,
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
  individualProfiles,
  volunteering,
} from '@/db/schema';

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  update: vi.fn(),
}));

const mockRequireAuth = vi.hoisted(() => vi.fn());

vi.mock('@/db', () => ({
  db: {
    select: mockDb.select,
    update: mockDb.update,
  },
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock('@/lib/audit/purpose-log', () => ({
  logPurposeEdit: vi.fn(),
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

describe('profile purpose actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ id: 'test-user-id' });
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
