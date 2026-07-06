import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();

const guardedClientFiles = [
  'src/components/profile/forms/ProjectForm.tsx',
  'src/components/policy/PolicyAssistant.tsx',
] as const;

describe('archived client API references', () => {
  it('keeps retained compatibility components from calling archived launch APIs', () => {
    const combinedSource = guardedClientFiles
      .map((relativePath) => readFileSync(path.join(REPO_ROOT, relativePath), 'utf8'))
      .join('\n');

    expect(combinedSource).not.toContain('/api/projects');
    expect(combinedSource).not.toContain('/api/verification/veriff');
    expect(combinedSource).not.toContain('/api/policy/explain');
    expect(combinedSource).not.toContain('cdn.veriff.me');
  });
});
