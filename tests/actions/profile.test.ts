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

// Mock the database
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(() => Promise.resolve({ id: 'test-user-id' })),
}));

// Mock audit log
vi.mock('@/lib/audit/purpose-log', () => ({
  logPurposeEdit: vi.fn(),
}));

// Mock analytics
vi.mock('@/lib/analytics/events', () => ({
  emitEvent: vi.fn(),
  emitProfileActivated: vi.fn(),
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Profile Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateVision', () => {
    it('should update vision in the database', async () => {
      const vision = 'To build a better future.';

      // Setup mocks
      const setMock = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      }));
      (db.update as any).mockReturnValue({ set: setMock });

      await updateVision(vision);

      expect(db.update).toHaveBeenCalledWith(individualProfiles);
      expect(setMock).toHaveBeenCalledWith({ vision });
    });
  });

  describe('replaceCauses', () => {
    it('should update causes in the database', async () => {
      const causes = ['Environment', 'Education'];

      // Setup mocks
      const setMock = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      }));
      (db.update as any).mockReturnValue({ set: setMock });

      await replaceCauses(causes);

      expect(db.update).toHaveBeenCalledWith(individualProfiles);
      expect(setMock).toHaveBeenCalledWith({ causes });
    });
  });

  describe('updateMission', () => {
    it('should update mission in the database', async () => {
      const mission = 'My mission is to learn.';

      // Setup mocks
      const setMock = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      }));
      (db.update as any).mockReturnValue({ set: setMock });

      await updateMission(mission);

      expect(db.update).toHaveBeenCalledWith(individualProfiles);
      expect(setMock).toHaveBeenCalledWith({ mission });
    });
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
