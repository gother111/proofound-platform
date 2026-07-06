import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();

const LOCALIZED_COPY_FILES = ['src/i18n/messages/en.json', 'src/i18n/messages/sv.json'];

describe('localized copy guardrails', () => {
  it('keeps launch locale strings aligned with proof-first MVP language', () => {
    const localizedCopy = LOCALIZED_COPY_FILES.map((relativePath) =>
      readFileSync(path.join(REPO_ROOT, relativePath), 'utf8')
    ).join('\n');

    expect(localizedCopy).toContain('privacy-safe evidence');
    expect(localizedCopy).toContain('review proof-backed submissions');
    expect(localizedCopy).toContain('bevisbaserade inlämningar');
    expect(localizedCopy).toContain('starkare bevis');
    expect(localizedCopy).not.toMatch(/review proof-backed candidates/i);
    expect(localizedCopy).not.toMatch(/granska kandidater/i);
    expect(localizedCopy).not.toMatch(/trust anchors?/i);
    expect(localizedCopy).not.toMatch(/trust signals?/i);
    expect(localizedCopy).not.toMatch(/compatibility signals?/i);
    expect(localizedCopy).not.toMatch(/external proof/i);
    expect(localizedCopy).not.toMatch(/privacy-safe signal/i);
    expect(localizedCopy).not.toMatch(/stronger signal than CVs/i);
    expect(localizedCopy).not.toMatch(/rekommendationer och externa bevis/i);
  });
});
