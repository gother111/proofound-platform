import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const artifactDir =
  '<repo>/.artifacts/ux-verification-2026-05-20/after-fixes-viewport-sweep';

const consent = {
  version: 'v1.1.2026-02-12',
  essential: true,
  analytics: false,
  marketing: false,
  timestamp: '2026-05-20T00:00:00.000Z',
};

const routes = [
  {
    id: 'individual-home',
    baseUrl: 'http://127.0.0.1:33123',
    persona: 'individual',
    path: '/app/i/home',
  },
  {
    id: 'individual-onboarding',
    baseUrl: 'http://127.0.0.1:33123',
    persona: 'individual',
    path: '/onboarding',
  },
  {
    id: 'individual-portfolio',
    baseUrl: 'http://127.0.0.1:33123',
    persona: 'individual',
    path: '/app/i/portfolio',
  },
  {
    id: 'individual-profile-full',
    baseUrl: 'http://127.0.0.1:33123',
    persona: 'individual',
    path: '/app/i/profile?profileView=full&tab=proof_packs',
  },
  {
    id: 'individual-verifications',
    baseUrl: 'http://127.0.0.1:33123',
    persona: 'individual',
    path: '/app/i/verifications',
  },
  {
    id: 'org-home',
    baseUrl: 'http://localhost:33122',
    persona: 'org_member',
    path: '/app/o/test-org/home',
  },
  {
    id: 'org-assignments',
    baseUrl: 'http://localhost:33122',
    persona: 'org_member',
    path: '/app/o/test-org/assignments',
  },
  {
    id: 'org-communications',
    baseUrl: 'http://localhost:33122',
    persona: 'org_member',
    path: '/app/o/test-org/communications',
  },
  {
    id: 'org-shortlist-redirect',
    baseUrl: 'http://localhost:33122',
    persona: 'org_member',
    path: '/app/o/test-org/shortlist',
  },
];

const viewports = [
  { id: 'desktop', width: 1440, height: 1000 },
  { id: 'mobile', width: 390, height: 844, isMobile: true },
];

function consentScript(preferences) {
  localStorage.setItem('proofound-cookie-preferences', JSON.stringify(preferences));
  localStorage.setItem('proofound-cookie-consent', `${preferences.version}-declined`);
}

async function waitForStableSurface(page) {
  const loadingPatterns = [
    /Loading profile/,
    /Opening profile tools/,
    /Assignment workspace is loading/,
    /Preparing organization messages/,
  ];

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const state = await page.evaluate((patterns) => {
      const text = document.body.innerText || '';
      const stillLoading = patterns.some((source) => new RegExp(source).test(text));
      const pulseCount = document.querySelectorAll('.animate-pulse').length;
      return {
        stillLoading,
        pulseCount,
        text,
      };
    }, loadingPatterns.map((pattern) => pattern.source));

    const expectedConversationSkeleton =
      state.text.includes('Messages') && state.pulseCount > 0 && attempt < 10;
    const expectedAssignmentFetch =
      state.text.includes('Loading assignments and matches') && attempt < 10;

    if (!state.stillLoading && !expectedConversationSkeleton && !expectedAssignmentFetch) {
      return;
    }

    await page.waitForTimeout(1000);
  }
}

async function inspectPage(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const text = body.innerText || '';
    const offenders = Array.from(document.querySelectorAll('body *'))
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90),
          className: String(el.getAttribute('class') || '').slice(0, 160),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter(
        (item) =>
          item.width > 0 &&
          item.height > 0 &&
          (item.left < -2 || item.right > window.innerWidth + 2)
      )
      .slice(0, 10);

    return {
      finalUrl: location.href,
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      textStart: text.replace(/\s+/g, ' ').trim().slice(0, 800),
      horizontalOverflow: Math.max(root.scrollWidth, body.scrollWidth) - root.clientWidth,
      loadingProfile: text.includes('Loading profile'),
      loadingAssignments: text.includes('Loading assignments and matches'),
      loadingOrgMessages: text.includes('Preparing organization messages'),
      cookieBannerVisible: text.includes('Privacy choices'),
      overflowOffenders: offenders,
    };
  });
}

await fs.mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch();
const results = [];

try {
  for (const viewport of viewports) {
    for (const route of routes) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: Boolean(viewport.isMobile),
      });
      await context.addCookies([
        {
          name: 'proofound-mock-persona',
          value: route.persona,
          url: route.baseUrl,
          sameSite: 'Lax',
        },
      ]);

      const page = await context.newPage();
      await page.addInitScript(consentScript, consent);

      const url = `${route.baseUrl}${route.path}`;
      let navigationError = null;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await waitForStableSurface(page);
      } catch (error) {
        navigationError = error instanceof Error ? error.message : String(error);
      }

      const screenshotPath = path.join(artifactDir, `${viewport.id}-${route.id}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      const inspection = await inspectPage(page);
      results.push({
        route: route.id,
        requestedUrl: url,
        viewport: viewport.id,
        screenshotPath,
        navigationError,
        ...inspection,
      });

      await context.close();
    }
  }
} finally {
  await browser.close();
}

const reportPath = path.join(artifactDir, 'results.json');
await fs.writeFile(
  reportPath,
  JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)
);

console.log(
  JSON.stringify(
    {
      reportPath,
      resultCount: results.length,
      failures: results.filter(
        (result) =>
          result.navigationError ||
          result.horizontalOverflow > 0 ||
          result.loadingProfile ||
          result.loadingAssignments ||
          result.loadingOrgMessages ||
          result.cookieBannerVisible
      ),
    },
    null,
    2
  )
);
