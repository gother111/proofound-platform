import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {},
}));

vi.mock('@/db/schema', () => ({
  notificationPreferences: {},
  notifications: {},
  profiles: {},
}));

vi.mock('@/lib/email/sender', () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock('@/lib/momentum/summary', () => ({
  getMomentumSummary: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { getWeeklyDigestAvailability, processWeeklyDigests } from '../weekly-digest';

describe('weekly digest availability', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('defaults to disabled', async () => {
    const availability = getWeeklyDigestAvailability();
    const result = await processWeeklyDigests();

    expect(availability).toEqual({
      enabled: false,
      reason: 'Weekly digest delivery is temporarily disabled.',
    });
    expect(result).toEqual({
      processed: 0,
      emailed: 0,
      createdInApp: 0,
      skipped: 0,
      errors: [],
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it('stays disabled even when ENABLE_WEEKLY_DIGEST is true', async () => {
    vi.stubEnv('ENABLE_WEEKLY_DIGEST', 'true');

    const availability = getWeeklyDigestAvailability();
    const result = await processWeeklyDigests();

    expect(availability).toEqual({
      enabled: false,
      reason: 'Weekly digest delivery is temporarily disabled.',
    });
    expect(result).toEqual({
      processed: 0,
      emailed: 0,
      createdInApp: 0,
      skipped: 0,
      errors: [],
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});
