import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')) as T;
}

function listTestFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'archive') return [];
      return listTestFiles(fullPath);
    }
    if (!/\.(test|spec)\.[cm]?[jt]sx?$/.test(entry.name)) return [];
    return [fullPath];
  });
}

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFiles(fullPath);
    }
    return [fullPath];
  });
}

function listActiveSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'archive') return [];
      return listActiveSourceFiles(fullPath);
    }
    return [fullPath];
  });
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ');
}

function expectTextBefore(content: string, before: string, after: string): void {
  const beforeIndex = content.indexOf(before);
  const afterIndex = content.indexOf(after);
  expect(beforeIndex).toBeGreaterThanOrEqual(0);
  expect(afterIndex).toBeGreaterThanOrEqual(0);
  expect(beforeIndex).toBeLessThan(afterIndex);
}

describe('launch gate package configuration', () => {
  it('pins the clean-checkout runtime and package manager', () => {
    const packageJson = readJson<{
      packageManager?: string;
      engines?: { node?: string };
    }>('package.json');
    const nvmrc = fs.readFileSync(path.join(repoRoot, '.nvmrc'), 'utf8').trim();
    const npmrc = fs.readFileSync(path.join(repoRoot, '.npmrc'), 'utf8');

    expect(nvmrc).toBe('24.15.0');
    expect(packageJson.engines?.node).toBe('24.x');
    expect(packageJson.packageManager).toBe('npm@11.12.1');
    expect(npmrc).toContain('engine-strict=true');
  });

  it('keeps every documented launch-critical npm command present', () => {
    const packageJson = readJson<{ scripts?: Record<string, string> }>('package.json');
    const scripts = packageJson.scripts ?? {};

    expect(scripts.lint).toBeTruthy();
    expect(scripts['audit:prod']).toBe('npm audit --omit=dev --audit-level=high');
    expect(scripts['audit:all']).toBe('npm audit --audit-level=high');
    expect(scripts.typecheck).toContain('--max-old-space-size=6144');
    expect(scripts.build).toBeTruthy();
    expect(scripts.test).toBe('node ./scripts/run-vitest-with-timeout.mjs');
    expect(scripts['test:api:focused']).toContain('tests/api');
    expect(scripts['test:privacy']).toContain('tests/privacy/rls-policies.test.ts');
    expect(scripts['test:privacy:extended']).toContain(
      'tests/privacy/rls-policies-extended.test.ts'
    );
    expect(scripts['test:launch:upload']).toContain('tests/api/upload-document-route.test.ts');
    expect(scripts['test:launch:privacy']).toContain('test:privacy:extended');
    expect(scripts['test:launch:routes']).toContain('tests/api/launch-surface-inventory.test.ts');
    expect(scripts['test:launch:org-corridor']).toContain(
      'tests/api/org-match-review-route.test.ts'
    );
    expect(scripts['test:launch:portfolio']).toContain(
      'tests/ui/public-portfolio-access-consistency.test.tsx'
    );
    expect(scripts['test:launch:workflow']).toContain(
      'tests/api/interviews-schedule-route.test.ts'
    );
    expect(scripts['test:slow:non-launch']).toContain(
      'tests/lib/cv-import-suggest-1000-benchmark.test.ts'
    );
    expect(scripts['test:slow:non-launch']).toContain(
      'tests/archive/non_mvp_cv_import_wizard/cv-import-wizard-quality.archived.test.ts'
    );
    expect(scripts['test:launch:smoke']).toBe('node --import tsx ./scripts/launch-smoke-runner.ts');
    expect(scripts['test:e2e:providers:strict']).toContain(
      'STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=${STRICT_PROVIDER_E2E_REQUIRE_CONNECTED:-false}'
    );
    expect(scripts['test:e2e:providers:advisory']).toBe('npm run test:e2e:providers:strict');
    expect(scripts['test:e2e:strict:all']).not.toContain('test:e2e:providers:strict');
    expect(scripts['test:a11y']).toBe(
      'node ./scripts/playwright-node24.mjs test --config playwright.a11y.config.ts --project=chromium'
    );
    expect(scripts['test:a11y:strict']).toContain('playwright.a11y.strict.config.ts');
    expect(scripts['ai:provider:smoke']).toBe('node --import tsx ./scripts/ai-provider-smoke.ts');
    expect(scripts['monitor:launch']).toBe(
      'node --import tsx ./scripts/run-launch-synthetic-monitors.ts'
    );
    expect(scripts['launch:status']).toBe('node ./scripts/check-launch-status.mjs');
    expect(scripts['deploy:readiness:strict']).toContain('FORCE_STRICT_DEPLOY_CHECK=true');
    expect(scripts['launch:validate']).toBe(
      'node --import tsx ./scripts/final-launch-validation.ts'
    );
  });

  it('keeps perf budgets tied to the launch-critical assignments route', () => {
    const perfBudgets = fs.readFileSync(path.join(repoRoot, 'scripts/perf-budgets.mjs'), 'utf8');

    expect(perfBudgets).toContain("path: '/api/health'");
    expect(perfBudgets).toContain("path: '/api/assignments'");
    expect(perfBudgets).toContain('expectedStatuses: [401, 403]');
    expect(perfBudgets).toContain('API ${path} p95');
  });

  it('ships model-matching AI provider smoke evidence with launch-status on Vercel', () => {
    const nextConfig = fs.readFileSync(path.join(repoRoot, 'next.config.js'), 'utf8');

    expect(nextConfig).toContain("'/api/monitoring/launch-status'");
    expect(nextConfig).toContain("'.artifacts/ai-provider-smoke.json'");
    expect(nextConfig).toContain("'.artifacts/launch-smoke-report.json'");
  });

  it('keeps launch gates fail-closed for client-exposed AI provider secrets', () => {
    const goNoGo = fs.readFileSync(path.join(repoRoot, 'scripts/go-no-go-check.ts'), 'utf8');
    const deployReadiness = fs.readFileSync(
      path.join(repoRoot, 'scripts/check-deploy-readiness.mjs'),
      'utf8'
    );
    const aiSecretGuard = fs.readFileSync(
      path.join(repoRoot, 'scripts/lib/client-exposed-ai-secrets.mjs'),
      'utf8'
    );

    for (const source of [goNoGo, deployReadiness]) {
      expect(source).toContain('listClientExposedAiSecretKeys');
      expect(source).toContain('client-exposed AI provider secret');
    }

    expect(aiSecretGuard).toContain('NEXT_PUBLIC_');
    expect(aiSecretGuard).toContain('OPENAI');
    expect(aiSecretGuard).toContain('ANTHROPIC');
    expect(aiSecretGuard).toContain('GEMINI');
    expect(aiSecretGuard).toContain('SECRET_NAME_PATTERN');
  });

  it('keeps launch CLI probes aligned with server-only internal auth fallback order', () => {
    const launchStatus = fs.readFileSync(
      path.join(repoRoot, 'scripts/check-launch-status.mjs'),
      'utf8'
    );
    const goNoGo = fs.readFileSync(path.join(repoRoot, 'scripts/go-no-go-check.ts'), 'utf8');
    const finalRunner = fs.readFileSync(
      path.join(repoRoot, 'src/lib/launch/final-launch-validation-runner.ts'),
      'utf8'
    );
    const strictGateRunner = fs.readFileSync(
      path.join(repoRoot, 'scripts/run-mvp-strict-gates.mjs'),
      'utf8'
    );
    const fullLaunchValidation = fs.readFileSync(
      path.join(repoRoot, 'src/lib/launch/full-launch-validation.ts'),
      'utf8'
    );
    const finalLaunchChecklist = fs.readFileSync(
      path.join(repoRoot, 'src/lib/launch/final-launch-checklist.ts'),
      'utf8'
    );

    for (const source of [
      launchStatus,
      goNoGo,
      finalRunner,
      fullLaunchValidation,
      finalLaunchChecklist,
      strictGateRunner,
    ]) {
      expect(source).toContain('INTERNAL_API_SECRET');
      expect(source).toContain('CRON_SECRET');
    }
    expect(launchStatus).toContain('INTERNAL_API_SECRET or CRON_SECRET is required');
    expect(goNoGo).toContain('INTERNAL_API_SECRET or CRON_SECRET is required');
    expect(goNoGo).toContain('GO_NO_GO_RUN_SYNTHETICS=0 is only allowed for local go/no-go runs');
    expectTextBefore(
      goNoGo,
      'GO_NO_GO_RUN_SYNTHETICS=0 is only allowed for local go/no-go runs',
      'fetch(`${BASE_URL}/api/cron/launch-synthetic-checks`'
    );
    expect(finalRunner).toContain('INTERNAL_API_SECRET or CRON_SECRET is required');
    expect(strictGateRunner).toContain('INTERNAL_API_SECRET/CRON_SECRET');
    expect(strictGateRunner).not.toContain("'CRON_SECRET',");
  });

  it('keeps external BASE_URL Playwright runs from starting local web servers in CI', () => {
    const configs = [
      'playwright.config.ts',
      'playwright.a11y.config.ts',
      'playwright.a11y.strict.config.ts',
    ].map((file) => fs.readFileSync(path.join(repoRoot, file), 'utf8'));

    for (const content of configs) {
      expect(content).toContain("!['localhost', '127.0.0.1', '::1'].includes");
      expect(content).toMatch(
        /(?:const reuseExistingServer =[\s\S]*(?:configuredBaseURLIsExternal|baseURLIsExternal))|(?:reuseExistingServer:\s*(?:configuredBaseURLIsExternal|baseURLIsExternal))/
      );
    }
  });

  it('keeps the locked MVP authority stack fresh and visibly classified', () => {
    const docsRegistry = compactWhitespace(
      fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8')
    );
    const authorityDocs = [
      ['AGENTS.md', 'repo+live', '2026-05-22'],
      ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md', 'repo', '2026-05-21'],
      [
        'PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md',
        'repo+live',
        '2026-05-21',
      ],
      ['PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md', 'repo+live', '2026-05-21'],
      ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md', 'repo+live', '2026-05-21'],
      ['Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md', 'repo+live', '2026-05-21'],
    ] as const;

    for (const [docPath, verificationSource, verifiedDate] of authorityDocs) {
      const content = fs.readFileSync(path.join(repoRoot, docPath), 'utf8');
      expect(content).toContain('Doc Class:');
      expect(content).toContain(`Last Verified: \`${verifiedDate}\``);
      expect(docsRegistry).toContain(
        `| \`${docPath}\` | \`active\` | \`root\` | \`${verificationSource}\` | \`${verifiedDate}\``
      );
    }

    const lockedMvp = fs.readFileSync(
      path.join(repoRoot, 'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md'),
      'utf8'
    );
    const alignedPrd = fs.readFileSync(
      path.join(repoRoot, 'PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md'),
      'utf8'
    );
    const technicalRequirements = fs.readFileSync(
      path.join(repoRoot, 'PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md'),
      'utf8'
    );
    const launchRunbook = fs.readFileSync(
      path.join(repoRoot, 'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md'),
      'utf8'
    );
    const gtmPlan = fs.readFileSync(
      path.join(repoRoot, 'Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md'),
      'utf8'
    );
    const activeAuthorityCopy = `${lockedMvp}\n${alignedPrd}\n${technicalRequirements}\n${launchRunbook}\n${gtmPlan}`;

    expect(activeAuthorityCopy).toContain('proof-first, privacy-first assignment review corridor');
    expect(activeAuthorityCopy).toContain('narrow, proof-first assignment review corridor');
    expect(alignedPrd).toContain('### 6.5 Assignment-review corridor');
    expect(activeAuthorityCopy).toContain(
      'review proof submissions through proof-backed, explainable, privacy-safe early review'
    );
    expect(activeAuthorityCopy).toContain('small assignment-review teams using lean workflows');
    expect(activeAuthorityCopy).toContain('review privacy-safe proof-backed submission summaries');
    expect(activeAuthorityCopy).toContain(
      'move one proof-review participant through intro, reveal, interview, and decision'
    );
    expect(activeAuthorityCopy).toContain(
      'matching organization confirmation plus proof-review participant confirmation'
    );
    expect(activeAuthorityCopy).toContain('anonymized submission label');
    expect(activeAuthorityCopy).toContain('assignment-review owner → `org_manager`');
    expect(activeAuthorityCopy).toContain('Proof-review participant accepts intro');
    expect(activeAuthorityCopy).toContain('Proof-review participant approves reveal');
    expect(activeAuthorityCopy).toContain('assignment-review owner or recruiter');
    expect(activeAuthorityCopy).toContain('public people directory');
    expect(activeAuthorityCopy).toContain('public people browsing');
    expect(activeAuthorityCopy).toContain('open people search index');
    expect(launchRunbook).toContain('sensitive assignment or proof-review participant complaints');
    expect(launchRunbook).toContain('no public people directory exists');
    expect(launchRunbook).toContain('review privacy-safe proof submissions');
    expect(launchRunbook).toContain('public people browsing');
    expect(activeAuthorityCopy).toContain('review proof submissions through proof');
    expect(activeAuthorityCopy).toContain('automated workflow recommendations');
    expect(activeAuthorityCopy).toContain(
      'proof-first assignment review corridor for design partners'
    );
    expect(technicalRequirements).toContain(
      'narrow, proof-first, privacy-safe assignment-review and credibility corridor'
    );
    expect(technicalRequirements).toContain('lean workflow-to-engagement flow');
    expect(activeAuthorityCopy).toContain('workflow recommendations');
    expect(activeAuthorityCopy).toContain('hidden proof-review participant evaluation store');
    expect(activeAuthorityCopy).toContain('proof-review participant consent');
    expect(technicalRequirements).toContain(
      '`org_reviewer` can review proof submissions and contribute feedback within allowed scope'
    );
    expect(gtmPlan).toContain('No proof-review participant identity');
    expect(gtmPlan).toContain('a cleaner first assignment-review corridor');
    expect(gtmPlan).toContain('want to review through proof, not profile theater');
    expect(gtmPlan).toContain('review signal comes from the work behind the claim');
    expect(technicalRequirements).toContain(
      'proof-review participant approval is mandatory for identity-bearing reveal'
    );
    expect(activeAuthorityCopy).toContain('proof-submission review record');
    expect(activeAuthorityCopy).toContain('proof-submission review, proof editing');
    expect(activeAuthorityCopy).toContain('participant-visible feedback');
    expect(technicalRequirements).toContain('participant-visible closure feedback');
    expect(technicalRequirements).toContain('no private notes in participant-visible channels');
    expect(technicalRequirements).toContain('no proof-review participant notification');
    expect(activeAuthorityCopy).toContain(
      'affect match, review, verification, reveal, trust-state, or workflow-decision state'
    );
    expect(activeAuthorityCopy).not.toContain(
      'proof-first, privacy-first hiring credibility corridor'
    );
    expect(activeAuthorityCopy).not.toContain('narrow, proof-first hiring credibility corridor');
    expect(activeAuthorityCopy).not.toContain('### 6.5 Hiring corridor');
    expect(activeAuthorityCopy).not.toContain(
      'review people through proof-backed, explainable, privacy-safe early review'
    );
    expect(activeAuthorityCopy).not.toContain(
      'review people through proof-backed, privacy-safe, explainable signal'
    );
    expect(activeAuthorityCopy).not.toContain('small hiring teams using lean workflows');
    expect(activeAuthorityCopy).not.toContain(
      'review privacy-safe proof-backed candidate summaries'
    );
    expect(activeAuthorityCopy).not.toContain('review privacy-safe proof-backed candidates');
    expect(activeAuthorityCopy).not.toContain(
      'move one candidate through intro, reveal, interview, and decision'
    );
    expect(activeAuthorityCopy).not.toContain(
      'matching org confirmation plus candidate confirmation'
    );
    expect(activeAuthorityCopy).not.toContain('anonymized candidate label');
    expect(activeAuthorityCopy).not.toContain('hiring manager →');
    expect(activeAuthorityCopy).not.toContain('Candidate accepts intro');
    expect(activeAuthorityCopy).not.toContain('Candidate approves reveal');
    expect(activeAuthorityCopy).not.toContain('public candidate directory');
    expect(activeAuthorityCopy).not.toContain('public candidate browsing');
    expect(activeAuthorityCopy).not.toContain('open candidate search index');
    expect(launchRunbook).not.toContain('sensitive assignment or candidate complaints');
    expect(launchRunbook).not.toContain('no public candidate directory exists');
    expect(launchRunbook).not.toContain('review privacy-safe candidates');
    expect(launchRunbook).not.toContain('public candidate browsing');
    expect(technicalRequirements).not.toContain(
      'narrow, proof-first, privacy-safe hiring and credibility corridor'
    );
    expect(technicalRequirements).not.toContain('lean hiring-to-engagement flow');
    expect(activeAuthorityCopy).not.toContain('review candidates through proof instead');
    expect(activeAuthorityCopy).not.toContain('automated hiring recommendations');
    expect(activeAuthorityCopy).not.toContain('hiring recommendations');
    expect(activeAuthorityCopy).not.toContain('hiring-decision state');
    expect(activeAuthorityCopy).not.toContain('hidden candidate evaluation store');
    expect(gtmPlan).not.toContain('No candidate identity');
    expect(gtmPlan).not.toContain('a cleaner first hiring corridor');
    expect(gtmPlan).not.toContain('want to hire through proof');
    expect(gtmPlan).not.toContain('hiring signal comes from the work behind the claim');
    expect(activeAuthorityCopy).not.toContain('candidate consent');
    expect(activeAuthorityCopy).not.toContain('candidate review record');
    expect(activeAuthorityCopy).not.toContain('candidate review, proof editing');
    expect(activeAuthorityCopy).not.toContain('non-candidate-facing');
    expect(activeAuthorityCopy).not.toContain('candidate-visible feedback');
    expect(technicalRequirements).not.toContain(
      '`org_reviewer` can review candidates and contribute feedback within allowed scope'
    );
    expect(technicalRequirements).not.toContain(
      'candidate approval is mandatory for identity-bearing reveal'
    );
    expect(technicalRequirements).not.toContain('candidate notification');
  });

  it('keeps local developer setup and lint troubleshooting aligned with current scripts', () => {
    const localDev = fs.readFileSync(path.join(repoRoot, 'docs/local-dev.md'), 'utf8');
    const lintTroubleshooting = fs.readFileSync(
      path.join(repoRoot, 'docs/TROUBLESHOOTING_LINT.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');
    const localDevCompact = compactWhitespace(localDev);

    expect(localDev).toContain('Last Verified: `2026-05-19`');
    expect(localDev).toContain('Node `24.15.0`');
    expect(localDev).toContain('npm `11.12.1`');
    expect(localDev).toContain('npm ci');
    expect(localDev).toContain('engine-strict=true');
    expect(localDev).toContain('NEXT_PUBLIC_USE_MOCK_SUPABASE=true npm run dev');
    expect(localDev).toContain('Use Browser for route inspection');
    expect(localDevCompact).toContain(
      'Mock mode is useful for Browser and Playwright layout checks, but it is not proof of RLS'
    );
    expect(localDev).toContain('Strict or launch-adjacent checks must keep');
    expect(localDev).not.toContain('node20');

    expect(lintTroubleshooting).toContain('Last Verified: `2026-05-19`');
    expect(lintTroubleshooting).toContain('scripts/lint-or-skip.js');
    expect(lintTroubleshooting).toContain('npx eslint . --ext .js,.jsx,.ts,.tsx');
    expect(lintTroubleshooting).toContain('Skipping lint: eslint is not installed');
    expect(lintTroubleshooting).toContain('npm ci');
    expect(lintTroubleshooting).toContain('FORCE_LINT=true npm run lint');
    expect(lintTroubleshooting).toContain('Do not count a dependency-missing skip');
    expect(lintTroubleshooting).not.toContain('npm install');
    expect(lintTroubleshooting).not.toContain('Next.js CLI');

    expect(docsRegistry).toContain(
      '| `docs/local-dev.md`                                                                                     | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `docs/TROUBLESHOOTING_LINT.md`                                                                          | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps local scratch scripts and browser run logs out of launch commits', () => {
    const gitignore = fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8');

    expect(gitignore).toContain('/scratch/');
    expect(gitignore).toContain('playwright-run.log');
  });

  it('keeps final launch checklist evidence aligned with assignment-review wording', () => {
    const finalLaunchDefinitions = fs.readFileSync(
      path.join(repoRoot, 'src/lib/launch/final-launch-checklist-definitions.ts'),
      'utf8'
    );
    const finalLaunchTest = fs.readFileSync(
      path.join(repoRoot, 'src/lib/launch/__tests__/final-launch-checklist.test.ts'),
      'utf8'
    );
    const finalLaunchCopy = `${finalLaunchDefinitions}\n${finalLaunchTest}`;

    expect(finalLaunchCopy).toContain('narrow proof-first assignment review corridor');
    expect(finalLaunchCopy).toContain('proof-first assignment review corridor');
    expect(finalLaunchCopy).toContain('review proof submissions instead of profile theater');
    expect(finalLaunchCopy).toContain('Proof-Submission Supply-Seeding Plan');
    expect(finalLaunchCopy).not.toContain('narrow proof-first hiring corridor');
    expect(finalLaunchCopy).not.toContain('proof-first hiring corridor');
    expect(finalLaunchCopy).not.toContain(
      'review candidates through proof instead of profile theater'
    );
    expect(finalLaunchCopy).not.toContain('Candidate Supply-Seeding Plan');
  });

  it('keeps the strict MVP gate wired to timeout-aware release commands', () => {
    const gateScript = fs.readFileSync(
      path.join(repoRoot, 'scripts/run-mvp-strict-gates.mjs'),
      'utf8'
    );

    expect(gateScript).toContain("commandArgs: ['ci', '--ignore-scripts']");
    expect(gateScript).toContain("'prod-dependency-audit'");
    expect(gateScript).toContain("'all-dependency-audit'");
    expect(gateScript).toContain("commandArgs: ['run', 'audit:prod']");
    expect(gateScript).toContain("commandArgs: ['run', 'audit:all']");
    expect(gateScript).toContain("'deploy-readiness-strict'");
    expect(gateScript).toContain("'focused-api-tests'");
    expect(gateScript).toContain("'privacy-tests'");
    expect(gateScript).toContain("'launch-status'");
    expect(gateScript).toContain("'timed_out'");
    expect(gateScript).toContain('commands.json');
    expect(gateScript).toContain('providerConnectedRequired');
    expect(gateScript).toContain(
      "STRICT_PROVIDER_E2E_REQUIRE_CONNECTED: providerConnectedRequired ? 'true' : 'false'"
    );
    expect(gateScript).toContain("id: 'providers-advisory-e2e'");
    expect(gateScript).toContain("commandArgs: ['run', 'test:e2e:providers:advisory']");
    expect(gateScript).toContain(
      'Connected-provider scheduling is not part of the default locked MVP launch corridor.'
    );
    expect(gateScript).not.toContain("id: 'providers-strict-e2e'");
    expect(gateScript).not.toContain("commandArgs: ['run', 'test:e2e:providers:strict']");
    expect(gateScript).toContain(
      'Connected provider credentials are required only when STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true.'
    );
    expect(gateScript).not.toContain("'LINKEDIN_CLIENT_ID'");
    expect(gateScript).not.toContain("'LINKEDIN_CLIENT_SECRET'");
  });

  it('keeps the accessibility go/no-go evidence current and honestly scoped', () => {
    const accessibilityReport = fs.readFileSync(
      path.join(repoRoot, 'ACCESSIBILITY_AUDIT_REPORT.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(accessibilityReport).toContain('Last Verified: `2026-05-19`');
    expect(accessibilityReport).toContain('npm run test:a11y');
    expect(accessibilityReport).toContain('Runtime: Node `v25.4.0`');
    expect(accessibilityReport).toContain('Total tests: `15`');
    expect(accessibilityReport).toContain('Passed: `11`');
    expect(accessibilityReport).toContain('Skipped: `4`');
    expect(accessibilityReport).toContain('tests/a11y/critical-flows.spec.ts');
    expect(accessibilityReport).toContain('tests/a11y/keyboard-navigation.spec.ts');
    expect(accessibilityReport).toContain('explicitly');
    expect(accessibilityReport).toContain('skipped until stable active MVP fixtures');
    expect(accessibilityReport).toContain(
      'Strict authenticated accessibility remains a production-candidate gate'
    );
    expect(accessibilityReport).toContain('Manual screen-reader validation');
    expect(accessibilityReport).not.toContain('2026-02-12');
    expect(docsRegistry).toContain(
      '| `ACCESSIBILITY_AUDIT_REPORT.md`                                                                         | `active`         | `root`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps accessibility guidance aligned with current MVP launch gates', () => {
    const accessibilityDocs = [
      fs.readFileSync(path.join(repoRoot, 'docs/ACCESSIBILITY.md'), 'utf8'),
      fs.readFileSync(path.join(repoRoot, 'docs/ACCESSIBILITY_TESTING_GUIDE.md'), 'utf8'),
    ];
    const joined = accessibilityDocs.join('\n');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    for (const content of accessibilityDocs) {
      expect(content).toContain('Last Verified: `2026-05-19`');
      expect(content).toContain('WCAG 2.1 AA');
      expect(content).toContain('npm run test:a11y');
      expect(content).toContain('npm run test:a11y:strict');
      expect(content).toContain('Strict authenticated');
      expect(content).toContain('Manual');
      expect(content).toContain('Proof Packs');
      expect(content).toContain('admin/internal');
    }

    expect(joined).toContain('matching and assignment-review surfaces when active');
    expect(joined).toContain('proof-submission review');
    expect(joined).toContain('proof-submission cards');
    expect(joined).toContain('private proof submissions');
    expect(joined).toContain('ACCESSIBILITY_AUDIT_REPORT.md');
    expect(joined).toContain('production-candidate gate');
    expect(compactWhitespace(joined.toLowerCase())).toContain(
      'not proof of full strict authenticated'
    );
    expect(joined).not.toContain(
      '@axe-core/playwright**: E2E accessibility testing (to be configured)'
    );
    expect(joined).not.toContain('.eslintrc.json');
    expect(joined).not.toContain('npx lighthouse https://proofound.io --view');
    expect(joined).not.toContain('/app/i/expertise');
    expect(joined).not.toContain('Zen Hub');
    expect(joined).not.toContain('matching/opportunities surfaces when active');
    expect(joined).not.toContain('candidate proof review');
    expect(joined).not.toContain('candidate proof cards');
    expect(joined).not.toContain('private candidate proof');
    expect(docsRegistry).toContain(
      '| `docs/ACCESSIBILITY.md`                                                                                 | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `docs/ACCESSIBILITY_TESTING_GUIDE.md`                                                                   | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps visual style and motion docs aligned with the active design contract', () => {
    const designContract = fs.readFileSync(path.join(repoRoot, 'DESIGN.md'), 'utf8');
    const ubiquitousLanguage = fs.readFileSync(
      path.join(repoRoot, 'docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md'),
      'utf8'
    );
    const styleMap = fs.readFileSync(path.join(repoRoot, 'docs/STYLEMAP.md'), 'utf8');
    const animationNotes = fs.readFileSync(path.join(repoRoot, 'docs/ANIMATION_NOTES.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');
    const designDocs = `${designContract}\n${ubiquitousLanguage}\n${styleMap}\n${animationNotes}`;

    expect(designContract).toContain('Last Verified: `2026-05-21`');
    expect(designContract).toContain('Last Updated: `2026-05-21`');
    expect(designContract).toContain('proof-first, privacy-first assignment review corridor');
    expect(designContract).toContain('primary object obvious');
    expect(designContract).toContain('proof-submission review, reveal request');
    expect(designContract).toContain('primary next action obvious and safe');
    expect(designContract).toContain(
      'privacy state, trust state, proof state, and readiness state'
    );
    expect(designContract).toContain(
      'gated, archived, disabled, empty, loading, error, and success states'
    );
    expect(designContract).toContain('score-first, rank-first, or automated-verdict presentation');
    expect(designContract).toContain('public directory behavior');
    expect(designContract).toContain('visual thesis, content plan, and interaction thesis');
    expect(designContract).toContain(
      'verify representative desktop and mobile behavior with Browser or Playwright'
    );
    expect(designContract).not.toContain('proof-first, privacy-first hiring corridor');
    expect(designContract).not.toContain('candidate review, reveal request');
    expect(designContract).not.toContain('candidate-facing surfaces');

    expect(ubiquitousLanguage).toContain('Doc Class: `active`');
    expect(ubiquitousLanguage).toContain('Last Verified: `2026-05-21`');
    expect(ubiquitousLanguage).toContain('Primary object');
    expect(ubiquitousLanguage).toContain('Primary next action');
    expect(ubiquitousLanguage).toContain('Reason code');
    expect(ubiquitousLanguage).toContain('automated workflow recommendations');
    expect(ubiquitousLanguage).toContain('Manual-link interview');
    expect(ubiquitousLanguage).toContain('Privacy stage');
    expect(ubiquitousLanguage).toContain('proof review, reveal request');
    expect(ubiquitousLanguage).toContain('public directory, profile theater, vanity metric');
    expect(ubiquitousLanguage).not.toContain('hiring or review-side account');
    expect(ubiquitousLanguage).not.toContain('candidate review, reveal request');
    expect(ubiquitousLanguage).not.toContain('automated hiring recommendations');

    expect(styleMap).toContain('Last Verified: `2026-05-19`');
    expect(styleMap).toContain('DESIGN.md');
    expect(styleMap).toContain('`--proofound-forest`');
    expect(styleMap).toContain('`#56624F`');
    expect(styleMap).toContain('proof review, reveal request');
    expect(styleMap).toContain('public directory');
    expect(styleMap).toContain('Dark mode is not an active supported theme');
    expect(styleMap).not.toContain('candidate review, reveal request');
    expect(styleMap).not.toContain('`#606C5A` | Primary buttons');
    expect(styleMap).not.toContain('Japandi palette above');

    expect(animationNotes).toContain('Last Verified: `2026-05-19`');
    expect(animationNotes).toContain('src/design/motion-tokens.json');
    expect(animationNotes).toContain('prefers-reduced-motion');
    expect(animationNotes).toContain('Use Browser');
    expect(animationNotes).toContain('Retired Guidance');
    expect(animationNotes).toContain('NetworkBackground');
    expect(animationNotes).toContain('LivingNetwork');
    expect(compactWhitespace(animationNotes)).toContain('Do not reintroduce `NetworkBackground`');
    expect(designDocs).toContain('primary object and next action');
    expect(designDocs.toLowerCase()).toContain('privacy');
    expect(designDocs).not.toContain('Purpose: Create living, organic feel');
    expect(designDocs).not.toContain('Canvas-based rendering for performance');
    expect(designDocs).not.toContain('Morphing Blobs');
    expect(designDocs).not.toContain('tokens/wireframe-spec.json');
    expect(docsRegistry).toContain(
      '| `docs/ANIMATION_NOTES.md`                                                                               | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `docs/STYLEMAP.md`                                                                                      | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `DESIGN.md`                                                                                             | `active`         | `root`        | `repo`              | `2026-05-21`'
    );
    expect(docsRegistry).toContain(
      '| `docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md`                                                                 | `active`         | `docs`        | `repo`              | `2026-05-21`'
    );
  });

  it('keeps landing proof examples away from broad enterprise SaaS framing', () => {
    const landingStory = fs.readFileSync(
      path.join(repoRoot, 'src/components/landing/sections/ScrollytellingSection.tsx'),
      'utf8'
    );

    expect(landingStory).toContain('Mission-led team');
    expect(landingStory).toContain('Proof-led review');
    expect(landingStory).toContain('mission-driven team scaling one assignment path');
    expect(landingStory).not.toContain('B2B SaaS');
    expect(landingStory).not.toContain('Enterprise clients');
    expect(landingStory).not.toContain('B2B platform');
    expect(landingStory).not.toContain('200+ employees');
    expect(landingStory).not.toContain('growth-stage B2B');
    expect(landingStory).not.toContain('mission-driven team scaling one hiring program');

    expect(
      fs.existsSync(path.join(repoRoot, 'src/components/landing/sections/HeroSection.tsx'))
    ).toBe(false);
    expect(
      fs.existsSync(
        path.join(
          repoRoot,
          'src/archive/non_launch_landing_variants/preserved/components/landing/sections/HeroSection.tsx'
        )
      )
    ).toBe(true);
  });

  it('keeps active public landing and SEO copy proof-review led', () => {
    const publicLandingCopy = [
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'src/app/terms/page.tsx',
      'src/components/landing/sections/FinalCTASection.tsx',
      'src/components/landing/sections/FooterSection.tsx',
      'src/components/landing/sections/ScrollytellingSection.tsx',
      'src/components/landing/sections/homepage-story-frames.ts',
      'src/components/landing/sections/BuiltForSection.tsx',
      'src/components/landing/sections/DayOneSurfacesSection.tsx',
      'src/components/landing/sections/EarlyProofSection.tsx',
      'src/components/landing/sections/HiringTeamsSection.tsx',
      'src/components/landing/sections/ThreeStepCorridorSection.tsx',
      'src/components/landing/sections/hero-variants/HeroManifesto.tsx',
      'src/lib/launch/public-org-trust-fixture.ts',
      'src/lib/matching/visual-fixtures.ts',
      'src/lib/seo/json-ld.ts',
      'src/lib/seo/llms.ts',
    ]
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');

    expect(publicLandingCopy).toContain('structured proof review');
    expect(publicLandingCopy).toContain('weak CV claims');
    expect(publicLandingCopy).toContain('Run assignment review from validated proof');
    expect(publicLandingCopy).toContain('Move from proof submissions to approved next steps');
    expect(publicLandingCopy).toContain('Build proof-first review');
    expect(publicLandingCopy).toContain('Evidence-based assignment review');
    expect(publicLandingCopy).toContain('privacy-safe assignment review');
    expect(publicLandingCopy).toContain('proof-first assignment review corridor');
    expect(publicLandingCopy).toContain('proof-review workflow');
    expect(publicLandingCopy).toContain('clear assignment-based workflow');
    expect(publicLandingCopy).toContain('proof-backed submissions');
    expect(publicLandingCopy).toContain('clearer-evidence submissions');
    expect(publicLandingCopy).toContain('before proof submissions start');
    expect(publicLandingCopy).toContain('before submissions open');
    expect(publicLandingCopy).toContain('Too much time reviewing weak submissions');
    expect(publicLandingCopy).toContain('Too many weak submissions.');
    expect(publicLandingCopy).toContain('organizations review assignment submissions');
    expect(publicLandingCopy).toContain('Proof-review participants add context');
    expect(publicLandingCopy).toContain('Proof-review participants flatten real ability');
    expect(publicLandingCopy).toContain("candidateLabel: 'Submission A'");
    expect(publicLandingCopy).toContain('Proof-first assignment review should stay calm');
    expect(publicLandingCopy).toContain('privacy-safe assignment review');

    for (const staleCopy of [
      'structured hiring signal',
      'weak CV signal',
      'Hire and collaborate',
      'Streamline hiring without sifting through CV noise',
      'higher-signal candidates',
      'Build hiring on stronger proof',
      'Explore evidence-based hiring',
      'Evidence-based hiring for a world',
      'proof-first hiring corridor',
      'privacy-safe candidate review',
      'inside the hiring corridor',
      'clear assignment-based hiring',
      'Review proof-backed candidates',
      'clearer-evidence candidates',
      'Candidates add context',
      'Candidates flatten real ability',
      'organizations find talent',
      "candidateLabel: 'Candidate A'",
      'proof-first hiring infrastructure',
      'privacy-safe hiring corridor',
      'before applications start',
      'before applications open',
      'Too much time reviewing weak applications',
      'Too many weak applications',
    ]) {
      expect(publicLandingCopy).not.toContain(staleCopy);
    }
  });

  it('keeps active operator docs aligned with proof-review corridor wording', () => {
    const activeOperatorDocs = [
      'README.md',
      'docs/internal-ops/index.md',
      'docs/internal-ops/assignment-quality-checklist.md',
      'docs/launch-operations-mvp.md',
      'docs/mvp-launch-master-checklist.md',
      'docs/STYLEMAP.md',
      'docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md',
      'Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md',
    ]
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');

    expect(activeOperatorDocs).toContain('proof-first assignment review corridor');
    expect(activeOperatorDocs).toContain('proof-review workflow');
    expect(activeOperatorDocs).toContain('privacy-safe proof review');
    expect(activeOperatorDocs).toContain('unordered proof review');
    expect(activeOperatorDocs).toContain('proof-backed assignment review');
    expect(activeOperatorDocs).toContain('Proof-submission supply-seeding plan');
    expect(activeOperatorDocs).toContain('a cleaner first assignment-review corridor');

    for (const staleCopy of [
      'proof-first, privacy-first hiring corridor',
      'narrow proof-first hiring corridor',
      'Proofound is a narrow proof-first hiring corridor',
      'proof-backed hiring credibility',
      'proof-first hiring for individuals and organizations',
      'the hiring corridor',
      'a cleaner first hiring corridor',
      'candidate review, reveal request',
      'privacy-safe candidate review',
      'unordered candidate review',
      'Candidate supply-seeding plan',
      'candidate supply seeding',
      'proof-first candidate review corridor',
    ]) {
      expect(activeOperatorDocs).not.toContain(staleCopy);
    }
  });

  it('keeps monitoring launch-ops routes documented as internal, not public', () => {
    const apiReference = fs.readFileSync(path.join(repoRoot, 'docs/API_REFERENCE.md'), 'utf8');
    const apiReferenceGenerator = fs.readFileSync(
      path.join(repoRoot, 'scripts/generate-api-reference.mjs'),
      'utf8'
    );
    const monitoringRoutes = [
      '/api/monitoring/health-diagnostics',
      '/api/monitoring/launch-status',
      '/api/monitoring/perf-status',
    ];

    expect(apiReferenceGenerator).toContain('requireInternalOpsRequest');

    for (const route of monitoringRoutes) {
      const routeLine = apiReference
        .split('\n')
        .find((line) => line.includes(`| \`GET\``) && line.includes(`\`${route}\``));

      expect(routeLine).toContain('| `internal` |');
      expect(routeLine).not.toContain('| `public` |');
    }
  });

  it('keeps organization APIs documented as session-scoped, not public directory surfaces', () => {
    const apiReference = fs.readFileSync(path.join(repoRoot, 'docs/API_REFERENCE.md'), 'utf8');
    const apiReferenceGenerator = fs.readFileSync(
      path.join(repoRoot, 'scripts/generate-api-reference.mjs'),
      'utf8'
    );
    const organizationRoutes = ['/api/organizations', '/api/organizations/[orgId]/assignments'];

    expect(apiReferenceGenerator).toContain('requireApiAuth');

    for (const route of organizationRoutes) {
      const routeLine = apiReference.split('\n').find((line) => line.includes(`\`${route}\``));

      expect(routeLine).toContain('| `session` |');
      expect(routeLine).not.toContain('| `public` |');
    }
  });

  it('keeps active API reference notes distinct from archived legacy markers', () => {
    const activeLegacyRows = fs
      .readFileSync(path.join(repoRoot, 'docs/API_REFERENCE.md'), 'utf8')
      .split('\n')
      .filter(
        (line) =>
          line.includes('| `active MVP`') && line.includes('legacy/compat markers in source')
      );

    expect(activeLegacyRows).toEqual([]);
  });

  it('keeps active route-count evidence aligned across launch docs', () => {
    const apiReference = fs.readFileSync(path.join(repoRoot, 'docs/API_REFERENCE.md'), 'utf8');
    const currentTruth = fs.readFileSync(path.join(repoRoot, 'docs/CURRENT_TRUTH.md'), 'utf8');
    const verificationChecklist = fs.readFileSync(
      path.join(repoRoot, 'docs/verification-checklist.md'),
      'utf8'
    );
    const backlogReadme = fs.readFileSync(path.join(repoRoot, 'docs/backlog/README.md'), 'utf8');
    const dependencyMap = fs.readFileSync(
      path.join(repoRoot, 'docs/backlog/dependency-map.md'),
      'utf8'
    );
    const phaseZero = fs.readFileSync(
      path.join(repoRoot, 'docs/backlog/phase-0-scope-lock.md'),
      'utf8'
    );
    const phaseThree = fs.readFileSync(
      path.join(repoRoot, 'docs/backlog/phase-3-hiring-corridor.md'),
      'utf8'
    );
    const currentStateArtifact = fs.readFileSync(
      path.join(repoRoot, '.artifacts/proofound-current-state-reality-check.md'),
      'utf8'
    );
    const launchReadinessSummary = fs.readFileSync(
      path.join(repoRoot, '.artifacts/launch-readiness-summary.md'),
      'utf8'
    );
    const phaseFive = fs.readFileSync(
      path.join(repoRoot, 'docs/backlog/phase-5-launch-packaging.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');
    const routeDocs = [
      currentTruth,
      verificationChecklist,
      backlogReadme,
      dependencyMap,
      phaseZero,
      phaseThree,
      currentStateArtifact,
      launchReadinessSummary,
      phaseFive,
    ].join('\n');

    expect(apiReference).toContain('- Total route handlers: **140**');
    expect(apiReference).toContain(
      '- Launch surface counts: `active MVP=108`, `internal launch ops=16`, `archived compatibility=16`'
    );
    expect(routeDocs).toContain('140 compiled API route handlers');
    expect(verificationChecklist).toContain('proof-review workflow reaches explicit `hire`');
    expect(verificationChecklist).toContain('proof-review-participant-consented reveal');
    expect(routeDocs).toContain('51 compiled pages');
    expect(routeDocs).toContain('108 APIs as active MVP');
    expect(routeDocs).toContain('16 APIs as internal-only launch ops');
    expect(routeDocs).toContain('16 API handlers as archived compatibility responses');
    expect(routeDocs).toContain('/dev/resolve-home');
    expect(backlogReadme).toContain('Last Verified: `2026-05-21`');
    expect(dependencyMap).toContain('Last Verified: `2026-05-21`');
    expect(phaseThree).toContain('Last Verified: `2026-05-21`');
    expect(routeDocs).toContain('Phase 3 — Assignment-review corridor');
    expect(routeDocs).toContain(
      'Phase 3<br/>Assignment-review corridor and assignment runtime hardening'
    );
    expect(phaseThree).toContain(
      'Phase 3: Assignment-Review Corridor and Assignment Runtime Hardening'
    );
    expect(routeDocs).not.toContain('Phase 3 — Hiring corridor');
    expect(routeDocs).not.toContain('Phase 3<br/>Hiring corridor and assignment runtime hardening');
    expect(phaseThree).not.toContain('Phase 3: Hiring Corridor and Assignment Runtime Hardening');
    expect(routeDocs).not.toContain('110 APIs');
    expect(routeDocs).not.toContain('14 API handlers as archived compatibility responses');
    expect(currentStateArtifact).toContain(
      '| no non-MVP launch surface                                                             | `PASS`'
    );
    expect(currentStateArtifact).toContain(
      'Fresh current-state counts are `140` compiled API route handlers and `51` compiled pages.'
    );
    expect(currentStateArtifact).not.toContain(
      'Fresh current-state counts are `138` APIs and `50` pages.'
    );
    expect(currentStateArtifact).not.toContain('Route breadth remains the only current blocker');
    expect(phaseFive).toContain('Last Verified: `2026-05-21`');
    expect(phaseFive).toContain('proof-first assignment review corridor centered on Proof Packs');
    expect(phaseFive).not.toContain('proof-first hiring corridor centered on Proof Packs');
    expect(phaseFive).toContain('Current as of 2026-05-20');
    expect(verificationChecklist).not.toContain('hiring corridor reaches explicit `hire`');
    expect(verificationChecklist).not.toContain('candidate-consented reveal');
    expect(phaseFive).toContain(
      'historical-registry cleanup watch item is no longer treated as open'
    );
    expect(launchReadinessSummary).toContain(
      'Current repo-ready checklist evidence is `.artifacts/launch-validation-2026-05-20/final-launch-checklist-status.md`, generated `2026-05-20'
    );
    expect(launchReadinessSummary).not.toContain('generated `2026-05-19T22:13:02.762Z`');
    expect(launchReadinessSummary).not.toContain(
      'Historical registry cleanup and earlier route-surface findings should stay archived'
    );
    expect(docsRegistry).toContain(
      '| `docs/API_REFERENCE.md`                                                                                 | `active`         | `docs`        | `repo+live`         | `2026-05-20`'
    );
    expect(docsRegistry).toContain('> Last Verified: `2026-05-30`');
    expect(docsRegistry).toContain(
      '| `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`                                              | `reference-spec` | `artifacts`   | `repo+browser`      | `2026-05-20`'
    );
    expect(docsRegistry).toContain(
      '| `docs/DOCS_REGISTRY.md`                                                                                 | `active`         | `docs`        | `repo+live`         | `2026-05-30`'
    );
    expect(docsRegistry).toContain(
      '| `.artifacts/proofound-current-state-reality-check.md`                                                   | `reference-spec` | `artifacts`   | `repo`              | `2026-05-20`'
    );
    expect(docsRegistry).toContain(
      '| `.artifacts/launch-readiness-summary.md`                                                                | `reference-spec` | `artifacts`   | `repo`              | `2026-05-20`'
    );
    expect(docsRegistry).toContain(
      '| `.artifacts/proofound-priority-file-map.md`                                                             | `reference-spec` | `artifacts`   | `repo`              | `2026-05-20`'
    );
    expect(docsRegistry).toContain(
      '| `docs/backlog/phase-5-launch-packaging.md`                                                              | `active`         | `docs`        | `repo+live`         | `2026-05-21`'
    );
    expect(docsRegistry).toContain(
      '| `docs/backlog/README.md`                                                                                | `active`         | `docs`        | `repo+live`         | `2026-05-21`'
    );
    expect(docsRegistry).toContain(
      '| `docs/backlog/dependency-map.md`                                                                        | `active`         | `docs`        | `repo+live`         | `2026-05-21`'
    );
    expect(docsRegistry).toContain(
      '| `docs/backlog/phase-3-hiring-corridor.md`                                                               | `active`         | `docs`        | `repo+live`         | `2026-05-21`'
    );
    expect(docsRegistry).toContain(
      '| `docs/verification-checklist.md`                                                                        | `active`         | `docs`        | `repo+live`         | `2026-05-20`'
    );
    expect(docsRegistry).not.toContain(
      '| `docs/DOCS_REGISTRY.md`                                                                                 | `active`         | `docs`        | `repo+live`         | `2026-05-14`'
    );
  });

  it('keeps cache monitoring docs aligned with implemented stats', () => {
    const cacheSource = fs.readFileSync(path.join(repoRoot, 'src/lib/cache.ts'), 'utf8');
    const monitoringDocs = [
      fs.readFileSync(path.join(repoRoot, 'docs/monitoring-alerting.md'), 'utf8'),
      fs.readFileSync(path.join(repoRoot, 'docs/caching-pagination.md'), 'utf8'),
    ].join('\n');

    expect(cacheSource).not.toContain('placeholder for future implementation');
    expect(monitoringDocs).not.toContain('cacheStats.hitRate');
    expect(monitoringDocs).not.toContain('const cacheStats = getCacheStats();');
    expect(monitoringDocs).toContain('/api/match/profile');
    expect(monitoringDocs).not.toContain('/api/core/matching/profile');
  });

  it('keeps archived and removed non-MVP tests out of the default release signal', () => {
    const vitestConfig = fs.readFileSync(path.join(repoRoot, 'vitest.config.ts'), 'utf8');
    const archivedConfig = fs.readFileSync(
      path.join(repoRoot, 'vitest.archived.config.ts'),
      'utf8'
    );

    expect(vitestConfig).toContain("'**/src/archive/**'");
    expect(vitestConfig).toContain("'**/tests/archive/**'");
    expect(vitestConfig).not.toContain('analytics-track-route.test.ts');
    expect(vitestConfig).not.toContain('performance-track-route.test.ts');
    expect(vitestConfig).toContain("'**/tests/lib/cv-import-suggest-1000-benchmark.test.ts'");
    expect(archivedConfig).toContain('src/archive/**/*.test.ts');
    expect(archivedConfig).toContain('tests/archive/non_mvp_cv_import_wizard/**/*.test.ts');
    expect(archivedConfig).toContain('tests/archive/non_mvp_legacy_api/**/*.test.ts');
    expect(archivedConfig).toContain('tests/archive/non_mvp_moderation_api/**/*.test.ts');
    expect(archivedConfig).toContain('tests/archive/non_mvp_org_integrations_ui/**/*.test.ts');
    expect(archivedConfig).toContain('tests/archive/non_mvp_org_integrations_ui/**/*.test.tsx');
  });

  it('keeps excluded compatibility tests in the archive tree', () => {
    const retiredActiveTestPaths = [
      'tests/api/messages-legacy-route.test.ts',
      'tests/api/moderation-appeals-route.test.ts',
      'tests/api/moderation-statements-of-reasons-route.test.ts',
      'tests/api/moderation-transparency-report-route.test.ts',
      'tests/api/organization-test-matches-route.test.ts',
      'tests/api/updates-cache-flag-route.test.ts',
      'tests/ui/admin-ai-spend-page.test.tsx',
      'tests/ui/admin-fairness-notes-page.test.tsx',
      'tests/ui/organization-settings-integrations.test.tsx',
      'tests/api/performance-track-route.test.ts',
    ];

    for (const retiredPath of retiredActiveTestPaths) {
      expect(fs.existsSync(path.join(repoRoot, retiredPath))).toBe(false);
    }

    const archivedPaths = [
      'tests/archive/non_mvp_legacy_api/messages-legacy-route.archived.test.ts',
      'tests/archive/non_mvp_legacy_api/updates-cache-flag-route.archived.test.ts',
      'tests/archive/non_mvp_moderation_api/moderation-appeals-route.archived.test.ts',
      'tests/archive/non_mvp_org_integrations_ui/organization-settings-integrations.archived.test.tsx',
      'tests/archive/non_mvp_admin_suite/admin-ai-spend-page.archived.test.tsx',
      'tests/archive/non_mvp_admin_suite/admin-fairness-notes-page.archived.test.tsx',
      'tests/archive/non_mvp_analytics_suite/performance-track-route.archived.test.ts',
    ];

    for (const archivedPath of archivedPaths) {
      expect(fs.existsSync(path.join(repoRoot, archivedPath))).toBe(true);
    }
  });

  it('keeps active tests from importing archived implementation modules', () => {
    const archivedAliasPrefix = '@' + '/archive/';
    const activeTestFiles = listTestFiles(path.join(repoRoot, 'tests'));
    const offenders = activeTestFiles
      .filter((file) => fs.readFileSync(file, 'utf8').includes(archivedAliasPrefix))
      .map((file) => path.relative(repoRoot, file));

    expect(offenders).toEqual([]);
  });

  it('keeps active tests from importing the retired Expertise Atlas UI island', () => {
    const retiredExpertiseImport = '@' + '/app/app/i/expertise/';
    const activeTestFiles = listTestFiles(path.join(repoRoot, 'tests'));
    const offenders = activeTestFiles
      .filter((file) => fs.readFileSync(file, 'utf8').includes(retiredExpertiseImport))
      .map((file) => path.relative(repoRoot, file));

    expect(offenders).toEqual([]);
  });

  it('keeps retired CV import wizard behavior tests archived', () => {
    const retiredActiveTestPaths = [
      'tests/lib/cv-import-wizard-extractor.test.ts',
      'tests/lib/cv-import-wizard-quality.test.ts',
      'tests/lib/python-cv-proxy.test.ts',
    ];
    const archivedPaths = [
      'tests/archive/non_mvp_cv_import_wizard/cv-import-wizard-extractor.archived.test.ts',
      'tests/archive/non_mvp_cv_import_wizard/cv-import-wizard-quality.archived.test.ts',
      'tests/archive/non_mvp_cv_import_wizard/python-cv-proxy.archived.test.ts',
      'tests/archive/non_mvp_cv_import_wizard/README.md',
    ];

    for (const retiredPath of retiredActiveTestPaths) {
      expect(fs.existsSync(path.join(repoRoot, retiredPath))).toBe(false);
    }

    for (const archivedPath of archivedPaths) {
      expect(fs.existsSync(path.join(repoRoot, archivedPath))).toBe(true);
    }
  });

  it('keeps Python document-intelligence tests classified outside default launch evidence', () => {
    const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
    const pythonReadme = fs.readFileSync(path.join(repoRoot, 'tests/python/README.md'), 'utf8');

    expect(readme).toContain('npm run test:python');
    expect(readme).toContain('not default MVP launch evidence');
    expect(readme).toContain('tests/python/README.md');

    expect(pythonReadme).toContain('Doc Class: `active`');
    expect(pythonReadme).toContain('Last Verified: `2026-05-19`');
    expect(pythonReadme).toContain('not the default MVP launch gate');
    expect(pythonReadme).toContain('wizard-suggest');
    expect(pythonReadme).toContain('internal-job');
    expect(pythonReadme).toContain('archived `410` responses');
    expect(pythonReadme).toContain('Use `npm run test:launch:ai`');
    expect(pythonReadme).toContain(
      'Use `npm run test:python` as package-level regression coverage only'
    );
  });

  it('keeps retired CV import wizard implementation modules archived', () => {
    const retiredActiveSourcePaths = [
      'src/lib/expertise/cv-import-wizard-apply.ts',
      'src/lib/expertise/cv-import-wizard-extractor.ts',
      'src/lib/expertise/python-cv-proxy.ts',
    ];
    const archivedSourcePaths = [
      'src/archive/non_launch_cv_import_wizard/README.md',
      'src/archive/non_launch_cv_import_wizard/lib/expertise/cv-import-wizard-apply.ts',
      'src/archive/non_launch_cv_import_wizard/lib/expertise/cv-import-wizard-extractor.ts',
      'src/archive/non_launch_cv_import_wizard/lib/expertise/python-cv-proxy.ts',
    ];

    for (const retiredPath of retiredActiveSourcePaths) {
      expect(fs.existsSync(path.join(repoRoot, retiredPath))).toBe(false);
    }

    for (const archivedPath of archivedSourcePaths) {
      expect(fs.existsSync(path.join(repoRoot, archivedPath))).toBe(true);
    }
  });

  it('keeps retired TypeScript Python internal worker helpers archived', () => {
    const retiredActiveSourcePaths = [
      'src/lib/expertise/cv-import-existing-skills-filter.ts',
      'src/lib/expertise/cv-import-extract-job-store.ts',
      'src/lib/expertise/cv-import-extract-worker.ts',
      'src/lib/expertise/cv-import-temp-storage.ts',
      'src/lib/expertise/cv-import-wizard-extract.ts',
      'src/lib/expertise/cv-import-wizard-types.ts',
      'src/lib/expertise/python-cv-extract-client.ts',
      'src/lib/python-internal/client.ts',
      'src/lib/python-internal/contracts.ts',
      'src/lib/python-internal/job-queue.ts',
      'src/lib/python-internal/request-utils.ts',
      'src/lib/python-internal/service.ts',
      'src/lib/python-internal/trigger.ts',
      'src/lib/python-internal/worker.ts',
      'src/lib/__tests__/python-internal-request-utils.test.ts',
      'tests/lib/cv-import-extract-job-store.test.ts',
      'tests/lib/python-internal-service.test.ts',
      'tests/lib/python-internal-trigger.test.ts',
      'tests/lib/python-internal-worker.test.ts',
    ];
    const archivedPaths = [
      'src/archive/non_launch_python_internal/README.md',
      'src/archive/non_launch_python_internal/lib/python-internal/contracts.ts',
      'src/archive/non_launch_python_internal/lib/python-internal/job-queue.ts',
      'src/archive/non_launch_python_internal/lib/expertise/python-cv-extract-client.ts',
      'tests/archive/non_mvp_python_internal/README.md',
      'tests/archive/non_mvp_python_internal/cv-import-extract-job-store.archived.test.ts',
      'tests/archive/non_mvp_python_internal/python-internal-request-utils.archived.test.ts',
      'tests/archive/non_mvp_python_internal/python-internal-service.archived.test.ts',
      'tests/archive/non_mvp_python_internal/python-internal-trigger.archived.test.ts',
      'tests/archive/non_mvp_python_internal/python-internal-worker.archived.test.ts',
    ];

    for (const retiredPath of retiredActiveSourcePaths) {
      expect(fs.existsSync(path.join(repoRoot, retiredPath))).toBe(false);
    }

    for (const archivedPath of archivedPaths) {
      expect(fs.existsSync(path.join(repoRoot, archivedPath))).toBe(true);
    }
  });

  it('keeps the retired Expertise Atlas UI island archived', () => {
    expect(fs.existsSync(path.join(repoRoot, 'src/app/app/i/expertise'))).toBe(false);
    expect(
      fs.existsSync(path.join(repoRoot, 'src/archive/non_launch_pages/app/i/expertise/page.tsx'))
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'src/archive/non_launch_pages/app/i/expertise/implementation')
      )
    ).toBe(true);
  });

  it('keeps the broad legacy PRD database script archived', () => {
    expect(fs.existsSync(path.join(repoRoot, 'tests/comprehensive-prd-test.ts'))).toBe(false);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'tests/archive/non_mvp_legacy_prd/comprehensive-prd.archived.ts')
      )
    ).toBe(true);
  });

  it('keeps the broad critical-gaps mock test archived', () => {
    expect(fs.existsSync(path.join(repoRoot, 'tests/integration/critical-gaps.test.ts'))).toBe(
      false
    );
    expect(
      fs.existsSync(
        path.join(repoRoot, 'tests/archive/non_mvp_critical_gaps/critical-gaps.archived.test.ts')
      )
    ).toBe(true);
  });

  it('keeps the retired broad platform health script archived', () => {
    expect(fs.existsSync(path.join(repoRoot, 'scripts/check-platform-health.mjs'))).toBe(false);
    expect(
      fs.existsSync(
        path.join(
          repoRoot,
          'scripts/archive/non_mvp_platform_health/check-platform-health.archived.mjs'
        )
      )
    ).toBe(true);
  });

  it('keeps the legacy go/no-go script archived and out of active docs', () => {
    expect(fs.existsSync(path.join(repoRoot, 'scripts/go-no-go-check.mjs'))).toBe(false);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'scripts/archive/legacy_go_no_go/go-no-go-check.archived.mjs')
      )
    ).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'scripts/go-no-go-check.ts'))).toBe(true);

    const orientationDocs = [
      'Architecture.md',
      'Documentation.md',
      'metrics.md',
      'Prompt.md',
      'verification.md',
      'project/Architecture.md',
      'project/Documentation.md',
      'project/Prompt.md',
    ];
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    for (const docPath of orientationDocs) {
      const content = fs.readFileSync(path.join(repoRoot, docPath), 'utf8');
      if (docPath === 'Prompt.md' || docPath === 'project/Prompt.md') {
        expect(content).toContain('Last Verified: `2026-05-21`');
        expect(content).toContain('Proofound is a proof-first assignment review corridor');
        expect(content).not.toContain('hiring credibility corridor');
      } else if (
        docPath === 'Documentation.md' ||
        docPath === 'metrics.md' ||
        docPath === 'project/Documentation.md' ||
        docPath === 'verification.md'
      ) {
        expect(content).toContain('Last Verified: `2026-05-21`');
        expect(content).not.toContain('SUS_STUDY_COMPLETE');
        if (docPath === 'verification.md') {
          expect(content).toContain('INTERNAL_API_SECRET=<secret>');
          expect(content).toContain(
            'change match, review, verification, reveal, trust-state, or workflow-decision state'
          );
          expect(content).not.toContain('change match/review/trust/hiring state');
        }
      } else {
        expect(content).toContain('Last Verified: `2026-05-19`');
      }
      expect(content).toContain('scripts/go-no-go-check.ts');
      expect(content).not.toContain('scripts/go-no-go-check.mjs');
      expect(content).not.toContain('STRICT_PROVIDER_E2E_REQUIRE_BOTH');
      expect(content).not.toContain('both Zoom and Google connected');
      const registryLine = docsRegistry
        .split('\n')
        .find((line) => line.includes(`| \`${docPath}\``));
      if (docPath === 'Prompt.md' || docPath === 'project/Prompt.md') {
        expect(registryLine).toContain('| `2026-05-21`');
      } else if (
        docPath === 'Documentation.md' ||
        docPath === 'metrics.md' ||
        docPath === 'project/Documentation.md' ||
        docPath === 'verification.md'
      ) {
        expect(registryLine).toContain('| `2026-05-21`');
      } else {
        expect(registryLine).toContain('| `2026-05-19`');
      }
    }

    const activeDocs = listFiles(path.join(repoRoot, 'docs')).filter(
      (file) => file.endsWith('.md') && !file.includes(`${path.sep}archive${path.sep}`)
    );
    const rootDocs = fs
      .readdirSync(repoRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => path.join(repoRoot, entry.name));
    const offenders = [...activeDocs, ...rootDocs]
      .filter((file) => fs.readFileSync(file, 'utf8').includes('go-no-go-check.mjs'))
      .map((file) => path.relative(repoRoot, file));

    expect(offenders).toEqual([]);
  });

  it('keeps the release checklist aligned with current production-candidate gates', () => {
    const releaseChecklist = fs.readFileSync(
      path.join(repoRoot, 'docs/release-checklist.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(releaseChecklist).toContain('Last Verified: `2026-05-21`');
    expect(releaseChecklist).toContain('docs/production-readiness-checklist.md');
    expect(releaseChecklist).toContain('docs/backlog/phase-exit-checklist.md');
    expect(releaseChecklist).toContain('mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md');
    expect(releaseChecklist).toContain('BASE_URL=<production-candidate-url>');
    expect(releaseChecklist).toContain('npm run monitor:launch');
    expect(releaseChecklist).toContain('npm run launch:status');
    expect(releaseChecklist).toContain('npm run perf:budgets');
    expect(releaseChecklist).toContain('npm run db:backup:checkpoint');
    expect(releaseChecklist).toContain('npm run db:restore:verify');
    expectTextBefore(
      releaseChecklist,
      'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json',
      'BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run go:no-go'
    );
    expect(releaseChecklist).toContain('/api/assignments` latency samples');
    expect(releaseChecklist).toContain(
      'manual-link interview posture remains the locked MVP default'
    );
    expect(docsRegistry).toContain(
      '| `docs/release-checklist.md`                                                                             | `active`         | `docs`        | `repo+live`         | `2026-05-21`'
    );
  });

  it('keeps go/no-go restore evidence tied to production-candidate targets', () => {
    const goNoGoScript = fs.readFileSync(path.join(repoRoot, 'scripts/go-no-go-check.ts'), 'utf8');
    const restoreDrill = fs.readFileSync(
      path.join(repoRoot, 'docs/launch-restore-drill.md'),
      'utf8'
    );
    const verificationChecklist = fs.readFileSync(
      path.join(repoRoot, 'agent/checklists/verification.md'),
      'utf8'
    );
    const launchMasterChecklist = fs.readFileSync(
      path.join(repoRoot, 'docs/mvp-launch-master-checklist.md'),
      'utf8'
    );
    const deploymentChecklist = fs.readFileSync(
      path.join(repoRoot, 'docs/DEPLOYMENT_CHECKLIST.md'),
      'utf8'
    );
    const productionReadinessChecklist = fs.readFileSync(
      path.join(repoRoot, 'docs/production-readiness-checklist.md'),
      'utf8'
    );
    const releaseChecklist = fs.readFileSync(
      path.join(repoRoot, 'docs/release-checklist.md'),
      'utf8'
    );
    const phaseExitChecklist = fs.readFileSync(
      path.join(repoRoot, 'docs/backlog/phase-exit-checklist.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(goNoGoScript).toContain('LAUNCH_RESTORE_REPORT_PATH');
    expect(goNoGoScript).toContain('.artifacts/launch-restore-report.json');
    expect(goNoGoScript).toContain('isLocalLaunchBaseUrl');
    expect(goNoGoScript).toContain('requireTargetBaseUrl: !isLocalLaunchBaseUrl()');
    expect(goNoGoScript).toContain(
      'production-candidate go/no-go requires a restore verification report'
    );
    expect(goNoGoScript).toContain('restore verification report is stale');
    expect(goNoGoScript).toContain('summary.json');
    expect(goNoGoScript).toContain('row-fingerprint.json');
    expect(goNoGoScript).not.toContain('SUS_STUDY_COMPLETE');
    for (const content of [
      verificationChecklist,
      launchMasterChecklist,
      deploymentChecklist,
      productionReadinessChecklist,
      releaseChecklist,
      phaseExitChecklist,
    ]) {
      expect(content).not.toContain('SUS_STUDY_COMPLETE');
    }

    expect(restoreDrill).toContain(
      'Production-candidate `npm run go:no-go` additionally requires a fresh passing restore verification report'
    );
    expect(restoreDrill).toContain('Last Verified: `2026-05-21`');
    expect(restoreDrill).toContain('INTERNAL_API_SECRET=<secret>');
    expect(restoreDrill).toContain('--out .artifacts/launch-restore-report.json');
    expect(restoreDrill).toContain('summary.json');
    expect(restoreDrill).toContain('row-fingerprint.json');

    expect(verificationChecklist).toContain(
      'Production-candidate runs additionally require a fresh passing restore verification report'
    );
    expect(verificationChecklist).toContain('INTERNAL_API_SECRET=<secret>');
    expect(launchMasterChecklist).toContain(
      'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json'
    );
    expect(launchMasterChecklist).toContain(
      'BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run launch:status'
    );
    expect(launchMasterChecklist).toContain('INTERNAL_API_SECRET=<secret>');
    expect(launchMasterChecklist).toContain(
      'BASE_URL=<production-candidate-url> INTERNAL_API_SECRET=<secret> npm run launch:validate'
    );
    expect(phaseExitChecklist).toContain('Last Verified: `2026-05-21`');
    expect(phaseExitChecklist).toContain(
      'BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run launch:status'
    );
    expect(phaseExitChecklist).toContain('INTERNAL_API_SECRET=<secret>');
    expect(phaseExitChecklist).toContain(
      'BASE_URL=<production-candidate-url> npm run perf:budgets'
    );
    for (const content of [
      deploymentChecklist,
      launchMasterChecklist,
      productionReadinessChecklist,
      releaseChecklist,
      phaseExitChecklist,
    ]) {
      expect(content).toContain('CRON_SECRET=<secret>');
      expect(content).toContain('INTERNAL_API_SECRET=<secret>');
      expectTextBefore(
        content,
        'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json',
        'BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run go:no-go'
      );
    }
    expect(productionReadinessChecklist).toContain('Last Verified: `2026-05-21`');
    expect(docsRegistry).toContain(
      '| `docs/launch-restore-drill.md`                                                                          | `active`         | `docs`        | `repo+live`         | `2026-05-21`'
    );
  });

  it('does not allow the active go/no-go gate to be bypassed by environment flags', () => {
    const goNoGoScript = fs.readFileSync(path.join(repoRoot, 'scripts/go-no-go-check.ts'), 'utf8');
    const strictGateRunner = fs.readFileSync(
      path.join(repoRoot, 'scripts/run-mvp-strict-gates.mjs'),
      'utf8'
    );
    const legacyGoNoGoScript = fs.readFileSync(
      path.join(repoRoot, 'scripts/archive/legacy_go_no_go/go-no-go-check.archived.mjs'),
      'utf8'
    );

    expect(goNoGoScript).not.toContain('SKIP_GO_NOGO');
    expect(goNoGoScript).toContain('if (!RUN_SYNTHETICS)');
    expect(goNoGoScript).toContain('if (!isLocalLaunchBaseUrl())');
    expect(goNoGoScript).toContain('production-candidate targets must run launch synthetic checks');
    expect(strictGateRunner).not.toContain('SKIP_GO_NOGO');
    expect(legacyGoNoGoScript).toContain('SKIP_GO_NOGO');
  });

  it('keeps root production and provider docs aligned with manual-link launch posture', () => {
    const productionChecklist = fs.readFileSync(
      path.join(repoRoot, 'PRODUCTION_CHECKLIST.md'),
      'utf8'
    );
    const providerReference = fs.readFileSync(path.join(repoRoot, 'OAUTH_SETUP_GUIDE.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(productionChecklist).toContain('Last Verified: `2026-05-21`');
    expect(productionChecklist).toContain('Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md');
    expect(productionChecklist).toContain('docs/production-readiness-checklist.md');
    expect(productionChecklist).toContain('docs/release-checklist.md');
    expect(productionChecklist).toContain(
      'Manual-link interview scheduling is the locked MVP default'
    );
    expect(productionChecklist).toContain('npm run db:backup:checkpoint');
    expect(productionChecklist).toContain(
      'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json'
    );
    expect(productionChecklist).toContain(
      '.artifacts/launch-restore-report.json` exists, is fresh, and points to readable checkpoint evidence'
    );
    expectTextBefore(
      productionChecklist,
      'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json',
      'BASE_URL=<production-candidate-url> CRON_SECRET=<target-secret> npm run go:no-go'
    );
    expect(productionChecklist).toContain('Authenticated `/api/monitoring/perf-status`');
    expect(productionChecklist).toContain('BASE_URL=<production-candidate-url>');
    expect(productionChecklist).toContain('INTERNAL_API_SECRET=<target-secret>');
    expect(productionChecklist).toContain('proof submission review cards');
    expect(productionChecklist).toContain('proof-review participant consent');
    expect(productionChecklist).toContain(
      'LinkedIn account-side checks must not grant public trust, proof-review participant reveal readiness, or intro eligibility by themselves.'
    );
    expect(productionChecklist).not.toContain('`ZOOM_CLIENT_ID`');
    expect(productionChecklist).not.toContain('Schedule interview with Zoom');
    expect(productionChecklist).not.toContain('/app/admin/metrics');
    expect(productionChecklist).not.toContain('Expertise Profile');
    expect(productionChecklist).not.toContain('PATH=/opt/homebrew');
    expect(productionChecklist).not.toContain('candidate proof review cards');
    expect(productionChecklist).not.toContain('candidate consent');
    expect(productionChecklist).not.toContain('candidate reveal');

    expect(providerReference).toContain('Last Verified: `2026-05-21`');
    expect(providerReference).toContain('Doc Class: `reference-spec`');
    expect(providerReference).toContain(
      'Manual-link interview scheduling is the default launch path'
    );
    expect(providerReference).toContain('proof-review participant consent preserved before reveal');
    expect(providerReference).toContain('proof-review participant contact details');
    expect(providerReference).toContain('hidden proof-review participant identity');
    expect(providerReference).toContain('Zoom-native meeting creation is not required');
    expect(providerReference).toContain('Google Calendar or Google Meet setup may be used only');
    expect(providerReference).not.toContain('candidate consent preserved before reveal');
    expect(providerReference).not.toContain('candidate contact details');
    expect(providerReference).not.toContain('hidden candidate identity');
    expect(providerReference).not.toContain(
      'Complete guide for setting up Zoom and Google Meet OAuth integrations'
    );
    expect(providerReference).not.toContain('Click "Connect Zoom"');
    expect(providerReference).not.toContain('`ZOOM_CLIENT_ID`');
    expect(providerReference).not.toContain('Schedule interview with Zoom');

    expect(docsRegistry).toContain(
      '| `PRODUCTION_CHECKLIST.md`                                                                               | `active`         | `root`        | `repo+live`         | `2026-05-21`'
    );
    expect(docsRegistry).toContain(
      '| `OAUTH_SETUP_GUIDE.md`                                                                                  | `reference-spec` | `root`        | `repo`              | `2026-05-21`'
    );
  });

  it('keeps retained mobile planning docs outside launch evidence', () => {
    const iosParityMatrix = fs.readFileSync(
      path.join(repoRoot, 'docs/mobile/IOS_PARITY_MATRIX.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(iosParityMatrix).toContain('Last Verified: `2026-05-19`');
    expect(iosParityMatrix).toContain('post-MVP mobile planning context only');
    expect(iosParityMatrix).toContain('classifies `/api/mobile/*` as archived');
    expect(iosParityMatrix).toContain('post-MVP only: hybrid');
    expect(iosParityMatrix).toContain('O-09 Proof Submission Review');
    expect(iosParityMatrix).toContain('Organization/Matching/SubmissionDetail');
    expect(iosParityMatrix).not.toContain('Candidate Deep-Dive');
    expect(iosParityMatrix).not.toContain('Organization/Candidates/Detail');
    expect(docsRegistry).toContain(
      '| `docs/mobile/IOS_PARITY_MATRIX.md` | `reference-spec` | `docs` | `repo` | `2026-05-19`'
    );
  });

  it('keeps retained database flow guidance aligned with restore-report evidence', () => {
    const dbFlows = fs.readFileSync(path.join(repoRoot, 'test-db-flows.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(dbFlows).toContain('Last Verified: `2026-05-19`');
    expect(dbFlows).toContain('npm run db:audit:migrations');
    expect(dbFlows).toContain(
      'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json'
    );
    expect(dbFlows).toContain('.artifacts/launch-restore-report.json');
    expect(docsRegistry).toContain(
      '| `test-db-flows.md`                                                                                      | `reference-spec` | `root`        | `repo`              | `2026-05-19`'
    );
  });

  it('keeps implementation contracts and milestones aligned with the locked corridor', () => {
    const implementDocs = [
      fs.readFileSync(path.join(repoRoot, 'Implement.md'), 'utf8'),
      fs.readFileSync(path.join(repoRoot, 'project/Implement.md'), 'utf8'),
    ];
    const planDocs = [
      fs.readFileSync(path.join(repoRoot, 'Plans.md'), 'utf8'),
      fs.readFileSync(path.join(repoRoot, 'project/Plans.md'), 'utf8'),
    ];
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    for (const content of implementDocs) {
      expect(content).toContain('Last Verified: `2026-05-19`');
      expect(content).toContain('For UI/public/visual changes, use Browser or Playwright evidence');
      expect(content).toContain('route, viewport, role/mode, and finding');
      expect(content).toContain('the command creates a real file');
      expect(content).toContain('manual-link interview scheduling as the locked MVP default');
      expect(content).toContain('Do not revive archived/post-MVP routes');
      expect(content).toContain('profile theater');
      expect(content).toContain('vanity metrics');
      expect(content).not.toContain('Last Verified: `2026-05-14`');
    }

    for (const content of planDocs) {
      expect(content).toContain('Last Verified: `2026-05-21`');
      expect(content).toContain('mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md');
      expect(content).toContain('reason-coded, privacy-safe explanations');
      expect(content).toContain('without automated workflow recommendations');
      expect(content).toContain('proof-review-participant-consented reveal');
      expect(content).toContain(
        'Manual-link interview coordination works as the locked MVP default'
      );
      expect(content).not.toContain('without automated hiring recommendations');
      expect(content).not.toContain('candidate-consented reveal');
      expect(content).toContain('src/app/api/cron/decision-reminders/route.ts');
      expect(content).toContain('src/app/api/cron/refresh-matches/route.ts');
      expect(content).toContain('src/app/api/cron/refresh-matches-worker/route.ts');
      expect(content).toContain('src/app/api/cron/sla-enforcement/route.ts');
      expect(content).toContain('backup checkpoint and isolated restore rehearsal evidence');
      expect(content).toContain('Browser or Playwright evidence');
      expect(content).not.toContain('Matching endpoints return ranked results');
      expect(content).not.toContain('Interest/shortlist/pipeline flows');
      expect(content).not.toContain('account-deletion-workflow');
      expect(content).not.toContain('third-party providers are not configured');
      expect(content).not.toContain('Last Verified: `2026-05-14`');
    }

    expect(docsRegistry).toContain(
      '| `Implement.md`                                                                                          | `active`         | `root`        | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `Plans.md`                                                                                              | `active`         | `root`        | `repo+live`         | `2026-05-21`'
    );
    expect(docsRegistry).toContain(
      '| `project/Implement.md`                                                                                  | `active`         | `project`     | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `project/Plans.md`                                                                                      | `active`         | `project`     | `repo+live`         | `2026-05-21`'
    );
  });

  it('keeps broad reference specs visibly outside current MVP launch authority', () => {
    const referenceDocs = ['FULL_PRODUCT_ARCHITECTURE_PLAN.md', 'SPRINT_1_PLAN.md'];
    const dataRequirements = fs.readFileSync(
      path.join(repoRoot, 'DATA_REQUIREMENTS_AND_AI_STRATEGY.md'),
      'utf8'
    );
    const architectureSupplement = fs.readFileSync(
      path.join(repoRoot, 'SYSTEM_ARCHITECTURE_SUPPLEMENT.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(dataRequirements).toContain('Doc Class: `reference-spec`');
    expect(dataRequirements).toContain('Last Verified: `2026-05-21`');
    expect(dataRequirements).toContain('not the canonical MVP launch contract');
    expect(dataRequirements).toContain('Proof Submissions');
    expect(dataRequirements).toContain('5K+ proof submissions');
    expect(dataRequirements).toContain('Workflow Decisions');
    expect(dataRequirements).toContain('Verified engagement outcomes');
    expect(dataRequirements).toContain('proof-submission rate');
    expect(dataRequirements).toContain('Proof-Submission Rate');
    expect(dataRequirements).toContain('Workflow Outcome Rate');
    expect(dataRequirements).toContain('proof_submitted');
    expect(dataRequirements).toContain('workflow_decision_recorded');
    expect(dataRequirements).toContain('engagement_verified');
    expect(dataRequirements).toContain(
      'views, proof submissions, workflow decisions, engagement outcomes'
    );
    expect(dataRequirements).toContain('Proof submissions: user_id, assignment_id, timestamp');
    expect(dataRequirements).toContain('proof-submission events');
    expect(dataRequirements).toContain('Post-First Proof Submission');
    expect(dataRequirements).toContain(
      'Track CTR, proof-submission rate, workflow outcome rate daily'
    );
    expect(dataRequirements).not.toContain('**Applications**');
    expect(dataRequirements).not.toContain('5K+ applications');
    expect(dataRequirements).not.toContain('Match Views → Applications');
    expect(dataRequirements).not.toContain('Applications → Hires');
    expect(dataRequirements).not.toContain('application rate');
    expect(dataRequirements).not.toContain('submitted application');
    expect(dataRequirements).not.toContain('applications, hires');
    expect(dataRequirements).not.toContain('got the role');
    expect(dataRequirements).not.toContain('**Hires**');
    expect(dataRequirements).not.toContain('hired');
    expect(dataRequirements).not.toContain('apply events');
    expect(dataRequirements).not.toContain('each hire generates');
    expect(dataRequirements).not.toContain('**Application Rate**');
    expect(dataRequirements).not.toContain('**Hire Rate**');
    expect(dataRequirements).not.toContain('Post-First Apply');
    expect(dataRequirements).not.toContain('User clicked "Apply", submitted form');
    expect(dataRequirements).not.toContain('Applied → Positive');
    expect(dataRequirements).not.toContain('Track CTR, apply rate, hire rate daily');
    expect(architectureSupplement).toContain('not the canonical MVP launch contract');
    expect(architectureSupplement).toContain(
      'Pipeline complete → notify assignment-review owner for final review'
    );
    expect(architectureSupplement).not.toContain(
      'Pipeline complete → notify hiring manager for final review'
    );
    expect(docsRegistry).toContain(
      '| `DATA_REQUIREMENTS_AND_AI_STRATEGY.md`                                                                  | `reference-spec` | `root`        | `repo`              | `2026-05-21`'
    );

    for (const docPath of referenceDocs) {
      const content = fs.readFileSync(path.join(repoRoot, docPath), 'utf8');
      expect(content).toContain('Doc Class: `reference-spec`');
      expect(content).toContain('Last Verified: `2026-05-19`');
      expect(content).toContain('not the canonical MVP launch contract');
      expect(content).toContain(
        'Current precedence: `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`'
      );
      const registryLine = docsRegistry
        .split('\n')
        .find((line) => line.includes(`| \`${docPath}\``));
      expect(registryLine).toContain('| `reference-spec` | `root`');
      expect(registryLine).toContain('| `2026-05-19`');
    }
  });

  it('keeps the historical E2E PRD validation reference aligned with engage/close wording', () => {
    const prdCriteriaValidation = fs.readFileSync(
      path.join(repoRoot, 'e2e/PRD_CRITERIA_VALIDATION.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(prdCriteriaValidation).toContain('This reference is historical');
    expect(prdCriteriaValidation).toContain('engage/close outcomes');
    expect(prdCriteriaValidation).not.toContain('hire/engage');
    expect(docsRegistry).toContain(
      '| `e2e/PRD_CRITERIA_VALIDATION.md`                                                                        | `reference-spec` | `e2e`         | `repo`              | `2026-05-21`'
    );
  });

  it('keeps active assistive AI prompts aligned to proof-review participant language', () => {
    const activeAiSources = [
      'src/lib/ai/assignment-clarity.ts',
      'src/lib/ai/verification-composer.ts',
      'src/lib/ai/start-from-cv.ts',
    ];
    const combined = activeAiSources
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');

    expect(combined).toContain('proof-review participant evaluation rubrics');
    expect(combined).toContain(
      'Do not refer to private proof-review participants or proof-review participant data.'
    );
    expect(combined).toContain('proof-review participant evaluation');
    expect(combined).toContain('interview, engagement, or workflow decisions');
    expect(combined).toContain('proof-review participant quality judgment');
    expect(combined).toContain('infer proof-review participant quality');
    expect(combined).not.toContain('candidate evaluation');
    expect(combined).not.toContain('private candidates or candidate data');
    expect(combined).not.toContain('candidate quality judgment');
    expect(combined).not.toContain('infer candidate quality');
    expect(combined).not.toContain('hiring decisions');
    expect(combined).not.toContain('hiring recommendations');
  });

  it('keeps AI reference guardrails aligned to proof-review participant language', () => {
    const aiReferenceDocs = [
      'docs/ai/Proofound_AI_Assistive_Layer_Source_Of_Truth_Addendum_2026-05-03.md',
      'docs/ai/Proofound_AI_Assistive_Layer_Technical_Requirements_2026-05-03.md',
      'docs/ai/Proofound_AI_Assistive_Layer_Launch_Runbook_Addendum_2026-05-03.md',
      'docs/ai/Proofound_AI_Assistive_Layer_Codex_Prompts_2026-05-03.md',
      'docs/ai/Proofound_Temporary_GCP_CV_OCR_Sandbox_Reference_2026-05-03.md',
      'docs/ai/Proofound_Temporary_GCP_CV_OCR_Sandbox_Setup_Runbook_2026-05-03.md',
      'docs/ai/Proofound_GCP_CV_OCR_Production_Integration_Proposal_2026-05-03.md',
      'docs/ai/Proofound_AI_Document_Patch_Map_2026-05-03.md',
    ];
    const combined = aiReferenceDocs
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(combined).toContain('proof-first assignment review corridor');
    expect(combined).toContain('proof-review participant consented');
    expect(combined).toContain('private proof-review participant data');
    expect(combined).toContain('proof-review participant quality');
    expect(combined).toContain('workflow recommendations');
    expect(combined).toContain('interview, engagement, or workflow decisions');
    for (const docPath of aiReferenceDocs) {
      expect(combined).toContain('Last Verified: `2026-05-21`');
      const registryLine = docsRegistry.split('\n').find((line) => line.includes(docPath));
      expect(registryLine).toContain('| `2026-05-21`');
    }
    expect(combined).not.toContain('private candidate data');
    expect(combined).not.toContain('overall candidate quality');
    expect(combined).not.toContain('automatic candidate evaluation');
    expect(combined).not.toContain('overall candidate judgment');
    expect(combined).not.toContain('hidden candidate evaluation store');
    expect(combined).not.toContain('hiring credibility corridor');
    expect(combined).not.toContain('hiring-decision state');
    expect(combined).not.toContain('match/review/trust/hiring state');
    expect(combined).not.toContain('make hiring decisions');
    expect(combined).not.toContain('hiring recommendations');
    expect(combined).not.toContain('auto-create hiring decisions');
  });

  it('keeps the GCP OCR service reference non-decisional and workflow-scoped', () => {
    const serviceReadme = fs.readFileSync(
      path.join(repoRoot, 'services/gcp-cv-ocr/README.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(serviceReadme).toContain('Doc Class: `reference-spec`');
    expect(serviceReadme).toContain('Last Verified: `2026-05-21`');
    expect(serviceReadme).toContain('not a proof-review participant evaluation system');
    expect(serviceReadme).toContain(
      'affect match, review, verification, reveal, trust-state, or workflow-decision state'
    );
    expect(serviceReadme).not.toContain('not a candidate evaluation system');
    expect(serviceReadme).not.toContain('match/review/trust/hiring state');
    expect(docsRegistry).toContain(
      '| `services/gcp-cv-ocr/README.md` | `reference-spec` | `services` | `repo` | `2026-05-21`'
    );
  });

  it('keeps broad reference snapshots from making current launch claims', () => {
    const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
    const userFlows = fs.readFileSync(
      path.join(repoRoot, 'USER_FLOWS_TECHNICAL_SPECIFICATIONS.md'),
      'utf8'
    );
    const systemArchitecture = fs.readFileSync(
      path.join(repoRoot, 'SYSTEM_ARCHITECTURE_COMPREHENSIVE.md'),
      'utf8'
    );
    const privacyAudit = fs.readFileSync(
      path.join(repoRoot, 'CROSS_DOCUMENT_PRIVACY_AUDIT.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(readme).toContain('Launch-candidate scaffold');
    expect(readme).toContain('Final launch readiness still depends on the target-specific gates');
    expect(readme).toContain('Active launch env requirements');
    expect(readme).toContain('Archived compatibility/helper env, not default launch requirements');
    expect(readme).toContain(
      'Archived Python document-intelligence helper variables are documented in `docs/ENV_VARIABLES.md`; they are not default MVP launch requirements.'
    );
    expect(readme).not.toContain('Production-ready scaffold');

    expect(userFlows).toContain('historical reference');
    expect(userFlows).toContain('Doc Class: `reference-spec`');
    expect(userFlows).toContain('Last Verified: `2026-05-21`');
    expect(userFlows).toContain('not production-ready MVP launch evidence');
    expect(userFlows).toContain('only the locked MVP corridor');
    expect(userFlows).toContain('I-11 view→proof-submission interest ≥ 30%');
    expect(userFlows).toContain('≥70% complete before first proof submission');
    expect(userFlows).toContain('View→proof-submission interest conversion ≥30%');
    expect(userFlows).toContain('Complete before proof submission');
    expect(userFlows).toContain('View → proof-submission interest');
    expect(userFlows).toContain('[I-14 Submit Proof Interest](#i-14-submit-proof-interest)');
    expect(userFlows).toContain('[O-09 Proof-Submission Review](#o-09-proof-submission-review)');
    expect(userFlows).toContain('Primary: "Submit proof interest for this assignment"');
    expect(userFlows).toContain('## I-14 SUBMIT PROOF INTEREST');
    expect(userFlows).toContain('"Before you submit proof interest, ensure:"');
    expect(userFlows).toContain('**I-14-B: Proof-Submission Interest Form**');
    expect(userFlows).toContain('✅ Proof-submission interest submitted!');
    expect(userFlows).toContain('POST /api/assignments/:id/proof-interest');
    expect(userFlows).toContain('proof_submission_id: string');
    expect(userFlows).toContain('Predicted proof-submission coverage ≥20 submissions');
    expect(userFlows).toContain('Proof-submission quality signal ≥70');
    expect(userFlows).toContain('Sample proof-submission preview');
    expect(userFlows).toContain('Impressions-to-proof-submission interest ≥5%');
    expect(userFlows).toContain('GET /api/proof-submissions/:id');
    expect(userFlows).toContain('PATCH /api/proof-submissions/:id/stage');
    expect(userFlows).toContain('Reviewer (manage proof submissions)');
    expect(userFlows).toContain('Time-to-workflow-outcome trend');
    expect(userFlows).toContain('Quality-of-engagement proxies');
    expect(userFlows).toContain('Optional feedback sharing with proof-review participant');
    expect(userFlows).not.toContain('production-ready technical specifications');
    expect(userFlows).not.toContain(
      'All 40 flows (20 Individual + 20 Organization) fully specified.'
    );
    expect(userFlows).not.toContain('I-11 view→apply ≥ 30%');
    expect(userFlows).not.toContain('first apply');
    expect(userFlows).not.toContain('View→apply');
    expect(userFlows).not.toContain('Complete before apply');
    expect(userFlows).not.toContain('View → apply');
    expect(userFlows).not.toContain('[I-14 Apply / Express Interest]');
    expect(userFlows).not.toContain('[O-09 Candidate Deep-Dive]');
    expect(userFlows).not.toContain('Primary: "Apply to this role"');
    expect(userFlows).not.toContain('## I-14 APPLY / EXPRESS INTEREST');
    expect(userFlows).not.toContain('"Before you apply, ensure:"');
    expect(userFlows).not.toContain('**I-14-B: Application Form**');
    expect(userFlows).not.toContain('✅ Application submitted!');
    expect(userFlows).not.toContain('POST /api/assignments/:id/apply');
    expect(userFlows).not.toContain('application_id: string');
    expect(userFlows).not.toContain('Predicted match coverage ≥20 candidates');
    expect(userFlows).not.toContain('Candidate quality score ≥70');
    expect(userFlows).not.toContain('Sample candidate preview');
    expect(userFlows).not.toContain('Impressions-to-apply');
    expect(userFlows).not.toContain('GET /api/candidates/:id');
    expect(userFlows).not.toContain('PATCH /api/applications/:id/stage');
    expect(userFlows).not.toContain('Recruiter (manage candidates)');
    expect(userFlows).not.toContain('Time-to-fill trend');
    expect(userFlows).not.toContain('Quality-of-hire proxies');
    expect(userFlows).not.toContain('Optional feedback sharing with candidate');

    expect(systemArchitecture).toContain('Historical MVP Scope Snapshot');
    expect(systemArchitecture).toContain('not current launch evidence');
    expect(systemArchitecture).toContain('Archived UI; retained taxonomy only');
    expect(systemArchitecture).toContain('npm run db:migrate');
    expect(systemArchitecture).not.toContain('npx drizzle-kit push:pg');
    expect(systemArchitecture).not.toContain('Supabase Dashboard → SQL Editor');

    expect(privacyAudit).toContain('Historical finding');
    expect(privacyAudit).toContain('not current production-candidate privacy evidence');
    expect(privacyAudit).toContain('Current launch evidence must come from fresh privacy tests');
    expect(privacyAudit).not.toContain('critical RLS policies have been successfully deployed');
    expect(privacyAudit).not.toContain('GDPR compliance checklist 100% complete');
    expect(privacyAudit).not.toContain('Overall CCPA Compliance');
    expect(privacyAudit).not.toContain('Run this SQL in Supabase SQL Editor');

    for (const docPath of [
      'CROSS_DOCUMENT_PRIVACY_AUDIT.md',
      'SYSTEM_ARCHITECTURE_COMPREHENSIVE.md',
    ]) {
      const registryLine = docsRegistry
        .split('\n')
        .find((line) => line.includes(`| \`${docPath}\``));
      expect(registryLine).toContain('| `2026-05-19`');
    }
    expect(docsRegistry).toContain(
      '| `USER_FLOWS_TECHNICAL_SPECIFICATIONS.md`                                                                | `reference-spec` | `root`        | `repo`              | `2026-05-21`'
    );
  });

  it('keeps active operator docs aligned with current deployment and provider gates', () => {
    const deploymentGuide = fs.readFileSync(
      path.join(repoRoot, 'docs/deployment-guide.md'),
      'utf8'
    );
    const setupRunbook = fs.readFileSync(path.join(repoRoot, 'agent/runbooks/setup.md'), 'utf8');
    const verificationChecklist = fs.readFileSync(
      path.join(repoRoot, 'agent/checklists/verification.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');
    const activeOperatorDocs = [deploymentGuide, setupRunbook, verificationChecklist].join('\n');

    expect(deploymentGuide).toContain('Last Verified: `2026-05-19`');
    expect(deploymentGuide).toContain('docs/production-readiness-checklist.md');
    expect(deploymentGuide).toContain('docs/backlog/phase-exit-checklist.md');
    expect(deploymentGuide).toContain('/api/cron/decision-reminders');
    expect(deploymentGuide).toContain('/api/cron/refresh-matches-worker');
    expect(deploymentGuide).toContain('Authenticated `/api/monitoring/launch-status`');
    expect(deploymentGuide).toContain('Authenticated `/api/monitoring/perf-status`');
    expect(deploymentGuide).toContain('INP < 200ms');
    expect(deploymentGuide).toContain('docs/RESEND_SETUP.md');
    expect(deploymentGuide).toContain('RESEND_API_KEY=<stored-in-target-secret-manager>');
    expect(deploymentGuide).toContain('EMAIL_FROM="Proofound <no-reply@proofound.io>"');
    expect(deploymentGuide).toContain('EMAIL_REPLY_TO="Proofound <hello@proofound.io>"');
    expect(setupRunbook).toContain('Last Verified: `2026-05-19`');
    expect(verificationChecklist).toContain('Last Verified: `2026-05-21`');
    expect(verificationChecklist).toContain(
      'change match, review, verification, reveal, trust-state, or workflow-decision state'
    );
    expect(verificationChecklist).not.toContain('change match/review/trust/hiring state');
    expect(activeOperatorDocs).toContain(
      'manual-link interview posture remains the locked MVP default'
    );
    expect(activeOperatorDocs).toContain('STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=false');
    expect(activeOperatorDocs).not.toContain('STRICT_PROVIDER_E2E_REQUIRE_BOTH');
    expect(activeOperatorDocs).not.toContain('both Zoom and Google connected');
    expect(activeOperatorDocs).not.toContain('/api/cron/cleanup-expired-sessions');
    expect(activeOperatorDocs).not.toContain('/api/cron/send-digest-emails');
    expect(activeOperatorDocs).not.toContain('platform=zoom');
    expect(deploymentGuide).not.toContain('RESEND_API_KEY=re_xxx');
    expect(deploymentGuide).not.toContain('EMAIL_FROM=noreply@yourdomain.com');
    expect(deploymentGuide).not.toContain('new Resend(process.env.RESEND_API_KEY)');
    expect(deploymentGuide).not.toContain('/api/test/email');
    expect(deploymentGuide).not.toContain('Email team');
    expect(deploymentGuide).not.toContain('https://yourdomain.com');
    expect(docsRegistry).toContain(
      '| `docs/deployment-guide.md`                                                                              | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `agent/runbooks/setup.md`                                                                               | `active`         | `agent`       | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `agent/checklists/verification.md`                                                                      | `active`         | `agent`       | `repo+live`         | `2026-05-21`'
    );
  });

  it('keeps public health docs aligned with the minimal liveness contract', () => {
    const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
    const deploymentGuide = fs.readFileSync(
      path.join(repoRoot, 'docs/deployment-guide.md'),
      'utf8'
    );
    const verificationChecklist = fs.readFileSync(
      path.join(repoRoot, 'agent/checklists/verification.md'),
      'utf8'
    );
    const publicHealthRoute = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/health/route.ts'),
      'utf8'
    );
    const publicHealthTest = fs.readFileSync(
      path.join(repoRoot, 'tests/api/public-health-route.test.ts'),
      'utf8'
    );
    const docs = [readme, deploymentGuide, verificationChecklist].join('\n');

    expect(publicHealthRoute).toContain('status');
    expect(publicHealthRoute).toContain('timestamp');
    expect(publicHealthTest).toContain(
      "expect(Object.keys(body).sort()).toEqual(['status', 'timestamp'])"
    );
    expect(docs).toContain('minimal public contract');
    expect(docs).toContain('Vercel deployment metadata');
    expect(docs).toContain('prebuilt workflow summary');
    expect(docs).not.toContain('api/health` returns the deployed commit SHA');
    expect(docs).not.toContain('api/health` reports the deployed commit SHA');
    expect(docs).not.toContain('api/health` exposes the deployed commit SHA');
  });

  it('keeps SLA enforcement cron expiry explicit and lifecycle-aware', () => {
    const slaCronRoute = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/cron/sla-enforcement/route.ts'),
      'utf8'
    );
    const slaCronTest = fs.readFileSync(
      path.join(repoRoot, 'tests/api/cron-sla-enforcement-route.test.ts'),
      'utf8'
    );
    const slaCronCopy = `${slaCronRoute}\n${slaCronTest}`;

    expect(slaCronCopy).toContain('EXPIRED_MATCH_REVIEW_SNOOZE_DAYS = 365');
    expect(slaCronCopy).toContain("lifecycleState: 'stale'");
    expect(slaCronCopy).toContain('staleAt: expiredAt');
    expect(slaCronCopy).toContain(
      'marks expired proof-submission matches stale while preserving the long snooze suppression'
    );
    expect(slaCronCopy).not.toContain('For now, we');
    expect(slaCronCopy).not.toContain('or add status field in future');
  });

  it('keeps synced preflight guidance aligned with current launch gates', () => {
    const rootPreflight = fs.readFileSync(path.join(repoRoot, 'preflight.md'), 'utf8');
    const agentPreflight = fs.readFileSync(
      path.join(repoRoot, 'agent/checklists/preflight.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    for (const content of [rootPreflight, agentPreflight]) {
      expect(content).toContain('Last Verified: `2026-05-19`');
      expect(content).toContain('npm run vercel:pull:production');
      expect(content).toContain('npm run vercel:build:production');
      expect(content).toContain('.vercel/output/config.json');
      expect(content).toContain('.vercel/output/builds.json');
      expect(content).toContain('VERCEL_TOKEN');
      expect(content).toContain('VERCEL_ORG_ID');
      expect(content).toContain('VERCEL_PROJECT_ID');
      expect(content).toContain('docs/DOCS_REGISTRY.md');
      expect(content).toContain('.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md');
      expect(content).toContain('DESIGN.md');
      expect(content).toContain('Use Browser');
      expect(content).toContain('privacy/no-leak');
      expect(content).toContain('isolated restore verification');
      expect(content).toContain('Never use `npm run db:push` against production');
      expect(content).not.toContain('VERCEL_DEPLOY_HOOK_URL');
      expect(content).not.toContain('vercel build --prod');
    }

    expect(docsRegistry).toContain(
      '| `agent/checklists/preflight.md`                                                                         | `active`         | `agent`       | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `preflight.md`                                                                                          | `active`         | `root`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps GitHub launch workflows from requiring connected providers by default', () => {
    const workflowPaths = [
      '.github/workflows/ci.yml',
      '.github/workflows/strict-quality.yml',
      '.github/workflows/retry-vercel-deploy.yml',
      '.github/workflows/playwright.yml',
    ];
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');
    const deployTrigger = fs.readFileSync(path.join(repoRoot, '.vercel-deploy-trigger.md'), 'utf8');

    for (const workflowPath of workflowPaths) {
      const workflow = fs.readFileSync(path.join(repoRoot, workflowPath), 'utf8');
      expect(workflow).toContain("STRICT_PROVIDER_E2E_REQUIRE_CONNECTED: 'false'");
      expect(workflow).not.toContain('STRICT_PROVIDER_E2E_REQUIRE_BOTH');
      expect(workflow).not.toContain("STRICT_PROVIDER_E2E_REQUIRE_CONNECTED: 'true'");
    }

    expect(deployTrigger).toContain('Doc Class: `historical`');
    expect(deployTrigger).toContain('Last Verified: `2026-05-19`');
    expect(deployTrigger).toContain('.github/workflows/retry-vercel-deploy.yml');
    expect(deployTrigger).toContain('VERCEL_TOKEN');
    expect(deployTrigger).toContain('VERCEL_ORG_ID');
    expect(deployTrigger).toContain('VERCEL_PROJECT_ID');
    expect(docsRegistry).toContain(
      '| `.vercel-deploy-trigger.md`                                                                             | `historical`     | `root`        | `archive`           | `2026-05-19`'
    );
  });

  it('keeps the legacy Linear bulk import out of active launch operations', () => {
    const linearSetup = fs.readFileSync(
      path.join(repoRoot, 'LINEAR_SETUP_INSTRUCTIONS.md'),
      'utf8'
    );
    const importScript = fs.readFileSync(
      path.join(repoRoot, 'scripts/import-linear-issues.mjs'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(linearSetup).toContain('Doc Class: `historical`');
    expect(linearSetup).toContain('Last Verified: `2026-05-19`');
    expect(compactWhitespace(linearSetup)).toContain(
      'Do not use it as current Proofound MVP launch planning guidance'
    );
    expect(linearSetup).toContain('agent/runbooks/proofound-ticket-finisher.md');
    expect(linearSetup).toContain('PROOFOUND_ALLOW_LEGACY_LINEAR_IMPORT=true');
    expect(linearSetup).not.toContain('Ready to import?');
    expect(linearSetup).not.toContain('Start Sprint 1');
    expect(linearSetup).not.toContain('npm install node-fetch dotenv');
    expect(importScript).toContain('PROOFOUND_ALLOW_LEGACY_LINEAR_IMPORT');
    expect(importScript).toContain('Refusing to run historical Linear bulk import');
    expect(docsRegistry).toContain(
      '| `LINEAR_SETUP_INSTRUCTIONS.md`                                                                          | `historical`     | `root`        | `archive`           | `2026-05-19`'
    );
  });

  it('keeps ticket closeout and sharded log guidance current and no-leak', () => {
    const ticketFinisher = fs.readFileSync(
      path.join(repoRoot, 'agent/runbooks/proofound-ticket-finisher.md'),
      'utf8'
    );
    const sessionReadme = fs.readFileSync(
      path.join(repoRoot, 'agent/scratchpad/README.md'),
      'utf8'
    );
    const legacyScratchpad = fs.readFileSync(path.join(repoRoot, 'agent/scratchpad.md'), 'utf8');
    const changeReadme = fs.readFileSync(path.join(repoRoot, 'project/changes/README.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');
    const shardedReadmes = `${sessionReadme}\n${changeReadme}`;

    expect(ticketFinisher).toContain('Last Verified: `2026-05-19`');
    expect(ticketFinisher).toContain('node scripts/proofound-ticket-finisher.mjs --json');
    expect(ticketFinisher).toContain('administrative aid only');
    expect(ticketFinisher).toContain('does not prove MVP completion');
    expect(ticketFinisher).toContain('must not commit, push, merge');
    expect(ticketFinisher).toContain('Never use the helper to broaden the locked MVP corridor');
    expect(ticketFinisher).toContain('Browser/visual evidence must name the route, viewport');

    for (const content of [sessionReadme, changeReadme]) {
      expect(content).toContain('Doc Class: `active`');
      expect(content).toContain('Last Verified: `2026-05-19`');
      expect(content).toContain('creates a real file');
      expect(content).toContain('extra arguments such as `--help` are not a dry run');
      expect(content).toContain('Do not include secrets');
      expect(content).toContain('private proof content');
      expect(content).toContain('route, viewport, role/mode, and finding');
    }

    expect(shardedReadmes).toContain('Routine work should not append to `agent/scratchpad.md`');
    expect(shardedReadmes).toContain('Routine per-task changes should not be appended there');
    expect(legacyScratchpad).toContain('Doc Class: `historical`');
    expect(legacyScratchpad).toContain('Last Verified: `2026-05-19`');
    expect(legacyScratchpad).toContain('Frozen for routine per-task updates');
    expect(legacyScratchpad).toContain('Do not use this legacy file as current launch evidence');
    expect(legacyScratchpad).toContain('log script creates a real file');
    expect(legacyScratchpad).toContain('Do not include private proof content');
    expect(docsRegistry).toContain(
      '| `agent/runbooks/proofound-ticket-finisher.md`                                                           | `active`         | `agent`       | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `agent/scratchpad/README.md`                                                                            | `active`         | `agent`       | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `project/changes/README.md`                                                                             | `active`         | `project`     | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `agent/scratchpad.md`                                                                                   | `historical`     | `agent`       | `archive`           | `2026-05-19`'
    );
  });

  it('keeps Resend setup guidance transactional, target-scoped, and privacy-safe', () => {
    const resendSetup = fs.readFileSync(path.join(repoRoot, 'docs/RESEND_SETUP.md'), 'utf8');
    const legacyEmailSource = fs.readFileSync(path.join(repoRoot, 'src/lib/email.ts'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(resendSetup).toContain('Last Verified: `2026-05-19`');
    expect(resendSetup).toContain('transactional email');
    expect(resendSetup).toContain('RESEND_API_KEY');
    expect(resendSetup).toContain('EMAIL_FROM');
    expect(resendSetup).toContain('EMAIL_REPLY_TO');
    expect(resendSetup).toContain('PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY');
    expect(resendSetup).toContain('docs:freshness');
    expect(resendSetup).toContain('tests/lib/workflow-email-privacy.test.ts');
    expect(resendSetup).toContain('/api/cron/decision-reminders');
    expect(resendSetup).toContain('private proof content');
    expect(resendSetup).toContain('hidden identity details before reveal consent');
    expect(resendSetup).toContain('Proof-submission/assignment invitation where active');
    expect(resendSetup).toContain('Do not run live email sends');
    expect(resendSetup).toContain('/api/cron/send-deletion-reminders');
    expect(resendSetup).toContain('/api/cron/process-deletions');
    expect(compactWhitespace(resendSetup)).toContain(
      'Archived standalone deletion cron routes are not active launch infrastructure'
    );
    expect(resendSetup).not.toContain('STATUS: RESEND CONFIGURED');
    expect(resendSetup).not.toContain('Since your RESEND_API_KEY is already configured');
    expect(resendSetup).not.toContain('node scripts/test-email.mjs');
    expect(resendSetup).not.toContain('Candidate/assignment invitation where active');
    expect(resendSetup).not.toContain('Skill & Matching System');
    expect(resendSetup).not.toContain('| `GET /api/cron/send-deletion-reminders`');
    expect(resendSetup).not.toContain('| `GET /api/cron/process-deletions`');
    expect(resendSetup).not.toContain('Use email digests instead of individual alerts');
    expect(legacyEmailSource).toContain('EMAIL_CONFIG.apiKey ? new Resend(EMAIL_CONFIG.apiKey)');
    expect(legacyEmailSource).not.toContain('placeholder_key');
    expect(legacyEmailSource).not.toContain('process.env.RESEND_API_KEY ||');
    expect(docsRegistry).toContain(
      '| `docs/RESEND_SETUP.md`                                                                                  | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps vendor processing guidance evidence-scoped and privacy-safe', () => {
    const vendorRegister = fs.readFileSync(
      path.join(repoRoot, 'docs/DATA_PROCESSING_AGREEMENTS.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(vendorRegister).toContain('Last Verified: `2026-05-19`');
    expect(vendorRegister).toContain('not legal advice');
    expect(vendorRegister).toContain('not a signed DPA repository');
    expect(vendorRegister).toContain('Do not infer a signed agreement from this file');
    expect(vendorRegister).toContain('manual-link interviews remain default');
    expect(vendorRegister).toContain('Veriff');
    expect(vendorRegister).toContain('Archived/post-MVP identity-document path');
    expect(vendorRegister).toContain('private proof content');
    expect(vendorRegister).toContain('hidden identity details');
    expect(vendorRegister).toContain('proof-review-participant-consented reveal');
    expect(vendorRegister).toContain('npm run test:privacy');
    expect(vendorRegister).toContain(
      'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json'
    );
    expect(vendorRegister).not.toContain('All vendors are carefully vetted');
    expect(vendorRegister).not.toContain('DPA Signed');
    expect(vendorRegister).not.toContain('SOC 2 Type II certified');
    expect(vendorRegister).not.toContain('GDPR-compliant');
    expect(vendorRegister).not.toContain('CCPA compliance');
    expect(vendorRegister).not.toContain('candidate-consented reveal');
    expect(docsRegistry).toContain(
      '| `docs/DATA_PROCESSING_AGREEMENTS.md`                                                                    | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps privacy test guidance from overstating launch evidence', () => {
    const privacyReadme = fs.readFileSync(path.join(repoRoot, 'tests/privacy/README.md'), 'utf8');
    const rlsPoliciesTest = fs.readFileSync(
      path.join(repoRoot, 'tests/privacy/rls-policies.test.ts'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(privacyReadme).toContain('Doc Class: `reference-spec`');
    expect(privacyReadme).toContain('Last Verified: `2026-05-19`');
    expect(privacyReadme).toContain('not standalone launch readiness proof');
    expect(privacyReadme).toContain('Node.js 24.15.0');
    expect(privacyReadme).toContain('npm ci');
    expect(privacyReadme).toContain('not a current launch-readiness certificate');
    expect(privacyReadme).toContain('rerun the scripts above against the intended target');
    expect(privacyReadme).not.toContain('Node.js 20.20.0');
    expect(privacyReadme).not.toContain('All dependencies installed (`npm install`)');
    expect(privacyReadme).not.toContain('| Profile Privacy      | 100%');
    expect(privacyReadme).not.toContain('supabase db push');
    expect(privacyReadme).not.toContain('Supabase SQL Editor');
    expect(privacyReadme).not.toContain('#engineering-support');
    expect(rlsPoliciesTest).toContain("visibility: 'private'");
    expect(rlsPoliciesTest).toContain('expectUnauthorized(data, error, "Alice should not see Bob');
    expect(rlsPoliciesTest).not.toContain('For now, we test');
    expect(rlsPoliciesTest).not.toContain('if (error || !data)');
    expect(docsRegistry).toContain(
      '| `tests/privacy/README.md`                                                                               | `reference-spec` | `tests`       | `repo`              | `2026-05-19`'
    );
  });

  it('keeps historical load-test notes non-gating and target-scoped', () => {
    const loadResults = fs.readFileSync(path.join(repoRoot, 'tests/load/RESULTS.md'), 'utf8');
    const artilleryMatching = fs.readFileSync(
      path.join(repoRoot, 'tests/load/artillery-matching.yml'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(loadResults).toContain('Doc Class: `reference-spec`');
    expect(loadResults).toContain('Last Verified: `2026-05-20`');
    expect(loadResults).toContain('historical/non-gating load-test notes');
    expect(loadResults).toContain('BASE_URL=<production-candidate-url> npm run perf:budgets');
    expect(loadResults).toContain('optional stress exploration only');
    expect(loadResults).toContain('record the tool version, target, date, owner');
    expect(loadResults).toContain('Not a current launch gate');
    expect(loadResults).toContain('If These Artillery Notes Are Revived');
    expect(loadResults).not.toContain('npm install -g artillery');
    expect(loadResults).not.toContain('## How to Run Load Tests');
    expect(loadResults).not.toContain('Track cache hit rates');
    expect(loadResults).not.toContain('TBD - Run tests to establish limits');
    expect(loadResults).not.toContain('### Before Launch');
    expect(loadResults).not.toContain('Expected Metrics (to be filled after running)');
    expect(artilleryMatching).toContain("url: '/api/match/profile'");
    expect(artilleryMatching).not.toContain('/api/core/matching/profile');
    expect(docsRegistry).toContain(
      '| `tests/load/RESULTS.md`                                                                                 | `reference-spec` | `tests`       | `repo`              | `2026-05-20`'
    );
  });

  it('keeps privacy environment setup on the repo-owned migration path', () => {
    const privacyEnvSetup = fs.readFileSync(
      path.join(repoRoot, 'tests/privacy/ENV_SETUP.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(privacyEnvSetup).toContain('Doc Class: `reference-spec`');
    expect(privacyEnvSetup).toContain('Last Verified: `2026-05-19`');
    expect(privacyEnvSetup).toContain('not production-candidate launch proof');
    expect(privacyEnvSetup).toContain('npm run db:drift-check');
    expect(privacyEnvSetup).toContain('npm run db:backup:checkpoint');
    expect(privacyEnvSetup).toContain('npm run db:audit:migrations');
    expect(privacyEnvSetup).toContain('npm run db:migrate');
    expect(privacyEnvSetup).toContain(
      'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json'
    );
    expect(privacyEnvSetup).toContain('npm run test:privacy:extended');
    expect(privacyEnvSetup).not.toContain('supabase db push');
    expect(privacyEnvSetup).not.toContain('SQL Editor');
    expect(privacyEnvSetup).not.toContain('src/db/policies.sql');
    expect(privacyEnvSetup).not.toContain('migrations/001_enable_rls_policies.sql');
    expect(privacyEnvSetup).not.toContain('test:privacy:setup-check');
    expect(privacyEnvSetup).not.toContain('test:privacy:cleanup');
    expect(docsRegistry).toContain(
      '| `tests/privacy/ENV_SETUP.md`                                                                            | `reference-spec` | `tests`       | `repo`              | `2026-05-19`'
    );
  });

  it('keeps the integration test plan aligned with active test files', () => {
    const packageJson = readJson<{ scripts: Record<string, string> }>('package.json');
    const integrationPlan = fs.readFileSync(
      path.join(repoRoot, 'INTEGRATION_TEST_PLAN.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(integrationPlan).toContain('Doc Class: `reference-spec`');
    expect(integrationPlan).toContain('Last Verified: `2026-05-20`');
    expect(integrationPlan).toContain('tests/integration/matching.test.ts');
    expect(integrationPlan).toContain('tests/integration/data-portability.test.ts');
    expect(integrationPlan).toContain(
      'Current active integration tests are deterministic contract tests'
    );
    expect(integrationPlan).toContain('npm run test:integration -- --reporter=verbose');
    expect(packageJson.scripts['test:integration']).toBe(
      'vitest run --config vitest.integration.config.ts'
    );
    expect(integrationPlan).not.toContain('tests/integration/evidence-pack.test.ts');
    expect(integrationPlan).toContain(
      'Historical `critical-gaps`, CV import wizard, and donor/investor evidence-pack tests'
    );
    expect(integrationPlan).toContain('Archived Evidence-Pack Boundary');
    expect(integrationPlan).toContain('tests/archive/non_mvp_evidence_pack/');
    expect(integrationPlan).toContain('No active integration test should imply');
    expect(integrationPlan).toContain('/api/mobile/*` remains archived');
    expect(integrationPlan).toContain('post-MVP reference only');
    expect(integrationPlan).not.toContain(
      '/api/mobile/v1/*` bootstrap and device token routes remain compatible'
    );
    expect(integrationPlan).not.toContain('tests/integration/critical-gaps.test.ts');
    expect(integrationPlan).not.toContain('tests/integration/cv-import.test.ts');
    for (const activeIntegrationPath of [
      'tests/integration/matching.test.ts',
      'tests/integration/data-portability.test.ts',
    ]) {
      const activeIntegrationSource = fs.readFileSync(
        path.join(repoRoot, activeIntegrationPath),
        'utf8'
      );

      expect(activeIntegrationSource).not.toContain('expect(true).toBe(true)');
      expect(activeIntegrationSource).not.toContain('Placeholder for actual test');
    }
    expect(fs.existsSync(path.join(repoRoot, 'tests/integration/setup.ts'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'tests/integration/evidence-pack.test.ts'))).toBe(
      false
    );
    expect(
      fs.existsSync(
        path.join(repoRoot, 'tests/archive/non_mvp_evidence_pack/evidence-pack.archived.test.ts')
      )
    ).toBe(true);
    expect(docsRegistry).toContain(
      '| `INTEGRATION_TEST_PLAN.md`                                                                              | `reference-spec` | `root`        | `repo`              | `2026-05-20`'
    );
    expect(docsRegistry).toContain('`src/archive/non_launch_evidence_pack/README.md`');
  });

  it('keeps LinkedIn verification guidance outside the launch corridor', () => {
    const linkedInSetup = fs.readFileSync(
      path.join(repoRoot, 'docs/LINKEDIN_VERIFICATION_SETUP.md'),
      'utf8'
    );
    const linkedInSummary = fs.readFileSync(
      path.join(repoRoot, 'docs/LINKEDIN_VERIFICATION_IMPLEMENTATION_SUMMARY.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(linkedInSetup).toContain('Doc Class: `reference-spec`');
    expect(linkedInSetup).toContain('Last Verified: `2026-05-21`');
    expect(linkedInSetup).toContain('outside the locked MVP launch corridor');
    expect(linkedInSetup).toContain('Work email is the only launch-active account-side check');
    expect(linkedInSetup).toContain('LinkedIn state is read-only history when present');
    expect(linkedInSetup).toContain('never creates proof trust');
    expect(linkedInSetup).toContain('read-only account-side history');
    expect(linkedInSetup).toContain('proof-review participant proof quality');
    expect(linkedInSetup).toContain('/api/admin/internal-ops/queues');
    expect(linkedInSetup).toContain('/api/admin/verification/linkedin/queue');
    expect(compactWhitespace(linkedInSetup)).toContain(
      'active launch code must not depend on them and they must not be added to MVP launch gates'
    );
    expect(linkedInSetup).not.toContain('Free automated checking');
    expect(linkedInSetup).not.toContain('Quick approvals');
    expect(linkedInSetup).not.toContain('Admin dashboard shows request sorted by confidence');
    expect(linkedInSetup).not.toContain('High Confidence (80-100%)');
    expect(linkedInSetup).not.toContain('compatibility signals');
    expect(linkedInSetup).not.toContain('Use ngrok for LinkedIn OAuth');
    expect(linkedInSetup).not.toContain('Track these metrics after deployment');
    expect(linkedInSetup).not.toContain('candidate proof quality');
    expect(linkedInSummary).toContain(
      'Current reference-only note: `docs/LINKEDIN_VERIFICATION_SETUP.md`'
    );
    expect(linkedInSummary).not.toContain('Canonical active reference');
    expect(docsRegistry).toContain(
      '| `docs/LINKEDIN_VERIFICATION_SETUP.md`                                                                   | `reference-spec` | `docs`        | `repo`              | `2026-05-21`'
    );
  });

  it('keeps support guidance aligned with self-service privacy and no-leak handling', () => {
    const emailSupport = fs.readFileSync(path.join(repoRoot, 'EMAIL_SUPPORT_SETUP.md'), 'utf8');
    const support = fs.readFileSync(path.join(repoRoot, 'SUPPORT.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(emailSupport).toContain('Last Verified: `2026-05-21`');
    expect(emailSupport).toContain('Use the app workflow whenever possible');
    expect(emailSupport).toContain('Do not process deletion from a bare email reply');
    expect(emailSupport).toContain('Do not mention an in-app chat or help center');
    expect(emailSupport).toContain('manual-link interviews by default');
    expect(emailSupport).toContain('private proof files');
    expect(emailSupport).toContain('Assignment Or Proof-Submission Review Help');
    expect(emailSupport).toContain('proof-submission review queue');
    expect(emailSupport).toContain('proof-review participant reveal consent');
    expect(emailSupport).toContain('participant private proof files');
    expect(emailSupport).toContain('hidden identity details');
    expect(emailSupport).toContain('admin/internal route exposed publicly');
    expect(emailSupport).not.toContain('CONFIRM DELETE');
    expect(emailSupport).not.toContain('Use our in-app chat');
    expect(emailSupport).not.toContain('https://proofound.io/help');
    expect(emailSupport).not.toContain('we will reset it manually');
    expect(emailSupport).not.toContain('skills, matches, messages');
    expect(emailSupport).not.toContain('Assignment Or Candidate Review Help');
    expect(emailSupport).not.toContain('assignment or review queue');
    expect(emailSupport).not.toContain('candidate private proof files');
    expect(support).toContain('Last Verified: `2026-05-19`');
    expect(support).toContain('locked MVP source of truth');
    expect(support).toContain('Add a manual meeting link');
    expect(support).not.toContain('Proofound_Project_Specification_2026-03-11.md` first');
    expect(docsRegistry).toContain(
      '| `EMAIL_SUPPORT_SETUP.md`                                                                                | `active`         | `root`        | `repo+live`         | `2026-05-21`'
    );
    expect(docsRegistry).toContain(
      '| `SUPPORT.md`                                                                                            | `active`         | `root`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps active public and outbound contact surfaces on the canonical proofound.io domain', () => {
    const activeSurfaceFiles = [
      'README.md',
      'emails/SkillVerificationRequest.tsx',
      'emails/DeletionComplete.tsx',
      'emails/DeletionReminder.tsx',
      'emails/DeletionScheduled.tsx',
      'src/lib/email/templates/assignment-invitation.tsx',
      'src/lib/email/templates/interview-scheduled.tsx',
      'src/components/settings/PrivacyOverview.tsx',
      'src/app/terms/page.tsx',
      'src/app/cookies/settings/page.tsx',
      'src/app/privacy/page.tsx',
      'src/app/api/verify/[token]/route.ts',
      'src/components/onboarding/OrganizationSetup.tsx',
      'src/lib/interviews/calendar.ts',
    ];

    for (const relativePath of activeSurfaceFiles) {
      const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

      expect(source, relativePath).not.toContain('proofound.com');
      expect(source, relativePath).not.toContain('https://proofound.io/help');
    }

    const skillVerificationEmail = fs.readFileSync(
      path.join(repoRoot, 'emails/SkillVerificationRequest.tsx'),
      'utf8'
    );
    const deletionEmail = fs.readFileSync(
      path.join(repoRoot, 'emails/DeletionComplete.tsx'),
      'utf8'
    );
    const orgSetup = fs.readFileSync(
      path.join(repoRoot, 'src/components/onboarding/OrganizationSetup.tsx'),
      'utf8'
    );
    const calendarInvite = fs.readFileSync(
      path.join(repoRoot, 'src/lib/interviews/calendar.ts'),
      'utf8'
    );

    expect(skillVerificationEmail).toContain('hello@proofound.io');
    expect(deletionEmail).toContain('https://proofound.io');
    expect(deletionEmail).toContain('privacy@proofound.io');
    expect(orgSetup).toContain('proofound.io/portfolio/org/');
    expect(calendarInvite).toContain('@proofound.io');
  });

  it('keeps deletion emails aligned with immediate irreversible account deletion', () => {
    const deletionScheduled = fs.readFileSync(
      path.join(repoRoot, 'emails/DeletionScheduled.tsx'),
      'utf8'
    );
    const deletionReminder = fs.readFileSync(
      path.join(repoRoot, 'emails/DeletionReminder.tsx'),
      'utf8'
    );
    const deletionComplete = fs.readFileSync(
      path.join(repoRoot, 'emails/DeletionComplete.tsx'),
      'utf8'
    );
    const emailService = fs.readFileSync(path.join(repoRoot, 'src/lib/email.ts'), 'utf8');
    const combined = `${deletionScheduled}\n${deletionReminder}\n${deletionComplete}\n${emailService}`;

    expect(combined).toContain('immediate, irreversible lifecycle request');
    expect(combined).toContain('We do not support a scheduled cancellation window');
    expect(combined).toContain('Proof Packs, proof items, and public portfolio projections');
    expect(combined).toContain('Matching, intro, reveal, interview, and decision records');
    expect(combined).toContain('Account Deletion Request Received - Proofound');
    expect(combined).toContain('Account Deletion Update - Proofound');
    expect(combined).not.toContain('30 days');
    expect(combined).not.toContain('cancel this request');
    expect(combined).not.toContain('Cancel Deletion');
    expect(combined).not.toContain('Cancel Deletion & Keep My Account');
    expect(combined).not.toContain('scheduled deletion state');
    expect(combined).not.toContain('automatically deleted on the scheduled date');
    expect(combined).not.toContain('Your matches and connections');
    expect(combined).not.toContain('Your messages and conversations');
  });

  it('keeps public portfolio share actions proof-scoped instead of recruiter-scoped', () => {
    const publicPortfolioCopy = [
      'src/app/portfolio/[handle]/CopyTextButton.tsx',
      'tests/ui/public-portfolio-page.test.tsx',
    ]
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');
    const copyButton = fs.readFileSync(
      path.join(repoRoot, 'src/app/portfolio/[handle]/CopyTextButton.tsx'),
      'utf8'
    );

    expect(publicPortfolioCopy).toContain('Copy proof summary');
    expect(copyButton).not.toContain('Copy recruiter summary');
  });

  it('keeps legacy PRD mirrors below the locked MVP authority stack', () => {
    const compatibilityPrd = fs.readFileSync(
      path.join(repoRoot, 'PRD_for_a_web_platform_MVP.md'),
      'utf8'
    );
    const executivePrd = fs.readFileSync(path.join(repoRoot, 'Proofound_PRD_MVP.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    for (const content of [compatibilityPrd, executivePrd]) {
      expect(content).toContain('Last Verified: `2026-05-21`');
      expect(content).toContain('Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md');
      expect(content).toContain(
        'PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md'
      );
      expect(content).toContain('PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md');
      expect(content).toContain('LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md');
    }
    expect(compatibilityPrd).not.toContain(
      'conflicts with the Project Specification or the stable canonical docs'
    );
    expect(executivePrd).not.toContain('1. `Proofound_Project_Specification_2026-03-11.md`');
    expect(executivePrd).toContain('reference-only context and must not broaden');
    expect(`${compatibilityPrd}\n${executivePrd}`).toContain(
      'proof-first, privacy-first assignment review corridor'
    );
    expect(`${compatibilityPrd}\n${executivePrd}`).toContain('proof submission review');
    expect(`${compatibilityPrd}\n${executivePrd}`).toContain('public people directory');
    expect(executivePrd).toContain(
      'move one proof-review participant through intro, reveal, interview, and decision'
    );
    expect(compatibilityPrd).toContain('proof-review participant consent');
    expect(compatibilityPrd).toContain('privacy-safe proof-submission review');
    expect(`${compatibilityPrd}\n${executivePrd}`).not.toContain(
      'proof-first, privacy-first hiring credibility corridor'
    );
    expect(compatibilityPrd).not.toContain('candidate consent');
    expect(`${compatibilityPrd}\n${executivePrd}`).not.toContain('public candidate directory');
    expect(executivePrd).not.toContain(
      'move one candidate through intro, reveal, interview, and decision'
    );
    expect(compatibilityPrd).not.toContain('privacy-safe candidate review');
    expect(docsRegistry).toContain(
      '| `PRD_for_a_web_platform_MVP.md`                                                                         | `reference-spec` | `root`        | `repo`              | `2026-05-21`'
    );
    expect(docsRegistry).toContain(
      '| `Proofound_PRD_MVP.md`                                                                                  | `reference-spec` | `root`        | `repo`              | `2026-05-21`'
    );
  });

  it('keeps the root core user flows reference proof-submission scoped', () => {
    const coreUserFlows = fs.readFileSync(
      path.join(repoRoot, 'Proofound_Core_User_Flows_v1.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(coreUserFlows).toContain('Reference note: this file is reference or historical');
    expect(coreUserFlows).toContain('## I‑11 Recommended Assignment Reviews');
    expect(coreUserFlows).toContain(
      'Review proof-led assignment contexts that match stated constraints'
    );
    expect(coreUserFlows).toContain('reason-coded proof signals');
    expect(coreUserFlows).toContain('privacy-safe preference data');
    expect(coreUserFlows).toContain('marks interest in one assignment-review context');
    expect(coreUserFlows).toContain('## I‑14 Submit Proof Interest');
    expect(coreUserFlows).toContain('Submit targeted, low‑friction proof-submission interest');
    expect(coreUserFlows).toContain('Proof-submission interest recorded and acknowledged');
    expect(coreUserFlows).toContain('Duplicate proof submissions; withdraws');
    expect(coreUserFlows).toContain('nudge before first proof submission');
    expect(coreUserFlows).toContain('proof-review participant view time');
    expect(coreUserFlows).toContain('preview of proof-submission volume');
    expect(coreUserFlows).toContain('sample proof-submission preview');
    expect(coreUserFlows).toContain('proof-submission quality signal');
    expect(coreUserFlows).toContain('Zero proof submissions');
    expect(coreUserFlows).toContain('time‑to‑workflow outcome');
    expect(coreUserFlows).toContain('quality‑of‑engagement proxies');
    expect(coreUserFlows).toContain('view→proof-submission interest');
    expect(coreUserFlows).toContain('## O‑08 Review Proof-Submission Matches');
    expect(coreUserFlows).toContain('proof-submission review records');
    expect(coreUserFlows).toContain('## O‑09 Proof-Submission Review');
    expect(coreUserFlows).toContain('Proof-review participant data');
    expect(coreUserFlows).toContain('Move proof submissions through a clear workflow');
    expect(coreUserFlows).toContain('proof-review participants');
    expect(coreUserFlows).toContain('accept from proof-review participant');
    expect(coreUserFlows).toContain('proof submission moved stage');
    expect(coreUserFlows).toContain('Proof-review participant selected');
    expect(coreUserFlows).toContain('Verification recorded on proof-review participant profile');
    expect(coreUserFlows).not.toContain('## I‑11 Recommended Feed');
    expect(coreUserFlows).not.toContain('Discover best‑fit opportunities');
    expect(coreUserFlows).not.toContain('Scroll ranked list');
    expect(coreUserFlows).not.toContain('Match score & subscores');
    expect(coreUserFlows).not.toContain('Sort by score/newness');
    expect(coreUserFlows).not.toContain('saves, or applies');
    expect(coreUserFlows).not.toContain('save/apply rate');
    expect(coreUserFlows).not.toContain('## I‑14 Apply / Express Interest');
    expect(coreUserFlows).not.toContain('Submit a targeted, low‑friction application');
    expect(coreUserFlows).not.toContain('Apply / save / dismiss action taken');
    expect(coreUserFlows).not.toContain('View‑to‑apply conversion');
    expect(coreUserFlows).not.toContain('Application created and acknowledged');
    expect(coreUserFlows).not.toContain('After apply or inbound outreach');
    expect(coreUserFlows).not.toContain('Duplicate applications; withdraws');
    expect(coreUserFlows).not.toContain('nudge before first apply');
    expect(coreUserFlows).not.toContain('candidate view time');
    expect(coreUserFlows).not.toContain('preview of candidate volume');
    expect(coreUserFlows).not.toContain('sample candidate preview');
    expect(coreUserFlows).not.toContain('candidate quality score');
    expect(coreUserFlows).not.toContain('Zero candidates');
    expect(coreUserFlows).not.toContain('time‑to‑fill');
    expect(coreUserFlows).not.toContain('quality‑of‑hire');
    expect(coreUserFlows).not.toContain('view→apply');
    expect(coreUserFlows).not.toContain('## O‑08 View Ranked Matches');
    expect(coreUserFlows).not.toContain('## O‑09 Candidate Deep‑Dive');
    expect(coreUserFlows).not.toContain('candidate profiles');
    expect(coreUserFlows).not.toContain('Candidate data; internal notes');
    expect(coreUserFlows).not.toContain('Move candidates through a clear pipeline');
    expect(coreUserFlows).not.toContain('Candidate in correct stage with owner');
    expect(coreUserFlows).not.toContain('accept from candidate');
    expect(coreUserFlows).not.toContain('candidate moved stage');
    expect(coreUserFlows).not.toContain('Candidate selected');
    expect(coreUserFlows).not.toContain('Verification recorded on candidate profile');
    expect(docsRegistry).toContain(
      '| `Proofound_Core_User_Flows_v1.md`                                                                       | `reference-spec` | `root`        | `repo`              | `2026-05-21`'
    );
  });

  it('keeps legacy technical and runbook mirrors proof-review participant aligned', () => {
    const legacyTechnicalRequirements = fs.readFileSync(
      path.join(repoRoot, 'PRD_TECHNICAL_REQUIREMENTS.md'),
      'utf8'
    );
    const legacyLaunchRunbook = fs.readFileSync(path.join(repoRoot, 'LAUNCH_RUNBOOK.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');
    const combinedLegacyMirrors = `${legacyTechnicalRequirements}\n${legacyLaunchRunbook}`;

    expect(combinedLegacyMirrors).toContain('Reference-only wrapper');
    expect(combinedLegacyMirrors).toContain('Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md');
    expect(combinedLegacyMirrors).toContain(
      'PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md'
    );
    expect(combinedLegacyMirrors).toContain('proof-review participant consent');
    expect(legacyTechnicalRequirements).toContain(
      '`org_reviewer` can review proof submissions and contribute feedback within allowed scope'
    );
    expect(legacyTechnicalRequirements).toContain(
      'proof-review participant approval is mandatory for identity-bearing reveal'
    );
    expect(legacyTechnicalRequirements).toContain(
      'narrow, proof-first, privacy-safe assignment-review and credibility corridor'
    );
    expect(legacyTechnicalRequirements).toContain('lean workflow-to-engagement flow');
    expect(combinedLegacyMirrors).toContain('proof-submission review, proof editing');
    expect(combinedLegacyMirrors).toContain('participant-visible feedback');
    expect(legacyLaunchRunbook).toContain(
      'sensitive assignment or proof-review participant complaints'
    );
    expect(legacyLaunchRunbook).toContain('no public people directory exists');
    expect(legacyLaunchRunbook).toContain('review privacy-safe proof submissions');
    expect(legacyLaunchRunbook).toContain('public people browsing');
    expect(legacyTechnicalRequirements).toContain('participant-visible closure feedback');
    expect(legacyTechnicalRequirements).toContain(
      'no private notes in participant-visible channels'
    );
    expect(legacyTechnicalRequirements).toContain('no proof-review participant notification');
    expect(combinedLegacyMirrors).not.toContain('candidate consent');
    expect(legacyLaunchRunbook).not.toContain('sensitive assignment or candidate complaints');
    expect(legacyLaunchRunbook).not.toContain('no public candidate directory exists');
    expect(legacyLaunchRunbook).not.toContain('review privacy-safe candidates');
    expect(legacyLaunchRunbook).not.toContain('public candidate browsing');
    expect(combinedLegacyMirrors).not.toContain('candidate review, proof editing');
    expect(combinedLegacyMirrors).not.toContain('non-candidate-facing');
    expect(combinedLegacyMirrors).not.toContain('candidate-visible feedback');
    expect(legacyTechnicalRequirements).not.toContain(
      '`org_reviewer` can review candidates and contribute feedback within allowed scope'
    );
    expect(legacyTechnicalRequirements).not.toContain(
      'candidate approval is mandatory for identity-bearing reveal'
    );
    expect(legacyTechnicalRequirements).not.toContain('candidate notification');
    expect(legacyTechnicalRequirements).not.toContain(
      'narrow, proof-first, privacy-safe hiring and credibility corridor'
    );
    expect(legacyTechnicalRequirements).not.toContain('lean hiring-to-engagement flow');
    expect(docsRegistry).toContain(
      '| `PRD_TECHNICAL_REQUIREMENTS.md`                                                                         | `reference-spec` | `root`        | `repo`              | `2026-05-21`'
    );
    expect(docsRegistry).toContain(
      '| `LAUNCH_RUNBOOK.md`                                                                                     | `reference-spec` | `root`        | `repo`              | `2026-05-21`'
    );
  });

  it('keeps the preserved project specification below the active privacy language', () => {
    const projectSpecification = fs.readFileSync(
      path.join(repoRoot, 'Proofound_Project_Specification_2026-03-11.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(projectSpecification).toContain('Reference-only note');
    expect(projectSpecification).toContain('This document must not override the locked MVP');
    expect(projectSpecification).toContain(
      'proof-first, privacy-first assignment-review and credibility corridor centered on Proof Packs'
    );
    expect(projectSpecification).toContain(
      'review proof submissions through privacy-safe, explainable proof-backed early review'
    );
    expect(projectSpecification).toContain('better assignment-review inputs');
    expect(projectSpecification).toContain('open people marketplace at launch');
    expect(projectSpecification).toContain('lean assignment-review teams');
    expect(projectSpecification).toContain('assignment-review owner');
    expect(projectSpecification).toContain('review anonymized proof submissions');
    expect(projectSpecification).toContain(
      'move proof-review participant through intro → reveal → interview → decision'
    );
    expect(projectSpecification).toContain(
      'matching organization + proof-review participant confirmation'
    );
    expect(projectSpecification).toContain('public people search index');
    expect(projectSpecification).toContain(
      'Identity reveal requires proof-review participant consent'
    );
    expect(projectSpecification).toContain(
      'proof-review participant approval required before identity-bearing reveal'
    );
    expect(projectSpecification).toContain(
      'assignment-review corridor reaches explicit `hire` and engagement verification states'
    );
    expect(projectSpecification).toContain('### Phase 3 — Assignment-review corridor');
    expect(projectSpecification).toContain('### 9.4 Assignment-review corridor');
    expect(projectSpecification).toContain('workflow process');
    expect(projectSpecification).toContain(
      'narrow, proof-first, privacy-safe assignment-review and credibility corridor'
    );
    expect(projectSpecification).not.toContain(
      'proof-first, privacy-first hiring and credibility corridor centered on Proof Packs'
    );
    expect(projectSpecification).not.toContain(
      'review people through privacy-safe, explainable proof-backed early review'
    );
    expect(projectSpecification).not.toContain('better hiring inputs');
    expect(projectSpecification).not.toContain('open candidate marketplace at launch');
    expect(projectSpecification).not.toContain('lean hiring teams');
    expect(projectSpecification).not.toContain('hiring manager →');
    expect(projectSpecification).not.toContain('review anonymized candidates');
    expect(projectSpecification).not.toContain(
      'move candidate through intro → reveal → interview → decision'
    );
    expect(projectSpecification).not.toContain('matching org + candidate confirmation');
    expect(projectSpecification).not.toContain('public candidate search index');
    expect(projectSpecification).toContain('proof-review participant intro acceptance');
    expect(projectSpecification).toContain('proof-review participant reveal approval');
    expect(projectSpecification).not.toContain('Identity reveal requires candidate consent');
    expect(projectSpecification).not.toContain(
      'candidate approval required before identity-bearing reveal'
    );
    expect(projectSpecification).not.toContain(
      'hiring corridor reaches explicit `hire` and engagement verification states'
    );
    expect(projectSpecification).not.toContain('### Phase 3 — Hiring corridor');
    expect(projectSpecification).not.toContain('### 9.4 Hiring corridor');
    expect(projectSpecification).not.toContain('hiring process');
    expect(projectSpecification).not.toContain(
      'narrow, proof-first, privacy-safe hiring and credibility corridor'
    );
    expect(projectSpecification).not.toContain('candidate intro acceptance');
    expect(projectSpecification).not.toContain('candidate reveal approval');
    expect(docsRegistry).toContain(
      '| `Proofound_Project_Specification_2026-03-11.md`                                                         | `reference-spec` | `root`        | `repo`              | `2026-05-21`'
    );
  });

  it('keeps the superseded master PRD historical and below current consent language', () => {
    const supersededMasterPrd = fs.readFileSync(
      path.join(repoRoot, 'PRD_for_a_web_platform_MVP.master-latest.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(supersededMasterPrd).toContain('Doc Class: `historical`');
    expect(supersededMasterPrd).toContain('Last Verified: `2026-05-21`');
    expect(supersededMasterPrd).toContain('Historical reference only');
    expect(supersededMasterPrd).toContain('Proof-First Assignment Review Corridor');
    expect(supersededMasterPrd).toContain(
      'This superseded PRD preserves historical product behavior for Proofound MVP.'
    );
    expect(supersededMasterPrd).toContain('proof-submission review record');
    expect(supersededMasterPrd).toContain('participant-visible feedback');
    expect(supersededMasterPrd).toContain(
      'Organizations review proof submissions through privacy-safe proof-backed summaries.'
    );
    expect(supersededMasterPrd).toContain('### 6.5 Assignment-review corridor');
    expect(supersededMasterPrd).toContain('public people directory');
    expect(supersededMasterPrd).toContain('review privacy-safe proof-backed submissions');
    expect(supersededMasterPrd).toContain(
      'move one proof-review participant through intro, reveal, interview, and decision'
    );
    expect(supersededMasterPrd).toContain('assignment-review owner → `org_manager`');
    expect(supersededMasterPrd).toContain(
      'Proofound MVP is a narrow, proof-first assignment review corridor centered on Proof Packs.'
    );
    expect(supersededMasterPrd).toContain(
      'review proof submissions through privacy-safe, explainable proof-backed early review'
    );
    expect(supersededMasterPrd).toContain(
      'Identity-bearing reveal requires proof-review participant consent.'
    );
    expect(supersededMasterPrd).toContain(
      'proof-review participant consent is required for identity-bearing reveal'
    );
    expect(supersededMasterPrd).not.toContain('candidate-visible feedback');
    expect(supersededMasterPrd).not.toContain('candidate review record');
    expect(supersededMasterPrd).not.toContain('Proof-First Hiring Corridor');
    expect(supersededMasterPrd).not.toContain(
      'This PRD defines the launch-bound product behavior for Proofound MVP.'
    );
    expect(supersededMasterPrd).not.toContain(
      'Organizations review candidates through privacy-safe proof-backed summaries.'
    );
    expect(supersededMasterPrd).not.toContain('### 6.5 Hiring corridor');
    expect(supersededMasterPrd).not.toContain(
      'Proofound MVP is a narrow, proof-first hiring credibility corridor centered on Proof Packs.'
    );
    expect(supersededMasterPrd).not.toContain(
      'review candidates through privacy-safe, explainable proof-backed early review'
    );
    expect(supersededMasterPrd).not.toContain('public candidate directory');
    expect(supersededMasterPrd).not.toContain('review privacy-safe proof-backed candidates');
    expect(supersededMasterPrd).not.toContain(
      'move one candidate through intro, reveal, interview, and decision'
    );
    expect(supersededMasterPrd).not.toContain('hiring manager →');
    expect(supersededMasterPrd).not.toContain('interview-to-hire corridor');
    expect(supersededMasterPrd).not.toContain('hiring-to-engagement flow');
    expect(supersededMasterPrd).not.toContain(
      'Identity-bearing reveal requires candidate consent.'
    );
    expect(supersededMasterPrd).not.toContain(
      'candidate consent is required for identity-bearing reveal'
    );
    expect(docsRegistry).toContain(
      '| `PRD_for_a_web_platform_MVP.master-latest.md` | `historical` | `root` | `repo` | `2026-05-21`'
    );
  });

  it('keeps the root privacy architecture reference aligned to proof-review consent language', () => {
    const privacyArchitecture = fs.readFileSync(
      path.join(repoRoot, 'DATA_SECURITY_PRIVACY_ARCHITECTURE.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(privacyArchitecture).toContain('reference context only');
    expect(privacyArchitecture).toContain(
      'Organization receives proof-review participant data solely for the approved assignment-review workflow and legally required engagement follow-through.'
    );
    expect(privacyArchitecture).toContain(
      'We ask this so assignment reviews can respect your compensation needs.'
    );
    expect(privacyArchitecture).toContain(
      'This information is only shared with organizations inside an approved proof-review workflow.'
    );
    expect(privacyArchitecture).toContain(
      'Organization may keep data for 12 months after the documented workflow decision or engagement outcome'
    );
    expect(privacyArchitecture).toContain(
      'org data isolation and proof-review participant data protection'
    );
    expect(privacyArchitecture).toContain(
      'Organization may not share data with third parties without proof-review participant consent'
    );
    expect(privacyArchitecture).toContain(
      'never overlap except through approved proof-review workflows'
    );
    expect(privacyArchitecture).toContain('Proof submissions shared');
    expect(privacyArchitecture).toContain('Proof-review workflow (participant initiates)');
    expect(privacyArchitecture).toContain('Proof submissions received');
    expect(privacyArchitecture).toContain('Submit Proof Interest');
    expect(privacyArchitecture).toContain('Before you submit proof interest:');
    expect(privacyArchitecture).toContain(
      "'individual' // Can create profile and submit proof interest for assignments"
    );
    expect(privacyArchitecture).toContain(
      "'org_manager' // Manage team, assignments, and proof-submission review"
    );
    expect(privacyArchitecture).toContain(
      "'org_reviewer'; // Review proof submissions within allowed scope"
    );
    expect(privacyArchitecture).toContain('**View proof submissions**');
    expect(privacyArchitecture).toContain('**Message proof-review participants**');
    expect(privacyArchitecture).toContain("['org_owner', 'org_manager'].includes(orgMember.role)");
    expect(privacyArchitecture).toContain("role IN ('org_owner', 'org_manager')");
    expect(privacyArchitecture).toContain("om.role IN ('org_owner', 'org_manager')");
    expect(privacyArchitecture).toContain(
      "role TEXT CHECK (role IN ('org_owner', 'org_manager', 'org_reviewer'))"
    );
    expect(privacyArchitecture).toContain(
      "They'll use this to evaluate your proof submission inside the approved assignment-review workflow"
    );
    expect(privacyArchitecture).toContain('proof submissions and messages');
    expect(privacyArchitecture).toContain(
      'Users explicitly share inside approved proof-review workflows'
    );
    expect(privacyArchitecture).not.toContain('Organization receives candidate data');
    expect(privacyArchitecture).not.toContain('show you opportunities that match your needs');
    expect(privacyArchitecture).not.toContain('organizations you apply to');
    expect(privacyArchitecture).not.toContain('Candidate name, email, skills, experience');
    expect(privacyArchitecture).not.toContain(
      'Organization may keep data for 12 months after hiring decision'
    );
    expect(privacyArchitecture).not.toContain('Must delete upon candidate request');
    expect(privacyArchitecture).not.toContain('org data isolation and candidate data protection');
    expect(privacyArchitecture).not.toContain(
      'Organization may not share data with third parties without candidate consent'
    );
    expect(privacyArchitecture).not.toContain(
      'never overlap except through explicit matching/application flows'
    );
    expect(privacyArchitecture).not.toContain('Applications submitted');
    expect(privacyArchitecture).not.toContain('Applications received');
    expect(privacyArchitecture).not.toContain('Applications (individual initiates)');
    expect(privacyArchitecture).not.toContain('User explicitly shares with each application');
    expect(privacyArchitecture).not.toContain('Recommended Feed (Matching)');
    expect(privacyArchitecture).not.toContain('Apply / Express Interest');
    expect(privacyArchitecture).not.toContain('Application Withdrawal');
    expect(privacyArchitecture).not.toContain('Before you apply:');
    expect(privacyArchitecture).not.toContain('Can create profile, apply to assignments');
    expect(privacyArchitecture).not.toContain('Manage team, assignments, candidates');
    expect(privacyArchitecture).not.toContain('Manage assignments, candidates');
    expect(privacyArchitecture).not.toContain('**View candidates**');
    expect(privacyArchitecture).not.toContain('**Message candidates**');
    expect(privacyArchitecture).not.toContain("['owner', 'steward', 'recruiter']");
    expect(privacyArchitecture).not.toContain("role IN ('owner', 'steward', 'recruiter')");
    expect(privacyArchitecture).not.toContain("om.role IN ('owner', 'steward', 'recruiter')");
    expect(privacyArchitecture).not.toContain(
      "role TEXT CHECK (role IN ('owner', 'steward', 'recruiter', 'viewer'))"
    );
    expect(privacyArchitecture).not.toContain("They'll use this to evaluate your application");
    expect(privacyArchitecture).not.toContain('You can withdraw your application anytime');
    expect(privacyArchitecture).not.toContain('[Submit Application]');
    expect(privacyArchitecture).not.toContain('applications and messages');
    expect(docsRegistry).toContain(
      '| `DATA_SECURITY_PRIVACY_ARCHITECTURE.md`                                                                 | `reference-spec` | `root`        | `repo`              | `2026-05-21`'
    );
  });

  it('keeps active security evidence docs pointed at existing current or historical sources', () => {
    const securityScanResults = fs.readFileSync(
      path.join(repoRoot, 'docs/security-scan-results.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(securityScanResults).toContain('Last Verified: `2026-05-21`');
    expect(securityScanResults).toContain('docs/CURRENT_TRUTH.md');
    expect(securityScanResults).toContain('docs/verification-checklist.md');
    expect(securityScanResults).toContain('docs/production-readiness-checklist.md');
    expect(securityScanResults).toContain('DATA_SECURITY_PRIVACY_ARCHITECTURE.md');
    expect(securityScanResults).toContain('docs/security-audit-report.md');
    expect(securityScanResults).toContain('SECURITY_REVIEW_REPORT.md');
    expect(securityScanResults).toMatch(/historical\s+reports only/);
    expect(securityScanResults).not.toContain('docs/SECURITY_PRIVACY_AUDIT.md');
    expect(securityScanResults).not.toContain('docs/SECURITY_PRIVACY_CHECKLIST.md');
    expect(securityScanResults).not.toContain('docs/DATA_SECURITY_PRIVACY_ARCHITECTURE.md');
    expect(fs.existsSync(path.join(repoRoot, 'docs/CURRENT_TRUTH.md'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'docs/verification-checklist.md'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'docs/production-readiness-checklist.md'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'DATA_SECURITY_PRIVACY_ARCHITECTURE.md'))).toBe(true);
    expect(docsRegistry).toContain(
      '| `docs/security-scan-results.md`                                                                         | `active`         | `docs`        | `repo+live`         | `2026-05-21`'
    );
  });

  it('keeps GEO audit scope aligned with active public launch surfaces', () => {
    const geoAudit = fs.readFileSync(path.join(repoRoot, 'agent/runbooks/geo-audit.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(geoAudit).toContain('Last Verified: `2026-05-19`');
    expect(geoAudit).toContain('must not widen the locked MVP public surface');
    expect(geoAudit).toContain('Active public launch pages');
    expect(geoAudit).toContain('public organization trust pages');
    expect(geoAudit).toContain('Archived public marketing pages such as');
    expect(geoAudit).toContain('return the route-policy outcome');
    expect(geoAudit).toContain('Do not add or revive broad marketing pages');
    expect(geoAudit).not.toContain(
      'Marketing pages: `/`, `/about`, `/manifesto`, `/careers`, `/contact`, `/support`'
    );
    expect(docsRegistry).toContain(
      '| `agent/runbooks/geo-audit.md` | `governance` | `agent` | `repo+live` | `2026-05-19`'
    );
  });

  it('keeps release batch mechanics below current launch evidence gates', () => {
    const releaseBatchFlow = fs.readFileSync(
      path.join(repoRoot, 'agent/runbooks/release-batch-flow.md'),
      'utf8'
    );
    const verificationChecklist = fs.readFileSync(
      path.join(repoRoot, 'agent/checklists/verification.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(releaseBatchFlow).toContain('Last Verified: `2026-05-19`');
    expect(releaseBatchFlow).toContain('describes release mechanics only');
    expect(releaseBatchFlow).toContain('production-candidate backup checkpoint');
    expect(releaseBatchFlow).toContain(
      'isolated restore report at `.artifacts/launch-restore-report.json`'
    );
    expect(releaseBatchFlow).toContain('authenticated `/api/monitoring/launch-status`');
    expect(releaseBatchFlow).toContain('authenticated `/api/monitoring/perf-status`');
    expect(releaseBatchFlow).toContain(
      'BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run go:no-go'
    );
    expect(releaseBatchFlow).toContain('INTERNAL_API_SECRET=<secret>');
    expect(verificationChecklist).toContain(
      'Confirm launch readiness separately with the current release and production-readiness checklists'
    );
    expect(docsRegistry).toContain(
      '| `agent/runbooks/release-batch-flow.md` | `runbook` | `agent` | `repo+live` | `2026-05-19`'
    );
  });

  it('keeps scoped verification docs under the locked MVP authority stack', () => {
    const identityContext = fs.readFileSync(
      path.join(repoRoot, 'IDENTITY_VERIFICATION_IMPLEMENTATION.md'),
      'utf8'
    );
    const verificationPolicy = fs.readFileSync(
      path.join(repoRoot, 'docs/verification-policy-mvp.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(identityContext).toContain('Doc Class: `reference-spec`');
    expect(identityContext).toContain('Last Verified: `2026-05-19`');
    expect(identityContext).toContain('reference-only implementation context');
    expect(identityContext).toContain('locked MVP authority stack');
    expect(identityContext).not.toContain('Project Specification explicitly requires');
    expect(identityContext).not.toContain('active Project Specification trust contract');
    expect(verificationPolicy).toContain('Last Verified: `2026-05-19`');
    expect(verificationPolicy).toContain('the locked MVP source of truth sets the launch promise');
    expect(verificationPolicy).toContain('must stay account-side');
    expect(verificationPolicy).toContain('including work-email or LinkedIn history');
    expect(verificationPolicy).not.toContain(
      'Proofound_Project_Specification_2026-03-11.md` sets the launch promise'
    );
    expect(docsRegistry).toContain(
      '| `IDENTITY_VERIFICATION_IMPLEMENTATION.md`                                                               | `reference-spec` | `root`        | `repo`              | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `docs/verification-policy-mvp.md`                                                                       | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps the testing strategy aligned with production-candidate launch gates', () => {
    const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
    const testingStrategy = fs.readFileSync(
      path.join(repoRoot, 'docs/testing-strategy.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(readme).toContain('Last Verified: `2026-05-30`');
    expect(readme).toContain('INTERNAL_API_SECRET=your-internal-launch-ops-token');
    expect(readme).toContain('npm run launch:status');
    expect(docsRegistry).toContain(
      '| `README.md`                                                                                             | `active`         | `root`        | `repo+live`         | `2026-05-30`'
    );
    expect(testingStrategy).toContain('Last Verified: `2026-05-21`');
    expect(testingStrategy).toContain('BASE_URL=<production-candidate-url>');
    expect(testingStrategy).toContain('INTERNAL_API_SECRET=<secret>');
    expect(testingStrategy).toContain(
      'BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run launch:status'
    );
    expect(testingStrategy).toContain(
      'BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run launch:validate'
    );
    expect(testingStrategy).toContain('fresh backup/restore evidence');
    expect(testingStrategy).toContain('manual-link interview');
    expect(compactWhitespace(testingStrategy)).toContain('posture remains the locked MVP default');
    expect(testingStrategy).not.toContain('STRICT_PROVIDER_E2E_REQUIRE_BOTH');
    expect(testingStrategy).not.toContain('both Zoom and Google connected');
    expect(docsRegistry).toContain(
      '| `docs/testing-strategy.md`                                                                              | `active`         | `docs`        | `repo+live`         | `2026-05-21`'
    );
  });

  it('keeps active launch evidence docs from using localhost for final gates', () => {
    const finalGateDocs = [
      'verification.md',
      'metrics.md',
      'Documentation.md',
      'docs/performance-testing.md',
      'docs/testing-strategy.md',
      'docs/backlog/phase-exit-checklist.md',
      'docs/backlog/phase-4-pilot-hardening.md',
      'docs/qa/summary.md',
      'docs/mvp-launch-master-checklist.md',
      'agent/checklists/verification.md',
    ];
    const localhostFinalGate =
      /BASE_URL=http:\/\/localhost:3000[^\n`]*(?:test:launch:smoke|perf:budgets|monitor:launch|launch:status|launch:validate|go:no-go)/;
    const hardCodedProductionFinalGate =
      /BASE_URL=https:\/\/proofound\.io[^\n`]*(?:test:launch:smoke|perf:budgets|monitor:launch|launch:status|launch:validate|go:no-go)/;
    const placeholderResultClaim =
      /BASE_URL=<production-candidate-url>[^\n`]*(?:test:launch:smoke|perf:budgets|monitor:launch|launch:status|launch:validate|go:no-go)[^\n]*(?:PASS|FAIL)/;

    for (const docPath of finalGateDocs) {
      const content = fs.readFileSync(path.join(repoRoot, docPath), 'utf8');
      expect(content).toContain('BASE_URL=<production-candidate-url>');
      expect(content).not.toMatch(localhostFinalGate);
      expect(content).not.toMatch(hardCodedProductionFinalGate);
      expect(content).not.toMatch(placeholderResultClaim);
      expect(content).not.toContain('Gate parity (with local server at `http://localhost:3000`)');
    }
    const performanceTesting = fs.readFileSync(
      path.join(repoRoot, 'docs/performance-testing.md'),
      'utf8'
    );
    expect(performanceTesting).toContain('Last Verified: `2026-05-21`');
    expect(performanceTesting).toContain('INTERNAL_API_SECRET=<secret>');
  });

  it('keeps environment docs from making connected providers launch-blocking by default', () => {
    const envExample = fs.readFileSync(path.join(repoRoot, '.env.example'), 'utf8');
    const envDocs = fs.readFileSync(path.join(repoRoot, 'docs/ENV_VARIABLES.md'), 'utf8');
    const launchMasterChecklist = fs.readFileSync(
      path.join(repoRoot, 'docs/mvp-launch-master-checklist.md'),
      'utf8'
    );
    const deployReadinessScript = fs.readFileSync(
      path.join(repoRoot, 'scripts/check-deploy-readiness.mjs'),
      'utf8'
    );
    const vercelPreflightScript = fs.readFileSync(
      path.join(repoRoot, 'scripts/vercel-preflight.mjs'),
      'utf8'
    );
    const veriffConfigScript = fs.readFileSync(
      path.join(repoRoot, 'scripts/test-veriff-config.js'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(envExample).toContain('manual meeting links remain the default launch path');
    expect(envExample).toContain('STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=false');
    expect(envExample).not.toContain('ZOOM_CLIENT_ID');
    expect(envExample).not.toContain('ZOOM_CLIENT_SECRET');
    expect(envExample).not.toContain('ZOOM_REDIRECT_URI');
    expect(envExample).not.toContain('LINKEDIN_CLIENT_ID');
    expect(envExample).not.toContain('LINKEDIN_CLIENT_SECRET');
    expect(envExample).not.toContain('LINKEDIN_REDIRECT_URI');
    expect(envExample).not.toContain('STRICT_PROVIDER_E2E_REQUIRE_BOTH');
    expect(envExample).not.toContain('must have Zoom + Google connected');
    expect(deployReadinessScript).not.toContain('LINKEDIN_REDIRECT_URI is not set');
    expect(vercelPreflightScript).not.toContain("'LINKEDIN_CLIENT_ID'");
    expect(vercelPreflightScript).not.toContain("'LINKEDIN_CLIENT_SECRET'");
    expect(envDocs).toContain('Last Verified: `2026-05-21`');
    expect(envDocs).toContain('Manual meeting links remain the locked MVP default');
    expect(envDocs).toContain('**Target-scoped Vars**');
    expect(envDocs).toContain('STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=false');
    expect(envDocs).toContain('Required Vars When `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true`');
    expect(envDocs).toContain('Manual-link interview scheduling must still work');
    expect(envDocs).toContain(
      'Google and LinkedIn login buttons are launch-active auth entry points'
    );
    expect(envDocs).toContain('https://proofound.io/api/integrations/google/callback');
    expect(envDocs).toContain('https://<supabase-project>.supabase.co/auth/v1/callback');
    expect(envDocs).toContain('<preview-app-url>/api/integrations/google/callback');
    expect(envDocs).toContain('Do not configure the archived app-side LinkedIn callback');
    expect(envDocs).not.toContain('/api/auth/linkedin/callback');
    expect(envDocs).toContain(
      'Archived/non-launch compatibility variable for retired LinkedIn verification manual-review notifications'
    );
    expect(envDocs).not.toContain('LinkedIn manual-review recipients');
    expect(envDocs).toContain('/api/match/profile');
    expect(envDocs).not.toContain('/api/core/matching/profile');
    expect(envDocs).toContain('retained near-matches matching handler');
    expect(envDocs).toContain('not CV screening, proof-review participant evaluation');
    expect(envDocs).toContain(
      'affect match, review, verification, reveal, trust-state, or workflow-decision state'
    );
    expect(envDocs).not.toContain('not CV screening, candidate evaluation');
    expect(envDocs).not.toContain('hiring-decision state');
    expect(envDocs).not.toContain('/api/core/matching/near-matches');
    expect(envDocs).not.toContain('yourdomain.com');
    expect(envDocs).not.toContain('preview.yourdomain.com');
    expect(envDocs).not.toContain('demo.yourdomain.com');
    expect(veriffConfigScript).toContain('https://proofound.io');
    expect(veriffConfigScript).not.toContain('https://yourdomain.com');
    expect(envDocs).toContain(
      'src/archive/non_launch_python_internal/lib/expertise/python-cv-extract-client.ts'
    );
    expect(envDocs).toContain(
      'The retired `/api/expertise/cv-import/wizard-*` proxy route family, Python `wizard-suggest`/`internal-job` modes, and TypeScript Python worker helpers remain archived'
    );
    expect(envDocs).not.toContain('- `src/lib/expertise/python-cv-extract-client.ts`');
    expect(envDocs).not.toContain('- `src/lib/python-internal/client.ts`');
    expect(envDocs).not.toContain('src/lib/expertise/python-cv-proxy.ts');
    expect(envDocs).not.toContain('**Required Vars**:\n\n- `GOOGLE_CLIENT_ID`');
    expect(envDocs).not.toContain('Make provider flows launch-blocking with real tokens');

    expect(launchMasterChecklist).toContain('Last Verified: `2026-05-21`');
    expect(launchMasterChecklist).toContain('STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=false');
    expect(launchMasterChecklist).toContain('BASE_URL=<production-candidate-url>');
    expect(launchMasterChecklist).not.toContain('BASE_URL=http://localhost:3000');
    expect(launchMasterChecklist).toContain('valid only for connected-provider advisory runs');
    expect(docsRegistry).toContain(
      '| `docs/mvp-launch-master-checklist.md`                                                                   | `active`         | `docs`        | `repo+live`         | `2026-05-21`'
    );
  });

  it('keeps analytics privacy setup scoped to archived routes and no-secret launch evidence', () => {
    const analyticsSetup = fs.readFileSync(path.join(repoRoot, 'ANALYTICS_GDPR_SETUP.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(analyticsSetup).toContain('Last Verified: `2026-05-19`');
    expect(analyticsSetup).toContain('not proof of GDPR compliance by itself');
    expect(analyticsSetup).toContain('/api/analytics/events');
    expect(analyticsSetup).toContain('/api/analytics/track');
    expect(analyticsSetup).toContain('archived compatibility surfaces');
    expect(analyticsSetup).toContain('PII_HASH_SALT');
    expect(analyticsSetup).toContain('Do not edit migration SQL with a live secret');
    expect(analyticsSetup).toContain('Do not use `db:push`');
    expect(analyticsSetup).toContain(
      'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json'
    );
    expect(analyticsSetup).toContain('private proof content');
    expect(analyticsSetup).toContain('hidden identity details before reveal consent');
    expect(analyticsSetup).toContain('tests/api/archived-api-handlers-route.test.ts');
    expect(analyticsSetup).not.toContain('Using Supabase Dashboard');
    expect(analyticsSetup).not.toContain('replace `${PII_HASH_SALT}`');
    expect(analyticsSetup).not.toContain('npm run db:push');
    expect(analyticsSetup).not.toContain('Your analytics system is now GDPR-compliant');
    expect(analyticsSetup).not.toContain('Use the same salt across environments');
    expect(docsRegistry).toContain(
      '| `ANALYTICS_GDPR_SETUP.md`                                                                               | `active`         | `root`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps active match analytics proof-signal scoped instead of score-led', () => {
    const analyticsConstants = fs.readFileSync(
      path.join(repoRoot, 'src/lib/analytics/constants.ts'),
      'utf8'
    );
    const analyticsMetrics = fs.readFileSync(
      path.join(repoRoot, 'src/lib/analytics/metrics.ts'),
      'utf8'
    );
    const healthCheckRoute = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/cron/health-check/route.ts'),
      'utf8'
    );
    const healthCheckRouteTest = fs.readFileSync(
      path.join(repoRoot, 'tests/api/cron-health-check-route.test.ts'),
      'utf8'
    );
    const analyticsMetricsTest = fs.readFileSync(
      path.join(repoRoot, 'src/lib/analytics/__tests__/metrics.test.ts'),
      'utf8'
    );
    const analyticsDisplayCopyTest = fs.readFileSync(
      path.join(repoRoot, 'tests/lib/analytics-display-copy.test.ts'),
      'utf8'
    );
    const activeAnalyticsContract = `${analyticsConstants}\n${analyticsMetrics}\n${healthCheckRoute}\n${healthCheckRouteTest}\n${analyticsMetricsTest}\n${analyticsDisplayCopyTest}`;

    expect(activeAnalyticsContract).toContain('proof_signals: MatchProofSignalProperty[]');
    expect(activeAnalyticsContract).toContain("review_mode: 'reason_coded'");
    expect(activeAnalyticsContract).toContain("score_visibility: 'internal_ordering_only'");
    expect(activeAnalyticsContract).toContain('proof_signals');
    expect(activeAnalyticsContract).toContain("metric: 'PROOF_FIT_ACCEPTANCE_LIFT'");
    expect(activeAnalyticsContract).toContain('calculateProofFitLift');
    expect(activeAnalyticsContract).toContain('proofFitLift');
    expect(activeAnalyticsContract).toContain('highProofFitAcceptanceRate');
    expect(activeAnalyticsContract).toContain('lowProofFitAcceptanceRate');
    expect(activeAnalyticsContract).toContain('proof_fit_acceptance');
    expect(activeAnalyticsContract).toContain('PROOF_FIT_LIFT_TARGET_PERCENT');
    expect(activeAnalyticsContract).toContain('PROOF_FIT_LIFT');
    expect(activeAnalyticsContract).toContain('metrics:proof-fit:lift');
    expect(activeAnalyticsContract).not.toContain('match_score: number');
    expect(activeAnalyticsContract).not.toContain('pac_value: number');
    expect(activeAnalyticsContract).not.toContain('skills_score: number');
    expect(activeAnalyticsContract).not.toContain('constraints_score: number');
    expect(activeAnalyticsContract).not.toContain('verification_score: number');
    expect(activeAnalyticsContract).not.toContain("metric: 'PAC_LIFT'");
    expect(activeAnalyticsContract).not.toContain('withPAC: number');
    expect(activeAnalyticsContract).not.toContain('withoutPAC: number');
    expect(activeAnalyticsContract).not.toContain('metrics.pac');
    expect(activeAnalyticsContract).not.toContain('pac_acceptance');
    expect(activeAnalyticsContract).not.toContain('TARGET_PAC');
    expect(activeAnalyticsContract).not.toContain('PAC_LIFT_TARGET_PERCENT');
    expect(activeAnalyticsContract).not.toContain("PAC_LIFT: 'metrics:pac:lift'");
    expect(activeAnalyticsContract).not.toContain('PAC lift');
  });

  it('keeps alert configuration scoped to launch-safe MVP operations', () => {
    const alertConfig = fs.readFileSync(path.join(repoRoot, 'docs/alert-configuration.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(alertConfig).toContain('Last Verified: `2026-05-21`');
    expect(alertConfig).toContain('/api/monitoring/launch-status');
    expect(alertConfig).toContain('/api/monitoring/perf-status');
    expect(alertConfig).toContain('/api/assignments` latency evidence');
    expect(alertConfig).toContain('/api/cron/decision-reminders');
    expect(alertConfig).toContain('/api/cron/health-check');
    expect(alertConfig).toContain('/api/cron/performance-check');
    expect(alertConfig).toContain('/api/cron/send-deletion-reminders');
    expect(alertConfig).toContain('Archived standalone deletion cron routes are not active');
    expect(alertConfig).toContain('manual meeting link default');
    expect(alertConfig).toContain('Proof Pack, assignment, proof review');
    expect(alertConfig).toContain('private proof content');
    expect(alertConfig).toContain('proof-review participant consent');
    expect(alertConfig).toContain('decision recording, including engage/close outcomes');
    expect(alertConfig).toContain('Do not make these launch-blocking by default');
    expect(alertConfig).toContain('TTSC/TTFQI/proof-fit business metric targets');
    expect(alertConfig).not.toContain('TTSC Exceeds Target');
    expect(alertConfig).not.toContain('TTFQI Exceeds Target');
    expect(alertConfig).not.toContain('Low Proof Fit Lift');
    expect(alertConfig).not.toContain('/api/test/trigger-error');
    expect(alertConfig).not.toContain('PagerDuty');
    expect(alertConfig).not.toContain('team@proofound.io');
    expect(alertConfig).not.toContain('Proof Pack, assignment, candidate review');
    expect(alertConfig).not.toContain('candidate consent');
    expect(alertConfig).not.toContain('hire/engage');
    expect(alertConfig).not.toContain('TTSC/TTFQI/PAC business metric targets');
    expect(docsRegistry).toContain(
      '| `docs/alert-configuration.md`                                                                           | `active`         | `docs`        | `repo+live`         | `2026-05-21`'
    );
  });

  it('keeps monitoring and alerting docs aligned with launch-safe operations', () => {
    const monitoringAlerting = fs.readFileSync(
      path.join(repoRoot, 'docs/monitoring-alerting.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(monitoringAlerting).toContain('Last Verified: `2026-05-19`');
    expect(monitoringAlerting).toContain('Use the existing public liveness endpoint');
    expect(monitoringAlerting).toContain('/api/monitoring/launch-status');
    expect(monitoringAlerting).toContain('/api/monitoring/health-diagnostics');
    expect(monitoringAlerting).toContain('Protected Launch Status');
    expect(monitoringAlerting).toContain('instead of adding a new');
    expect(monitoringAlerting).toContain('admin dashboard during launch hardening');
    expect(monitoringAlerting).toContain('private proof content');
    expect(monitoringAlerting).not.toContain('/api/core/matching/profile');
    expect(monitoringAlerting).not.toContain('comprehensive monitoring');
    expect(monitoringAlerting).not.toContain('Payment processing errors');
    expect(monitoringAlerting).not.toContain('Cache hit rate');
    expect(monitoringAlerting).not.toContain('TODO: Send');
    expect(monitoringAlerting).not.toContain('Create health check API');
    expect(monitoringAlerting).not.toContain('Custom Monitoring Dashboard');
    expect(monitoringAlerting).not.toContain('src/app/admin/monitoring/page.tsx');
    expect(monitoringAlerting).not.toContain('Total Users');
    expect(monitoringAlerting).not.toContain('New Users (24h)');
    expect(monitoringAlerting).not.toContain('PagerDuty');
    expect(monitoringAlerting).not.toContain('team@proofound.io');
    expect(monitoringAlerting).not.toContain('backend-team@proofound.io');
    expect(monitoringAlerting).not.toContain('frontend-team@proofound.io');
    expect(docsRegistry).toContain(
      '| `docs/monitoring-alerting.md`                                                                           | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps Sentry and structured logging privacy-safe for launch', () => {
    const sentrySetup = fs.readFileSync(path.join(repoRoot, 'docs/sentry-setup.md'), 'utf8');
    const structuredLogging = fs.readFileSync(
      path.join(repoRoot, 'docs/structured-logging.md'),
      'utf8'
    );
    const clientSentryConfig = fs.readFileSync(
      path.join(repoRoot, 'instrumentation-client.ts'),
      'utf8'
    );
    const serverSentryConfig = fs.readFileSync(
      path.join(repoRoot, 'sentry.server.config.ts'),
      'utf8'
    );
    const edgeSentryConfig = fs.readFileSync(path.join(repoRoot, 'sentry.edge.config.ts'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');
    const docs = `${sentrySetup}\n${structuredLogging}`;
    const sentryConfigs = `${clientSentryConfig}\n${serverSentryConfig}\n${edgeSentryConfig}`;

    expect(sentrySetup).toContain('Last Verified: `2026-05-19`');
    expect(sentrySetup).toContain('session replay opt-in by default');
    expect(sentrySetup).toContain('NEXT_PUBLIC_SENTRY_REPLAY_SESSION_SAMPLE_RATE=0');
    expect(sentrySetup).toContain('remove request cookies, headers, and body data');
    expect(sentrySetup).toContain('not as final go/no-go proof');
    expect(structuredLogging).toContain('Last Verified: `2026-05-19`');
    expect(structuredLogging).toContain('raw request or response bodies');
    expect(structuredLogging).toContain('private proof content');
    expect(structuredLogging).toContain('hidden identity details before reveal consent');
    expect(structuredLogging).toContain('participant private content');
    expect(structuredLogging).toContain('raw AI prompts');
    expect(structuredLogging).toContain('Do not migrate a risky console call');
    expect(structuredLogging).not.toContain('candidate private content');
    expect(docs).not.toContain("throw new Error('Test Sentry error')");
    expect(docs).not.toContain('payment.failed');
    expect(docs).not.toContain('Session replay for error debugging');
    expect(docs).not.toContain('Datadog (post-launch only');
    expect(clientSentryConfig).toContain('NEXT_PUBLIC_SENTRY_REPLAY_SESSION_SAMPLE_RATE');
    expect(clientSentryConfig).toContain('NEXT_PUBLIC_SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE');
    expect(clientSentryConfig).toContain('delete event.request.cookies');
    expect(sentryConfigs).toContain('delete event.request.headers');
    expect(sentryConfigs).toContain('delete event.request.data');
    expect(docsRegistry).toContain(
      '| `docs/sentry-setup.md`                                                                                  | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `docs/structured-logging.md`                                                                            | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps security policy and incident response no-leak and launch-scoped', () => {
    const securityPolicy = fs.readFileSync(path.join(repoRoot, '.github/SECURITY.md'), 'utf8');
    const incidentRunbook = fs.readFileSync(
      path.join(repoRoot, 'docs/SECURITY_INCIDENT_RESPONSE_RUNBOOK.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');
    const combined = `${securityPolicy}\n${incidentRunbook}`;

    expect(securityPolicy).toContain('Last Verified: `2026-05-19`');
    expect(securityPolicy).toContain('Do not send passwords');
    expect(securityPolicy).toContain('private proof files');
    expect(securityPolicy).toContain('archived/post-MVP surfaces');
    expect(securityPolicy).toContain(
      'Security and compliance claims should be based on current evidence'
    );
    expect(incidentRunbook).toContain('Last Verified: `2026-05-19`');
    expect(incidentRunbook).toContain('not legal advice or proof of compliance by itself');
    expect(incidentRunbook).toContain('First 15 Minutes');
    expect(incidentRunbook).toContain('private proof content');
    expect(incidentRunbook).toContain('org review/proof-submission card checks');
    expect(incidentRunbook).toContain('hidden identity details before reveal consent');
    expect(incidentRunbook).toContain('raw request/response bodies');
    expect(incidentRunbook).toContain('Do not run destructive production');
    expect(incidentRunbook).toContain(
      'Store incident records under the approved internal location'
    );
    expect(combined).not.toContain('SOC 2');
    expect(combined).not.toContain('GDPR and CCPA compliant from day one');
    expect(combined).not.toContain('#security-incidents Slack channel');
    expect(combined).not.toContain('Supabase SQL Editor');
    expect(combined).not.toContain('UPDATE auth.refresh_tokens');
    expect(combined).not.toContain('org review/candidate proof card checks');
    expect(combined).not.toContain('Emergency Phone');
    expect(docsRegistry).toContain(
      '| `.github/SECURITY.md`                                                                                   | `active`         | `github`      | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `docs/SECURITY_INCIDENT_RESPONSE_RUNBOOK.md`                                                            | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps manual testing docs aligned with the active MVP route corridor', () => {
    const manualChecklist = fs.readFileSync(
      path.join(repoRoot, 'MANUAL_TESTING_CHECKLIST.md'),
      'utf8'
    );
    const manualGuide = fs.readFileSync(path.join(repoRoot, 'MANUAL_TESTING_GUIDE.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');
    const manualDocs = `${manualChecklist}\n${manualGuide}`;

    for (const content of [manualChecklist, manualGuide]) {
      expect(content).toContain('Last Verified: `2026-05-21`');
      expect(content).toContain('/app/i/portfolio');
      expect(content).toContain('/app/i/verifications');
      expect(content).toContain('/app/i/communications');
      expect(content).toContain('/app/i/settings/privacy');
      expect(content).toContain('/app/o/<slug>/assignments');
      expect(content).toContain('/app/o/<slug>/communications');
      expect(content).toContain('/admin/verification');
      expect(content).toContain('/admin/audit');
      expect(content).toContain('manual-link');
      expect(content).toContain('Proof Pack');
      expect(content).toContain('proof-review participant consent');
    }

    expect(manualDocs).toContain('proof-first assignment review');
    expect(manualDocs).toContain('proof-review participant contact details');
    expect(manualDocs).toContain('Proof-submission review cards');
    expect(manualGuide).toContain('INTERNAL_API_SECRET=<secret>');
    expect(manualGuide).not.toContain('SUS_STUDY_COMPLETE');
    expect(manualDocs).toContain('engage/close');
    expect(manualDocs).not.toContain('/app/i/expertise');
    expect(manualDocs).not.toContain('/admin/fairness');
    expect(manualDocs).not.toContain('/admin/users');
    expect(manualDocs).not.toContain('/admin/organizations');
    expect(manualDocs).not.toContain('Expertise Profile');
    expect(manualDocs).not.toContain('Zen Hub');
    expect(manualDocs).not.toContain('Well-being tracking');
    expect(manualDocs).not.toContain('proof-first hiring');
    expect(manualDocs).not.toContain('Candidate proof review cards');
    expect(manualDocs).not.toContain('candidate consent');
    expect(manualDocs).not.toContain('candidate contact details');
    expect(manualDocs).not.toContain('hire/engage');
    expect(docsRegistry).toContain(
      '| `MANUAL_TESTING_CHECKLIST.md`                                                                           | `reference-spec` | `root`        | `repo`              | `2026-05-21`'
    );
    expect(docsRegistry).toContain(
      '| `MANUAL_TESTING_GUIDE.md`                                                                               | `reference-spec` | `root`        | `repo`              | `2026-05-21`'
    );
  });

  it('keeps the admin testing guide and smoke probe scoped to launch ops', () => {
    const adminGuide = fs.readFileSync(
      path.join(repoRoot, 'ADMIN_DASHBOARD_TESTING_GUIDE.md'),
      'utf8'
    );
    const adminSmoke = fs.readFileSync(
      path.join(repoRoot, 'e2e/admin-dashboard-smoke.spec.ts'),
      'utf8'
    );
    const adminDataProbe = fs.readFileSync(
      path.join(repoRoot, 'scripts/test-admin-dashboard-data.js'),
      'utf8'
    );
    const adminAudit = fs.readFileSync(
      path.join(repoRoot, 'audit/admin-dashboard-mvp-ops-review-2026-05-03.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');
    const activeAdminEvidence = `${adminGuide}\n${adminSmoke}\n${adminDataProbe}`;

    expect(adminGuide).toContain('Last Verified: `2026-05-19`');
    expect(adminAudit).toContain('Last Verified: `2026-05-20`');
    expect(adminAudit).toContain(
      'Disposition: resolved for current MVP queue metadata projection on 2026-05-20.'
    );
    expect(adminAudit).toContain('Disposition: resolved on 2026-05-20.');
    expect(adminAudit).toContain(
      'Disposition: resolved as a minimal repo-evidence card on 2026-05-20.'
    );
    expect(adminGuide).toContain('/admin/verification');
    expect(adminGuide).toContain('/admin/audit');
    expect(adminGuide).toContain('tests/ui/admin-dashboard-launch-links.test.tsx');
    expect(adminGuide).toContain('tests/api/admin-internal-ops-queue-route.test.ts');
    expect(adminGuide).toContain('docs/internal-ops/index.md');
    expect(adminGuide).toContain('archived/post-MVP');

    expect(activeAdminEvidence).toContain('/api/admin/internal-ops/queues');
    expect(activeAdminEvidence).toContain('/api/admin/audit?page=1&limit=20&search=');
    expect(activeAdminEvidence).toContain('Operations Queues');
    expect(activeAdminEvidence).toContain('Audit Logs');
    expect(activeAdminEvidence).not.toContain('launch health panel is invisible');
    expect(activeAdminEvidence).not.toContain('admin dashboard/i');
    expect(activeAdminEvidence).not.toContain('linkedin verification queue');
    expect(activeAdminEvidence).not.toContain('/api/admin/analytics/overview');
    expect(activeAdminEvidence).not.toContain('/api/metrics/all');
    expect(activeAdminEvidence).not.toContain('Growth API Endpoint');
    expect(activeAdminEvidence).not.toContain('Fairness API Endpoint');
    expect(docsRegistry).toContain(
      '| `ADMIN_DASHBOARD_TESTING_GUIDE.md`                                                                      | `active`         | `root`        | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `audit/admin-dashboard-mvp-ops-review-2026-05-03.md` | `reference-spec` | `audit` | `repo` | `2026-05-20`'
    );
  });

  it('keeps the root quick start launch-safe and free of retired migration promises', () => {
    const quickStart = fs.readFileSync(path.join(repoRoot, 'QUICK_START.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(quickStart).toContain('Last Verified: `2026-05-21`');
    expect(quickStart).toContain('locked Proofound MVP corridor');
    expect(quickStart).toContain('proof-first assignment review corridor');
    expect(quickStart).toContain('proof submission review');
    expect(quickStart).toContain('Manual meeting links remain');
    expect(quickStart).toContain('/app/i/portfolio');
    expect(quickStart).toContain('/app/o/test-org/assignments');
    expect(quickStart).toContain('/admin/verification');
    expect(quickStart).toContain('npm run test:launch:routes');
    expect(quickStart).not.toContain('cjpfrgmsxwxhuomnvciq');
    expect(quickStart).not.toContain('migrations-to-run.sql');
    expect(quickStart).not.toContain('Well-being tracking in Zen Hub');
    expect(quickStart).not.toContain('Dashboard customization');
    expect(quickStart).not.toContain('First-run tour appears');
    expect(quickStart).not.toContain('Click "Connect Zoom"');
    expect(quickStart).not.toContain('proof-first hiring corridor');
    expect(quickStart).not.toContain('candidate proof review');
    expect(docsRegistry).toContain(
      '| `QUICK_START.md`                                                                                        | `active`         | `root`        | `repo+live`         | `2026-05-21`'
    );
  });

  it('keeps the logging migration guide scoped to active MVP surfaces', () => {
    const loggingGuide = fs.readFileSync(path.join(repoRoot, 'LOGGING_MIGRATION_GUIDE.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(loggingGuide).toContain('Last Verified: `2026-05-19`');
    expect(loggingGuide).toContain('Proof Packs');
    expect(loggingGuide).toContain('/admin/verification');
    expect(loggingGuide).toContain("rg -n 'console\\.(log|warn|error|debug)'");
    expect(loggingGuide).toContain("g '!src/archive/**'");
    expect(loggingGuide).toContain('Never log raw private proof content');
    expect(loggingGuide).not.toContain('src/app/app/i/expertise/page.tsx');
    expect(loggingGuide).not.toContain('AddSkillDrawer.tsx');
    expect(loggingGuide).not.toContain('EditSkillWindow.tsx');
    expect(loggingGuide).not.toContain('grep -r');
    expect(loggingGuide).not.toContain('Expertise Page');
    expect(loggingGuide).not.toContain('Click "Connect Zoom"');
    expect(docsRegistry).toContain(
      '| `LOGGING_MIGRATION_GUIDE.md`                                                                            | `active`         | `root`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps superseded Expertise fix instructions out of active launch guidance', () => {
    const fixInstructions = fs.readFileSync(path.join(repoRoot, 'FIX_INSTRUCTIONS.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(fixInstructions).toContain('Doc Class: `historical`');
    expect(fixInstructions).toContain('Last Verified: `2026-05-19`');
    expect(fixInstructions).toContain('/app/i/expertise` is archived outside launch scope');
    expect(fixInstructions).toContain('Proof Packs');
    expect(fixInstructions).not.toContain('FINAL SOLUTION');
    expect(fixInstructions).not.toContain('Refresh Sofia');
    expect(fixInstructions).not.toContain('src/app/app/i/expertise/page.tsx');
    expect(fixInstructions).not.toContain('console.log debugging');
    expect(docsRegistry).toContain(
      '| `FIX_INSTRUCTIONS.md`                                                                                   | `historical`     | `root`        | `archive`           | `2026-05-19`'
    );
  });

  it('keeps migration runbooks aligned with checkpoint and restore discipline', () => {
    const applyManual = fs.readFileSync(path.join(repoRoot, 'APPLY_MIGRATIONS_MANUAL.md'), 'utf8');
    const runGuide = fs.readFileSync(path.join(repoRoot, 'RUN_MIGRATIONS_GUIDE.md'), 'utf8');
    const deploymentGuide = fs.readFileSync(
      path.join(repoRoot, 'docs/deployment-guide.md'),
      'utf8'
    );
    const applyNewMigrations = fs.readFileSync(
      path.join(repoRoot, 'scripts/apply-new-migrations.mjs'),
      'utf8'
    );
    const applyTriggerFix = fs.readFileSync(
      path.join(repoRoot, 'scripts/apply-trigger-fix.mjs'),
      'utf8'
    );
    const seedDemoOrganizations = fs.readFileSync(
      path.join(repoRoot, 'scripts/seed-demo-organizations.mjs'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');
    const migrationDocs = `${applyManual}\n${runGuide}\n${deploymentGuide}\n${applyNewMigrations}\n${applyTriggerFix}\n${seedDemoOrganizations}`;
    const unsafeMigrationHelpers = `${applyNewMigrations}\n${applyTriggerFix}\n${seedDemoOrganizations}`;

    for (const content of [applyManual, runGuide]) {
      expect(content).toContain('Last Verified: `2026-05-19`');
      expect(content).toContain('npm run db:drift-check');
      expect(content).toContain('npm run db:backup:checkpoint');
      expect(content).toContain('npm run db:audit:migrations');
      expect(content).toContain('npm run db:migrate');
      expect(content).toContain(
        'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json'
      );
      expect(content).toContain('docs/launch-restore-drill.md');
      expect(content).toContain('Do not');
    }

    expect(migrationDocs).toContain('Do not use `npm run db:push`');
    expect(migrationDocs).toContain('public.app_migration_ledger');
    expect(migrationDocs).toContain('production-candidate');
    expect(migrationDocs).not.toContain('Supabase Dashboard method');
    expect(migrationDocs).not.toContain('copy it into Supabase SQL Editor');
    expect(migrationDocs).not.toContain('Supabase Dashboard → SQL Editor');
    expect(migrationDocs).not.toContain('dashboard → SQL Editor');
    expect(unsafeMigrationHelpers).not.toContain('npm run db:push');
    expect(migrationDocs).toContain('npm run db:migrate');
    expect(docsRegistry).toContain(
      '| `APPLY_MIGRATIONS_MANUAL.md`                                                                            | `active`         | `root`        | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `RUN_MIGRATIONS_GUIDE.md`                                                                               | `active`         | `root`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps the old RLS deployment summary out of current launch evidence', () => {
    const rlsSummary = fs.readFileSync(path.join(repoRoot, 'RLS_DEPLOYMENT_SUMMARY.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(rlsSummary).toContain('Doc Class: `historical`');
    expect(rlsSummary).toContain('Last Verified: `2026-05-19`');
    expect(compactWhitespace(rlsSummary)).toContain('Do not use it as current launch evidence');
    expect(rlsSummary).toContain('tests/privacy/rls-mvp-isolation.test.ts');
    expect(rlsSummary).toContain('tests/privacy/storage-policies.test.ts');
    expect(rlsSummary).toContain('npm run db:drift-check');
    expect(rlsSummary).toContain('npm run db:backup:checkpoint');
    expect(rlsSummary).toContain('npm run db:audit:migrations');
    expect(rlsSummary).toContain('npm run db:migrate');
    expect(rlsSummary).toContain(
      'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json'
    );
    expect(rlsSummary).toContain('Do not use `npm run db:push`');
    expect(rlsSummary).toContain('Historical Snapshot');
    expect(rlsSummary).not.toContain('Production-ready');
    expect(rlsSummary).not.toContain('GDPR Compliance');
    expect(rlsSummary).not.toContain('100% Coverage');
    expect(rlsSummary).not.toContain('Action Required');
    expect(docsRegistry).toContain(
      '| `RLS_DEPLOYMENT_SUMMARY.md`                                                                             | `historical`     | `root`        | `archive`           | `2026-05-19`'
    );
  });

  it('keeps the deployment checklist aligned with launch-safe migration and smoke gates', () => {
    const deploymentChecklist = fs.readFileSync(
      path.join(repoRoot, 'docs/DEPLOYMENT_CHECKLIST.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(deploymentChecklist).toContain('Last Verified: `2026-05-21`');
    expect(deploymentChecklist).toContain('locked Proofound MVP corridor');
    expect(deploymentChecklist).toContain('production-candidate');
    expect(deploymentChecklist).toContain('npm run db:drift-check');
    expect(deploymentChecklist).toContain('npm run db:backup:checkpoint');
    expect(deploymentChecklist).toContain('npm run db:audit:migrations');
    expect(deploymentChecklist).toContain('npm run db:migrate');
    expect(deploymentChecklist).toContain(
      'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json'
    );
    expect(deploymentChecklist).toContain('public.app_migration_ledger');
    expect(deploymentChecklist).toContain('Do not use `npm run db:push`');
    expect(deploymentChecklist).toContain('/api/monitoring/launch-status');
    expect(deploymentChecklist).toContain('INTERNAL_API_SECRET=<secret>');
    expect(deploymentChecklist).toContain(
      'BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run launch:status'
    );
    expect(deploymentChecklist).toContain('/api/monitoring/perf-status');
    expect(deploymentChecklist).toContain('/api/assignments');
    expect(deploymentChecklist).toContain('proof-submission review');
    expect(deploymentChecklist).toContain('Use Browser');
    expect(deploymentChecklist).toContain('Manual interview links remain');
    expect(deploymentChecklist).not.toContain('Run `supabase/storage-setup.sql`');
    expect(deploymentChecklist).not.toContain('In Supabase SQL Editor');
    expect(deploymentChecklist).not.toContain('Copy contents of supabase/storage-setup.sql');
    expect(deploymentChecklist).not.toContain('Messaging System');
    expect(deploymentChecklist).not.toContain('Match scores displayed');
    expect(deploymentChecklist).not.toContain('candidate proof review');
    expect(docsRegistry).toContain(
      '| `docs/DEPLOYMENT_CHECKLIST.md`                                                                          | `active`         | `docs`        | `repo+live`         | `2026-05-21`'
    );
  });

  it('keeps the storage setup guide aligned with private upload lifecycle', () => {
    const storageSetup = fs.readFileSync(path.join(repoRoot, 'docs/STORAGE_SETUP.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(storageSetup).toContain('Last Verified: `2026-05-19`');
    expect(storageSetup).toContain('user-uploads-quarantine');
    expect(storageSetup).toContain('user-uploads-private');
    expect(storageSetup).toContain('manual_review');
    expect(storageSetup).toContain('uploaded_files');
    expect(storageSetup).toContain('POST /api/upload/document');
    expect(storageSetup).toContain('DELETE /api/upload/document?fileId=<uploaded-file-id>');
    expect(storageSetup).toContain(
      'Does not return a public URL for private proof/document uploads'
    );
    expect(storageSetup).toContain('Do not use `npm run db:push`');
    expect(storageSetup).toContain(
      'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json'
    );
    expect(storageSetup).toContain('tests/privacy/storage-policies.test.ts');
    expect(storageSetup).toContain('tests/lib/public-portfolio-projection.test.ts');
    expect(storageSetup).not.toContain('Recommended for First-Time Setup');
    expect(storageSetup).not.toContain('supabase db push');
    expect(storageSetup).not.toContain('Run the SQL Migration');
    expect(storageSetup).not.toContain('DELETE /api/upload/document?path=');
    expect(storageSetup).not.toContain('Public files are viewable by everyone');
    expect(docsRegistry).toContain(
      '| `docs/STORAGE_SETUP.md`                                                                                 | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps retired smart search deployment steps out of active launch guidance', () => {
    const smartSearchSteps = fs.readFileSync(
      path.join(repoRoot, 'DEPLOYMENT_STEPS_SMART_SEARCH.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(smartSearchSteps).toContain('Doc Class: `historical`');
    expect(smartSearchSteps).toContain('Last Verified: `2026-05-19`');
    expect(smartSearchSteps).toContain(
      '/app/i/expertise` and the broad Expertise Atlas UI are archived'
    );
    expect(smartSearchSteps).toContain('Proof Packs');
    expect(smartSearchSteps).toContain('APPLY_MIGRATIONS_MANUAL.md');
    expect(smartSearchSteps).not.toContain('supabase db push');
    expect(smartSearchSteps).not.toContain('SQL Editor');
    expect(smartSearchSteps).not.toContain('cjpfrgmsxwxhuomnvciq');
    expect(smartSearchSteps).not.toContain('Navigate to the Expertise tab');
    expect(docsRegistry).toContain(
      '| `DEPLOYMENT_STEPS_SMART_SEARCH.md`                                                                      | `historical`     | `root`        | `archive`           | `2026-05-19`'
    );
  });

  it('keeps retained expertise taxonomy guidance from reviving archived Atlas UI', () => {
    const expertiseSetup = fs.readFileSync(
      path.join(repoRoot, 'docs/EXPERTISE_ATLAS_SETUP.md'),
      'utf8'
    );
    const expertiseDatasetReadme = fs.readFileSync(
      path.join(repoRoot, 'data/README-EXPERTISE-ATLAS-SKILLS.md'),
      'utf8'
    );
    const taxonomyRecovery = fs.readFileSync(
      path.join(repoRoot, 'agent/runbooks/expertise-taxonomy-recovery.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');
    const combined = [expertiseSetup, expertiseDatasetReadme, taxonomyRecovery].join('\n');

    expect(expertiseSetup).toContain('Doc Class: `active`');
    expect(expertiseSetup).toContain('Last Verified: `2026-05-19`');
    expect(expertiseSetup).toContain(
      '/app/i/expertise` and the broad Expertise Atlas UI are archived'
    );
    expect(expertiseSetup).toContain('Do not use archived Expertise Atlas UI files');
    expect(expertiseSetup).toContain('npm run db:drift-check');
    expect(expertiseSetup).toContain('POST /api/match/profile');
    expect(expertiseSetup).not.toContain('POST /api/core/matching/profile');
    expect(expertiseSetup).toContain('retained near-matches handler');
    expect(expertiseSetup).not.toContain('POST /api/core/matching/near-matches');
    expect(expertiseDatasetReadme).toContain('Doc Class: `reference-spec`');
    expect(expertiseDatasetReadme).toContain('Last Verified: `2026-05-19`');
    expect(expertiseDatasetReadme).toContain(
      '/app/i/expertise` and the broad Expertise Atlas UI are archived'
    );
    expect(expertiseDatasetReadme).toContain('not active launch evidence');
    expect(expertiseDatasetReadme).toContain('Historical Usage Pattern');
    expect(expertiseDatasetReadme).toContain('Reference Follow-Ups Only');
    expect(expertiseDatasetReadme).toContain('target-approved taxonomy recovery plan');
    expect(expertiseDatasetReadme).toContain(
      'proof-skill selection and assignment expertise helpers'
    );
    expect(expertiseDatasetReadme).not.toContain('for the Expertise Atlas MVP');
    expect(expertiseDatasetReadme).not.toContain('20,000 L4 skills for Expertise Atlas MVP');
    expect(expertiseDatasetReadme).not.toContain(
      'Import to Database:** Run the import script above'
    );
    expect(taxonomyRecovery).toContain('Last Verified: `2026-05-19`');
    expect(taxonomyRecovery).toContain('retained taxonomy APIs');
    expect(taxonomyRecovery).toContain(
      'not a runbook for restoring the archived `/app/i/expertise` UI'
    );
    expect(taxonomyRecovery).toContain('A target is explicit and approved');
    expect(taxonomyRecovery).toContain('isolated restore rehearsal');
    expect(taxonomyRecovery).toContain('/app/i/expertise` remains archived/unavailable');
    expect(combined).not.toContain('dashboard taxonomy context is missing');
    expect(combined).toContain('Do not use this runbook to run `db:push`');
    expect(combined).toContain('revive archived Expertise Atlas UI routes');
    expect(docsRegistry).toContain(
      '| `docs/EXPERTISE_ATLAS_SETUP.md`                                                                         | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `data/README-EXPERTISE-ATLAS-SKILLS.md`                                                                 | `reference-spec` | `data`        | `repo`              | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `agent/runbooks/expertise-taxonomy-recovery.md` | `active` | `agent` | `repo+live` | `2026-05-19`'
    );
  });

  it('keeps active expertise taxonomy responses free of numeric match scores', () => {
    const taxonomyRoute = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/expertise/taxonomy/route.ts'),
      'utf8'
    );
    const taxonomyRouteTest = fs.readFileSync(
      path.join(repoRoot, 'tests/api/expertise-taxonomy-route.test.ts'),
      'utf8'
    );

    expect(taxonomyRoute).toContain('taxonomyMatchConfidenceLabel');
    expect(taxonomyRoute).toContain('matchConfidence: taxonomyMatchConfidenceLabel(match?.score)');
    expect(taxonomyRoute).toContain('matchConfidence: s.matchConfidence ?? null');
    expect(taxonomyRoute).not.toContain('matchScore: match?.score');
    expect(taxonomyRoute).not.toContain('matchScore: s.matchScore');
    expect(taxonomyRouteTest).toContain('without numeric match scores');
    expect(taxonomyRouteTest).toContain("not.toHaveProperty('matchScore')");
  });

  it('keeps the Supabase setup guide target-agnostic and launch-safe', () => {
    const setupSupabase = fs.readFileSync(path.join(repoRoot, 'SETUP_SUPABASE.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(setupSupabase).toContain('Last Verified: `2026-05-21`');
    expect(setupSupabase).toContain('locked Proofound');
    expect(setupSupabase).toContain('MVP corridor');
    expect(setupSupabase).toContain('docs/ENV_VARIABLES.md');
    expect(setupSupabase).toContain('APPLY_MIGRATIONS_MANUAL.md');
    expect(setupSupabase).toContain('npm run db:drift-check');
    expect(setupSupabase).toContain('npm run db:backup:checkpoint');
    expect(setupSupabase).toContain('npm run db:audit:migrations');
    expect(setupSupabase).toContain('npm run db:migrate');
    expect(setupSupabase).toContain(
      'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json'
    );
    expect(setupSupabase).toContain('Do not use direct schema-push commands');
    expect(setupSupabase).toContain('Do not use dashboard SQL paste');
    expect(setupSupabase).toContain('Supabase MCP can be useful for read-only inspection');
    expect(setupSupabase).toContain('INTERNAL_API_SECRET=<secret>');
    expect(setupSupabase).not.toContain('SUS_STUDY_COMPLETE');
    expect(setupSupabase).toContain('Proof Packs');
    expect(setupSupabase).not.toContain('cjpfrgmsxwxhuomnvciq');
    expect(setupSupabase).not.toContain('This is safe because MCP only runs');
    expect(setupSupabase).not.toContain('Running migrations (`npm run db:push`)');
    expect(setupSupabase).not.toContain('awesome platform');
    expect(setupSupabase).not.toContain('🎉');
    expect(docsRegistry).toContain(
      '| `SETUP_SUPABASE.md`                                                                                     | `active`         | `root`        | `repo+live`         | `2026-05-21`'
    );
  });

  it('keeps the Supabase MCP guide target-agnostic and read-only by default', () => {
    const mcpGuide = fs.readFileSync(path.join(repoRoot, 'docs/SUPABASE_MCP_SETUP.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(mcpGuide).toContain('Last Verified: `2026-05-19`');
    expect(mcpGuide).toContain('not launch evidence by itself');
    expect(mcpGuide).toContain('Prefer read-only inspection');
    expect(mcpGuide).toContain('project_ref=<project-ref>');
    expect(mcpGuide).toContain('SUPABASE_SERVICE_ROLE_KEY` bypasses RLS');
    expect(mcpGuide).toContain('npm run db:drift-check');
    expect(mcpGuide).toContain('npm run db:backup:checkpoint');
    expect(mcpGuide).toContain('npm run db:audit:migrations');
    expect(mcpGuide).toContain('npm run db:migrate');
    expect(mcpGuide).toContain(
      'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json'
    );
    expect(mcpGuide).toContain('Do not use direct schema-push commands');
    expect(mcpGuide).toContain('Do not use dashboard SQL paste');
    expect(mcpGuide).not.toContain('cjpfrgmsxwxhuomnvciq');
    expect(mcpGuide).not.toContain('Running migrations (`npm run db:push`)');
    expect(mcpGuide).not.toContain('mcp_supabase_apply_migration');
    expect(mcpGuide).not.toContain('Your Supabase project');
    expect(mcpGuide).not.toContain('All tables have **Row Level Security (RLS) enabled**');
    expect(docsRegistry).toContain(
      '| `docs/SUPABASE_MCP_SETUP.md`                                                                            | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps the Supabase MCP status note free of stale target snapshots', () => {
    const mcpStatus = fs.readFileSync(path.join(repoRoot, 'MCP_STATUS.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(mcpStatus).toContain('Last Verified: `2026-05-19`');
    expect(mcpStatus).toContain('optional operator tool');
    expect(mcpStatus).toContain('not an MVP source of truth');
    expect(mcpStatus).toContain('Project refs are environment-specific');
    expect(mcpStatus).toContain('read-only schema inspection');
    expect(mcpStatus).toContain('Do not use Supabase MCP to');
    expect(mcpStatus).toContain('migration runbooks');
    expect(mcpStatus).toContain('old table snapshot');
    expect(mcpStatus).not.toContain('cjpfrgmsxwxhuomnvciq');
    expect(mcpStatus).not.toContain('Connection target: Supabase MCP for project');
    expect(mcpStatus).not.toContain('Recent MCP discovery confirms');
    expect(mcpStatus).not.toContain('leaked password protection was previously reported');
    expect(docsRegistry).toContain(
      '| `MCP_STATUS.md`                                                                                         | `active`         | `root`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps internal ops SOPs current and protected-route scoped', () => {
    const internalOpsDocs = [
      'docs/internal-ops/index.md',
      'docs/internal-ops/verification-review-sop.md',
      'docs/internal-ops/redaction-risky-upload-sop.md',
      'docs/internal-ops/reveal-privacy-dispute-sop.md',
      'docs/internal-ops/assignment-quality-checklist.md',
      'docs/internal-ops/engagement-verification-evidence-checklist.md',
      'docs/internal-ops/workflow-comms-templates.md',
    ];
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    for (const docPath of internalOpsDocs) {
      const content = fs.readFileSync(path.join(repoRoot, docPath), 'utf8');
      expect(content).toContain('Last Verified: `2026-05-19`');
      expect(docsRegistry).toContain(`| \`${docPath}\``);
      const registryLine = docsRegistry
        .split('\n')
        .find((line) => line.includes(`| \`${docPath}\``));
      expect(registryLine).toContain('| `2026-05-19`');
    }

    const index = fs.readFileSync(path.join(repoRoot, 'docs/internal-ops/index.md'), 'utf8');
    const verificationReview = fs.readFileSync(
      path.join(repoRoot, 'docs/internal-ops/verification-review-sop.md'),
      'utf8'
    );
    const revealPrivacyDispute = fs.readFileSync(
      path.join(repoRoot, 'docs/internal-ops/reveal-privacy-dispute-sop.md'),
      'utf8'
    );
    const engagementVerificationChecklist = fs.readFileSync(
      path.join(repoRoot, 'docs/internal-ops/engagement-verification-evidence-checklist.md'),
      'utf8'
    );
    const verificationPolicy = fs.readFileSync(
      path.join(repoRoot, 'docs/verification-policy-mvp.md'),
      'utf8'
    );
    const adminVerificationDashboardTest = fs.readFileSync(
      path.join(repoRoot, 'tests/ui/admin-verification-dashboard.test.tsx'),
      'utf8'
    );
    const adminVerificationDashboard = fs.readFileSync(
      path.join(repoRoot, 'src/components/admin/AdminVerificationDashboard.tsx'),
      'utf8'
    );
    const internalOpsQueue = fs.readFileSync(
      path.join(repoRoot, 'src/lib/internal-ops/queue.ts'),
      'utf8'
    );
    expect(index).toContain('/admin/verification');
    expect(index).toContain('/api/admin/internal-ops/queues');
    expect(index).toContain('admin/internal-only');
    expect(index).toContain('public and logged-out users must not see queue content');
    expect(index).toContain('proof-review workflow');
    expect(index).toContain('pushing more proof review');
    expect(index).not.toContain('the hiring corridor');
    expect(index).not.toContain('pushing more candidate review');
    expect(verificationReview).toContain('reveal/privacy dispute');
    expect(verificationReview).toContain('live intro, interview, or decision path');
    expect(verificationReview).not.toContain('candidate-facing dispute');
    expect(verificationReview).not.toContain('live hiring decision');
    expect(revealPrivacyDispute).toContain(
      'a proof-review participant disputes a reveal state or says consent was not respected'
    );
    expect(revealPrivacyDispute).not.toContain(
      'a candidate disputes a reveal state or says consent was not respected'
    );
    expect(engagementVerificationChecklist).toContain(
      'matching organization confirmation plus proof-review participant confirmation'
    );
    expect(engagementVerificationChecklist).toContain(
      'same proof-review participant, organization, and engagement fact'
    );
    expect(engagementVerificationChecklist).toContain(
      'linked decision, proof-review participant, and organization'
    );
    expect(engagementVerificationChecklist).not.toContain(
      'matching org confirmation plus candidate confirmation'
    );
    expect(engagementVerificationChecklist).not.toContain(
      'same candidate, organization, and engagement fact'
    );
    expect(engagementVerificationChecklist).not.toContain(
      'linked decision, candidate, and organization'
    );
    expect(verificationPolicy).toContain(
      'organization confirmation plus a proof-review participant confirmation'
    );
    expect(verificationPolicy).not.toContain('org confirmation plus a candidate confirmation');
    expect(adminVerificationDashboardTest).toContain(
      'Pilot workflow is stuck after engagement decision.'
    );
    expect(adminVerificationDashboard).toContain('Proof-review participant consent');
    expect(adminVerificationDashboard).toContain(
      "candidateConsentStatus: 'Proof-review participant consent status'"
    );
    expect(adminVerificationDashboard).toContain("candidate: 'Proof-review participant'");
    expect(adminVerificationDashboard).toContain(
      "candidate_consented: 'Proof-review participant consented'"
    );
    expect(internalOpsQueue).toContain('Proof-review participant consent');
    expect(adminVerificationDashboardTest).toContain('Proof-review participant consent:');
    expect(adminVerificationDashboardTest).toContain('Proof-review participant consent status:');
    expect(adminVerificationDashboardTest).toContain('Proof-review participant consented');
    expect(adminVerificationDashboardTest).toContain('Proof-review participant');
    expect(adminVerificationDashboard).not.toContain("'Candidate consent'");
    expect(adminVerificationDashboard).not.toContain('Candidate Consent Status');
    expect(internalOpsQueue).not.toContain("'Candidate consent'");
    expect(adminVerificationDashboardTest).not.toContain("screen.getByText('Candidate')");
    expect(adminVerificationDashboardTest).not.toContain("screen.getByText('Candidate Consented')");
    expect(adminVerificationDashboardTest).not.toContain(
      "summary: 'Pilot workflow is stuck after hire decision.'"
    );

    const templates = fs.readFileSync(
      path.join(repoRoot, 'docs/internal-ops/workflow-comms-templates.md'),
      'utf8'
    );
    expect(templates).toContain('Do not include private proof content');
    expect(templates).toContain('locked MVP corridor');
    expect(templates).toContain(
      'matching organization confirmation plus proof-review participant confirmation'
    );
    expect(templates).not.toContain(
      'matching organization confirmation plus candidate confirmation'
    );
  });

  it('keeps engagement verification pilot-ops queue copy workflow-led', () => {
    const engagementVerificationService = fs.readFileSync(
      path.join(repoRoot, 'src/lib/engagement-verifications/service.ts'),
      'utf8'
    );
    const engagementVerificationTest = fs.readFileSync(
      path.join(repoRoot, 'tests/lib/engagement-verifications.test.ts'),
      'utf8'
    );

    expect(engagementVerificationService).toContain(
      'Workflow decision recorded. Engagement confirmation still needs pilot follow-through.'
    );
    expect(engagementVerificationService).not.toContain(
      'Hire recorded. Engagement confirmation still needs pilot follow-through.'
    );
    expect(engagementVerificationTest).toContain(
      'Workflow decision recorded. Engagement confirmation still needs pilot follow-through.'
    );
  });

  it('keeps April launch signoff files historical, not current go/no-go proof', () => {
    const ownerRoster = fs.readFileSync(
      path.join(repoRoot, 'docs/internal-ops/launch-owner-roster-2026-04-27.md'),
      'utf8'
    );
    const launchEvidence = fs.readFileSync(
      path.join(repoRoot, 'docs/internal-ops/production-launch-evidence-2026-04-27.md'),
      'utf8'
    );
    const launchSignoff = fs.readFileSync(
      path.join(repoRoot, 'docs/launch-signoff-2026-04-27.md'),
      'utf8'
    );
    const internalOpsIndex = fs.readFileSync(
      path.join(repoRoot, 'docs/internal-ops/index.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    for (const content of [ownerRoster, launchEvidence, launchSignoff]) {
      expect(content).toContain('Doc Class: `historical`');
      expect(content).toContain('Last Verified: `2026-05-19`');
      expect(content).toContain('April 27, 2026');
    }

    expect(launchEvidence).toMatch(/Do\s+not use it as current launch readiness/);
    expect(launchEvidence).toContain('final go/no-go on the intended target');
    expect(launchSignoff).toContain('Do not use it as current');
    expect(launchSignoff).toContain('Current launch readiness remains unproven');
    expect(ownerRoster).toMatch(/Do\s+not use it as proof that current launch-owner coverage/);
    expect(internalOpsIndex).toContain('Historical launch owner roster');
    expect(internalOpsIndex).toContain('Historical production launch evidence');
    expect(internalOpsIndex).toContain('not current go/no-go authority');
    expect(launchEvidence).not.toContain('Full launch gate bundle: `GO`');
    expect(launchSignoff).not.toContain('Decision: `GO`');
    expect(launchSignoff).not.toContain('approve GO for the founder-led production MVP launch');
    expect(docsRegistry).toContain(
      '| `docs/internal-ops/launch-owner-roster-2026-04-27.md`                                                   | `historical`     | `docs`        | `archive`           | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `docs/internal-ops/production-launch-evidence-2026-04-27.md`                                            | `historical`     | `docs`        | `archive`           | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `docs/launch-signoff-2026-04-27.md`                                                                     | `historical`     | `docs`        | `archive`           | `2026-05-19`'
    );
  });

  it('keeps launch signoff and QA guidance tied to current target evidence', () => {
    const signoffTemplate = fs.readFileSync(
      path.join(repoRoot, 'docs/full-launch-signoff-memo-template.md'),
      'utf8'
    );
    const qaBugs = fs.readFileSync(path.join(repoRoot, 'docs/qa/bugs.md'), 'utf8');
    const qaSummary = fs.readFileSync(path.join(repoRoot, 'docs/qa/summary.md'), 'utf8');
    const loginPage = fs.readFileSync(path.join(repoRoot, 'src/app/login/page.tsx'), 'utf8');
    const debugIngest = fs.readFileSync(path.join(repoRoot, 'src/lib/debug-ingest.ts'), 'utf8');
    const envExample = fs.readFileSync(path.join(repoRoot, '.env.example'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(signoffTemplate).toContain('Last Verified: `2026-05-19`');
    expect(signoffTemplate).toContain('Historical GO memos');
    expect(signoffTemplate).toContain('Database target');
    expect(signoffTemplate).toContain('Live `/api/monitoring/perf-status`');
    expect(signoffTemplate).toContain('/api/assignments');
    expect(signoffTemplate).toContain('Production-candidate backup checkpoint');
    expect(signoffTemplate).toContain('Isolated restore rehearsal');
    expect(signoffTemplate).toContain('Proof-submission supply-seeding plan ready');
    expect(signoffTemplate).toContain('Browser desktop/mobile smoke evidence');
    expect(signoffTemplate).toContain('Privacy/no-leak checks');
    expect(signoffTemplate).not.toContain('Candidate supply-seeding plan ready');

    expect(qaSummary).toContain('Last Verified: `2026-05-21`');
    expect(qaSummary).toContain('INTERNAL_API_SECRET=<secret>');
    expect(qaSummary).toContain('npm run test:launch:routes');
    expect(qaSummary).toContain('npm run test:launch:workflow');
    expect(qaSummary).toContain('npm run test:launch:smoke');
    expect(qaSummary).toContain('monitor:launch');
    expect(qaSummary).toContain('Node 24.15.0/npm 11.12.1');
    expect(qaSummary).toContain('Browser desktop/mobile evidence');
    expect(qaSummary).toContain('workflow recommendation');
    expect(qaSummary).toContain('change match/review/trust/workflow state');
    expect(qaSummary).not.toContain('hiring recommendation');
    expect(qaSummary).not.toContain('change match/review/trust/hiring state');
    expect(qaSummary).not.toContain('PATH=/opt/homebrew/opt/node@20/bin:$PATH');

    expect(qaBugs).toContain('Last Verified: `2026-05-19`');
    expect(qaBugs).toContain('B-008 Login page debug localhost ingest calls');
    expect(qaBugs).toContain('Status: fixed');
    expect(qaBugs).toContain('No hardcoded localhost ingest endpoint');
    expect(qaBugs).toContain('route, viewport, role/mode');
    expect(loginPage).toContain('sendDebugIngest');
    expect(debugIngest).toContain('DEBUG_INGEST_URL');
    expect(debugIngest).toContain('NEXT_PUBLIC_DEBUG_INGEST_URL');
    expect(envExample).toContain('DEBUG_INGEST_ENABLED=false');
    expect(`${loginPage}\n${debugIngest}\n${envExample}`).not.toMatch(/localhost:\d+\/.*ingest/);

    expect(docsRegistry).toContain(
      '| `docs/full-launch-signoff-memo-template.md`                                                             | `active`         | `docs`        | `repo`              | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `docs/qa/bugs.md`                                                                                       | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `docs/qa/summary.md`                                                                                    | `active`         | `docs`        | `repo+live`         | `2026-05-21`'
    );
  });

  it('keeps February project flow and PR triage snapshots historical', () => {
    const flowMatrix = fs.readFileSync(
      path.join(repoRoot, 'project/MVP_FLOW_MATRIX_2026-02-12.md'),
      'utf8'
    );
    const prTriage = fs.readFileSync(path.join(repoRoot, 'project/PR_TRIAGE_2026-02.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    for (const content of [flowMatrix, prTriage]) {
      expect(content).toContain('Doc Class: `historical`');
      expect(content).toContain('Last Verified: `2026-05-19`');
      expect(content).not.toContain('Doc Class: `active`');
    }

    expect(flowMatrix).toMatch(/Do\s+not\s+use it as current MVP flow truth/);
    expect(flowMatrix).toContain('manual-link first');
    expect(flowMatrix).toContain('STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true');
    expect(flowMatrix).toContain('Browser desktop/mobile evidence');
    expect(flowMatrix).not.toContain('both Zoom + Google connected');
    expect(flowMatrix).not.toContain('both Zoom and Google connected');
    expect(flowMatrix).not.toContain('MVP 100% readiness is **not yet reached**');

    expect(prTriage).toMatch(/Do\s+not\s+use it as current\s+GitHub PR state/);
    expect(prTriage).toContain(
      'current GitHub PR state only when the task explicitly requires PR work'
    );
    expect(prTriage).not.toContain('Current Active Queue');
    expect(prTriage).not.toContain('Merge state');

    expect(docsRegistry).toContain(
      '| `project/MVP_FLOW_MATRIX_2026-02-12.md`                                                                 | `historical`     | `project`     | `archive`           | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `project/PR_TRIAGE_2026-02.md`                                                                          | `historical`     | `project`     | `archive`           | `2026-05-19`'
    );
  });

  it('keeps launch operations guidance aligned with the current MVP corridor', () => {
    const launchOperations = fs.readFileSync(
      path.join(repoRoot, 'docs/launch-operations-mvp.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(launchOperations).toContain('Last Verified: `2026-05-19`');
    expect(launchOperations).toContain('Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md');
    expect(launchOperations).toContain('PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite');
    expect(launchOperations).toContain('internal-ops/index.md');
    expect(launchOperations).toContain('production-readiness-checklist.md');
    expect(launchOperations).toContain('backlog/phase-exit-checklist.md');
    expect(launchOperations).toContain('production-candidate backup checkpoint evidence');
    expect(launchOperations).toContain('isolated restore rehearsal evidence');
    expect(launchOperations).toContain('/api/assignments` latency/perf-status evidence');
    expect(launchOperations).toContain('authenticated `/api/monitoring/perf-status`');
    expect(launchOperations).toContain('review_overprecision_protected');
    expect(launchOperations).toContain('reason-coded review');
    expect(launchOperations).toContain('unordered proof review');
    expect(launchOperations).toContain('low proof-submission supply');
    expect(launchOperations).toContain('keep reviewing blind submissions');
    expect(launchOperations).toContain('proof-review participant-facing reason codes');
    expect(launchOperations).toContain('`verification`: pending or disputed verification reviews.');
    expect(launchOperations).toContain('`correction_revocation`: redaction, risky upload');
    expect(launchOperations).toContain(
      '`privacy_reveal_exception`: privacy or reveal dispute review.'
    );
    expect(launchOperations).toContain(
      '`pilot_ops`: assignment-quality, engagement-verification, and thin-supply handoffs.'
    );
    expect(launchOperations).not.toContain('fairness_suppressed_ranking');
    expect(launchOperations).not.toContain('fairness_remediation');
    expect(launchOperations).not.toContain('manual fairness note generation');
    expect(launchOperations).not.toContain('verification_pending_manual');
    expect(launchOperations).not.toContain('rank bands');
    expect(launchOperations).not.toContain('unordered candidate review');
    expect(launchOperations).not.toContain('low candidate supply');
    expect(launchOperations).not.toContain('keep reviewing blind profiles');
    expect(launchOperations).not.toContain('candidate-facing reason codes');
    expect(launchOperations).not.toContain('PRD_for_a_web_platform_MVP.master-latest.md');
    expect(docsRegistry).toContain(
      '| `docs/launch-operations-mvp.md`                                                                         | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps retired wellbeing API tests archived', () => {
    expect(fs.existsSync(path.join(repoRoot, 'tests/api-endpoints-test.ts'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'tests/lib/wellbeing-client.test.ts'))).toBe(false);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'tests/archive/non_mvp_wellbeing_api/api-endpoints.archived.ts')
      )
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'tests/archive/non_mvp_wellbeing_api/wellbeing-client.archived.test.ts')
      )
    ).toBe(true);
  });

  it('keeps active tests away from retired wellbeing APIs', () => {
    const retiredWellbeingApi = '/api/' + 'wellbeing';
    const activeTestFiles = listTestFiles(path.join(repoRoot, 'tests'));
    const offenders = activeTestFiles
      .filter((file) => fs.readFileSync(file, 'utf8').includes(retiredWellbeingApi))
      .map((file) => path.relative(repoRoot, file));

    expect(offenders).toEqual([]);
  });

  it('keeps archived why-not-shortlisted feedback out of active source', () => {
    const archivedFeedbackApi = '/api/feedback/why-not-shortlisted';
    const activeSourceFiles = listActiveSourceFiles(path.join(repoRoot, 'src'));
    const offenders = activeSourceFiles
      .filter((file) => fs.readFileSync(file, 'utf8').includes(archivedFeedbackApi))
      .map((file) => path.relative(repoRoot, file));

    expect(offenders).toEqual([
      'src/lib/__tests__/middleware-launch-archive.test.ts',
      'src/lib/launch/surface-policy.ts',
    ]);
    expect(
      fs.existsSync(
        path.join(
          repoRoot,
          'src/archive/non_launch_feedback/preserved/components/feedback/WhyNotShortlisted.tsx'
        )
      )
    ).toBe(true);
  });

  it('keeps active invite surface policy proof-submission scoped', () => {
    const surfacePolicy = fs.readFileSync(
      path.join(repoRoot, 'src/lib/launch/surface-policy.ts'),
      'utf8'
    );

    expect(surfacePolicy).toContain("surfaceLabel: 'Submission Invite API'");
    expect(surfacePolicy).toContain('Submission invite and claim flows remain active');
    expect(surfacePolicy).toContain('proof-review participant evaluation');
    expect(surfacePolicy).not.toContain('candidate evaluation');
    expect(surfacePolicy).toContain("matches: matchExactOrPrefix('/api/candidate-invites')");
    expect(surfacePolicy).not.toContain("surfaceLabel: 'Candidate Invite API'");
    expect(surfacePolicy).not.toContain('Candidate invite and claim flows remain active');
  });

  it('keeps active submission invite failure copy proof-submission scoped', () => {
    const activeInviteFiles = [
      'src/app/api/organizations/[orgId]/candidate-invites/route.ts',
      'src/app/api/organizations/[orgId]/candidate-invites/[inviteId]/route.ts',
      'src/app/api/candidate-invites/[token]/claim/route.ts',
      'src/app/api/candidate-invites/[token]/proof-card/route.ts',
      'src/app/api/candidate-invites/[token]/route.ts',
      'src/app/api/candidate-invites/[token]/workspace/route.ts',
      'src/app/candidate-invite/[token]/CandidateInviteClient.tsx',
      'src/lib/email.ts',
    ];
    const combined = activeInviteFiles
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');

    expect(combined).toContain('submission invite');
    expect(combined).toContain('Failed to load submission invites');
    expect(combined).toContain('Failed to create submission invites');
    expect(combined).toContain('Failed to update submission invite');
    expect(combined).toContain('Failed to fetch submission workspace');
    expect(combined).toContain('Failed to send submission invite email');
    expect(combined).toContain('Submission invite');
    expect(combined).toContain('Saved privately to your submission workspace');
    expect(combined).toContain('participant-controlled reveal step');
    expect(combined).toContain('Submit proof for this assignment');
    expect(combined).toContain('Continue to proof submission');
    expect(combined).toContain('Submit reviewed proof');
    expect(combined).toContain('Owner-only proof-submission packet');
    expect(combined).toContain('No owner-only Proof Pack is ready for this assignment yet.');
    expect(combined).toContain(
      'Assignment proof submissions can only submit an owner-only Proof Pack'
    );
    expect(combined).not.toContain('Failed to load candidate invites');
    expect(combined).not.toContain('Failed to create candidate invites');
    expect(combined).not.toContain('Failed to update candidate invite');
    expect(combined).not.toContain('Failed to fetch candidate workspace');
    expect(combined).not.toContain('Failed to send candidate invite email');
    expect(combined).not.toContain('Candidate invite');
    expect(combined).not.toContain('Saved privately to your candidate workspace');
    expect(combined).not.toContain('candidate-controlled corridor step');
    expect(combined).not.toContain('Apply from this assignment');
    expect(combined).not.toContain('Apply to this assignment');
    expect(combined).not.toContain('Continue with the invited email when you are ready to apply');
    expect(combined).not.toContain('Starting the application');
    expect(combined).not.toContain('broaden the application beyond this assignment');
    expect(combined).not.toContain('before this application is submitted');
    expect(combined).not.toContain('Owner-only application packet');
    expect(combined).not.toContain('Submit reviewed application');
    expect(combined).not.toContain(
      'Assignment applications can only submit an owner-only Proof Pack'
    );
    expect(combined).not.toContain('Owner-only Proof Pack ID');
    expect(combined).not.toContain('00000000-0000-0000-0000-000000000000');
  });

  it('keeps organization momentum activity proof-submission scoped', () => {
    const momentumActivity = fs.readFileSync(
      path.join(repoRoot, 'src/lib/momentum/activity.ts'),
      'utf8'
    );
    const momentumActivityTest = fs.readFileSync(
      path.join(repoRoot, 'tests/lib/momentum-activity.test.ts'),
      'utf8'
    );
    expect(momentumActivity).toContain('New proof-submission match generated');
    expect(momentumActivity).not.toContain('New candidate match generated');
    expect(momentumActivityTest).toContain('New proof-submission match generated');
    expect(momentumActivityTest).toContain('New candidate match generated');
  });

  it('keeps organization shortlist copy proof-submission scoped', () => {
    const orgShortlistClient = fs.readFileSync(
      path.join(repoRoot, 'src/components/shortlist/OrgShortlistClient.tsx'),
      'utf8'
    );

    expect(orgShortlistClient).toContain('proof submission');
    expect(orgShortlistClient).toContain('Submission label, role focus, reason');
    expect(orgShortlistClient).toContain('No shortlisted proof submissions match these filters');
    expect(orgShortlistClient).not.toContain('Candidate label, role focus, reason');
    expect(orgShortlistClient).not.toContain('No shortlisted candidates match');
    expect(orgShortlistClient).not.toContain("|| 'Candidate'");
  });

  it('keeps active matching review UI proof-led instead of score or rank led', () => {
    const activeMatchingReviewFiles = [
      'src/components/matching/OrganizationMatchingEmpty.tsx',
      'src/components/matching/MatchingOrganizationView.tsx',
      'src/components/matching/MatchResultCard.tsx',
      'src/components/matching/MatchExplainerModal.tsx',
      'src/components/matching/SnoozedMatchesList.tsx',
      'src/components/matching/VerificationGatesWarning.tsx',
      'src/app/app/o/[slug]/messages/OrgMessagesClient.tsx',
    ];
    const matchExplainRoute = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/match/explain/[matchId]/route.ts'),
      'utf8'
    );
    const assignmentMatchHandler = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/core/matching/assignment/handler.ts'),
      'utf8'
    );
    const interestHandler = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/core/matching/interest/handler.ts'),
      'utf8'
    );
    const orgReviewRoute = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/org/[id]/matches/[matchId]/review/route.ts'),
      'utf8'
    );
    const archivedScoreRankFiles = [
      'src/archive/non_launch_matching_ui/preserved/components/matching/RankDisplay.tsx',
      'src/archive/non_launch_matching_ui/preserved/components/matching/MatchScoreBreakdown.tsx',
      'src/archive/non_launch_matching_ui/preserved/components/matching/MatchDetailPanel.tsx',
      'src/archive/non_launch_matching_ui/preserved/components/matching/ExplainPanel.tsx',
      'src/archive/non_launch_matching_ui/preserved/lib/matching/explainer.ts',
    ];

    const activeMatchingReviewText = activeMatchingReviewFiles
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');

    expect(activeMatchingReviewText).toContain('Reason-coded');
    expect(activeMatchingReviewText).toContain('Evidence Review');
    expect(activeMatchingReviewText).toContain('Skills evidence:');
    expect(activeMatchingReviewText).toContain('Org reviewing proof submissions');
    expect(activeMatchingReviewText).toContain('Constraint fit:');
    expect(activeMatchingReviewText).toContain('Proof freshness:');
    expect(activeMatchingReviewText).toContain('Verification support:');
    expect(activeMatchingReviewText).toContain('Review proof-backed submissions');
    expect(activeMatchingReviewText).toContain('proof-submission review console');
    expect(activeMatchingReviewText).toContain('This assignment review');
    expect(activeMatchingReviewText).toContain('assignment review evidence');
    expect(activeMatchingReviewText).toContain('Assignment Match');
    expect(activeMatchingReviewText).toContain('Proof Submission');
    expect(activeMatchingReviewText).toContain('Proof-submission signals');
    expect(activeMatchingReviewText).toContain('Proof signals available');
    expect(activeMatchingReviewText).toContain(
      'Identity stays protected until the corridor is ready.'
    );
    expect(activeMatchingReviewText).toContain('Identity remains protected before reveal');
    expect(activeMatchingReviewText).toContain('Submission #');
    expect(activeMatchingReviewText).toContain('Submission Lvl');
    expect(activeMatchingReviewText).not.toContain(
      'compositeScore={matchExplanation.compositeScore}'
    );
    expect(activeMatchingReviewText).not.toContain('score?: number');
    expect(activeMatchingReviewText).not.toContain('result.score');
    expect(activeMatchingReviewText).not.toContain('proofSignalLabel(value)');
    expect(activeMatchingReviewText).not.toContain('contributions.map');
    expect(activeMatchingReviewText).not.toContain('subscores={matchExplanation.subscores}');
    expect(activeMatchingReviewText).not.toContain('explanation.subscores');
    expect(activeMatchingReviewText).not.toContain('fallbackScore');
    expect(orgReviewRoute).toContain('proof-review participant approves');
    expect(orgReviewRoute).toContain('proof-review participant reciprocates interest');
    expect(orgReviewRoute).toContain('The proof-review participant');
    expect(matchExplainRoute).toContain("rankMode: 'band'");
    expect(matchExplainRoute).toContain('exactRankAvailable = false');
    expect(matchExplainRoute).toContain("scoreVisibility: 'internal_ordering_only'");
    expect(matchExplainRoute).toContain('proofSignals: toProofSignals(match.subscores_json)');
    expect(matchExplainRoute).not.toContain('canRevealExactRank');
    expect(matchExplainRoute).not.toContain("rankMode: 'exact'");
    expect(matchExplainRoute).not.toContain('compositeScore:');
    expect(matchExplainRoute).not.toContain('scoreTotal:');
    expect(matchExplainRoute).not.toContain('scoreState:');
    expect(matchExplainRoute).not.toContain('scoreVersion:');
    expect(matchExplainRoute).not.toContain('inputsHash:');
    expect(matchExplainRoute).not.toContain('subscores: {');
    expect(assignmentMatchHandler).toContain('const exactRankLive = false');
    expect(assignmentMatchHandler).not.toContain('rank: showExactRank');
    expect(assignmentMatchHandler).not.toContain('canViewExactRank');
    expect(interestHandler).toContain('This proof submission is reviewable');
    expect(interestHandler).toContain('keep reviewing the proof submission');
    expect(interestHandler).toContain('other side will only see the introduction');
    expect(interestHandler).not.toContain('The candidate will only see the introduction');
    expect(interestHandler).not.toContain('This candidate is reviewable');
    expect(interestHandler).not.toContain('reviewing the candidate proof');
    expect(interestHandler).not.toContain('candidate has stronger relevant proof');

    for (const relativePath of activeMatchingReviewFiles) {
      const content = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

      expect(content).not.toContain("from '@/components/ui/progress'");
      expect(content).not.toContain('<Progress');
      expect(content).not.toContain('Signal Breakdown by Category');
      expect(content).not.toContain('getRankDisplay');
      expect(content).not.toContain('Match Score');
      expect(content).not.toContain('Your Rank');
      expect(content).not.toContain('Overall Match');
      expect(content).not.toContain('Top 10');
      expect(content).not.toContain('Top 5');
      expect(content).not.toContain('Top 20');
      expect(content).not.toContain('Evidence Breakdown');
      expect(content).not.toContain('Skills Evidence Match');
      expect(content).not.toContain('Constraints Match');
      expect(content).not.toContain('Proof Freshness (Recency)');
      expect(content).not.toContain('Verification Support');
      expect(content).not.toContain('Review proof-backed candidates, shortlist fits');
      expect(content).not.toContain('Candidate Review Console');
      expect(content).not.toContain('Candidate Match');
      expect(content).not.toContain('Opportunity Match');
      expect(content).not.toContain('Candidate signals');
      expect(content).not.toContain('Candidate identity stays protected');
      expect(content).not.toContain('Candidate identity remains protected');
      expect(content).not.toContain('Candidate #');
      expect(content).not.toContain('Candidate Lvl');
      expect(content).not.toContain('Candidate has: Lvl');
      expect(content).not.toContain('selected candidate');
      expect(content).not.toContain('candidate explanation');
      expect(content).not.toContain('Org viewing candidates');
      expect(content).not.toContain('Waiting for reviewer response.');
      expect(content).not.toContain("match{count !== 1 ? 'es' : ''}");
      expect(content).not.toContain('Candidate added to shortlist.');
      expect(content).not.toContain('This opportunity');
      expect(content).not.toContain('candidate authenticity and');
      expect(content).not.toContain('Unlocked');
      expect(content).not.toContain('Strong proof alignment');
      expect(content).not.toContain('Clear proof alignment');
    }

    const reviewContract = fs.readFileSync(
      path.join(repoRoot, 'src/lib/matching/review-contract.ts'),
      'utf8'
    );
    expect(reviewContract).toContain('Review band:');
    expect(reviewContract).toContain('High-priority proof review');
    expect(reviewContract).toContain('return `Submission ${suffix');
    expect(reviewContract).toContain('proof-review participant’s stated focus');
    expect(reviewContract).toContain('proof-review participant was shortlisted');
    expect(reviewContract).toContain('manually shortlisted this proof-review participant');
    expect(reviewContract).toContain('pending proof-review participant approval');
    expect(reviewContract).not.toContain('return `Candidate ${suffix');
    expect(reviewContract).not.toContain('Rank band:');
    expect(reviewContract).not.toContain("return 'Top 10'");
    expect(reviewContract).not.toContain("return 'Top 5'");
    expect(reviewContract).not.toContain("return 'Top 20'");
    expect(reviewContract).not.toContain('candidate’s stated focus');
    expect(reviewContract).not.toContain('candidate was shortlisted');
    expect(reviewContract).not.toContain('manually shortlisted this candidate');
    expect(reviewContract).not.toContain('corridor state for this candidate');
    expect(reviewContract).not.toContain('pending candidate approval');
    expect(orgReviewRoute).toContain('Proof Review');
    expect(orgReviewRoute).not.toContain('Candidate Review');
    expect(orgReviewRoute).not.toContain('candidate approves');
    expect(orgReviewRoute).not.toContain('candidate reciprocates interest');
    expect(orgReviewRoute).not.toContain("'The candidate'");

    for (const relativePath of archivedScoreRankFiles) {
      expect(fs.existsSync(path.join(repoRoot, relativePath))).toBe(true);
    }
    expect(fs.existsSync(path.join(repoRoot, 'src/components/matching/RankDisplay.tsx'))).toBe(
      false
    );
    expect(
      fs.existsSync(path.join(repoRoot, 'src/components/matching/MatchScoreBreakdown.tsx'))
    ).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'src/components/matching/MatchDetailPanel.tsx'))).toBe(
      false
    );
    expect(fs.existsSync(path.join(repoRoot, 'src/components/matching/ExplainPanel.tsx'))).toBe(
      false
    );
    expect(fs.existsSync(path.join(repoRoot, 'src/lib/matching/explainer.ts'))).toBe(false);
  });

  it('keeps masked conversation handles proof-submission scoped', () => {
    const conversationAccess = fs.readFileSync(
      path.join(repoRoot, 'src/lib/messaging/conversation-access.ts'),
      'utf8'
    );
    const conversationsRoute = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/conversations/route.ts'),
      'utf8'
    );
    const conversationRouteTest = fs.readFileSync(
      path.join(repoRoot, 'tests/api/conversations-route.test.ts'),
      'utf8'
    );
    const conversationDetailRouteTest = fs.readFileSync(
      path.join(repoRoot, 'tests/api/conversation-detail-routes.test.ts'),
      'utf8'
    );
    const organizationMessagesPageTest = fs.readFileSync(
      path.join(repoRoot, 'tests/routes/organization-messages-page.test.tsx'),
      'utf8'
    );
    const conversationList = fs.readFileSync(
      path.join(repoRoot, 'src/components/messaging/ConversationList.tsx'),
      'utf8'
    );
    const messageThread = fs.readFileSync(
      path.join(repoRoot, 'src/components/messaging/MessageThread.tsx'),
      'utf8'
    );
    const strictFixtures = fs.readFileSync(
      path.join(repoRoot, 'e2e/helpers/strict-fixtures.ts'),
      'utf8'
    );
    const crossUserHelpers = fs.readFileSync(
      path.join(repoRoot, 'e2e/helpers/cross-user-helpers.ts'),
      'utf8'
    );
    const inviteClaimRoute = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/candidate-invites/[token]/claim/route.ts'),
      'utf8'
    );
    const orgReviewRoute = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/org/[id]/matches/[matchId]/review/route.ts'),
      'utf8'
    );

    const activeConversationText = [
      conversationAccess,
      conversationsRoute,
      conversationRouteTest,
      conversationDetailRouteTest,
      organizationMessagesPageTest,
      conversationList,
      messageThread,
      strictFixtures,
      crossUserHelpers,
      inviteClaimRoute,
      orgReviewRoute,
    ].join('\n');

    expect(activeConversationText).toContain('Submission #');
    expect(activeConversationText).toContain('Submission A');
    expect(activeConversationText).toContain('maskedHandleTwo ||');
    expect(activeConversationText).toContain("if (name === 'Submission') return 'S'");
    expect(inviteClaimRoute).toContain("makeMaskedHandleForPersona('individual')");
    expect(orgReviewRoute).toContain("makeMaskedHandleForPersona('individual')");
    expect(activeConversationText).not.toContain(
      "displayName = profile.persona === 'individual' ? 'Candidate' : 'Organization'"
    );
    expect(activeConversationText).not.toContain('Candidate #');
    expect(activeConversationText).not.toContain('Candidate A');
    expect(activeConversationText).not.toContain("if (name === 'Candidate') return 'C'");
    expect(activeConversationText).not.toContain('maskedHandleOne: `Candidate');
  });

  it('keeps retained near-matches responses reason-coded without raw score artifacts', () => {
    const nearMatchesHandler = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/core/matching/near-matches/handler.ts'),
      'utf8'
    );

    expect(nearMatchesHandler).toContain('function toVisibilitySafeNearMatch');
    expect(nearMatchesHandler).toContain("reviewMode: 'reason_coded'");
    expect(nearMatchesHandler).toContain('items: visibilitySafeItems');
    expect(nearMatchesHandler).toContain("scoreVisibility: 'internal_ordering_only'");
    expect(nearMatchesHandler).toContain('Scores stay internal for ordering only.');
    expect(nearMatchesHandler).not.toContain('items: topK');
    expect(nearMatchesHandler).not.toContain('weights: weights');

    const publicMapperStart = nearMatchesHandler.indexOf('function toVisibilitySafeNearMatch');
    const publicMapperEnd = nearMatchesHandler.indexOf('/**', publicMapperStart);
    const publicMapperBody = nearMatchesHandler.slice(publicMapperStart, publicMapperEnd);
    expect(publicMapperBody).toContain('assignmentId: item.assignmentId');
    expect(publicMapperBody).toContain('reason: item.reason');
    expect(publicMapperBody).not.toContain('score: item.score');
    expect(publicMapperBody).not.toContain('subscores: item.subscores');
    expect(publicMapperBody).not.toContain('contributions: item.contributions');
    expect(publicMapperBody).not.toContain('focusBoost: item.focusBoost');
  });

  it('keeps retained assignment matching responses free of raw score artifacts', () => {
    const assignmentMatchHandler = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/core/matching/assignment/handler.ts'),
      'utf8'
    );

    expect(assignmentMatchHandler).toContain('function toVisibilitySafeAssignmentMatchItem');
    expect(assignmentMatchHandler).toContain("scoreVisibility: 'internal_ordering_only'");
    expect(assignmentMatchHandler).toContain('weights: {}');
    expect(assignmentMatchHandler).not.toContain('score: item.score');
    expect(assignmentMatchHandler).not.toContain('scoreTotal: item.scoreTotal');
    expect(assignmentMatchHandler).not.toContain('subscoresJson: item.subscoresJson');
    expect(assignmentMatchHandler).not.toContain('scoreSnapshotJson: item.scoreSnapshotJson');
    expect(assignmentMatchHandler).not.toContain('score: Number(row.score)');
    expect(assignmentMatchHandler).not.toContain('scoreTotal: row.scoreTotal');
    expect(assignmentMatchHandler).not.toContain('subscoresJson: row.subscoresJson');
    expect(assignmentMatchHandler).not.toContain('scoreSnapshotJson: row.scoreSnapshotJson');

    const publicMapperStart = assignmentMatchHandler.indexOf(
      'function toVisibilitySafeAssignmentMatchItem'
    );
    const publicMapperEnd = assignmentMatchHandler.indexOf(
      '// Validation schema',
      publicMapperStart
    );
    const publicMapperBody = assignmentMatchHandler.slice(publicMapperStart, publicMapperEnd);
    expect(publicMapperBody).toContain('score: _score');
    expect(publicMapperBody).toContain('scoreTotal: _scoreTotal');
    expect(publicMapperBody).toContain('scoreSnapshotJson: _scoreSnapshotJson');
    expect(publicMapperBody).toContain('contributions: _contributions');
    expect(publicMapperBody).toContain('focusBoost: _focusBoost');
  });

  it('keeps hidden-match responses free of raw score artifacts', () => {
    const matchHideRoute = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/match/hide/route.ts'),
      'utf8'
    );
    const hiddenMatchesList = fs.readFileSync(
      path.join(repoRoot, 'src/components/matching/HiddenMatchesList.tsx'),
      'utf8'
    );

    expect(matchHideRoute).toContain("scoreVisibility: 'internal_ordering_only'");
    expect(matchHideRoute).not.toContain('score: Number(row.match.score)');
    expect(matchHideRoute).not.toContain('score: row.match.score');
    expect(hiddenMatchesList).toContain("match.assignment.title || 'Assignment'");
    expect(hiddenMatchesList).not.toContain("match.assignment.title || 'Opportunity'");
  });

  it('keeps paused-match responses free of raw score artifacts', () => {
    const matchSnoozedRoute = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/match/snoozed/route.ts'),
      'utf8'
    );
    const snoozedMatchesList = fs.readFileSync(
      path.join(repoRoot, 'src/components/matching/SnoozedMatchesList.tsx'),
      'utf8'
    );

    expect(matchSnoozedRoute).toContain("scoreVisibility: 'internal_ordering_only'");
    expect(matchSnoozedRoute).toContain('proofFitLabel: proofFitLabel(row.match.score)');
    expect(matchSnoozedRoute).not.toContain('matchScore: parseFloat(row.match.score)');
    expect(matchSnoozedRoute).not.toContain('matchScore:');
    expect(snoozedMatchesList).toContain('proofFitLabel?: string');
    expect(snoozedMatchesList).toContain("{match.proofFitLabel ?? 'Proof review needed'}");
    expect(snoozedMatchesList).not.toContain('matchScore?: number');
    expect(snoozedMatchesList).not.toContain('legacyProofFitLabel');
    expect(snoozedMatchesList).not.toContain('match.matchScore');
  });

  it('keeps retained profile matching responses reason-coded without raw score artifacts', () => {
    const profileMatchHandler = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/core/matching/profile/handler.ts'),
      'utf8'
    );

    expect(profileMatchHandler).toContain('function toVisibilitySafeProfileMatch');
    expect(profileMatchHandler).toContain("reviewMode: 'reason_coded'");
    expect(profileMatchHandler).toContain('items: topKWithIds.map(toVisibilitySafeProfileMatch)');
    expect(profileMatchHandler).toContain("scoreVisibility: 'internal_ordering_only'");
    expect(profileMatchHandler).not.toContain('score: item.score');
    expect(profileMatchHandler).not.toContain('scoreTotal: item.scoreTotal');
    expect(profileMatchHandler).not.toContain('subscores: item.subscores');
    expect(profileMatchHandler).not.toContain('contributions: item.contributions');
    expect(profileMatchHandler).not.toContain('focusBoost: item.focusBoost');

    const publicMapperStart = profileMatchHandler.indexOf('function toVisibilitySafeProfileMatch');
    const publicMapperEnd = profileMatchHandler.indexOf(
      'function resolveAssignmentScanLimit',
      publicMapperStart
    );
    const publicMapperBody = profileMatchHandler.slice(publicMapperStart, publicMapperEnd);
    expect(publicMapperBody).toContain('assignmentId: item.assignmentId');
    expect(publicMapperBody).toContain('reasonCodes: item.artifact.reasonCodes');
    expect(publicMapperBody).toContain('proofSignals: Object.entries(item.contributions)');
    expect(publicMapperBody).not.toContain('score: item.score');
    expect(publicMapperBody).not.toContain('subscores: item.subscores');
    expect(publicMapperBody).not.toContain('contributions: item.contributions');
    expect(publicMapperBody).not.toContain('focusBoost: item.focusBoost');
  });

  it('keeps active assignment import copy assignment-brief scoped', () => {
    const assignmentBuilder = fs.readFileSync(
      path.join(repoRoot, 'src/app/app/o/[slug]/assignments/new/AssignmentBuilderClient.tsx'),
      'utf8'
    );
    const assignmentImport = fs.readFileSync(
      path.join(repoRoot, 'src/lib/assignments/job-description-import.ts'),
      'utf8'
    );
    const activeAssignmentImportCopy = `${assignmentBuilder}\n${assignmentImport}`;

    expect(assignmentBuilder).toContain('Import existing assignment brief');
    expect(assignmentBuilder).toContain('Existing assignment brief');
    expect(assignmentBuilder).toContain('Paste the existing assignment brief here');
    expect(assignmentImport).toContain('Paste the full assignment brief');
    expect(assignmentImport).toContain('pasted assignment brief is source material only');
    expect(activeAssignmentImportCopy).not.toContain('Import existing job description');
    expect(activeAssignmentImportCopy).not.toContain('Existing job description');
    expect(activeAssignmentImportCopy).not.toContain('Paste the full job description');
    expect(activeAssignmentImportCopy).not.toContain(
      'pasted job description is source material only'
    );
  });

  it('keeps active readiness and intro copy eligibility-led instead of unlock-led', () => {
    const activeReadinessCopyFiles = [
      'src/app/app/i/home/page.tsx',
      'src/app/app/o/[slug]/interviews/page.tsx',
      'src/components/onboarding/PublicPortfolioReadyStep.tsx',
      'src/components/onboarding/PersonaChoice.tsx',
      'src/components/profile/GuidedProfileSetupView.tsx',
      'src/components/profile/EditableProfileView.tsx',
      'src/components/matching/IndividualMatchingEmpty.tsx',
      'src/components/matching/MatchingProfileSetup.tsx',
      'src/app/api/core/matching/interest/handler.ts',
      'src/lib/contracts/launch-operations.ts',
      'src/lib/matching/eligibility.ts',
      'src/lib/readiness/individual-state.ts',
      'src/lib/ui/recovery-actions.ts',
    ];

    const activeReadinessCopy = activeReadinessCopyFiles
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');

    expect(activeReadinessCopy).toContain('Day 1 proof link ready');
    expect(activeReadinessCopy).toContain('build matching readiness');
    expect(activeReadinessCopy).toContain('Prepare assignment reviews at your pace');
    expect(activeReadinessCopy).toContain('Assignment reviews open in order');
    expect(activeReadinessCopy).toContain('Set up assignment review preferences');
    expect(activeReadinessCopy).toContain('assignment reviews stay relevant');
    expect(activeReadinessCopy).toContain('review-stage reveal');
    expect(activeReadinessCopy).toContain('Introductions need stronger proof first');
    expect(activeReadinessCopy).toContain('introductions are available');
    expect(activeReadinessCopy).toContain('Verification is still in progress for this review set.');
    expect(activeReadinessCopy).toContain(
      'Proof-review participant feedback must use a participant-facing reason code.'
    );

    for (const staleCopy of [
      'Day 1 win unlocked',
      'unlock matching',
      'unlock opportunities',
      'Introductions unlock',
      'Candidate feedback must use a candidate-facing reason code.',
      'unlock introductions',
      'introductions unlock',
      'personalized browse unlocks',
      'before browse unlocks',
      'before public visibility can unlock',
      'before introductions can unlock',
      'Introductions are unlocked',
      'introductions are unlocked',
      'unlocks your profile',
      'ranking quality',
      'unlock your Public Page',
      'unlock better matches',
      'unlock and improve opportunities',
      'unlock the decision step',
      'unlock personalized browse results',
      'candidate set',
      'Prepare matching at your pace',
      'Set up matching profile',
      'Matching opens in order',
      'make matching ready',
      'opening matching further',
      'visible after a match',
      'Set up your matching profile',
      'make better matches available',
    ]) {
      expect(activeReadinessCopy).not.toContain(staleCopy);
    }
  });

  it('keeps active interview feedback UI away from score-led labels', () => {
    const feedbackPage = fs.readFileSync(
      path.join(repoRoot, 'src/app/app/interviews/[id]/feedback/page.tsx'),
      'utf8'
    );
    const feedbackForm = fs.readFileSync(
      path.join(repoRoot, 'src/components/feedback/FeedbackForm.tsx'),
      'utf8'
    );
    const feedbackEmail = fs.readFileSync(
      path.join(repoRoot, 'emails/FeedbackRequest.tsx'),
      'utf8'
    );
    const emailService = fs.readFileSync(path.join(repoRoot, 'src/lib/email.ts'), 'utf8');

    expect(feedbackPage).toContain('Rating: {answer.score}');
    expect(feedbackPage).toContain('Participant → Organization');
    expect(feedbackPage).toContain('Organization → Participant');
    expect(feedbackPage).not.toContain('Score: {answer.score}');
    expect(feedbackPage).not.toContain('Candidate → Org');
    expect(feedbackPage).not.toContain('Org → Candidate');
    expect(feedbackForm).toContain('Submit feedback');
    expect(feedbackForm).toContain('Share workflow feedback');
    expect(feedbackEmail).toContain('Share workflow feedback');
    expect(feedbackEmail).toContain('structured workflow feedback');
    expect(feedbackEmail).toContain('keep the review workflow fair');
    expect(emailService).toContain('Share workflow feedback');
    expect(feedbackForm).not.toContain('Submit score');
    expect(feedbackForm).not.toContain('Share feedback with the candidate');
    expect(feedbackEmail).not.toContain('Share feedback with the candidate');
    expect(feedbackEmail).not.toContain('structured feedback for the candidate');
    expect(feedbackEmail).not.toContain('keep interviews fair');
    expect(emailService).not.toContain('Share feedback with the candidate');
  });

  it('keeps outbound match email copy proof-led and score-free', () => {
    const matchEmail = fs.readFileSync(
      path.join(repoRoot, 'emails/NewMatchNotification.tsx'),
      'utf8'
    );
    const candidateInviteEmail = fs.readFileSync(
      path.join(repoRoot, 'emails/CandidateInvite.tsx'),
      'utf8'
    );
    const emailService = fs.readFileSync(path.join(repoRoot, 'src/lib/email.ts'), 'utf8');

    expect(matchEmail).toContain('A Proof Review Is Ready');
    expect(matchEmail).toContain('A proof-backed assignment review is ready');
    expect(matchEmail).toContain('Proof-backed assignment review');
    expect(matchEmail).toContain('current assignment corridor');
    expect(matchEmail).toContain('Review state');
    expect(matchEmail).toContain('Relevant proof signals:');
    expect(matchEmail).toContain('without exposing a numeric match score');
    expect(matchEmail).not.toContain('Match Score');
    expect(matchEmail).not.toContain('scorePercentage');
    expect(matchEmail).not.toContain('You Have a New Match!');
    expect(matchEmail).not.toContain('high-quality matches');
    expect(matchEmail).not.toContain('proof-backed opportunity');
    expect(matchEmail).not.toContain('Proof-backed opportunity');
    expect(matchEmail).not.toContain('Review the opportunity');
    expect(candidateInviteEmail).toContain('proof-card step in their assignment review');
    expect(candidateInviteEmail).toContain('structured evidence of your skills, outcomes, and');
    expect(candidateInviteEmail).not.toContain('join their hiring flow');
    expect(candidateInviteEmail).not.toContain('traditional CV');
    expect(emailService).toContain('Proof review ready - Proofound');
    expect(emailService).toContain('/app/i/matching?matchId=');
    expect(emailService).not.toContain('matchScore: number');
    expect(emailService).not.toContain('matchScore: matchData.matchScore');
    expect(emailService).not.toContain('/app/i/matches/');
  });

  it('keeps outbound verification emails trust-signal led instead of premium or ranking led', () => {
    const verificationApprovedEmail = fs.readFileSync(
      path.join(repoRoot, 'emails/VerificationApproved.tsx'),
      'utf8'
    );
    const verificationRejectedEmail = fs.readFileSync(
      path.join(repoRoot, 'emails/VerificationRejected.tsx'),
      'utf8'
    );
    const identityRevealedEmail = fs.readFileSync(
      path.join(repoRoot, 'emails/IdentityRevealed.tsx'),
      'utf8'
    );
    const linkedinPendingReviewEmail = fs.readFileSync(
      path.join(repoRoot, 'emails/LinkedInVerificationPendingReview.tsx'),
      'utf8'
    );
    const workEmailVerificationEmail = fs.readFileSync(
      path.join(repoRoot, 'emails/WorkEmailVerification.tsx'),
      'utf8'
    );
    const combined = [
      verificationApprovedEmail,
      verificationRejectedEmail,
      identityRevealedEmail,
      linkedinPendingReviewEmail,
      workEmailVerificationEmail,
    ].join('\n');
    const compactCombined = compactWhitespace(combined);

    expect(combined).toContain('account-side trust signal');
    expect(combined).toContain('Work email is the launch-active account-side check');
    expect(combined).toContain('Review verification settings');
    expect(combined).toContain('LinkedIn checks are outside the launch corridor');
    expect(combined).toContain('Proof-review participant now visible');
    expect(combined).toContain('Proof-review participant:</strong>');
    expect(compactCombined).toContain(
      'It is a trust signal, not an automated score, rank, or workflow recommendation.'
    );
    expect(compactCombined).toContain('It does not create an automated');
    expect(compactCombined).toContain(
      'Verification is a trust signal, not an automated score, rank, or workflow recommendation.'
    );
    expect(compactCombined).toContain('Keep your profile and Proof Packs current');
    expect(combined).not.toContain('Candidate now visible');
    expect(combined).not.toContain('<strong>Candidate:</strong>');
    expect(combined).not.toContain('Unlock premium features');
    expect(combined).not.toContain('Improve Matching');
    expect(combined).not.toContain('Stand Out');
    expect(combined).not.toContain('priority in search and matching');
    expect(combined).not.toContain('better match recommendations');
    expect(combined).not.toContain('improves your match quality');
    expect(combined).not.toContain('unlock the verified badge');
    expect(combined).not.toContain('Connect your LinkedIn profile');
    expect(combined).not.toContain('Connect your LinkedIn profile instead');
    expect(combined).not.toContain('Complete government ID verification with Veriff');
    expect(combined).not.toContain('better matching opportunities');
    expect(combined).not.toContain('enhanced credibility');
    expect(combined).not.toContain('hiring recommendation');
    expect(combined).not.toContain('?tab=help');
  });

  it('keeps interview scheduled email proof-led and stage-aware', () => {
    const interviewScheduledEmail = fs.readFileSync(
      path.join(repoRoot, 'emails/InterviewScheduled.tsx'),
      'utf8'
    );
    const legacyInterviewScheduledEmail = fs.readFileSync(
      path.join(repoRoot, 'src/lib/email/templates/interview-scheduled.tsx'),
      'utf8'
    );
    const combined = `${interviewScheduledEmail}\n${legacyInterviewScheduledEmail}`;
    const compactInterviewEmail = compactWhitespace(combined);

    expect(combined).toContain('approved context, and meeting details');
    expect(combined).toContain('relevant Proof Packs and portfolio context');
    expect(legacyInterviewScheduledEmail).toContain('assignment review');
    expect(interviewScheduledEmail).toContain('Privacy and workflow stage');
    expect(legacyInterviewScheduledEmail).toContain('Interview reminders:');
    expect(compactInterviewEmail).toContain(
      'This email only includes scheduling details. Proof files, private notes, contact details, and reveal-stage context stay inside the authenticated workflow'
    );
    expect(combined).not.toContain('Both parties will now have their identities revealed');
    expect(combined).not.toContain('Have your resume and portfolio ready');
    expect(combined).not.toContain('Identities Revealed');
    expect(combined).not.toContain('full profiles');
    expect(combined).not.toContain('communicate directly');
    expect(combined).not.toContain('within 7 days of match');
    expect(combined).not.toContain('Be ready to discuss your relevant skills and experience');
    expect(combined).not.toContain('Need to reschedule? Contact');
    expect(legacyInterviewScheduledEmail).not.toContain('opportunity');
  });

  it('keeps decision notification email workflow-led instead of ATS/application-led', () => {
    const notificationEmails = fs.readFileSync(
      path.join(repoRoot, 'src/lib/email/notifications.ts'),
      'utf8'
    );
    const compactNotificationEmails = compactWhitespace(notificationEmails);

    expect(notificationEmails).toContain('Proofound workflow decision from');
    expect(notificationEmails).toContain('Proofound Workflow Decision');
    expect(notificationEmails).toContain('proof-review workflow');
    expect(notificationEmails).toContain('Workflow feedback from');
    expect(notificationEmails).toContain('Open Proofound for the approved next step');
    expect(compactNotificationEmails).toContain(
      'This decision does not score, rank, or evaluate your wider profile.'
    );
    expect(notificationEmails).not.toContain('Application Update');
    expect(notificationEmails).not.toContain('Application update from');
    expect(notificationEmails).not.toContain('Thank you for your interest in');
    expect(notificationEmails).not.toContain('continue exploring opportunities on Proofound');
    expect(notificationEmails).not.toContain('You will receive next steps shortly.');
  });

  it('keeps active assignment notification copy proof-review scoped', () => {
    const notifications = fs.readFileSync(
      path.join(repoRoot, 'src/lib/notifications/index.ts'),
      'utf8'
    );

    expect(notifications).toContain('New Assignment Review');
    expect(notifications).toContain('posted an assignment for proof review');
    expect(notifications).toContain("type: 'assignment_published'");
    expect(notifications).toContain('/app/i/matching?assignment=');
    expect(notifications).not.toContain('New Opportunity');
    expect(notifications).not.toContain('posted: ${assignmentTitle}');
  });

  it('keeps organization trust fixtures assignment-review scoped', () => {
    const organizationTrustCopy = [
      'tests/ui/organization-trust-profile-page.test.tsx',
      'tests/api/organizations-route.test.ts',
      'tests/ui/public-org-portfolio-page.test.tsx',
      'src/lib/supabase/mock-server-client.ts',
    ]
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');

    expect(organizationTrustCopy).toContain('Ship proof-first assignment review');
    expect(organizationTrustCopy).toContain(
      'This assignment path matters because the work makes proof easier to review.'
    );
    expect(organizationTrustCopy).toContain('proof-first assignment review still needs trust');
    expect(organizationTrustCopy).toContain(
      'focused reveal conversation for shortlisted proof-review participants'
    );
    expect(organizationTrustCopy).not.toContain("mission: 'Ship trust-first hiring'");
    expect(organizationTrustCopy).not.toContain(
      "tagline: 'This role matters because the work fixes trust in hiring.'"
    );
    expect(organizationTrustCopy).not.toContain(
      "tagline: 'This work matters because trustworthy hiring is still too rare.'"
    );
    expect(organizationTrustCopy).not.toContain('shortlisted candidates');
  });

  it('keeps account verification emails and tours proof-review led', () => {
    const accountVerificationEmails = [
      'emails/VerifyEmailIndividual.tsx',
      'emails/VerifyEmailOrganization.tsx',
    ]
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');
    const activeTourCopy = ['src/components/tour/tourSteps.tsx', 'src/lib/tour/tour-steps.ts']
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');
    const combined = `${accountVerificationEmails}\n${activeTourCopy}`;

    expect(accountVerificationEmails).toContain('Create one artifact-backed Proof Pack');
    expect(accountVerificationEmails).toContain('organization trust page');
    expect(accountVerificationEmails).toContain('Review proof-led submission context');
    expect(accountVerificationEmails).toContain('Request staged introductions');
    expect(activeTourCopy).toContain('reason-coded proof context');
    expect(activeTourCopy).toContain('review proof-led submission context');
    expect(activeTourCopy).toContain('trust basics participants and reviewers');
    expect(activeTourCopy).toContain('privacy staged');
    expect(activeTourCopy).toContain('Ready to start proof review');
    expect(activeTourCopy).toContain('start a proof-first assignment review');
    expect(activeTourCopy).toContain('staged introductions stay inside the proof-first workflow');

    for (const staleCopy of [
      'Connect with mission-aligned opportunities',
      'Find collaborators and mentors',
      'Post opportunities and find the right team members',
      'Connect with partners and collaborators',
      'scoring to compare skills',
      'potential employers',
      'Our algorithm prioritizes',
      'matching system will find qualified candidates',
      'track the hiring process',
      'Ready to find great talent',
      'finding purpose-driven talent',
      'Matching and hiring workflows stay available after this first step',
      'stakeholders who will be involved in hiring decisions',
      'reduce hiring bias',
      'Review proof-led candidate context',
      'review proof-led candidate context',
      'trust basics candidates and reviewers',
    ]) {
      expect(combined).not.toContain(staleCopy);
    }
  });

  it('keeps active signup and review-entry copy workflow-scoped', () => {
    const workflowEntryCopy = [
      'src/components/auth/SignupForm.tsx',
      'src/app/app/o/[slug]/home/page.tsx',
      'src/app/app/o/[slug]/assignments/page.tsx',
      'src/app/app/i/matching/MatchingClient.tsx',
      'src/app/app/i/matching/(workspace)/loading.tsx',
      'src/app/app/i/matching/preferences/page.tsx',
      'src/components/matching/EnhancedMatchFilters.tsx',
      'src/components/matching/MatchingOrganizationView.tsx',
      'src/app/api/assignments/[id]/route.ts',
      'src/app/api/assignments/route.ts',
      'src/lib/assignments/visual-fixtures.ts',
      'src/app/api/ai/assignments/clarify/route.ts',
      'src/components/onboarding/OrganizationSetup.tsx',
      'src/app/app/o/[slug]/profile/page.tsx',
    ]
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');

    expect(workflowEntryCopy).toContain('proof-review workflow improvements');
    expect(workflowEntryCopy).toContain('open proof-led assignment review');
    expect(workflowEntryCopy).toContain('proof-review workflow, staged review context');
    expect(workflowEntryCopy).toContain('proof-led assignment reviews');
    expect(workflowEntryCopy).toContain('assignment reviews');
    expect(workflowEntryCopy).toContain('Preparing privacy-safe assignment reviews');
    expect(workflowEntryCopy).toContain('Preparing assignment reviews');
    expect(workflowEntryCopy).toContain('No assignment reviews yet');
    expect(workflowEntryCopy).toContain('new assignment reviews can land cleanly');
    expect(workflowEntryCopy).toContain('No assignment reviews fit the current filters');
    expect(workflowEntryCopy).toContain('Hidden from assignment reviews');
    expect(workflowEntryCopy).toContain('Filter Assignment Reviews');
    expect(workflowEntryCopy).toContain('Narrow review context by skills');
    expect(workflowEntryCopy).toContain('to open proof-led assignment review');
    expect(workflowEntryCopy).toContain('reaches proof review');
    expect(workflowEntryCopy).toContain('New submissions');
    expect(workflowEntryCopy).toContain('Review submissions');
    expect(workflowEntryCopy).toContain('Loading proof-aligned submissions');
    expect(workflowEntryCopy).toContain(
      'One assignment path and one review queue for published work and submissions'
    );
    expect(workflowEntryCopy).toContain('reviewers need to trust the work context');

    for (const staleCopy of [
      'matching opportunities',
      'open candidate matching',
      'matching corridor, candidate review, and pipeline',
      'relevant opportunities',
      'opportunities aligned with your skills',
      'privacy-safe opportunities',
      'new opportunities can land cleanly',
      'Preparing matches',
      'No matches yet',
      'No matches fit the current filters',
      'Hidden from results',
      'Could not refresh matches',
      'Filter Matches',
      'Narrow down opportunities',
      'proof-led hiring corridor',
      'reaches candidate review',
      'New candidates',
      'Review candidates',
      'Loading proof-aligned candidates',
      'published work and candidates',
      'candidates need to trust you',
    ]) {
      expect(workflowEntryCopy).not.toContain(staleCopy);
    }
  });

  it('keeps active recovery, privacy, locale, and verification helper copy proof-review scoped', () => {
    const supportWorkflowCopy = [
      'src/lib/ui/recovery-actions.ts',
      'src/components/settings/PrivacyOverview.tsx',
      'src/lib/internal-ops/queue.ts',
      'src/lib/verification/request-feed.ts',
      'src/lib/verification/visual-link-fixtures.ts',
      'src/lib/readiness/organization.ts',
      'src/lib/ai/policy-explainer.ts',
      'src/lib/portfolio/public-projection.ts',
      'src/app/app/i/matching/DeferredMatchingClient.tsx',
      'src/app/page.tsx',
      'docs/internal-ops/redaction-risky-upload-sop.md',
      'docs/internal-ops/index.md',
      'docs/internal-ops/workflow-comms-templates.md',
      'docs/mvp-launch-master-checklist.md',
      'docs/ACCESSIBILITY_TESTING_GUIDE.md',
      'docs/SECURITY_INCIDENT_RESPONSE_RUNBOOK.md',
      'docs/internal-ops/reveal-privacy-dispute-sop.md',
      'docs/alert-configuration.md',
      'docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md',
      'docs/ai/Proofound_Temporary_GCP_CV_OCR_Sandbox_Reference_2026-05-03.md',
      'src/app/portfolio/org/[slug]/page.tsx',
      'src/components/policy/PolicyAssistant.tsx',
      'src/lib/matching/explainer-contract.ts',
      'src/i18n/messages/en.json',
      'src/i18n/messages/sv.json',
    ]
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');
    const compactSupportWorkflowCopy = compactWhitespace(supportWorkflowCopy);

    expect(supportWorkflowCopy).toContain('proof-backed submissions');
    expect(supportWorkflowCopy).toContain('assignment-review recovery actions');
    expect(supportWorkflowCopy).toContain('proof-led assignment reviews');
    expect(supportWorkflowCopy).toContain('assignment-review workflows');
    expect(supportWorkflowCopy).toContain('assignment-review workflow narrow');
    expect(supportWorkflowCopy).toContain('Proof-first assignment review readiness review');
    expect(supportWorkflowCopy).toContain('Assignment review operations');
    expect(supportWorkflowCopy).toContain(
      'Reduced review uncertainty in a sensitive assignment-review workflow'
    );
    expect(supportWorkflowCopy).toContain(
      'Confirm this proof submission makes evidence easier to inspect.'
    );
    expect(supportWorkflowCopy).toContain('proof-review signal');
    expect(supportWorkflowCopy).toContain('review proof-backed submissions');
    expect(supportWorkflowCopy).toContain('better-fit assignment reviews');
    expect(supportWorkflowCopy).toContain('support proof-led assignment reviews');
    expect(supportWorkflowCopy).toContain('real proof submissions');
    expect(supportWorkflowCopy).toContain('Proof packet redesign for proof review');
    expect(supportWorkflowCopy).toContain('review submissions through concrete work evidence');
    expect(compactSupportWorkflowCopy).toContain('matching preferences and assignment reviews');
    expect(supportWorkflowCopy).toContain('proof based submission review');
    expect(supportWorkflowCopy).toContain('live assignment-review decision');
    expect(supportWorkflowCopy).toContain('proof submissions through the corridor');
    expect(supportWorkflowCopy).toContain('bevisbaserade inlämningar');
    expect(supportWorkflowCopy).toContain('without exposing participant identity details');
    expect(supportWorkflowCopy).toContain('Keep participant private context out of notes.');
    expect(supportWorkflowCopy).toContain('participant-facing explanation copy');
    expect(supportWorkflowCopy).toContain('proof-review participant consent');
    expect(supportWorkflowCopy).toContain('proof-review participant consented reveal');
    expect(supportWorkflowCopy).toContain('proof-review participant approval');
    expect(supportWorkflowCopy).toContain('hidden identity details before reveal consent');
    expect(supportWorkflowCopy).toContain('participant comms templates');
    expect(supportWorkflowCopy).toContain('Proof-first assignment-review research');
    expect(supportWorkflowCopy).toContain('assignment reviews');
    expect(supportWorkflowCopy).toContain('Matches, proof submissions, conversations');
    expect(supportWorkflowCopy).toContain('without asking participants to overshare');

    for (const staleCopy of [
      'proof-backed candidates',
      'candidate pipeline recovery actions',
      'better-fit opportunities',
      'relevant opportunities',
      'match you with opportunities',
      'Connect you with opportunities',
      'hiring corridor narrow',
      'live hiring corridor decision',
      'Proof-first hiring corridor readiness review',
      'Hiring corridor operations',
      'Reduced review uncertainty in a sensitive hiring workflow',
      'candidate review signal',
      'Confirm the candidate can make proof evidence easier to inspect.',
      'launch-safe candidate story',
      'Proof packet redesign for candidate review',
      'review candidates through concrete work evidence',
      'real candidate signals',
      'preferences and opportunities',
      'proof based candidate review',
      'moving candidates through the corridor',
      'review proof-backed candidates',
      'granska kandidater',
      'without exposing candidate identity',
      'organization and candidate private context',
      'candidate-facing explanation copy',
      'candidate consent',
      'candidate consented reveal',
      'candidate approval exists',
      'candidate identity exposed',
      'candidate comms templates',
      'hidden candidate identity details',
      'Proof-first hiring research',
      'hiring reviews',
      'small hiring panel',
      'Matches, applications, conversations',
      'without asking candidates to overshare',
    ]) {
      expect(compactSupportWorkflowCopy).not.toContain(staleCopy);
    }
  });

  it('keeps consent-to-share copy snapshot-scoped and workflow-led', () => {
    const consentDialog = fs.readFileSync(
      path.join(repoRoot, 'src/components/matching/ConsentToShareDialog.tsx'),
      'utf8'
    );

    expect(consentDialog).toContain('Consent to Share Proof Snapshot');
    expect(consentDialog).toContain('exact proof-review snapshot');
    expect(consentDialog).toContain('request the next workflow stage');
    expect(consentDialog).toContain('assignment workflow');
    expect(consentDialog).toContain('Give Consent & Share Snapshot');
    expect(consentDialog).not.toContain('Consent to Share Profile');
    expect(consentDialog).not.toContain('Your profile will be shared');
    expect(consentDialog).not.toContain('continue the hiring corridor');
    expect(consentDialog).not.toContain('part of their hiring process');
    expect(consentDialog).not.toContain('hiring process');
    expect(consentDialog).not.toContain('Give Consent & Share Profile');
  });

  it('keeps identity reveal messaging stage-scoped and approval-led', () => {
    const revealCard = fs.readFileSync(
      path.join(repoRoot, 'src/components/messaging/RevealIdentityCard.tsx'),
      'utf8'
    );

    expect(revealCard).toContain('Identity reveal approved');
    expect(revealCard).toContain('Approved identity fields are now visible');
    expect(revealCard).toContain('Request Identity Reveal');
    expect(revealCard).toContain('approved identity fields are shown');
    expect(revealCard).toContain('Reveal Approved Identity Fields');
    expect(revealCard).toContain('Reveal Approved Fields');
    expect(revealCard).toContain('move this workflow beyond masked review');
    expect(revealCard).not.toContain('Identities Revealed!');
    expect(revealCard).not.toContain("see each other's full profiles");
    expect(revealCard).not.toContain('Reveal My Identity');
    expect(revealCard).not.toContain('Your identity will be revealed when they agree');
    expect(revealCard).not.toContain('continue the hiring corridor');
    expect(revealCard).not.toContain('hiring corridor');
  });

  it('keeps active interview pages workflow-led instead of generic hiring-corridor led', () => {
    const interviewPages = [
      'src/app/app/i/interviews/IndividualInterviewsPage.tsx',
      'src/app/app/o/[slug]/interviews/page.tsx',
    ]
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');
    const hiringCorridorSnapshot = fs.readFileSync(
      path.join(repoRoot, 'src/lib/hiring-corridor/snapshot.ts'),
      'utf8'
    );
    const workflowContracts = fs.readFileSync(
      path.join(repoRoot, 'src/lib/workflow/contracts.ts'),
      'utf8'
    );
    const hiringCorridorSnapshotTest = fs.readFileSync(
      path.join(repoRoot, 'tests/lib/hiring-corridor-snapshot.test.ts'),
      'utf8'
    );
    const organizationInterviewsPageTest = fs.readFileSync(
      path.join(repoRoot, 'tests/ui/organization-interviews-page-actions.test.tsx'),
      'utf8'
    );

    expect(interviewPages).toContain('Interview workflow is loading');
    expect(interviewPages).toContain('Loading interview workflow');
    expect(interviewPages).toContain('Track the staged workflow');
    expect(interviewPages).toContain('No active interview workflow yet');
    expect(interviewPages).toContain('workflow stage');
    expect(interviewPages).toContain('workflow messaging');
    expect(interviewPages).not.toContain('Track the full hiring corridor');
    expect(interviewPages).not.toContain('No active hiring corridor yet');
    expect(interviewPages).not.toContain('Loading interview corridor');
    expect(interviewPages).not.toContain('Interview corridor is loading');
    expect(interviewPages).not.toContain('candidate via messaging');
    expect(hiringCorridorSnapshot).toContain('proof-review participant');
    expect(hiringCorridorSnapshot).toContain('The engagement decision is recorded');
    expect(hiringCorridorSnapshot).toContain('decision stage');
    expect(hiringCorridorSnapshotTest).toContain(
      'Waiting for proof-review participant confirmation'
    );
    expect(workflowContracts).toContain('Awaiting proof-review participant confirmation');
    expect(workflowContracts).toContain('submission invite is actively pursued');
    expect(workflowContracts).toContain(
      'future self-serve application object would represent explicit proof-review participant intent'
    );
    expect(workflowContracts).toContain('outside the active MVP corridor');
    expect(workflowContracts).toContain(
      'At most one active intro may exist per participant profile and assignment.'
    );
    expect(organizationInterviewsPageTest).toContain(
      'Engagement: Awaiting proof-review participant confirmation'
    );
    expect(hiringCorridorSnapshot).not.toContain('The candidate is shortlisted');
    expect(hiringCorridorSnapshot).not.toContain('The candidate needs to accept');
    expect(hiringCorridorSnapshot).not.toContain('The candidate expressed interest');
    expect(hiringCorridorSnapshot).not.toContain('The candidate advanced');
    expect(hiringCorridorSnapshotTest).not.toContain('Waiting for candidate confirmation');
    expect(workflowContracts).not.toContain('Awaiting candidate confirmation');
    expect(workflowContracts).not.toContain(
      'Application is explicit candidate intent submitted through an application surface'
    );
    expect(workflowContracts).not.toContain(
      'Duplicate applications may only exist as resubmissions after a terminal outcome.'
    );
    expect(workflowContracts).not.toContain(
      'A duplicate application must never create a second active intro.'
    );
    expect(workflowContracts).not.toContain(
      'At most one active intro may exist per candidate_profile_id and assignment_id.'
    );
    expect(organizationInterviewsPageTest).not.toContain('Awaiting candidate confirmation');
    expect(hiringCorridorSnapshot).not.toContain('so the candidate can complete');
    expect(hiringCorridorSnapshot).not.toContain('hire decision');
    expect(hiringCorridorSnapshot).not.toContain('The decision is hire');
  });

  it('keeps decision dialog workflow-scoped and engagement-distinct', () => {
    const decisionDialog = fs.readFileSync(
      path.join(repoRoot, 'src/components/decisions/DecisionDialog.tsx'),
      'utf8'
    );
    const startFromCvDialog = fs.readFileSync(
      path.join(repoRoot, 'src/components/profile/StartFromCvDialog.tsx'),
      'utf8'
    );

    expect(decisionDialog).toContain('Record Workflow Decision');
    expect(decisionDialog).toContain('Your workflow decision has been recorded');
    expect(decisionDialog).toContain('Move to engagement confirmation');
    expect(decisionDialog).toContain('decision and verification stay distinct');
    expect(decisionDialog).toContain('without an engagement outcome');
    expect(decisionDialog).toContain('Close this assignment workflow');
    expect(decisionDialog).toContain('without a broader profile judgment');
    expect(decisionDialog).toContain('not sent through workflow notifications');
    expect(decisionDialog).toContain('Confirm Workflow Decision');
    expect(decisionDialog).not.toContain('Make Hiring Decision');
    expect(decisionDialog).not.toContain('Extend an offer to this candidate');
    expect(decisionDialog).not.toContain('Not a fit for this role');
    expect(decisionDialog).not.toContain('Your ${decision} decision has been recorded');
    expect(decisionDialog).not.toContain('will not be shared with the candidate');
    expect(decisionDialog).not.toContain('candidate-facing workflow notifications');
    expect(decisionDialog).not.toContain('hiring and verification stay distinct');
    expect(decisionDialog).not.toContain('without a hiring outcome');
    expect(startFromCvDialog).toContain('workflow decisions');
    expect(startFromCvDialog).not.toContain('hiring decisions');
  });

  it('keeps retired wellbeing and Zen implementation modules archived', () => {
    expect(fs.existsSync(path.join(repoRoot, 'src/components/wellbeing'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'src/components/zen'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'src/components/dashboard/ZenSnapshotCard.tsx'))).toBe(
      false
    );
    expect(fs.existsSync(path.join(repoRoot, 'src/lib/wellbeing'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'src/lib/zen'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'src/data/zen.ts'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'src/archive/non_launch_wellbeing/README.md'))).toBe(
      true
    );
  });

  it('keeps retired Zoom and scaffolded video provider wrappers archived', () => {
    expect(fs.existsSync(path.join(repoRoot, 'src/lib/integrations/zoom.ts'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'src/lib/video'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'src/components/interviews/InterviewCard.tsx'))).toBe(
      false
    );
    expect(
      fs.existsSync(path.join(repoRoot, 'src/components/interviews/InterviewConfirmation.tsx'))
    ).toBe(false);
    expect(
      fs.existsSync(path.join(repoRoot, 'src/components/interviews/ScheduleInterviewDialog.tsx'))
    ).toBe(false);
    expect(
      fs.existsSync(
        path.join(
          repoRoot,
          'src/archive/non_launch_integrations/preserved/lib/integrations/zoom.ts'
        )
      )
    ).toBe(true);
    expect(
      fs.existsSync(path.join(repoRoot, 'src/archive/non_launch_integrations/preserved/lib/video'))
    ).toBe(true);

    const activeLaunchText = [
      ...listFiles(path.join(repoRoot, 'src')),
      ...listFiles(path.join(repoRoot, 'docs')),
      ...listFiles(path.join(repoRoot, 'scripts')),
    ]
      .filter((file) => !file.includes(`${path.sep}archive${path.sep}`))
      .filter((file) => /\.(md|mjs|ts|tsx)$/.test(file))
      .map((file) => fs.readFileSync(file, 'utf8'))
      .join('\n');

    expect(activeLaunchText).not.toContain('Zoom or Google Meet');
    expect(activeLaunchText).not.toContain('native Zoom/Google provider success');
  });

  it('keeps active interview fixtures on launch-safe meeting links', () => {
    const retiredZoomMeetingUrlPrefix = 'https://zoom.us' + '/j';
    const interviewVisualFixtures = fs.readFileSync(
      path.join(repoRoot, 'src/lib/interviews/visual-fixtures.ts'),
      'utf8'
    );
    const activeFiles = [
      ...listFiles(path.join(repoRoot, 'src'), ['.ts', '.tsx']),
      ...listFiles(path.join(repoRoot, 'tests'), ['.ts', '.tsx']),
      ...listFiles(path.join(repoRoot, 'scripts'), ['.ts']),
      ...listFiles(path.join(repoRoot, 'emails'), ['.tsx']),
    ].filter((file) => !file.includes(`${path.sep}archive${path.sep}`));

    const offenders = activeFiles
      .filter((file) => fs.readFileSync(file, 'utf8').includes(retiredZoomMeetingUrlPrefix))
      .map((file) => path.relative(repoRoot, file));

    expect(offenders).toEqual([]);
    expect(interviewVisualFixtures).toContain(
      'Interview coordination is active for this proof-review participant.'
    );
    expect(interviewVisualFixtures).toContain('The engagement decision is recorded.');
    expect(interviewVisualFixtures).not.toContain(
      'Interview coordination is active for this candidate.'
    );
    expect(interviewVisualFixtures).not.toContain('The hire decision is recorded.');
    expect(interviewVisualFixtures).not.toContain('The decision is hire');
  });

  it('keeps generic customizable dashboard shell archived', () => {
    const retiredPaths = [
      'src/components/dashboard/CustomizableDashboard.tsx',
      'src/components/dashboard/CustomizeModal.tsx',
      'src/components/dashboard/DashboardCustomizer.tsx',
      'src/components/dashboard/DashboardSkeleton.tsx',
      'src/components/dashboard/DashboardTile.tsx',
      'src/components/dashboard/DraggableDashboard.tsx',
      'src/components/dashboard/DynamicDashboard.tsx',
      'src/app/app/o/[slug]/home/OrgDashboardClient.tsx',
      'src/app/app/o/[slug]/home/SuspendedOrgDashboardClient.tsx',
      'src/lib/dashboard/indDataFetchers.ts',
      'src/lib/dashboard/layout.ts',
      'src/lib/dashboard/orgDataFetchers.ts',
      'src/components/dashboard/ExpertiseDepthWidget.tsx',
      'src/components/dashboard/ExploreCard.tsx',
      'src/components/dashboard/GapMapWidget.tsx',
      'src/components/dashboard/GoalsCard.tsx',
      'src/components/dashboard/ImpactSnapshotCard.tsx',
      'src/components/dashboard/InterviewsFeedbackCard.tsx',
      'src/components/dashboard/MatchingReadinessCard.tsx',
      'src/components/dashboard/MatchingResultsCard.tsx',
      'src/components/dashboard/MomentumMetricsCard.tsx',
      'src/components/dashboard/NextBestActionsWidget.tsx',
      'src/components/dashboard/NextStepsHelper.tsx',
      'src/components/dashboard/NotificationsCard.tsx',
      'src/components/dashboard/OrgGoalsCard.tsx',
      'src/components/dashboard/OrgMatchingCard.tsx',
      'src/components/dashboard/ProfileActivationCard.tsx',
      'src/components/dashboard/ProjectsCard.tsx',
      'src/components/dashboard/ReadinessSprintPanel.tsx',
      'src/components/dashboard/TasksCard.tsx',
      'src/components/dashboard/TeamRolesCard.tsx',
      'src/components/dashboard/WhileAwayCard.tsx',
      'src/components/dashboard/org/NextActionsCard.tsx',
      'src/components/dashboard/org/OrgReadinessCard.tsx',
      'src/components/dashboard/org/TTSCTrendCard.tsx',
      'tests/ui/draggable-dashboard-while-away-visibility.test.tsx',
      'tests/ui/dashboard-status-chip-style.test.tsx',
      'tests/ui/next-steps-helper.test.tsx',
      'tests/ui/org-dashboard-archived-nav.test.tsx',
      'tests/ui/tasks-card.test.tsx',
      'tests/ui/while-away-card.test.tsx',
      'tests/ui/projects-card.test.tsx',
      'tests/dashboard-layout.test.ts',
    ];

    for (const retiredPath of retiredPaths) {
      expect(fs.existsSync(path.join(repoRoot, retiredPath))).toBe(false);
    }

    expect(
      fs.existsSync(path.join(repoRoot, 'src/archive/non_launch_dashboard_ui/README.md'))
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          repoRoot,
          'src/archive/non_launch_dashboard_ui/app/o/[slug]/home/OrgDashboardClient.tsx'
        )
      )
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          repoRoot,
          'src/archive/non_launch_dashboard_ui/components/dashboard/OrgMatchingCard.tsx'
        )
      )
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'src/archive/non_launch_dashboard_ui/lib/dashboard/layout.ts')
      )
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'src/archive/non_launch_dashboard_ui/lib/dashboard/indDataFetchers.ts')
      )
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'src/archive/non_launch_dashboard_ui/lib/dashboard/orgDataFetchers.ts')
      )
    ).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'tests/archive/non_mvp_dashboard_ui/README.md'))).toBe(
      true
    );
  });

  it('keeps broad organization suite components archived', () => {
    const retiredPaths = [
      'src/components/organization/CultureEditor.tsx',
      'src/components/organization/ProjectsManager.tsx',
      'src/components/organization/PartnershipsManager.tsx',
      'src/components/organization/StructureManager.tsx',
      'src/components/organization/ImpactDashboard.tsx',
      'src/components/organization/GoalsManager.tsx',
      'src/components/organization/OrgCandidatesWorkspace.tsx',
      'src/components/organization/OrganizationBasicInfoEditor.tsx',
      'src/components/assignments/AssignmentManager.tsx',
      'src/components/assignments/StakeholderAssignmentForm.tsx',
      'src/components/assignments/StakeholderInviteDialog.tsx',
      'src/lib/org/defaults.ts',
      'src/lib/org/copy-variants.ts',
      'tests/ui/org-candidates-workspace.test.tsx',
      'tests/ui/organization-basic-info-editor.test.tsx',
    ];

    for (const retiredPath of retiredPaths) {
      expect(fs.existsSync(path.join(repoRoot, retiredPath))).toBe(false);
    }

    expect(
      fs.existsSync(path.join(repoRoot, 'src/components/organization/OrgTrustProfileEditor.tsx'))
    ).toBe(true);
    expect(
      fs.existsSync(path.join(repoRoot, 'src/archive/non_launch_org_suite/lib/org/defaults.ts'))
    ).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'src/archive/non_launch_org_suite/README.md'))).toBe(
      true
    );
    expect(
      fs.existsSync(
        path.join(repoRoot, 'src/archive/non_launch_assignment_collaboration/README.md')
      )
    ).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'tests/archive/non_mvp_org_suite/README.md'))).toBe(
      true
    );
  });

  it('keeps retired contract-signing E2E journeys archived', () => {
    const activeBroadWorkflow = fs.readFileSync(
      path.join(repoRoot, 'e2e/workflows.spec.ts'),
      'utf8'
    );
    const retiredPaths = [
      'emails/ContractSigned.tsx',
      'tests/e2e/complete-user-journey.spec.ts',
      'tests/e2e/helpers/page-objects.ts',
    ];

    for (const retiredPath of retiredPaths) {
      expect(fs.existsSync(path.join(repoRoot, retiredPath))).toBe(false);
    }

    expect(
      fs.existsSync(path.join(repoRoot, 'tests/archive/non_mvp_contract_flow/README.md'))
    ).toBe(true);
    expect(
      fs.existsSync(path.join(repoRoot, 'src/archive/non_launch_contract_flow/README.md'))
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'src/archive/non_launch_contract_flow/emails/ContractSigned.tsx')
      )
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          repoRoot,
          'tests/archive/non_mvp_contract_flow/complete-user-journey.archived.spec.ts'
        )
      )
    ).toBe(true);

    expect(activeBroadWorkflow).toContain('Archived Contract Surfaces');
    expect(activeBroadWorkflow).toContain(
      'does not expose contract signing as an active MVP route'
    );
    expect(activeBroadWorkflow).not.toContain('Contract Attestation');
    expect(activeBroadWorkflow).not.toContain('should display contracts page');
    expect(activeBroadWorkflow).not.toContain("Page might not exist yet - that's ok");
  });

  it('keeps active code from linking users into archived contract routes', () => {
    const activeRoots = ['src', 'emails'].map((root) => path.join(repoRoot, root));
    const activeFiles = activeRoots.flatMap((root) =>
      fs.existsSync(root)
        ? listFiles(root).filter(
            (file) =>
              /\.[cm]?(?:ts|tsx|js|jsx)$/.test(file) &&
              !file.includes(`${path.sep}archive${path.sep}`)
          )
        : []
    );

    const offenders = activeFiles
      .filter((file) => fs.readFileSync(file, 'utf8').includes('/app/contracts'))
      .map((file) => path.relative(repoRoot, file));

    expect(offenders).toEqual([]);
  });

  it('keeps retired feedback SUS trigger UI archived', () => {
    const retiredPaths = [
      'src/components/feedback/SUSTriggerProvider.tsx',
      'src/components/feedback/SUSSurvey.tsx',
      'src/lib/feedback/sus-scoring.ts',
    ];

    for (const retiredPath of retiredPaths) {
      expect(fs.existsSync(path.join(repoRoot, retiredPath))).toBe(false);
    }

    expect(
      fs.existsSync(path.join(repoRoot, 'src/archive/non_launch_feedback_sus/README.md'))
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'src/archive/non_launch_feedback_sus/components/feedback/SUSSurvey.tsx')
      )
    ).toBe(true);
  });

  it('keeps retired Expertise shared UI components archived', () => {
    expect(fs.existsSync(path.join(repoRoot, 'src/components/expertise'))).toBe(false);
    expect(
      fs.existsSync(
        path.join(
          repoRoot,
          'src/archive/non_launch_pages/app/i/expertise/implementation/shared-components/expertise'
        )
      )
    ).toBe(true);
  });

  it('keeps the retired skill gaps UI archived with the Expertise Atlas surface', () => {
    expect(fs.existsSync(path.join(repoRoot, 'src/components/skill-gaps'))).toBe(false);
    expect(
      fs.existsSync(path.join(repoRoot, 'src/archive/non_launch_pages/app/i/skill-gaps/README.md'))
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          repoRoot,
          'src/archive/non_launch_pages/app/i/skill-gaps/implementation/SkillGapsClient.tsx'
        )
      )
    ).toBe(true);
    const archivedExpertiseAtlas = fs.readFileSync(
      path.join(
        repoRoot,
        'src/archive/non_launch_pages/app/i/expertise/implementation/ExpertiseAtlasClient.tsx'
      ),
      'utf8'
    );
    const archivedSkillGapsReadme = fs.readFileSync(
      path.join(repoRoot, 'src/archive/non_launch_pages/app/i/skill-gaps/README.md'),
      'utf8'
    );
    const archivedSkillGapsImport =
      '@' + '/archive/non_launch_pages/app/i/skill-gaps/implementation/SkillGapsClient';

    expect(archivedExpertiseAtlas).toContain(archivedSkillGapsImport);
    expect(archivedExpertiseAtlas).not.toContain('@/components/skill-gaps/SkillGapsClient');
    expect(archivedSkillGapsReadme).toContain('/api/skill-gaps*');
    expect(archivedSkillGapsReadme).toContain('outside the locked MVP corridor');
  });

  it('keeps unfinished assignment and coming-soon UI out of active components', () => {
    const activeRetiredComponents = [
      'src/components/matching/AssignmentBuilderV2.tsx',
      'src/components/matching/WeightsFiltersSheet.tsx',
      'src/components/assignments/AssignmentWizard.tsx',
      'src/components/support/ChatWidget.tsx',
      'src/components/settings/VeriffVerification.tsx',
      'src/components/ComingSoon.tsx',
    ];
    const archivedRetiredComponents = [
      'src/archive/non_launch_assignment_collaboration/components/matching/AssignmentBuilderV2.tsx',
      'src/archive/non_launch_assignment_collaboration/components/matching/WeightsFiltersSheet.tsx',
      'src/archive/non_launch_pages/components/ComingSoon.tsx',
      'src/archive/non_launch_pages/components/README.md',
    ];

    for (const activePath of activeRetiredComponents) {
      expect(fs.existsSync(path.join(repoRoot, activePath))).toBe(false);
    }
    for (const archivedPath of archivedRetiredComponents) {
      expect(fs.existsSync(path.join(repoRoot, archivedPath))).toBe(true);
    }

    const assignmentArchiveReadme = fs.readFileSync(
      path.join(repoRoot, 'src/archive/non_launch_assignment_collaboration/README.md'),
      'utf8'
    );
    const genericComponentsReadme = fs.readFileSync(
      path.join(repoRoot, 'src/archive/non_launch_pages/components/README.md'),
      'utf8'
    );

    expect(compactWhitespace(assignmentArchiveReadme)).toContain(
      'unfinished TODO/coming-soon behavior'
    );
    expect(genericComponentsReadme).toContain('should not render generic "coming soon"');
  });

  it('keeps retired in-app chat configuration out of the launch runtime', () => {
    const envExample = fs.readFileSync(path.join(repoRoot, '.env.example'), 'utf8');
    const appEnhancements = fs.readFileSync(
      path.join(repoRoot, 'src/components/root/DeferredAppEnhancements.tsx'),
      'utf8'
    );

    expect(fs.existsSync(path.join(repoRoot, 'src/components/support/ChatWidget.tsx'))).toBe(false);
    expect(envExample).not.toContain('NEXT_PUBLIC_CRISP_WEBSITE_ID');
    expect(envExample).not.toContain('Crisp');
    expect(appEnhancements).not.toContain('ChatWidget');
    expect(appEnhancements).not.toContain('client.crisp.chat');
  });

  it('keeps retired fairness settings implementation archived', () => {
    expect(fs.existsSync(path.join(repoRoot, 'src/app/app/i/settings/fairness'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'src/components/settings/DemographicOptIn.tsx'))).toBe(
      false
    );
    expect(
      fs.existsSync(
        path.join(repoRoot, 'src/archive/non_launch_pages/app/i/settings/fairness/README.md')
      )
    ).toBe(true);
  });

  it('keeps broad admin analytics and fairness modules archived', () => {
    const retiredPaths = [
      'src/components/admin/FairnessDashboard.tsx',
      'src/components/admin/FairnessReport.tsx',
      'src/components/admin/MetricsDashboard.tsx',
      'src/components/admin/PerformanceDashboard.tsx',
      'src/components/admin/organizations',
      'src/components/admin/users',
      'src/components/analytics',
      'src/components/metrics',
      'src/components/dashboard/org/FairnessNoteCard.tsx',
      'src/lib/analytics/fairness.ts',
      'src/lib/analytics/fairness-gaps.ts',
      'src/lib/analytics/fairness-note-generator.ts',
      'src/lib/reports/fairness-note.ts',
    ];

    for (const retiredPath of retiredPaths) {
      expect(fs.existsSync(path.join(repoRoot, retiredPath))).toBe(false);
    }
    expect(fs.existsSync(path.join(repoRoot, 'src/archive/non_launch_admin_ui/README.md'))).toBe(
      true
    );
  });

  it('keeps active E2E helpers away from the retired Expertise Atlas route', () => {
    const activeHelperFiles = fs
      .readdirSync(path.join(repoRoot, 'e2e/helpers'), { withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.[cm]?tsx?$/.test(entry.name))
      .map((entry) => path.join(repoRoot, 'e2e/helpers', entry.name));

    const offenders = activeHelperFiles
      .filter((file) => fs.readFileSync(file, 'utf8').includes('/app/i/expertise'))
      .map((file) => path.relative(repoRoot, file));

    expect(offenders).toEqual([]);
  });

  it('keeps active broad E2E helpers fail-closed instead of using fake verification or score data', () => {
    const activeBroadE2eHelpers = ['e2e/helpers/auth.ts', 'e2e/helpers/test-data.ts']
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');

    expect(activeBroadE2eHelpers).toContain('fails closed');
    expect(activeBroadE2eHelpers).toContain('No connected test email inbox is configured');
    expect(activeBroadE2eHelpers).toContain('No E2E test-data adapter is configured');
    expect(activeBroadE2eHelpers).toContain('proofSignals');
    expect(activeBroadE2eHelpers).not.toContain('For now, this is a placeholder');
    expect(activeBroadE2eHelpers).not.toContain('Email verification not implemented');
    expect(activeBroadE2eHelpers).not.toContain('mock-verification-token');
    expect(activeBroadE2eHelpers).not.toContain('matchScore:');
  });

  it('keeps strict organization E2E copy assignment-review scoped', () => {
    const strictFixtures = fs.readFileSync(
      path.join(repoRoot, 'e2e/helpers/strict-fixtures.ts'),
      'utf8'
    );
    const strictOrganizationSpec = fs.readFileSync(
      path.join(repoRoot, 'e2e/strict/organization.strict.spec.ts'),
      'utf8'
    );
    const strictOrgE2eCopy = `${strictFixtures}\n${strictOrganizationSpec}`;

    expect(strictOrgE2eCopy).toContain('focused proof-first assignment review path');
    expect(strictOrgE2eCopy).toContain('review proof submissions through quality');
    expect(strictOrgE2eCopy).toContain('review proof submissions instead of generic role language');
    expect(strictOrgE2eCopy).toContain('Portfolio-ready proof-submission seed');
    expect(strictOrgE2eCopy).toContain('strict proof-submission artifacts');
    expect(strictOrgE2eCopy).toContain('strict proof-submission pack');
    expect(strictOrgE2eCopy).toContain('Strict Proof Review Org');
    expect(strictOrgE2eCopy).toContain('strict proof-review experience context');
    expect(strictOrgE2eCopy).toContain('strict proof-submission matching profile');
    expect(strictOrgE2eCopy).toContain('strict proof-submission verification record');
    expect(strictOrgE2eCopy).toContain('proof-submission expectations');
    expect(strictOrgE2eCopy).toContain('proof-submission matches');
    expect(strictOrgE2eCopy).toContain('Current review workspace');
    expect(strictOrgE2eCopy).toContain('New assignment');
    expect(strictOrgE2eCopy).not.toContain('narrow, proof-first hiring corridor');
    expect(strictOrgE2eCopy).not.toContain('review candidates through proof quality');
    expect(strictOrgE2eCopy).not.toContain('review candidates through real proof');
    expect(strictOrgE2eCopy).not.toContain('candidate proof expectations');
    expect(strictOrgE2eCopy).not.toContain('strict candidate proof');
    expect(strictOrgE2eCopy).not.toContain('Strict Candidate Org');
    expect(strictOrgE2eCopy).not.toContain('strict candidate experience context');
    expect(strictOrgE2eCopy).not.toContain('strict candidate matching profile');
    expect(strictOrgE2eCopy).not.toContain('strict candidate verification record');
    expect(strictOrgE2eCopy).not.toContain('strict candidate matching consent obligation');
    expect(strictOrgE2eCopy).not.toContain('strict candidate profile shell');
    expect(strictOrgE2eCopy).not.toContain('Portfolio-ready candidate seed');
    expect(strictOrgE2eCopy).not.toContain('ranked matches');
    expect(strictOrgE2eCopy).not.toContain('blind candidate');
    expect(strictOrgE2eCopy).not.toContain('generic hiring language');
    expect(strictOrgE2eCopy).not.toContain('hiring decisions end to end');
    expect(strictOrgE2eCopy).not.toContain('A focused launch desk for one clean hiring corridor');
    expect(strictOrgE2eCopy).not.toContain('Organization review cockpit');
    expect(strictOrgE2eCopy).not.toContain("heading', { name: 'Corridor Queue'");
  });

  it('keeps active broad E2E matching assertions assignment-review scoped', () => {
    const broadE2eMatchingSpecs = [
      'e2e/workflows.spec.ts',
      'e2e/comprehensive_flow.spec.ts',
      'e2e/helpers/matching-helpers.ts',
    ]
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');

    expect(broadE2eMatchingSpecs).toContain('assignment reviews');
    expect(broadE2eMatchingSpecs).toContain('/matching');
    expect(broadE2eMatchingSpecs).toContain('[data-testid="match-card"]');
    expect(broadE2eMatchingSpecs).toContain('keeps matching proof-led and score-free');
    expect(broadE2eMatchingSpecs).toContain('raw score artifacts are hidden');
    expect(broadE2eMatchingSpecs).toContain('verifyRawScoreArtifactsHidden');
    expect(broadE2eMatchingSpecs).toContain('verifyExactRankArtifactsHidden');
    expect(broadE2eMatchingSpecs).toContain('exact rank artifacts stay hidden');
    expect(broadE2eMatchingSpecs).not.toContain('expect(true).toBeTruthy()');
    expect(broadE2eMatchingSpecs).not.toContain('no opportunities');
    expect(broadE2eMatchingSpecs).not.toContain('matches|opportunities');
    expect(broadE2eMatchingSpecs).not.toContain('.opportunity-card');
    expect(broadE2eMatchingSpecs).not.toContain('should show match score');
    expect(broadE2eMatchingSpecs).not.toContain('Verify match score is displayed');
    expect(broadE2eMatchingSpecs).not.toContain('Look for match score indicators');
    expect(broadE2eMatchingSpecs).not.toContain('rank transparency');
    expect(broadE2eMatchingSpecs).not.toContain('Verify rank display');
    expect(broadE2eMatchingSpecs).not.toContain('Look for rank indicators');
    expect(broadE2eMatchingSpecs).not.toContain('verifyRankDisplay');
  });

  it('keeps active organization integration E2E proof-submission scoped', () => {
    const organizationIntegrationCopy = [
      'e2e/integration/organization-complete-journey.spec.ts',
      'e2e/helpers/organization-helpers.ts',
      'e2e/matching-messages-empty-visual.spec.ts',
    ]
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');

    expect(organizationIntegrationCopy).toContain('Proof-Submission Review');
    expect(organizationIntegrationCopy).toContain('proof-submission matches');
    expect(organizationIntegrationCopy).toContain('proof-submission detail');
    expect(organizationIntegrationCopy).toContain('proof-submission review');
    expect(organizationIntegrationCopy).toContain('viewProofSubmissionDetail');
    expect(organizationIntegrationCopy).toContain('Proof submission|Submission|Skills|Experience');
    expect(organizationIntegrationCopy).toContain('no proof submissions');
    expect(organizationIntegrationCopy).toContain('Identity remains protected before reveal');
    expect(organizationIntegrationCopy).not.toContain('Candidate Discovery');
    expect(organizationIntegrationCopy).not.toContain('For now, test page structure');
    expect(organizationIntegrationCopy).not.toContain(
      'For now, verify matching page is accessible'
    );
    expect(organizationIntegrationCopy).not.toContain("Don't fail test");
    expect(organizationIntegrationCopy).not.toContain('Could not create assignment');
    expect(organizationIntegrationCopy).not.toContain('Assignment creation in complete journey');
    expect(organizationIntegrationCopy).not.toContain('ranked matches for assignment');
    expect(organizationIntegrationCopy).not.toContain('candidate deep dive');
    expect(organizationIntegrationCopy).not.toContain('candidate interactions');
    expect(organizationIntegrationCopy).not.toContain('Could not view candidate profile');
    expect(organizationIntegrationCopy).not.toContain('viewCandidateProfile');
    expect(organizationIntegrationCopy).not.toContain('a[href*="candidate"]');
    expect(organizationIntegrationCopy).not.toContain(
      'Candidate identity remains protected before reveal'
    );
    expect(organizationIntegrationCopy).not.toContain('no candidates');
    expect(organizationIntegrationCopy).not.toContain('Match Score|Overall Score');
  });

  it('keeps polish screenshot scratch out of default E2E discovery', () => {
    expect(fs.existsSync(path.join(repoRoot, 'e2e/polish-audit.spec.ts'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'e2e/polish_audit.spec.ts'))).toBe(false);

    const scratchReadme = fs.readFileSync(
      path.join(repoRoot, '.artifacts/polish-audit-screenshots/README.md'),
      'utf8'
    );
    expect(scratchReadme).toContain('local visual-audit scratch evidence only');
    expect(scratchReadme).toContain('not an automated launch gate');
    expect(scratchReadme).toContain('Use Browser');
  });

  it('lets launch-smoke command scenarios override shared local environment', () => {
    const launchSmokeRunner = fs.readFileSync(
      path.join(repoRoot, 'scripts/launch-smoke-runner.ts'),
      'utf8'
    );
    const smokeRunnerEnv = fs.readFileSync(
      path.join(repoRoot, 'src/lib/launch/smoke-runner-env.ts'),
      'utf8'
    );

    expect(launchSmokeRunner).toContain('buildLaunchSmokeScenarioEnv');
    expectTextBefore(smokeRunnerEnv, '...sharedEnv,', '...scenarioEnv,');
    expect(smokeRunnerEnv).toContain('PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY');
    expect(smokeRunnerEnv).toContain("executionMode === 'live'");
  });
});
