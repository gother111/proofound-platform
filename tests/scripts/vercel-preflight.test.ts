import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

describe('vercel-preflight', () => {
  it('supports GitHub Actions project secrets when the local Vercel link file is absent', () => {
    const script = fs.readFileSync(path.join(repoRoot, 'scripts/vercel-preflight.mjs'), 'utf8');

    expect(script).toContain("source: 'VERCEL_PROJECT_ID'");
    expect(script).toContain(
      '.vercel/project.json was not found and VERCEL_PROJECT_ID is not set.'
    );
    expect(script).toContain('process.env.VERCEL_PROJECT_ID');
    expect(script).toContain('Vercel project id resolves to');
  });
});
