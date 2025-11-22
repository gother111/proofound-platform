import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateVision, replaceCauses, updateMission } from '@/actions/profile';
import { db } from '@/db';
import { individualProfiles } from '@/db/schema';

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
});
