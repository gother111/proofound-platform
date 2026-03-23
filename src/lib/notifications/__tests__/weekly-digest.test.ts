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

  it('defaults to disabled when ENABLE_WEEKLY_DIGEST is unset', async () => {
    const availability = getWeeklyDigestAvailability();
    const result = await processWeeklyDigests();

    expect(availability).toEqual({
      enabled: false,
      reason: 'Weekly digest delivery is disabled unless ENABLE_WEEKLY_DIGEST=true',
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

  it('stays disabled when ENABLE_WEEKLY_DIGEST is false', async () => {
    vi.stubEnv('ENABLE_WEEKLY_DIGEST', 'false');

    const availability = getWeeklyDigestAvailability();
    const result = await processWeeklyDigests();

    expect(availability).toEqual({
      enabled: false,
      reason: 'Weekly digest delivery is disabled unless ENABLE_WEEKLY_DIGEST=true',
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
