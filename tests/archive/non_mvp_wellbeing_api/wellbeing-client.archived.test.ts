import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveSelfAssessment, saveWorkSchedule, setWellbeingOptIn } from '@/lib/wellbeing/client';
import { apiFetch } from '@/lib/api/fetch';

// Archived with the non-MVP wellbeing/Zen API surface. The launch corridor keeps
// active coverage on 410 route policy instead of these retired client helpers.

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

describe('wellbeing client helpers', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
    vi.mocked(apiFetch).mockResolvedValue({ ok: true } as Response);
  });

  it('uses apiFetch for setWellbeingOptIn', async () => {
    const payload = { optedIn: true, privacyBannerAcknowledged: true };

    await setWellbeingOptIn(payload);

    expect(apiFetch).toHaveBeenCalledWith(
      '/api/wellbeing/opt-in',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  });

  it('uses apiFetch for saveWorkSchedule', async () => {
    const payload = {
      schedule: {
        monday: 8,
        tuesday: 8,
        wednesday: 8,
        thursday: 8,
        friday: 8,
        saturday: 0,
        sunday: 0,
      },
    };

    await saveWorkSchedule(payload);

    expect(apiFetch).toHaveBeenCalledWith(
      '/api/wellbeing/work-schedule',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  });

  it('uses apiFetch for saveSelfAssessment', async () => {
    const payload = {
      assessmentType: 'phq2' as const,
      score: 3,
      severity: 'Elevated Strain',
      responses: {
        phq2_1: 1,
        phq2_2: 2,
      },
    };

    await saveSelfAssessment(payload);

    expect(apiFetch).toHaveBeenCalledWith(
      '/api/wellbeing/self-assessment',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  });
});
