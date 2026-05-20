import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.BASE_URL || 'http://localhost:33122';
const artifactDir =
  '<repo>/.artifacts/ux-verification-2026-05-20/browser-goal-sweep';

const consent = {
  version: 'v1.1.2026-02-12',
  essential: true,
  analytics: false,
  marketing: false,
  timestamp: '2026-05-20T00:00:00.000Z',
};

const routes = [
  { id: 'individual-home', persona: 'individual', path: '/app/i/home' },
  { id: 'individual-onboarding', persona: 'individual', path: '/onboarding' },
  { id: 'individual-portfolio', persona: 'individual', path: '/app/i/portfolio' },
  {
    id: 'individual-profile',
    persona: 'individual',
    path: '/app/i/profile?profileView=full&tab=proof_packs',
  },
  { id: 'individual-verifications', persona: 'individual', path: '/app/i/verifications' },
  { id: 'org-home', persona: 'org_member', path: '/app/o/test-org/home' },
  { id: 'org-assignments', persona: 'org_member', path: '/app/o/test-org/assignments' },
  {
    id: 'org-communications',
    persona: 'org_member',
    path: '/app/o/test-org/communications',
  },
  { id: 'org-shortlist-redirect', persona: 'org_member', path: '/app/o/test-org/shortlist' },
];

const viewports = [
  { id: 'desktop', width: 1440, height: 1000 },
  { id: 'mobile', width: 390, height: 844 },
];

function sanitizeConsole(messages) {
  return messages
    .filter((entry) => entry.type === 'error' || entry.type === 'warning')
    .map((entry) => ({
      type: entry.type,
      text: entry.text.slice(0, 600),
    }));
}

async function addFixtureCookies(context, persona) {
  await context.addCookies([
    {
      name: 'proofound-mock-persona',
      value: persona,
      url: baseUrl,
    },
  ]);
}

async function run() {
  await fs.mkdir(artifactDir, { recursive: true });

  const browser = await chromium.launch();
  const results = [];

  try {
    for (const viewport of viewports) {
      for (const route of routes) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: 1,
        });

        await addFixtureCookies(context, route.persona);
        await context.addInitScript((value) => {
          localStorage.setItem('proofound-cookie-preferences', JSON.stringify(value));
          localStorage.setItem('proofound-cookie-consent', `${value.version}-declined`);
        }, consent);

        const page = await context.newPage();
        const consoleMessages = [];
        page.on('console', (message) => {
          consoleMessages.push({ type: message.type(), text: message.text() });
        });

        let navigationError = null;
        try {
          await page.goto(`${baseUrl}${route.path}`, {
            waitUntil: 'domcontentloaded',
            timeout: 25000,
          });
          await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);
          await page
            .getByText('Loading assignments and matches...', { exact: true })
            .waitFor({ state: 'hidden', timeout: 8000 })
            .catch(() => null);
          await page
            .getByText('Loading proof-aligned candidates...', { exact: true })
            .waitFor({ state: 'hidden', timeout: 8000 })
            .catch(() => null);
        } catch (error) {
          navigationError = error instanceof Error ? error.message : String(error);
        }

        const screenshotPath = path.join(artifactDir, `${viewport.id}-${route.id}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        const metrics = await page.evaluate(() => {
          const root = document.documentElement;
          const body = document.body;
          const text = body.innerText || '';
          const overflowOffenders = Array.from(document.querySelectorAll('body *'))
            .map((el) => {
              const rect = el.getBoundingClientRect();
              return {
                tag: el.tagName.toLowerCase(),
                text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
                className: String(el.getAttribute('class') || '').slice(0, 120),
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
            heading: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() || '',
            h1s: Array.from(document.querySelectorAll('h1')).map((h1) =>
              h1.textContent?.replace(/\s+/g, ' ').trim()
            ),
            horizontalOverflow:
              Math.max(root.scrollWidth, body.scrollWidth) - root.clientWidth,
            scrollWidth: Math.max(root.scrollWidth, body.scrollWidth),
            clientWidth: root.clientWidth,
            cookieBannerVisible: /Privacy choices/.test(text),
            loginVisible: /Sign in|Log in|Welcome back/.test(text),
            duplicateCreateAssignment:
              (text.match(/Create assignment/g) || []).length +
                (text.match(/New Assignment/g) || []).length >
              1,
            scoreLanguageVisible: /automatically scored|sorted based on verified evidence|ranked/i.test(
              text
            ),
            textStart: text.slice(0, 600),
            overflowOffenders,
          };
        });

        results.push({
          route: route.id,
          path: route.path,
          persona: route.persona,
          viewport: viewport.id,
          viewportSize: `${viewport.width}x${viewport.height}`,
          screenshotPath,
          navigationError,
          consoleMessages: sanitizeConsole(consoleMessages),
          ...metrics,
        });

        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const reportPath = path.join(artifactDir, 'visual-sweep-results.json');
  await fs.writeFile(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
  console.log(reportPath);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
