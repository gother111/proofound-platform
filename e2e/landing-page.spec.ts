import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero with the new wedge and primary actions', async ({ page }) => {
    const hero = page.getByTestId('landing-hero-section');
    await expect(hero).toBeVisible();

    await expect(
      page.getByRole('heading', { name: /See the work behind the claim/i, level: 1 })
    ).toBeVisible();

    await expect(hero.getByText(/Stronger signal than CVs/i)).toBeVisible();
    await expect(hero.getByRole('button', { name: /Request a pilot/i })).toBeVisible();
    await expect(hero.getByRole('button', { name: /Create your proof portfolio/i })).toBeVisible();
    await expect(hero.getByText(/Review handoff/i)).toBeVisible();
    await expect(hero.getByText(/Shared into a privacy-safe assignment corridor\./i)).toBeVisible();
  });

  test('renders the quiet desktop header navigation', async ({ page }) => {
    const header = page.getByRole('banner');
    await expect(header.getByRole('link', { name: /Proofound home/i })).toBeVisible();
    await expect(header.getByRole('link', { name: 'How it works' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'For individuals' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'For organizations' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
  });

  test('renders the requested section sequence', async ({ page }) => {
    await expect(page.getByText('What changes when proof comes first')).toBeVisible();

    const headings = [
      'One clear starting point for each side.',
      'Better assignments create better shortlists.',
      'Build proof. Publish trust. Review safely.',
      'Every real claim should resolve to evidence.',
      'Public does not mean exposed.',
      'What this looks like in practice.',
      'Start with proof, not noise.',
    ];

    for (const heading of headings) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }
  });

  test('renders both day-one surfaces with correct actions', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Public proof portfolio/i })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Trust page \+ assignment corridor/i })
    ).toBeVisible();

    await expect(
      page.getByRole('link', { name: /Create your proof portfolio/i }).first()
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Request a pilot/i }).first()).toBeVisible();
  });

  test('renders privacy-safe review explanations', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Blind by default/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Progressive reveal/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Explainable review/i })).toBeVisible();
  });

  test('renders final CTA and footer links', async ({ page }) => {
    const finalCta = page.getByTestId('landing-final-cta-section');
    await expect(finalCta).toBeVisible();
    await expect(
      finalCta.getByRole('button', { name: /Create your proof portfolio/i })
    ).toBeVisible();
    await expect(finalCta.getByRole('button', { name: /Request a pilot/i })).toBeVisible();

    const footer = page.getByTestId('landing-footer-section');
    await expect(footer).toBeVisible();
    await expect(footer.getByRole('link', { name: /Cookies/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Cookie settings/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Privacy/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Terms/i })).toBeVisible();
  });

  test('maintains the new layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: /See the work behind the claim/i, level: 1 })
    ).toBeVisible();

    const hero = page.getByTestId('landing-hero-section');
    await expect(hero.getByRole('button', { name: /Create your proof portfolio/i })).toBeVisible();
    await expect(hero.getByRole('button', { name: /Request a pilot/i })).toBeVisible();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('all primary sections render inside main', async ({ page }) => {
    const sections = page.locator('main').locator('section');
    await expect(sections).toHaveCount(9);
  });
});

test.describe('Accessibility', () => {
  test('has a single h1 and multiple supporting h2 headings', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.locator('h2').count()).toBeGreaterThan(0);
  });

  test('all images have alt text or are decorative', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i += 1) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');

      expect(alt !== null || ariaHidden === 'true').toBeTruthy();
    }
  });
});
