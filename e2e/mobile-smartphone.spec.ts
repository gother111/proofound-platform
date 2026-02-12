import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 12'] });
test.setTimeout(120000);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
  });
});

async function gotoStable(page: import('@playwright/test').Page, route: string) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);
      return;
    } catch (error) {
      if (attempt === 1) throw error;
      await page.waitForTimeout(300);
    }
  }
}

test.describe('Smartphone UI regression', () => {
  test.describe.configure({ mode: 'serial' });
  test('key mobile routes render without horizontal overflow', async ({ page }) => {
    const routes = [
      '/',
      '/login',
      '/signup',
      '/reset-password',
      '/verify-email?token=validmocktoken&email=test%40example.com',
      '/app/i/home',
      '/app/o/test-org/home',
      '/app/o/test-org/assignments',
      '/admin',
    ];

    for (const route of routes) {
      await gotoStable(page, route);

      const overflowPx = await page.evaluate(() => {
        const html = document.documentElement;
        const body = document.body;
        const viewportWidth = window.innerWidth;
        const docWidth = Math.max(
          html.scrollWidth,
          html.offsetWidth,
          body?.scrollWidth ?? 0,
          body?.offsetWidth ?? 0
        );
        return Math.max(0, docWidth - viewportWidth);
      });

      expect(overflowPx, `${route} has horizontal overflow`).toBeLessThanOrEqual(1);
    }
  });

  test('app topbar profile trigger meets 44x44 tap target', async ({ page }) => {
    for (const route of ['/app/i/home', '/app/o/test-org/home']) {
      await gotoStable(page, route);

      const profileTrigger = page.getByRole('button', { name: 'Open profile menu' }).first();
      await expect(profileTrigger).toBeVisible();
      const box = await profileTrigger.boundingBox();
      expect(box, `${route} missing profile trigger bounds`).not.toBeNull();
      expect(box!.width, `${route} profile trigger width`).toBeGreaterThanOrEqual(44);
      expect(box!.height, `${route} profile trigger height`).toBeGreaterThanOrEqual(44);
    }
  });

  test('admin mobile header actions are visible and inside viewport', async ({ page }) => {
    await gotoStable(page, '/admin');

    const navTrigger = page.getByRole('button', { name: 'Open admin navigation' });
    const notifications = page.getByRole('button', { name: 'Open notifications' });
    const profile = page.getByRole('button', { name: 'Open admin profile menu' });

    await expect(navTrigger).toBeVisible();
    await expect(notifications).toBeVisible();
    await expect(profile).toBeVisible();

    const { viewportWidth, rightEdgeMax } = await page.evaluate(() => {
      const actions = [
        document.querySelector('[aria-label="Open admin navigation"]') as HTMLElement | null,
        document.querySelector('[aria-label="Open notifications"]') as HTMLElement | null,
        document.querySelector('[aria-label="Open admin profile menu"]') as HTMLElement | null,
      ].filter(Boolean) as HTMLElement[];

      const rightEdgeMax = actions.reduce((max, el) => {
        const rect = el.getBoundingClientRect();
        return Math.max(max, rect.right);
      }, 0);

      return { viewportWidth: window.innerWidth, rightEdgeMax };
    });

    expect(rightEdgeMax).toBeLessThanOrEqual(viewportWidth);
  });

  test('organization shell main area reserves space for bottom nav', async ({ page }) => {
    await gotoStable(page, '/app/o/test-org/home');

    const paddingBottom = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return 0;
      return Number.parseFloat(window.getComputedStyle(main).paddingBottom || '0');
    });

    expect(paddingBottom).toBeGreaterThanOrEqual(80);
  });
});
