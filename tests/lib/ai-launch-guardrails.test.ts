// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  assertAiRawPromptLoggingAllowed,
  resolveAiRawPromptLoggingEnabled,
} from '@/lib/ai/usage-ledger';

const originalEnv = { ...process.env };
const AI_ROUTE_ROOT = path.join(process.cwd(), 'src/app/api/ai');
const FORBIDDEN_AI_ROUTE_PATTERN =
  /\b(?:candidate[-_/]?score|candidate[-_/]?rank|scor(?:e|ing)|rank(?:ing)?)\b/i;
const FORBIDDEN_RESPONSE_FIELD_PATTERN =
  /\b(?:candidateScore|candidateRank|candidate_score|candidate_rank|fitScore|fit_score|rankBand|scoreBand)\b/;

async function collectRouteFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectRouteFiles(absolutePath)));
      continue;
    }
    if (entry.isFile() && entry.name === 'route.ts') {
      files.push(absolutePath);
    }
  }

  return files.sort();
}

describe('AI launch no-go guardrails', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('fails if a client-exposed Gemini API key is configured in the test environment', () => {
    const exposed = Object.entries(process.env)
      .filter(([key, value]) => /^NEXT_PUBLIC_.*GEMINI.*KEY$/i.test(key) && value?.trim())
      .map(([key]) => key);

    expect(exposed).toEqual([]);
  });

  it('blocks raw prompt logging in production-like environments', () => {
    process.env.NODE_ENV = 'production';
    process.env.AI_RAW_PROMPT_LOGGING_ENABLED = 'true';

    expect(resolveAiRawPromptLoggingEnabled()).toBe(true);
    expect(() => assertAiRawPromptLoggingAllowed()).toThrow(/AI_RAW_PROMPT_LOGGING_ENABLED/);
  });

  it('keeps active AI route names away from scoring and ranking surfaces', async () => {
    const routeFiles = await collectRouteFiles(AI_ROUTE_ROOT);
    const routePaths = routeFiles.map(
      (file) => `/api/ai/${path.relative(AI_ROUTE_ROOT, path.dirname(file)).replace(/\\/g, '/')}`
    );

    expect(routePaths).toEqual([
      '/api/ai/assignments/clarify',
      '/api/ai/privacy-preflight/check',
      '/api/ai/proof-pack/suggest',
      '/api/ai/suggestions/events',
      '/api/ai/verifications/compose',
    ]);
    expect(routePaths.filter((routePath) => FORBIDDEN_AI_ROUTE_PATTERN.test(routePath))).toEqual(
      []
    );
  });

  it('does not expose score or rank fields from AI route response contracts', async () => {
    const routeFiles = await collectRouteFiles(AI_ROUTE_ROOT);
    const sources = await Promise.all(routeFiles.map((file) => readFile(file, 'utf8')));

    expect(
      sources
        .flatMap((source) => source.match(FORBIDDEN_RESPONSE_FIELD_PATTERN) ?? [])
        .filter(Boolean)
    ).toEqual([]);
  });
});
