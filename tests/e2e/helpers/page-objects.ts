/**
 * Page Object Models for E2E Tests
 *
 * Provides reusable page interactions for Playwright tests
 */

import { Page, Locator } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('[type="submit"]');
  }
}

export class SignupPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/signup');
  }

  async signupAsIndividual(email: string, password: string, name: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.fill('[name="confirmPassword"]', password);
    await this.page.click('[type="submit"]');

    // Complete onboarding
    await this.page.waitForURL('/onboarding');
    await this.page.click('text=I\'m an individual');
    await this.page.fill('[name="displayName"]', name);
    await this.page.click('button:has-text("Continue")');
  }
}

export class MatchingPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/app/i/matching');
  }

  get matchCards(): Locator {
    return this.page.locator('[data-testid="match-card"]');
  }

  async getFirstMatchCard() {
    return this.matchCards.first();
  }

  async clickMatch(index: number = 0) {
    await this.matchCards.nth(index).click();
  }

  async waitForMatches() {
    await this.page.waitForSelector('[data-testid="match-card"]', { timeout: 10000 });
  }
}

export class ContractPage {
  constructor(private page: Page) {}

  async goto(contractId: string) {
    await this.page.goto(`/app/contracts/${contractId}`);
  }

  async attestAsCandidate() {
    await this.page.click('[data-testid="candidate-attest-button"]');
    await this.page.click('button:has-text("Confirm")');
  }

  async attestAsOrganization() {
    await this.page.click('[data-testid="org-attest-button"]');
    await this.page.click('button:has-text("Confirm")');
  }

  async waitForSignedStatus() {
    await this.page.waitForSelector('text=Contract Signed', { timeout: 5000 });
  }
}

export class DataExportPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/app/settings/data');
  }

  async triggerExport() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.click('button:has-text("Export My Data")'),
    ]);

    return download;
  }

  async importData(filePath: string) {
    await this.page.setInputFiles('[type="file"]', filePath);
    await this.page.click('button:has-text("Import Data")');
  }
}
