import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();

const ACTIVE_RUNTIME_ROOTS = [
  'src/actions',
  'src/app',
  'src/components',
  'src/hooks',
  'src/lib',
] as const;

const DISALLOWED_SURVEY_REFERENCES = [
  '/api/surveys/sus',
  'sus_survey_completed',
  '@/lib/surveys/sus-triggers',
  '@/lib/surveys/sus-calculator',
  'triggerFirstAssignmentSurvey',
  'triggerProfileActivationSurvey',
  'checkTenMatchesMilestone',
] as const;

function collectSourceFiles(relativeDir: string): string[] {
  const absoluteDir = path.join(REPO_ROOT, relativeDir);
  const entries = readdirSync(absoluteDir);
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry);
    const relativePath = path.relative(REPO_ROOT, absolutePath);
    if (relativePath.startsWith('src/archive/')) continue;
    if (relativePath.startsWith('src/lib/launch/')) continue;

    const stat = statSync(absolutePath);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(relativePath));
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry)) {
      files.push(relativePath);
    }
  }

  return files;
}

describe('archived SUS survey surfaces', () => {
  it('keeps retired SUS survey endpoints and trigger side effects out of active runtime source', () => {
    const combinedSource = ACTIVE_RUNTIME_ROOTS.flatMap(collectSourceFiles)
      .map((relativePath) => readFileSync(path.join(REPO_ROOT, relativePath), 'utf8'))
      .join('\n');

    for (const reference of DISALLOWED_SURVEY_REFERENCES) {
      expect(combinedSource).not.toContain(reference);
    }
  });
});
