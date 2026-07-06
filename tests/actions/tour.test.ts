import { beforeEach, describe, expect, it, vi } from 'vitest';

import { completeTour, getTourStatus, resetTour } from '@/actions/tour';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';
import { revalidatePath } from 'next/cache';

const mocks = vi.hoisted(() => ({
  db: {
    update: vi.fn(),
    query: {
      profiles: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock('@/db', () => ({
  db: mocks.db,
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

function mockUpdateSuccess() {
  const where = vi.fn().mockResolvedValue({});
  const set = vi.fn().mockReturnValue({ where });
  mocks.db.update.mockReturnValue({ set });

  return { set, where };
}

describe('tour actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-1' } as any);
  });

  it('completes the tour and revalidates active app shells', async () => {
    mockUpdateSuccess();
    mocks.db.query.profiles.findFirst.mockResolvedValue({ tourCompleted: true });

    const result = await completeTour();

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith('/app');
    expect(revalidatePath).toHaveBeenCalledWith('/app/i');
    expect(revalidatePath).toHaveBeenCalledWith('/app/o');
  });

  it('logs structured completion verification failures', async () => {
    mockUpdateSuccess();
    mocks.db.query.profiles.findFirst.mockResolvedValue({ tourCompleted: false });

    const result = await completeTour();

    expect(result).toEqual({
      success: false,
      error: 'Failed to verify tour completion in database',
    });
    expect(log.error).toHaveBeenCalledWith('tour.complete.verify_failed', {
      userId: 'user-1',
    });
  });

  it('logs structured reset failures', async () => {
    mocks.db.update.mockImplementation(() => {
      throw new Error('reset failed');
    });

    const result = await resetTour();

    expect(result).toEqual({
      success: false,
      error: 'reset failed',
    });
    expect(log.error).toHaveBeenCalledWith('tour.reset.failed', {
      error: expect.any(Error),
    });
  });

  it('returns tour status and logs structured status failures', async () => {
    mocks.db.query.profiles.findFirst.mockRejectedValueOnce(new Error('status failed'));

    const failed = await getTourStatus();

    expect(failed).toEqual({
      success: false,
      tourCompleted: false,
      persona: 'unknown',
      userId: '',
      error: 'status failed',
    });
    expect(log.error).toHaveBeenCalledWith('tour.status.failed', {
      error: expect.any(Error),
    });

    mocks.db.query.profiles.findFirst.mockResolvedValueOnce({
      tourCompleted: true,
      persona: 'individual',
    });

    const success = await getTourStatus();

    expect(success).toEqual({
      success: true,
      tourCompleted: true,
      persona: 'individual',
      userId: 'user-1',
    });
  });
});
