import { expect, test, type Page } from '@playwright/test';

test.skip(
  process.env.PLAYWRIGHT_SERVER_MODE !== 'prod',
  'CSP smoke requires a production build served with next start.'
);

const CSP_SCRIPT_HOST_ALLOWLIST = ['https://client.crisp.chat'];

function getDirective(csp: string, directive: string): string[] {
  return (
    csp
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${directive} `))
      ?.split(/\s+/)
      .filter(Boolean) ?? []
  );
}

function expectProductionCsp(csp: string | undefined) {
  expect(csp, 'CSP header').toBeTruthy();

  const scriptSrc = getDirective(csp ?? '', 'script-src');
  expect(scriptSrc).toContain("'self'");
  expect(scriptSrc).toContain("'strict-dynamic'");
  expect(scriptSrc.some((token) => /^'nonce-[A-Za-z0-9+/]+=*'$/.test(token))).toBe(true);
  expect(scriptSrc).not.toContain("'unsafe-inline'");
  expect(scriptSrc).not.toContain('https:');
  expect(scriptSrc.filter((token) => token.startsWith('https://'))).toEqual(
    CSP_SCRIPT_HOST_ALLOWLIST
  );

  expect(getDirective(csp ?? '', 'object-src')).toEqual(['object-src', "'none'"]);
  expect(getDirective(csp ?? '', 'frame-ancestors')).toEqual(['frame-ancestors', "'none'"]);
}

async function collectConsoleFailures(page: Page) {
  const failures: string[] = [];
  const failurePattern =
    /hydration failed|there was an error while hydrating|refused to (?:execute|load).*script|script-src|script-src-elem/i;

  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type()) && failurePattern.test(message.text())) {
      failures.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    if (failurePattern.test(error.message)) {
      failures.push(error.message);
    }
  });

  return failures;
}

async function openWithCspProof(page: Page, path: string) {
  await page.addInitScript(() => {
    localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
  });

  const consoleFailures = await collectConsoleFailures(page);
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });

  expect(response, `response for ${path}`).not.toBeNull();
  expect(response?.status(), `status for ${path}`).toBeLessThan(500);
  expectProductionCsp(response?.headers()['content-security-policy']);

  await expect(page.locator('body')).toBeVisible();
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

  expect(consoleFailures, `CSP/hydration console failures for ${path}`).toEqual([]);
}

test.describe('production CSP nonce smoke', () => {
  test('landing page has strict script CSP and hydrates client navigation', async ({ page }) => {
    await openWithCspProof(page, '/');

    await page
      .getByTestId('landing-header')
      .getByRole('link', { name: /sign in/i })
      .click();
    await expect(page.getByTestId('login-form-shell')).toBeVisible();
  });

  test('app shell has strict script CSP', async ({ page }) => {
    await openWithCspProof(page, '/app/i/home');
  });

  test('public portfolio has strict script CSP', async ({ page }) => {
    await openWithCspProof(page, '/portfolio/alex');
  });

  test('organization review page has strict script CSP', async ({ page }) => {
    await openWithCspProof(page, '/app/o/acme/assignments/assignment-1/review');
  });

  test('reveal-adjacent messaging page has strict script CSP', async ({ page }) => {
    await openWithCspProof(page, '/app/i/messages?conversation=conversation-1');
  });
});
