import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const artifactDir =
  '<repo>/.artifacts/ux-verification-2026-05-20/browser-main-working-pages-2026-05-20/playwright-fallback';

const viewports = [
  { name: 'desktop', width: 1280, height: 900, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true },
];

const routes = [
  {
    role: 'individual',
    label: 'individual-home',
    url: 'http://localhost:33123/app/i/home',
    expectedPath: '/app/i/home',
  },
  {
    role: 'individual',
    label: 'individual-profile-proof-packs',
    url: 'http://localhost:33123/app/i/profile?profileView=full&tab=proof_packs',
    expectedPath: '/app/i/profile',
  },
  {
    role: 'individual',
    label: 'individual-verifications',
    url: 'http://localhost:33123/app/i/verifications',
    expectedPath: '/app/i/verifications',
  },
  {
    role: 'individual',
    label: 'individual-matching',
    url: 'http://localhost:33123/app/i/matching',
    expectedPath: '/app/i/matching',
  },
  {
    role: 'individual',
    label: 'individual-communications',
    url: 'http://localhost:33123/app/i/communications',
    expectedPath: '/app/i/communications',
  },
  {
    role: 'individual',
    label: 'individual-settings-privacy',
    url: 'http://localhost:33123/app/i/settings/privacy',
    expectedPath: '/app/i/settings/privacy',
  },
  {
    role: 'individual',
    label: 'onboarding',
    url: 'http://localhost:33123/onboarding',
    expectedPath: '/onboarding',
  },
  {
    role: 'organization',
    label: 'org-home',
    url: 'http://localhost:33122/app/o/test-org/home',
    expectedPath: '/app/o/test-org/home',
  },
  {
    role: 'organization',
    label: 'org-assignments',
    url: 'http://localhost:33122/app/o/test-org/assignments',
    expectedPath: '/app/o/test-org/assignments',
  },
  {
    role: 'organization',
    label: 'org-communications',
    url: 'http://localhost:33122/app/o/test-org/communications',
    expectedPath: '/app/o/test-org/communications',
  },
  {
    role: 'organization',
    label: 'org-interviews',
    url: 'http://localhost:33122/app/o/test-org/interviews',
    expectedPath: '/app/o/test-org/interviews',
  },
  {
    role: 'organization',
    label: 'org-profile',
    url: 'http://localhost:33122/app/o/test-org/profile',
    expectedPath: '/app/o/test-org/profile',
  },
  {
    role: 'organization',
    label: 'org-shortlist',
    url: 'http://localhost:33122/app/o/test-org/shortlist',
    expectedPath: '/app/o/test-org/assignments',
  },
];

const stuckPatterns = [
  'Loading profile',
  'Opening profile tools',
  'Preparing matching workspace',
  'Preparing organization messages',
  'Preparing assignment',
  'Loading organization profile',
];

const stalePatterns = [
  'Match Score',
  'Composite Score',
  'Top 10',
  'Top 5',
  'Top 20',
  'proofound.com',
  'Cancel Deletion',
  'Identities Revealed',
  'Give Consent & Share Profile',
  'unlock the verified badge',
];

async function inspect(page) {
  return page.evaluate(
    ({ stalePatterns, stuckPatterns }) => {
      const text = document.body?.innerText || '';
      const h1s = Array.from(document.querySelectorAll('h1'))
        .map((node) => node.textContent?.trim())
        .filter(Boolean);
      const maxScrollWidth = Math.max(
        document.documentElement.scrollWidth,
        document.body?.scrollWidth || 0
      );
      const cookieOverlay = Array.from(
        document.querySelectorAll(
          '[role="dialog"], [aria-modal="true"], .cookie, [id*="cookie" i], [class*="cookie" i]'
        )
      )
        .map((node) => (node.textContent || '').trim().slice(0, 160))
        .filter((snippet) => /cookie|privacy preferences|consent/i.test(snippet));

      return {
        finalUrl: location.href,
        title: document.title,
        h1s,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        scroll: {
          scrollWidth: maxScrollWidth,
          clientWidth: window.innerWidth,
          horizontalOverflowPx: Math.max(0, maxScrollWidth - window.innerWidth),
          documentHeight: Math.max(
            document.documentElement.scrollHeight,
            document.body?.scrollHeight || 0
          ),
        },
        flags: {
          redirectedToLogin:
            /\bSign in\b|\bLog in\b/.test(text) && location.pathname.startsWith('/app/'),
          missingH1: h1s.length === 0,
          horizontalOverflow: Math.max(0, maxScrollWidth - window.innerWidth) > 2,
          stuckMatches: stuckPatterns.filter((pattern) => text.includes(pattern)),
          staleMatches: stalePatterns.filter((pattern) => text.includes(pattern)),
          percentMatchMatches: Array.from(new Set(text.match(/\b\d{1,3}%\s+match\b/gi) || [])),
          obviousError:
            /Application error|Unhandled Runtime Error|Internal Server Error|This page could not be found|404/.test(
              text
            ),
          cookieOverlay,
        },
      };
    },
    { stalePatterns, stuckPatterns }
  );
}

async function main() {
  await fs.mkdir(artifactDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.isMobile,
        deviceScaleFactor: 1,
      });
      await context.addCookies([
        { name: 'sb-access-token', value: 'mock-token', domain: 'localhost', path: '/' },
        { name: 'sb-refresh-token', value: 'mock-refresh-token', domain: 'localhost', path: '/' },
      ]);
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text());
        }
      });
      await page.addInitScript(() => {
        localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
      });

      for (const route of routes) {
        const record = {
          ...route,
          viewport: viewport.name,
          viewportSize: { width: viewport.width, height: viewport.height },
          startedAt: new Date().toISOString(),
        };
        consoleErrors.length = 0;
        try {
          await context.addCookies([
            {
              name: 'proofound-mock-persona',
              value: route.role === 'organization' ? 'org_member' : 'individual',
              domain: 'localhost',
              path: '/',
            },
          ]);
          await page.goto(route.url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
          await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
          await page.waitForTimeout(900);
          record.inspect = await inspect(page);
          record.finalUrlMatchesExpectedPath =
            new URL(record.inspect.finalUrl).pathname === route.expectedPath;
          record.consoleErrors = [...consoleErrors];
          const screenshotName = `${viewport.name}-${route.label}.png`;
          const screenshotPath = path.join(artifactDir, screenshotName);
          await page.screenshot({ path: screenshotPath, fullPage: false });
          record.screenshot = screenshotPath;
        } catch (error) {
          record.error = error instanceof Error ? error.message : String(error);
        }
        record.finishedAt = new Date().toISOString();
        results.push(record);
        console.log(`${viewport.name} ${route.label}: ${record.error ? 'ERROR' : 'ok'}`);
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  const failures = results.filter((record) => {
    const flags = record.inspect?.flags;
    return (
      record.error ||
      flags?.redirectedToLogin ||
      flags?.missingH1 ||
      flags?.horizontalOverflow ||
      flags?.obviousError ||
      flags?.stuckMatches?.length ||
      flags?.staleMatches?.length ||
      flags?.percentMatchMatches?.length ||
      flags?.cookieOverlay?.length ||
      record.finalUrlMatchesExpectedPath === false ||
      record.consoleErrors?.length
    );
  });

  const report = {
    generatedAt: new Date().toISOString(),
    artifactDir,
    routeCount: routes.length,
    viewportCount: viewports.length,
    resultCount: results.length,
    failureCount: failures.length,
    failures,
    results,
  };

  await fs.writeFile(path.join(artifactDir, 'playwright-visual-sweep-report.json'), JSON.stringify(report, null, 2));
  console.log(`report=${path.join(artifactDir, 'playwright-visual-sweep-report.json')}`);
  console.log(`failureCount=${failures.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
