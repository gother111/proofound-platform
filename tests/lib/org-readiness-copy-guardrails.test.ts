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
    expect(activeCopy).not.toMatch(/Opportunity activity|Candidate volume|candidate pipeline/i);
    expect(activeCopy).not.toMatch(/hiring readiness insights/i);
    expect(activeCopy).not.toMatch(/Company Dashboard Analytics Tiles/i);
    expect(activeCopy).not.toMatch(/No matches for assignment|Review Criteria/i);
    expect(activeCopy).not.toMatch(/pipeline quality/i);
    expect(activeCopy).not.toMatch(/category === 'candidate'|category: 'candidate'/i);
    expect(activeCopy).not.toMatch(/\/o\/\$\{organizationId\}\/assignments/i);
    expect(activeCopy).not.toMatch(
      /\/edit\?tab=weights|\/assignments\/\$\{assignment\.id\}\/edit/i
    );
    expect(activeCopy).not.toMatch(/avgScore|% average/i);
    expect(activeCopy).toMatch(/real proof submissions/i);
    expect(activeCopy).toMatch(/proof-alignment signals/i);
    expect(activeCopy).toMatch(/proof gates/i);
    expect(activeCopy).toMatch(/Organization assignment-review readiness/i);
    expect(activeCopy).toMatch(/without proof submissions/i);
    expect(activeCopy).toMatch(/assignment review more specific/i);
    expect(activeCopy).toMatch(/encodeURIComponent\(assignmentId\)\}\/review/i);
    expect(activeCopy).toMatch(/Assignment-review activity/i);
    expect(activeCopy).toMatch(/Proof-submission volume/i);
    expect(activeCopy).toMatch(/proof-review readiness insights/i);
    expect(activeCopy).toMatch(/proof-submission pipeline insights/i);
  });
});
