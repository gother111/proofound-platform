import { test, expect, devices, type Page } from '@playwright/test';

const { defaultBrowserType: _defaultBrowserType, ...iphone12ChromiumProfile } =
  devices['iPhone 12'];
const isOrgMode = process.env.MOCK_ORG_MODE === 'true';

test.use(iphone12ChromiumProfile);
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

type MobileRouteExpectation = {
  route: string;
  pathname: string;
  assertLoaded: (page: Page) => Promise<void>;
};

function expectCurrentPath(page: Page, pathname: string, route: string) {
  expect(new URL(page.url()).pathname, `${route} should load its intended route`).toBe(pathname);
}

test.describe('Smartphone UI regression', () => {
  test.describe.configure({ mode: 'serial' });
  test('key mobile routes render without horizontal overflow', async ({ page }) => {
    const publicRoutes: MobileRouteExpectation[] = [
      {
        route: '/',
        pathname: '/',
        assertLoaded: async (routePage) => {
          await expect(
            routePage.getByRole('heading', { name: /Proof behind the claim/i })
          ).toBeVisible();
        },
      },
      {
        route: '/login',
        pathname: '/login',
        assertLoaded: async (routePage) => {
          await expect(routePage.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
        },
      },
      {
        route: '/signup',
        pathname: '/signup',
        assertLoaded: async (routePage) => {
          await expect(routePage.getByTestId('signup-choice-screen')).toBeVisible();
        },
      },
      {
        route: '/reset-password',
        pathname: '/reset-password',
        assertLoaded: async (routePage) => {
          await expect(
            routePage.getByRole('heading', { name: 'Reset your password' })
          ).toBeVisible();
        },
      },
      {
        route: '/admin',
        pathname: '/admin',
        assertLoaded: async (routePage) => {
          await expect(routePage.getByRole('heading', { name: 'Launch Operations' })).toBeVisible();
        },
      },
      {
        route: '/verify-email?token=validmocktoken&email=test%40example.com',
        pathname: '/verify-email',
        assertLoaded: async (routePage) => {
          await expect(routePage.locator('[data-testid^="verify-email-"]').first()).toBeVisible();
        },
      },
    ];
    const individualRoutes: MobileRouteExpectation[] = [
      {
        route: '/app/i/home',
        pathname: '/app/i/home',
        assertLoaded: async (routePage) => {
          await expect(
            routePage.getByRole('heading', {
              name: /Add your first proof record|Verify strongest proof record/,
            })
          ).toBeVisible();
        },
      },
      {
        route: '/app/i/profile',
        pathname: '/app/i/profile',
        assertLoaded: async (routePage) => {
          await expect(
            routePage.getByRole('navigation', { name: 'Mobile primary navigation' })
          ).toBeVisible();
          await expect(routePage.getByTestId('profile-skeleton')).toHaveCount(0);
          await expect(
            routePage.getByRole('heading', { name: 'Public Page readiness' })
          ).toBeVisible();
        },
      },
    ];
    const orgRoutes: MobileRouteExpectation[] = [
      {
        route: '/app/o/test-org/home',
        pathname: '/app/o/test-org/home',
        assertLoaded: async (routePage) => {
          await expect(routePage.getByText('Trust, assignment, and review order')).toBeVisible();
        },
      },
      {
        route: '/app/o/test-org/profile',
        pathname: '/app/o/test-org/profile',
        assertLoaded: async (routePage) => {
          await expect(
            routePage.getByRole('heading', { name: 'Organization Profile', exact: true })
          ).toBeVisible();
        },
      },
      {
        route: '/app/o/test-org/assignments',
        pathname: '/app/o/test-org/assignments',
        assertLoaded: async (routePage) => {
          await expect(routePage.getByRole('heading', { name: 'Assignments' })).toBeVisible();
        },
      },
    ];
    const routes = [...publicRoutes, ...(isOrgMode ? orgRoutes : individualRoutes)];

    for (const routeExpectation of routes) {
      const isolatedPage = await page.context().newPage();
      await isolatedPage.addInitScript(() => {
        localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
      });

      try {
        await gotoStable(isolatedPage, routeExpectation.route);
        expectCurrentPath(isolatedPage, routeExpectation.pathname, routeExpectation.route);
        await routeExpectation.assertLoaded(isolatedPage);

        const overflowPx = await isolatedPage.evaluate(() => {
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

        expect(overflowPx, `${routeExpectation.route} has horizontal overflow`).toBeLessThanOrEqual(
          1
        );
      } finally {
        await isolatedPage.close();
      }
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

  test('app shells do not expose archived notification entrypoints', async ({ page }) => {
    for (const route of ['/app/i/home', '/app/o/test-org/home']) {
      await gotoStable(page, route);

      await expect(page.getByRole('button', { name: 'Notifications' })).toHaveCount(0);
      await expect(page.getByTestId('notifications-dropdown')).toHaveCount(0);
      await expect(page.locator('a[href^="/app/i/notifications"]')).toHaveCount(0);
      await expect(page.locator('a[href^="/app/i/settings/notifications"]')).toHaveCount(0);
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

    const shellSpacing = await page.evaluate(() => {
      const main = document.querySelector('main') as HTMLElement | null;
      const mobileNav = document.querySelector(
        'nav[aria-label="Mobile primary navigation"]'
      ) as HTMLElement | null;

      if (!main || !mobileNav) {
        return null;
      }

      const mainRect = main.getBoundingClientRect();
      const navRect = mobileNav.getBoundingClientRect();
      const styles = window.getComputedStyle(main);

      return {
        mainBottom: mainRect.bottom,
        navTop: navRect.top,
        marginBottom: Number.parseFloat(styles.marginBottom || '0'),
        paddingBottom: Number.parseFloat(styles.paddingBottom || '0'),
      };
    });

    expect(shellSpacing).not.toBeNull();
    expect(shellSpacing!.mainBottom).toBeLessThanOrEqual(shellSpacing!.navTop);
    expect(shellSpacing!.marginBottom + shellSpacing!.paddingBottom).toBeGreaterThanOrEqual(80);
  });

  test('mobile profile shells expose their retained bottom navigation destinations', async ({
    page,
  }) => {
    if (!isOrgMode) {
      await gotoStable(page, '/app/i/profile');
      const individualMobileNav = page.getByRole('navigation', {
        name: 'Mobile primary navigation',
      });
      await expect(individualMobileNav.getByRole('link', { name: 'Settings' })).toBeVisible();
    }

    if (isOrgMode) {
      await gotoStable(page, '/app/o/test-org/profile');
      const orgMobileNav = page.getByRole('navigation', { name: 'Mobile primary navigation' });
      await expect(orgMobileNav.getByRole('link', { name: 'Public Preview' })).toBeVisible();
      await expect(orgMobileNav.getByRole('link', { name: 'Settings' })).toHaveCount(0);
    }
  });

  test('individual profile action buttons remain clickable above the mobile bottom nav', async ({
    page,
  }) => {
    test.skip(isOrgMode, 'Run individual profile action checks without MOCK_ORG_MODE=true');

    await gotoStable(page, '/app/i/profile?profileView=full');

    const shareButton = page.getByRole('button', { name: 'Share', exact: true });
    const addLocationButton = page.getByRole('button', { name: 'Add location' });

    await expect(shareButton).toBeVisible();
    await expect(addLocationButton).toBeVisible();

    await shareButton.click({ trial: true });
    await addLocationButton.click({ trial: true });
  });

  test('organization profile actions remain clickable above the mobile bottom nav', async ({
    page,
  }) => {
    test.skip(!isOrgMode, 'Run organization profile action checks with MOCK_ORG_MODE=true');

    await gotoStable(page, '/app/o/test-org/profile');

    const organizationName = page.getByRole('textbox', { name: 'Organization name' });
    await expect(organizationName).toBeVisible();
    await organizationName.click({ trial: true });

    const publicTrustProfileLink = page
      .getByRole('navigation', { name: 'Mobile primary navigation' })
      .getByRole('link', { name: 'Public Preview' });
    await expect(publicTrustProfileLink).toBeVisible();
    await publicTrustProfileLink.click({ trial: true });
  });

  test('narrow mobile width resilience for profile shells', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['iPhone SE'] });

    try {
      const routes = isOrgMode ? ['/app/o/test-org/profile'] : ['/app/i/profile'];

      for (const route of routes) {
        const page = await context.newPage();
        await page.addInitScript(() => {
          localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
        });

        try {
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

          expect(overflowPx, `${route} overflows on iPhone SE`).toBeLessThanOrEqual(1);

          const mobileNav = page.getByRole('navigation', { name: 'Mobile primary navigation' });
          if (route.startsWith('/app/i/')) {
            await expect(mobileNav.getByRole('link', { name: 'Settings' })).toBeVisible();
          } else {
            await expect(mobileNav.getByRole('link', { name: 'Public Preview' })).toBeVisible();
            await expect(mobileNav.getByRole('link', { name: 'Settings' })).toHaveCount(0);
          }
        } finally {
          await page.close();
        }
      }
    } finally {
      await context.close();
    }
  });

  test('narrow mobile app shells keep archived notification entrypoints hidden', async ({
    browser,
  }) => {
    const context = await browser.newContext({ ...devices['iPhone SE'] });

    try {
      for (const route of ['/app/i/home', '/app/o/test-org/home']) {
        const page = await context.newPage();
        await page.addInitScript(() => {
          localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
        });

        try {
          await gotoStable(page, route);

          await expect(page.getByRole('button', { name: 'Notifications' })).toHaveCount(0);
          await expect(page.getByTestId('notifications-dropdown')).toHaveCount(0);
        } finally {
          await page.close();
        }
      }
    } finally {
      await context.close();
    }
  });
});
