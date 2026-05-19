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

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ');
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
    expect(scripts['test:launch:smoke']).toBe('node --import tsx ./scripts/launch-smoke-runner.ts');
    expect(scripts['test:e2e:providers:strict']).toContain(
      'STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=${STRICT_PROVIDER_E2E_REQUIRE_CONNECTED:-false}'
    );
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

  it('keeps the strict MVP gate wired to timeout-aware release commands', () => {
    const gateScript = fs.readFileSync(
      path.join(repoRoot, 'scripts/run-mvp-strict-gates.mjs'),
      'utf8'
    );

    expect(gateScript).toContain("commandArgs: ['ci']");
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
    expect(accessibilityReport).toContain('Passed: `15`');
    expect(accessibilityReport).toContain('tests/a11y/critical-flows.spec.ts');
    expect(accessibilityReport).toContain('tests/a11y/keyboard-navigation.spec.ts');
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
    expect(joined.toLowerCase()).toContain('not proof of full strict authenticated');
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

  it('keeps archived and removed non-MVP tests out of the default release signal', () => {
    const vitestConfig = fs.readFileSync(path.join(repoRoot, 'vitest.config.ts'), 'utf8');
    const archivedConfig = fs.readFileSync(
      path.join(repoRoot, 'vitest.archived.config.ts'),
      'utf8'
    );

    expect(vitestConfig).toContain("'**/src/archive/**'");
    expect(vitestConfig).toContain("'**/tests/archive/**'");
    expect(vitestConfig).toContain("'**/tests/api/analytics-track-route.test.ts'");
    expect(vitestConfig).toContain("'**/tests/lib/cv-import-suggest-1000-benchmark.test.ts'");
    expect(archivedConfig).toContain('src/archive/**/*.test.ts');
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
    expect(releaseChecklist).toContain('/api/assignments` latency samples');
    expect(releaseChecklist).toContain(
      'manual-link interview posture remains the locked MVP default'
    );
    expect(docsRegistry).toContain(
      '| `docs/release-checklist.md`                                                                             | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
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
    expect(productionChecklist).toContain('npm run db:restore:verify');
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

  it('keeps Resend setup guidance transactional, target-scoped, and privacy-safe', () => {
    const resendSetup = fs.readFileSync(path.join(repoRoot, 'docs/RESEND_SETUP.md'), 'utf8');
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
    expect(docsRegistry).toContain(
      '| `docs/RESEND_SETUP.md`                                                                                  | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
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
    expect(linkedInSetup).toContain('Last Verified: `2026-05-19`');
    expect(linkedInSetup).toContain('outside the locked MVP launch corridor');
    expect(linkedInSetup).toContain('Work email is the only launch-active account-side check');
    expect(linkedInSetup).toContain('LinkedIn state is read-only history when present');
    expect(linkedInSetup).toContain('never creates proof trust');
    expect(linkedInSetup).toContain('/api/admin/internal-ops/queues');
    expect(linkedInSetup).toContain('/api/admin/verification/linkedin/queue');
    expect(compactWhitespace(linkedInSetup)).toContain(
      'Do not add them to required MVP launch gates'
    );
    expect(linkedInSetup).not.toContain('Free automated checking');
    expect(linkedInSetup).not.toContain('Quick approvals');
    expect(linkedInSetup).not.toContain('Admin dashboard shows request sorted by confidence');
    expect(linkedInSetup).not.toContain('High Confidence (80-100%)');
    expect(linkedInSetup).not.toContain('Use ngrok for LinkedIn OAuth');
    expect(linkedInSetup).not.toContain('Track these metrics after deployment');
    expect(linkedInSummary).toContain(
      'Current reference-only note: `docs/LINKEDIN_VERIFICATION_SETUP.md`'
    );
    expect(linkedInSummary).not.toContain('Canonical active reference');
    expect(docsRegistry).toContain(
      '| `docs/LINKEDIN_VERIFICATION_SETUP.md`                                                                   | `reference-spec` | `docs`        | `repo`              | `2026-05-19`'
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

  it('keeps environment docs from making connected providers launch-blocking by default', () => {
    const envDocs = fs.readFileSync(path.join(repoRoot, 'docs/ENV_VARIABLES.md'), 'utf8');
    const launchMasterChecklist = fs.readFileSync(
      path.join(repoRoot, 'docs/mvp-launch-master-checklist.md'),
      'utf8'
    );
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');

    expect(envDocs).toContain('Last Verified: `2026-05-19`');
    expect(envDocs).toContain('Manual meeting links remain the locked MVP default');
    expect(envDocs).toContain('**Target-scoped Vars**');
    expect(envDocs).toContain('STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=false');
    expect(envDocs).toContain('Required Vars When `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true`');
    expect(envDocs).toContain('Manual-link interview scheduling must still work');
    expect(envDocs).not.toContain('**Required Vars**:\n\n- `GOOGLE_CLIENT_ID`');
    expect(envDocs).not.toContain('Make provider flows launch-blocking with real tokens');

    expect(launchMasterChecklist).toContain('Last Verified: `2026-05-19`');
    expect(launchMasterChecklist).toContain('STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=false');
    expect(launchMasterChecklist).toContain(
      'valid only for connected-provider strict launch-gate runs'
    );
    expect(docsRegistry).toContain(
      '| `docs/mvp-launch-master-checklist.md`                                                                   | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
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
    expect(adminAudit).toContain('Last Verified: `2026-05-19`');
    expect(adminAudit).toContain('Disposition: resolved for the active Playwright smoke');
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
      '| `audit/admin-dashboard-mvp-ops-review-2026-05-03.md` | `reference-spec` | `audit` | `repo` | `2026-05-19`'
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
    const docsRegistry = fs.readFileSync(path.join(repoRoot, 'docs/DOCS_REGISTRY.md'), 'utf8');
    const migrationDocs = `${applyManual}\n${runGuide}`;

    for (const content of [applyManual, runGuide]) {
      expect(content).toContain('Last Verified: `2026-05-19`');
      expect(content).toContain('npm run db:drift-check');
      expect(content).toContain('npm run db:backup:checkpoint');
      expect(content).toContain('npm run db:audit:migrations');
      expect(content).toContain('npm run db:migrate');
      expect(content).toContain('npm run db:restore:verify -- --checkpoint <checkpoint-dir>');
      expect(content).toContain('docs/launch-restore-drill.md');
      expect(content).toContain('Do not');
    }

    expect(migrationDocs).toContain('Do not use `npm run db:push`');
    expect(migrationDocs).toContain('public.app_migration_ledger');
    expect(migrationDocs).toContain('production-candidate');
    expect(migrationDocs).not.toContain('Supabase Dashboard method');
    expect(migrationDocs).not.toContain('copy it into Supabase SQL Editor');
    expect(docsRegistry).toContain(
      '| `APPLY_MIGRATIONS_MANUAL.md`                                                                            | `active`         | `root`        | `repo+live`         | `2026-05-19`'
    );
    expect(docsRegistry).toContain(
      '| `RUN_MIGRATIONS_GUIDE.md`                                                                               | `active`         | `root`        | `repo+live`         | `2026-05-19`'
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
      'npm run db:restore:verify -- --checkpoint <checkpoint-dir>'
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
    expect(storageSetup).toContain('npm run db:restore:verify -- --checkpoint <checkpoint-dir>');
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
    expect(setupSupabase).toContain('npm run db:restore:verify -- --checkpoint <checkpoint-dir>');
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
    expect(mcpGuide).toContain('npm run db:restore:verify -- --checkpoint <checkpoint-dir>');
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
      'src/lib/dashboard/layout.ts',
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
});
