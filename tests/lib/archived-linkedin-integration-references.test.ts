import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();

const ACTIVE_LINKEDIN_HELPER = 'src/lib/linkedin-verified.ts';

describe('archived LinkedIn integration references', () => {
  it('keeps active LinkedIn compatibility helpers local-only', () => {
    const source = readFileSync(path.join(REPO_ROOT, ACTIVE_LINKEDIN_HELPER), 'utf8');

    expect(source).not.toContain('https://api.linkedin.com/rest');
    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('fetchLinkedInVerificationReport');
    expect(source).not.toContain('fetchLinkedInIdentityMe');
    expect(source).not.toContain('LinkedInRestApiError');
  });

  it('keeps external LinkedIn integrations out of active source', () => {
    expect(
      readFileSync(path.join(REPO_ROOT, 'src/lib/linkedin-verified.ts'), 'utf8')
    ).not.toContain('playwright');

    const activeLibEntries = readdirSync(path.join(REPO_ROOT, 'src/lib'));

    expect(activeLibEntries).not.toContain('linkedin.ts');
    expect(activeLibEntries).not.toContain('linkedin-scraper.ts');
    expect(activeLibEntries).not.toContain('linkedin-enrichment.ts');

    expect(() => readFileSync(path.join(REPO_ROOT, 'src/lib/linkedin.ts'), 'utf8')).toThrow();
    expect(() =>
      readFileSync(path.join(REPO_ROOT, 'src/lib/linkedin-scraper.ts'), 'utf8')
    ).toThrow();
    expect(() =>
      readFileSync(path.join(REPO_ROOT, 'src/lib/linkedin-enrichment.ts'), 'utf8')
    ).toThrow();
  });
});
