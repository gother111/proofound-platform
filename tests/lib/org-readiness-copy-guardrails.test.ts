import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();

const ACTIVE_ORG_READINESS_FILES = [
  'src/lib/analytics/next-actions.ts',
  'src/lib/readiness/organization.ts',
  'src/lib/momentum/summary.ts',
];

describe('active organization readiness copy guardrails', () => {
  it('keeps org readiness actions in proof-first assignment language', () => {
    const activeCopy = ACTIVE_ORG_READINESS_FILES.map((relativePath) =>
      readFileSync(path.join(REPO_ROOT, relativePath), 'utf8')
    ).join('\n');

    expect(activeCopy).not.toMatch(/low match quality|matching quality|weight matrix/i);
    expect(activeCopy).not.toMatch(/adjust weights/i);
    expect(activeCopy).not.toMatch(/candidate signals/i);
    expect(activeCopy).toMatch(/real proof submissions/i);
    expect(activeCopy).toMatch(/proof-alignment signals/i);
    expect(activeCopy).toMatch(/proof gates/i);
  });
});
