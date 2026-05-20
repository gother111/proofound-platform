import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();

describe('user audit log copy guardrails', () => {
  it('keeps legacy snippet events framed as legacy Public Page link history', () => {
    const routeSource = readFileSync(
      path.join(REPO_ROOT, 'src/app/api/user/audit-log/route.ts'),
      'utf8'
    );

    expect(routeSource).toContain("public_snippet_viewed: 'Viewed legacy Public Page link'");
    expect(routeSource).toContain(
      "public_snippet_unavailable: 'Attempted unavailable legacy Public Page link'"
    );
    expect(routeSource).not.toContain("'Viewed public snippet'");
    expect(routeSource).not.toContain("'Attempted unavailable public snippet'");
  });
});
