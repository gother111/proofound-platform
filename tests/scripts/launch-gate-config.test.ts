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

  it('keeps the locked MVP authority stack fresh and visibly classified', () => {
    const docsRegistry = compactWhitespace(
      fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8')
    );
    const authorityDocs = [
      ['AGENTS.md', 'repo+live'],
      ['Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md', 'repo'],
      ['PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md', 'repo+live'],
      ['PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md', 'repo+live'],
      ['LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md', 'repo+live'],
      ['Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md', 'repo+live'],
    ] as const;

    for (const [docPath, verificationSource] of authorityDocs) {
      const content = fs.readFileSync(path.join(repoRoot, docPath), 'utf8');
      expect(content).toContain('Doc Class:');
      expect(content).toContain('Last Verified: `2026-05-19`');
      expect(docsRegistry).toContain(
        `| \`${docPath}\` | \`active\` | \`root\` | \`${verificationSource}\` | \`2026-05-19\``
      );
    }
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

    expect(designContract).toContain('Last Verified: `2026-05-19`');
    expect(designContract).toContain('primary object obvious');
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

    expect(ubiquitousLanguage).toContain('Doc Class: `active`');
    expect(ubiquitousLanguage).toContain('Last Verified: `2026-05-19`');
    expect(ubiquitousLanguage).toContain('Primary object');
    expect(ubiquitousLanguage).toContain('Primary next action');
    expect(ubiquitousLanguage).toContain('Reason code');
    expect(ubiquitousLanguage).toContain('Manual-link interview');
    expect(ubiquitousLanguage).toContain('Privacy stage');
    expect(ubiquitousLanguage).toContain('public directory, profile theater, vanity metric');

    expect(styleMap).toContain('Last Verified: `2026-05-19`');
    expect(styleMap).toContain('DESIGN.md');
    expect(styleMap).toContain('`--proofound-forest`');
    expect(styleMap).toContain('`#56624F`');
    expect(styleMap).toContain('public directory');
    expect(styleMap).toContain('Dark mode is not an active supported theme');
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
      '| `DESIGN.md`                                                                                             | `active`         | `root`        | `repo`              | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md`                                                                 | `active`         | `docs`        | `repo`              | `2026-05-19`'
    );
  });

  it('keeps landing proof examples away from broad enterprise SaaS framing', () => {
    const landingStory = fs.readFileSync(
      path.join(repoRoot, 'src/components/landing/sections/ScrollytellingSection.tsx'),
      'utf8'
    );

    expect(landingStory).toContain('Mission-led team');
    expect(landingStory).toContain('Proof-led review');
    expect(landingStory).toContain('mission-driven team scaling one hiring program');
    expect(landingStory).not.toContain('B2B SaaS');
    expect(landingStory).not.toContain('Enterprise clients');
    expect(landingStory).not.toContain('B2B platform');
    expect(landingStory).not.toContain('200+ employees');
    expect(landingStory).not.toContain('growth-stage B2B');

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
    const phaseZero = fs.readFileSync(
      path.join(repoRoot, 'docs/backlog/phase-0-scope-lock.md'),
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
      phaseZero,
      currentStateArtifact,
      launchReadinessSummary,
      phaseFive,
    ].join('\n');

    expect(apiReference).toContain('- Total route handlers: **140**');
    expect(apiReference).toContain(
      '- Launch surface counts: `active MVP=108`, `internal launch ops=16`, `archived compatibility=16`'
    );
    expect(routeDocs).toContain('140 compiled API route handlers');
    expect(routeDocs).toContain('51 compiled pages');
    expect(routeDocs).toContain('108 APIs as active MVP');
    expect(routeDocs).toContain('16 APIs as internal-only launch ops');
    expect(routeDocs).toContain('16 API handlers as archived compatibility responses');
    expect(routeDocs).toContain('/dev/resolve-home');
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
    expect(phaseFive).toContain('Current as of 2026-05-20');
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
    expect(docsRegistry).toContain('> Last Verified: `2026-05-20`');
    expect(docsRegistry).toContain(
      '| `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`                                              | `reference-spec` | `artifacts`   | `repo+browser`      | `2026-05-20`'
    );
    expect(docsRegistry).toContain(
      '| `docs/DOCS_REGISTRY.md`                                                                                 | `active`         | `docs`        | `repo+live`         | `2026-05-20`'
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
      '| `docs/backlog/phase-5-launch-packaging.md`                                                              | `active`         | `docs`        | `repo+live`         | `2026-05-20`'
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
      expect(content).toContain('Last Verified: `2026-05-19`');
      expect(content).toContain('scripts/go-no-go-check.ts');
      expect(content).not.toContain('scripts/go-no-go-check.mjs');
      expect(content).not.toContain('STRICT_PROVIDER_E2E_REQUIRE_BOTH');
      expect(content).not.toContain('both Zoom and Google connected');
      const registryLine = docsRegistry
        .split('\n')
        .find((line) => line.includes(`| \`${docPath}\``));
      expect(registryLine).toContain('| `2026-05-19`');
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

    expect(releaseChecklist).toContain('Last Verified: `2026-05-19`');
    expect(releaseChecklist).toContain('docs/production-readiness-checklist.md');
    expect(releaseChecklist).toContain('docs/backlog/phase-exit-checklist.md');
    expect(releaseChecklist).toContain('mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md');
    expect(releaseChecklist).toContain('BASE_URL=<production-candidate-url>');
    expect(releaseChecklist).toContain('npm run monitor:launch');
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
      '| `docs/release-checklist.md`                                                                             | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
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

    expect(goNoGoScript).toContain('LAUNCH_RESTORE_REPORT_PATH');
    expect(goNoGoScript).toContain('.artifacts/launch-restore-report.json');
    expect(goNoGoScript).toContain('isLocalLaunchBaseUrl');
    expect(goNoGoScript).toContain(
      'production-candidate go/no-go requires a restore verification report'
    );
    expect(goNoGoScript).toContain('restore verification report is stale');
    expect(goNoGoScript).toContain('summary.json');
    expect(goNoGoScript).toContain('row-fingerprint.json');
    expect(goNoGoScript).not.toContain('SUS_STUDY_COMPLETE');

    expect(restoreDrill).toContain(
      'Production-candidate `npm run go:no-go` additionally requires a fresh passing restore verification report'
    );
    expect(restoreDrill).toContain('--out .artifacts/launch-restore-report.json');
    expect(restoreDrill).toContain('summary.json');
    expect(restoreDrill).toContain('row-fingerprint.json');

    expect(verificationChecklist).toContain(
      'Production-candidate runs additionally require a fresh passing restore verification report'
    );
    expect(launchMasterChecklist).toContain(
      'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json'
    );
    for (const content of [
      deploymentChecklist,
      launchMasterChecklist,
      productionReadinessChecklist,
      releaseChecklist,
      phaseExitChecklist,
    ]) {
      expect(content).toContain('CRON_SECRET=<secret>');
      expectTextBefore(
        content,
        'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json',
        'BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run go:no-go'
      );
    }
  });

  it('keeps root production and provider docs aligned with manual-link launch posture', () => {
    const productionChecklist = fs.readFileSync(
      path.join(repoRoot, 'PRODUCTION_CHECKLIST.md'),
      'utf8'
    );
    const providerReference = fs.readFileSync(path.join(repoRoot, 'OAUTH_SETUP_GUIDE.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(productionChecklist).toContain('Last Verified: `2026-05-19`');
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
    expect(productionChecklist).not.toContain('`ZOOM_CLIENT_ID`');
    expect(productionChecklist).not.toContain('Schedule interview with Zoom');
    expect(productionChecklist).not.toContain('/app/admin/metrics');
    expect(productionChecklist).not.toContain('Expertise Profile');
    expect(productionChecklist).not.toContain('PATH=/opt/homebrew');

    expect(providerReference).toContain('Last Verified: `2026-05-19`');
    expect(providerReference).toContain('Doc Class: `reference-spec`');
    expect(providerReference).toContain(
      'Manual-link interview scheduling is the default launch path'
    );
    expect(providerReference).toContain('Zoom-native meeting creation is not required');
    expect(providerReference).toContain('Google Calendar or Google Meet setup may be used only');
    expect(providerReference).not.toContain(
      'Complete guide for setting up Zoom and Google Meet OAuth integrations'
    );
    expect(providerReference).not.toContain('Click "Connect Zoom"');
    expect(providerReference).not.toContain('`ZOOM_CLIENT_ID`');
    expect(providerReference).not.toContain('Schedule interview with Zoom');

    expect(docsRegistry).toContain(
      '| `PRODUCTION_CHECKLIST.md`                                                                               | `active`         | `root`        | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `OAUTH_SETUP_GUIDE.md`                                                                                  | `reference-spec` | `root`        | `repo`              | `2026-05-19`'
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
      expect(content).toContain('Last Verified: `2026-05-19`');
      expect(content).toContain('mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md');
      expect(content).toContain('reason-coded, privacy-safe explanations');
      expect(content).toContain('without automated hiring recommendations');
      expect(content).toContain(
        'Manual-link interview coordination works as the locked MVP default'
      );
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
      '| `Plans.md`                                                                                              | `active`         | `root`        | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `project/Implement.md`                                                                                  | `active`         | `project`     | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `project/Plans.md`                                                                                      | `active`         | `project`     | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps broad reference specs visibly outside current MVP launch authority', () => {
    const referenceDocs = [
      'DATA_REQUIREMENTS_AND_AI_STRATEGY.md',
      'FULL_PRODUCT_ARCHITECTURE_PLAN.md',
      'SPRINT_1_PLAN.md',
    ];
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

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
    expect(userFlows).toContain('not production-ready MVP launch evidence');
    expect(userFlows).toContain('only the locked MVP corridor');
    expect(userFlows).not.toContain('production-ready technical specifications');
    expect(userFlows).not.toContain(
      'All 40 flows (20 Individual + 20 Organization) fully specified.'
    );

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
      'USER_FLOWS_TECHNICAL_SPECIFICATIONS.md',
    ]) {
      const registryLine = docsRegistry
        .split('\n')
        .find((line) => line.includes(`| \`${docPath}\``));
      expect(registryLine).toContain('| `2026-05-19`');
    }
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
      '| `agent/checklists/verification.md`                                                                      | `active`         | `agent`       | `repo+live`         | `2026-05-19`'
    );
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
    expect(resendSetup).toContain('hidden candidate identity details');
    expect(resendSetup).toContain('Do not run live email sends');
    expect(resendSetup).toContain('/api/cron/send-deletion-reminders');
    expect(resendSetup).toContain('/api/cron/process-deletions');
    expect(compactWhitespace(resendSetup)).toContain(
      'Archived standalone deletion cron routes are not active launch infrastructure'
    );
    expect(resendSetup).not.toContain('STATUS: RESEND CONFIGURED');
    expect(resendSetup).not.toContain('Since your RESEND_API_KEY is already configured');
    expect(resendSetup).not.toContain('node scripts/test-email.mjs');
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
    expect(vendorRegister).toContain('npm run test:privacy');
    expect(vendorRegister).toContain(
      'npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json'
    );
    expect(vendorRegister).not.toContain('All vendors are carefully vetted');
    expect(vendorRegister).not.toContain('DPA Signed');
    expect(vendorRegister).not.toContain('SOC 2 Type II certified');
    expect(vendorRegister).not.toContain('GDPR-compliant');
    expect(vendorRegister).not.toContain('CCPA compliance');
    expect(docsRegistry).toContain(
      '| `docs/DATA_PROCESSING_AGREEMENTS.md`                                                                    | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps privacy test guidance from overstating launch evidence', () => {
    const privacyReadme = fs.readFileSync(path.join(repoRoot, 'tests/privacy/README.md'), 'utf8');
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
    expect(loadResults).toContain('Last Verified: `2026-05-19`');
    expect(loadResults).toContain('historical/non-gating load-test notes');
    expect(loadResults).toContain('BASE_URL=<production-candidate-url> npm run perf:budgets');
    expect(loadResults).toContain('optional stress exploration only');
    expect(loadResults).toContain('record the tool version, target, date, owner');
    expect(loadResults).not.toContain('npm install -g artillery');
    expect(loadResults).not.toContain('## How to Run Load Tests');
    expect(loadResults).not.toContain('Track cache hit rates');
    expect(artilleryMatching).toContain("url: '/api/match/profile'");
    expect(artilleryMatching).not.toContain('/api/core/matching/profile');
    expect(docsRegistry).toContain(
      '| `tests/load/RESULTS.md`                                                                                 | `reference-spec` | `tests`       | `repo`              | `2026-05-19`'
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
    const integrationPlan = fs.readFileSync(
      path.join(repoRoot, 'INTEGRATION_TEST_PLAN.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(integrationPlan).toContain('Doc Class: `reference-spec`');
    expect(integrationPlan).toContain('Last Verified: `2026-05-19`');
    expect(integrationPlan).toContain('tests/integration/matching.test.ts');
    expect(integrationPlan).toContain('tests/integration/data-portability.test.ts');
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
      expect(fs.existsSync(path.join(repoRoot, activeIntegrationPath))).toBe(true);
    }
    expect(fs.existsSync(path.join(repoRoot, 'tests/integration/evidence-pack.test.ts'))).toBe(
      false
    );
    expect(
      fs.existsSync(
        path.join(repoRoot, 'tests/archive/non_mvp_evidence_pack/evidence-pack.archived.test.ts')
      )
    ).toBe(true);
    expect(docsRegistry).toContain(
      '| `INTEGRATION_TEST_PLAN.md`                                                                              | `reference-spec` | `root`        | `repo`              | `2026-05-19`'
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
    expect(linkedInSetup).toContain('Last Verified: `2026-05-20`');
    expect(linkedInSetup).toContain('outside the locked MVP launch corridor');
    expect(linkedInSetup).toContain('Work email is the only launch-active account-side check');
    expect(linkedInSetup).toContain('LinkedIn state is read-only history when present');
    expect(linkedInSetup).toContain('never creates proof trust');
    expect(linkedInSetup).toContain('read-only account-side history');
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
    expect(linkedInSummary).toContain(
      'Current reference-only note: `docs/LINKEDIN_VERIFICATION_SETUP.md`'
    );
    expect(linkedInSummary).not.toContain('Canonical active reference');
    expect(docsRegistry).toContain(
      '| `docs/LINKEDIN_VERIFICATION_SETUP.md`                                                                   | `reference-spec` | `docs`        | `repo`              | `2026-05-20`'
    );
  });

  it('keeps support guidance aligned with self-service privacy and no-leak handling', () => {
    const emailSupport = fs.readFileSync(path.join(repoRoot, 'EMAIL_SUPPORT_SETUP.md'), 'utf8');
    const support = fs.readFileSync(path.join(repoRoot, 'SUPPORT.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(emailSupport).toContain('Last Verified: `2026-05-19`');
    expect(emailSupport).toContain('Use the app workflow whenever possible');
    expect(emailSupport).toContain('Do not process deletion from a bare email reply');
    expect(emailSupport).toContain('Do not mention an in-app chat or help center');
    expect(emailSupport).toContain('manual-link interviews by default');
    expect(emailSupport).toContain('private proof files');
    expect(emailSupport).toContain('hidden identity details');
    expect(emailSupport).toContain('admin/internal route exposed publicly');
    expect(emailSupport).not.toContain('CONFIRM DELETE');
    expect(emailSupport).not.toContain('Use our in-app chat');
    expect(emailSupport).not.toContain('https://proofound.io/help');
    expect(emailSupport).not.toContain('we will reset it manually');
    expect(emailSupport).not.toContain('skills, matches, messages');
    expect(support).toContain('Last Verified: `2026-05-19`');
    expect(support).toContain('locked MVP source of truth');
    expect(support).toContain('Add a manual meeting link');
    expect(support).not.toContain('Proofound_Project_Specification_2026-03-11.md` first');
    expect(docsRegistry).toContain(
      '| `EMAIL_SUPPORT_SETUP.md`                                                                                | `active`         | `root`        | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `SUPPORT.md`                                                                                            | `active`         | `root`        | `repo+live`         | `2026-05-19`'
    );
  });

  it('keeps legacy PRD mirrors below the locked MVP authority stack', () => {
    const compatibilityPrd = fs.readFileSync(
      path.join(repoRoot, 'PRD_for_a_web_platform_MVP.md'),
      'utf8'
    );
    const executivePrd = fs.readFileSync(path.join(repoRoot, 'Proofound_PRD_MVP.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    for (const content of [compatibilityPrd, executivePrd]) {
      expect(content).toContain('Last Verified: `2026-05-19`');
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
    expect(docsRegistry).toContain(
      '| `PRD_for_a_web_platform_MVP.md`                                                                         | `reference-spec` | `root`        | `repo`              | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `Proofound_PRD_MVP.md`                                                                                  | `reference-spec` | `root`        | `repo`              | `2026-05-19`'
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
    const testingStrategy = fs.readFileSync(
      path.join(repoRoot, 'docs/testing-strategy.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(testingStrategy).toContain('Last Verified: `2026-05-19`');
    expect(testingStrategy).toContain('BASE_URL=<production-candidate-url>');
    expect(testingStrategy).toContain('fresh backup/restore evidence');
    expect(testingStrategy).toContain('manual-link interview');
    expect(compactWhitespace(testingStrategy)).toContain('posture remains the locked MVP default');
    expect(testingStrategy).not.toContain('STRICT_PROVIDER_E2E_REQUIRE_BOTH');
    expect(testingStrategy).not.toContain('both Zoom and Google connected');
    expect(docsRegistry).toContain(
      '| `docs/testing-strategy.md`                                                                              | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
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
  });

  it('keeps environment docs from making connected providers launch-blocking by default', () => {
    const envDocs = fs.readFileSync(path.join(repoRoot, 'docs/ENV_VARIABLES.md'), 'utf8');
    const launchMasterChecklist = fs.readFileSync(
      path.join(repoRoot, 'docs/mvp-launch-master-checklist.md'),
      'utf8'
    );
    const veriffConfigScript = fs.readFileSync(
      path.join(repoRoot, 'scripts/test-veriff-config.js'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(envDocs).toContain('Last Verified: `2026-05-19`');
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

    expect(launchMasterChecklist).toContain('Last Verified: `2026-05-19`');
    expect(launchMasterChecklist).toContain('STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=false');
    expect(launchMasterChecklist).toContain('BASE_URL=<production-candidate-url>');
    expect(launchMasterChecklist).not.toContain('BASE_URL=http://localhost:3000');
    expect(launchMasterChecklist).toContain('valid only for connected-provider advisory runs');
    expect(docsRegistry).toContain(
      '| `docs/mvp-launch-master-checklist.md`                                                                   | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
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
    expect(analyticsSetup).toContain('hidden candidate identity details');
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

  it('keeps alert configuration scoped to launch-safe MVP operations', () => {
    const alertConfig = fs.readFileSync(path.join(repoRoot, 'docs/alert-configuration.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(alertConfig).toContain('Last Verified: `2026-05-19`');
    expect(alertConfig).toContain('/api/monitoring/launch-status');
    expect(alertConfig).toContain('/api/monitoring/perf-status');
    expect(alertConfig).toContain('/api/assignments` latency evidence');
    expect(alertConfig).toContain('/api/cron/decision-reminders');
    expect(alertConfig).toContain('/api/cron/health-check');
    expect(alertConfig).toContain('/api/cron/performance-check');
    expect(alertConfig).toContain('/api/cron/send-deletion-reminders');
    expect(alertConfig).toContain('Archived standalone deletion cron routes are not active');
    expect(alertConfig).toContain('manual meeting link default');
    expect(alertConfig).toContain('private proof content');
    expect(alertConfig).toContain('Do not make these launch-blocking by default');
    expect(alertConfig).not.toContain('TTSC Exceeds Target');
    expect(alertConfig).not.toContain('TTFQI Exceeds Target');
    expect(alertConfig).not.toContain('Low Proof Fit Lift');
    expect(alertConfig).not.toContain('/api/test/trigger-error');
    expect(alertConfig).not.toContain('PagerDuty');
    expect(alertConfig).not.toContain('team@proofound.io');
    expect(docsRegistry).toContain(
      '| `docs/alert-configuration.md`                                                                           | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
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
    expect(structuredLogging).toContain('hidden candidate identity details');
    expect(structuredLogging).toContain('raw AI prompts');
    expect(structuredLogging).toContain('Do not migrate a risky console call');
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
    expect(incidentRunbook).toContain('hidden candidate identity details');
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
      expect(content).toContain('Last Verified: `2026-05-19`');
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
    }

    expect(manualDocs).not.toContain('/app/i/expertise');
    expect(manualDocs).not.toContain('/admin/fairness');
    expect(manualDocs).not.toContain('/admin/users');
    expect(manualDocs).not.toContain('/admin/organizations');
    expect(manualDocs).not.toContain('Expertise Profile');
    expect(manualDocs).not.toContain('Zen Hub');
    expect(manualDocs).not.toContain('Well-being tracking');
    expect(docsRegistry).toContain(
      '| `MANUAL_TESTING_CHECKLIST.md`                                                                           | `reference-spec` | `root`        | `repo`              | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `MANUAL_TESTING_GUIDE.md`                                                                               | `reference-spec` | `root`        | `repo`              | `2026-05-19`'
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

    expect(quickStart).toContain('Last Verified: `2026-05-19`');
    expect(quickStart).toContain('locked Proofound MVP corridor');
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
    expect(docsRegistry).toContain(
      '| `QUICK_START.md`                                                                                        | `active`         | `root`        | `repo+live`         | `2026-05-19`'
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

    expect(deploymentChecklist).toContain('Last Verified: `2026-05-19`');
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
    expect(deploymentChecklist).toContain('/api/monitoring/perf-status');
    expect(deploymentChecklist).toContain('/api/assignments');
    expect(deploymentChecklist).toContain('Use Browser');
    expect(deploymentChecklist).toContain('Manual interview links remain');
    expect(deploymentChecklist).not.toContain('Run `supabase/storage-setup.sql`');
    expect(deploymentChecklist).not.toContain('In Supabase SQL Editor');
    expect(deploymentChecklist).not.toContain('Copy contents of supabase/storage-setup.sql');
    expect(deploymentChecklist).not.toContain('Messaging System');
    expect(deploymentChecklist).not.toContain('Match scores displayed');
    expect(docsRegistry).toContain(
      '| `docs/DEPLOYMENT_CHECKLIST.md`                                                                          | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
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

  it('keeps the Supabase setup guide target-agnostic and launch-safe', () => {
    const setupSupabase = fs.readFileSync(path.join(repoRoot, 'SETUP_SUPABASE.md'), 'utf8');
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(setupSupabase).toContain('Last Verified: `2026-05-19`');
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
    expect(setupSupabase).toContain('Proof Packs');
    expect(setupSupabase).not.toContain('cjpfrgmsxwxhuomnvciq');
    expect(setupSupabase).not.toContain('This is safe because MCP only runs');
    expect(setupSupabase).not.toContain('Running migrations (`npm run db:push`)');
    expect(setupSupabase).not.toContain('awesome platform');
    expect(setupSupabase).not.toContain('🎉');
    expect(docsRegistry).toContain(
      '| `SETUP_SUPABASE.md`                                                                                     | `active`         | `root`        | `repo+live`         | `2026-05-19`'
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
    expect(index).toContain('/admin/verification');
    expect(index).toContain('/api/admin/internal-ops/queues');
    expect(index).toContain('admin/internal-only');
    expect(index).toContain('public and logged-out users must not see queue content');

    const templates = fs.readFileSync(
      path.join(repoRoot, 'docs/internal-ops/workflow-comms-templates.md'),
      'utf8'
    );
    expect(templates).toContain('Do not include private proof content');
    expect(templates).toContain('locked MVP corridor');
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
    const loginPage = fs.readFileSync(path.join(repoRoot, 'src/app/(auth)/login/page.tsx'), 'utf8');
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
    expect(signoffTemplate).toContain('Browser desktop/mobile smoke evidence');
    expect(signoffTemplate).toContain('Privacy/no-leak checks');

    expect(qaSummary).toContain('Last Verified: `2026-05-19`');
    expect(qaSummary).toContain('npm run test:launch:routes');
    expect(qaSummary).toContain('npm run test:launch:workflow');
    expect(qaSummary).toContain('npm run test:launch:smoke');
    expect(qaSummary).toContain('monitor:launch');
    expect(qaSummary).toContain('Node 24.15.0/npm 11.12.1');
    expect(qaSummary).toContain('Browser desktop/mobile evidence');
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
      '| `docs/qa/summary.md`                                                                                    | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
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

  it('keeps active matching review UI proof-led instead of score or rank led', () => {
    const activeMatchingReviewFiles = [
      'src/components/matching/MatchResultCard.tsx',
      'src/components/matching/MatchExplainerModal.tsx',
      'src/components/matching/SnoozedMatchesList.tsx',
    ];
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
    }

    const reviewContract = fs.readFileSync(
      path.join(repoRoot, 'src/lib/matching/review-contract.ts'),
      'utf8'
    );
    expect(reviewContract).toContain('Review band:');
    expect(reviewContract).toContain('High-priority proof review');
    expect(reviewContract).not.toContain('Rank band:');
    expect(reviewContract).not.toContain("return 'Top 10'");
    expect(reviewContract).not.toContain("return 'Top 5'");
    expect(reviewContract).not.toContain("return 'Top 20'");

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

    expectTextBefore(launchSmokeRunner, '...sharedEnv,', '...scenario.runner.env,');
  });
});
