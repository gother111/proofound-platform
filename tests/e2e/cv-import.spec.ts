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

  test('does not expose generic profile CV import from the expertise surface', async ({ page }) => {
    await page.goto('/app/i/expertise');

    await expect(
      page.getByRole('button', { name: /import from cv|import from resume/i })
    ).toHaveCount(0);
    await expect(page.getByRole('tab', { name: /import from cv|import from resume/i })).toHaveCount(
      0
    );
  });
});
