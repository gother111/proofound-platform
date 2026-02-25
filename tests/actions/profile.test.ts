import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateVision,
  replaceCauses,
  updateMission,
  updateEducation,
  updateVolunteering,
} from '@/actions/profile';
import { db } from '@/db';
import { education, individualProfiles, volunteering } from '@/db/schema';

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
    });
    const { set } = mockUpdateSuccess();

    await updateMission('Build trustworthy systems');

    expect(db.update).toHaveBeenCalledWith(individualProfiles);
    expect(set).toHaveBeenCalledWith({ mission: 'Build trustworthy systems' });
  });

  it('rejects mission update when values are missing', async () => {
    mockCurrentProfileRow({
      value: null,
      fieldVisibility: {},
      values: [],
      causes: ['Climate Justice'],
    });
    mockUpdateSuccess();

    await expect(updateMission('Build trustworthy systems')).rejects.toThrow(
      'Add at least one value before updating your mission.'
    );
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

    await expect(updateMission('Build trustworthy systems')).rejects.toThrow(
      'Add at least one cause before updating your mission.'
    );
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

    await expect(updateVision('A fair and open future')).rejects.toThrow(
      'Add at least one value and at least one cause before updating your vision.'
    );
    expect(db.update).not.toHaveBeenCalled();
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
