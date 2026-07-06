import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = process.env.PROOFOUND_SCREENSHOT_DIR ?? path.join(process.cwd(), 'output');
const BASE_URL = process.env.PROOFOUND_SCREENSHOT_BASE_URL ?? 'http://localhost:3000';

async function takeScreenshotsForPersona(persona, routes, suffix) {
  console.log(`\n--- Capture screenshots for ${persona.toUpperCase()} ---`);

  // Launch browser
  const browser = await chromium.launch();

  try {
    // 1. DESKTOP VIEWPORT
    console.log(`Setting up Desktop context for ${persona}...`);
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 1024 },
      deviceScaleFactor: 2, // Retinal for premium look
    });

    // Set cookies for authentication and persona
    await desktopContext.addCookies([
      {
        name: 'proofound-mock-persona',
        value: persona,
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'sb-access-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'sb-refresh-token',
        value: 'mock-refresh-token',
        domain: 'localhost',
        path: '/',
      }
    ]);

    const desktopPage = await desktopContext.newPage();

    // Decline cookie banner in local storage
    await desktopPage.addInitScript(() => {
      localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
    });

    for (const r of routes) {
      console.log(`Desktop: Navigating to ${BASE_URL}${r.path}...`);
      await desktopPage.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle' });
      await desktopPage.waitForTimeout(1500); // Allow react animations/render to complete

      const fileName = `${r.name}_desktop_${suffix}.png`;
      const filePath = path.join(ARTIFACT_DIR, fileName);
      await desktopPage.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved screenshot: ${fileName}`);
    }
    await desktopContext.close();

    // 2. MOBILE VIEWPORT (iPhone 12 portrait)
    console.log(`Setting up Mobile context for ${persona}...`);
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 3, // High DPI mobile
      isMobile: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
    });

    await mobileContext.addCookies([
      {
        name: 'proofound-mock-persona',
        value: persona,
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'sb-access-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'sb-refresh-token',
        value: 'mock-refresh-token',
        domain: 'localhost',
        path: '/',
      }
    ]);

    const mobilePage = await mobileContext.newPage();

    // Decline cookie banner
    await mobilePage.addInitScript(() => {
      localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
    });

    for (const r of routes) {
      console.log(`Mobile: Navigating to ${BASE_URL}${r.path}...`);
      await mobilePage.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle' });
      await mobilePage.waitForTimeout(1500);

      const fileName = `${r.name}_mobile_${suffix}.png`;
      const filePath = path.join(ARTIFACT_DIR, fileName);
      await mobilePage.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved screenshot: ${fileName}`);
    }
    await mobileContext.close();

  } catch (error) {
    console.error(`Error capturing screenshots for ${persona}:`, error);
  } finally {
    await browser.close();
  }
}

(async () => {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const individualRoutes = [
    { path: '/app/i/home', name: 'individual_home' },
    { path: '/onboarding', name: 'individual_onboarding' },
    { path: '/app/i/portfolio', name: 'individual_portfolio' },
    { path: '/app/i/verifications', name: 'individual_verifications' },
  ];

  const orgRoutes = [
    { path: '/app/o/test-org/home', name: 'org_home' },
    { path: '/app/o/test-org/assignments', name: 'org_assignments' },
  ];

  console.log('Starting visual verification screenshot capture...');

  // Capturing individual surfaces
  await takeScreenshotsForPersona('individual', individualRoutes, 'v1');

  // Capturing org surfaces
  await takeScreenshotsForPersona('org_member', orgRoutes, 'v1');

  console.log('\nFinished all visual verification screenshot captures!');
})();
