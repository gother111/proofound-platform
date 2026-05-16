// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  assertAiProductionHardCapConfigured,
  assertAiRawPromptLoggingAllowed,
  resolveAiRawPromptLoggingEnabled,
} from '@/lib/ai/usage-ledger';
import { parseJobDescription } from '@/lib/ai/jd-parser';

const originalEnv = { ...process.env };
const AI_ROUTE_ROOT = path.join(process.cwd(), 'src/app/api/ai');
const ACTIVE_AI_SOURCE_ROOTS = [
  AI_ROUTE_ROOT,
  path.join(process.cwd(), 'src/app/api/expertise/jd-to-l4'),
  path.join(process.cwd(), 'src/lib/ai'),
  path.join(process.cwd(), 'src/lib/expertise/gemini'),
] as const;
const FORBIDDEN_AI_ROUTE_PATTERN =
  /\b(?:candidate[-_/]?score|candidate[-_/]?rank|scor(?:e|ing)|rank(?:ing)?)\b/i;
const FORBIDDEN_RESPONSE_FIELD_PATTERN =
  /\b(?:candidateScore|candidateRank|candidate_score|candidate_rank|fitScore|fit_score|rankBand|scoreBand)\b/;
const FORBIDDEN_LEGACY_PROVIDER_PATTERN =
  /@anthropic-ai\/sdk|new\s+Anthropic|anthropic\.messages|ANTHROPIC_API_KEY|USE_ANTHROPIC_API|claude-3-5-sonnet/i;
const AI_LAUNCH_COVERAGE_SENTINELS = [
  'tests/lib/ai-redaction.test.ts',
  'tests/lib/gemini-reranker.test.ts',
  'tests/lib/gemini-taxonomy-shortlist.test.ts',
  'tests/lib/nlp-extractor.test.ts',
  'tests/api/admin/analytics-cv-import-spend-route.test.ts',
  'tests/ui/individual-setup-proof-first.test.tsx',
  'npm run test:ai:archived-admin',
] as const;

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

async function collectSourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(absolutePath)));
      continue;
    }
    if (entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name)) {
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

  it('requires a monthly AI hard cap when assistants are enabled in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.AI_ASSISTANTS_ENABLED = 'true';
    delete process.env.AI_MONTHLY_HARD_CAP_SEK;
    delete process.env.AI_PROD_MONTHLY_HARD_CAP_SEK;

    expect(() => assertAiProductionHardCapConfigured()).toThrow(/AI_ASSISTANTS_ENABLED=true/);

    process.env.AI_PROD_MONTHLY_HARD_CAP_SEK = '700';
    expect(() => assertAiProductionHardCapConfigured()).not.toThrow();
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
      '/api/ai/start-from-cv/sessions/[sessionId]/accept',
      '/api/ai/start-from-cv/sessions/[sessionId]/discard',
      '/api/ai/start-from-cv/sessions/[sessionId]/extract',
      '/api/ai/start-from-cv/sessions/[sessionId]',
      '/api/ai/start-from-cv/sessions',
      '/api/ai/start-from-cv/status',
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

  it('keeps active AI source off legacy direct Anthropic provider calls', async () => {
    const sourceFiles = (
      await Promise.all(ACTIVE_AI_SOURCE_ROOTS.map((root) => collectSourceFiles(root)))
    ).flat();
    const offenders: string[] = [];

    for (const file of sourceFiles) {
      const source = await readFile(file, 'utf8');
      if (FORBIDDEN_LEGACY_PROVIDER_PATTERN.test(source)) {
        offenders.push(path.relative(process.cwd(), file));
      }
    }

    expect(offenders).toEqual([]);
  });

  it('keeps the launch AI command wired to edge AI guardrail suites', async () => {
    const packageJson = JSON.parse(
      await readFile(path.join(process.cwd(), 'package.json'), 'utf8')
    );
    const launchAiScript = packageJson.scripts?.['test:launch:ai'] || '';
    const privacyScript = packageJson.scripts?.['test:privacy'] || '';
    const archivedAdminScript = packageJson.scripts?.['test:ai:archived-admin'] || '';

    expect(
      AI_LAUNCH_COVERAGE_SENTINELS.filter((sentinel) => !launchAiScript.includes(sentinel))
    ).toEqual([]);
    expect(privacyScript).toContain('tests/lib/ai-redaction.test.ts');
    expect(archivedAdminScript).toContain('vitest.archived.config.ts');
    expect(archivedAdminScript).toContain('tests/ui/admin-ai-spend-page.test.tsx');
  });

  it('keeps JD-to-L4 parsing local even if legacy provider env is present', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-legacy-test-key';
    process.env.USE_ANTHROPIC_API = 'true';

    const suggestions = await parseJobDescription(
      'We need a senior Python developer with Django, AWS, SQL, and strong communication skills. Must have 5+ years building launch-critical systems.'
    );

    expect(suggestions.map((suggestion) => suggestion.l4_name)).toEqual(
      expect.arrayContaining(['Python', 'SQL', 'AWS', 'Communication'])
    );
  });
});
