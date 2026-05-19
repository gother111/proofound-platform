import { expect, test } from '@playwright/test';

test.describe('CV import non-launch hard gate', () => {
  test('keeps legacy CV import wizard API archived', async ({ request }) => {
    const response = await request.post('/api/expertise/cv-import/wizard-suggest', {
      data: { documents: [] },
    });
    const payload = await response.json();

    expect(response.status()).toBe(410);
    expect(payload).toMatchObject({
      surface: 'Legacy Expertise API',
      launchState: 'non_launch',
    });
    expect(JSON.stringify(payload)).not.toMatch(/score|rank|shortlist|verifiedAt|publishedAt/i);
  });

  test('keeps the legacy expertise page outside the compiled MVP surface', async ({ request }) => {
    const response = await request.get('/app/i/expertise');

    expect(response.status()).toBe(404);
  });
});
