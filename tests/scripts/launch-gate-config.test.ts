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

    const activeDocs = listFiles(path.join(repoRoot, 'docs')).filter(
      (file) => file.endsWith('.md') && !file.includes(`${path.sep}archive${path.sep}`)
    );
    const offenders = activeDocs
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
    expect(testingStrategy).toContain('posture remains the locked MVP default');
    expect(testingStrategy).not.toContain('STRICT_PROVIDER_E2E_REQUIRE_BOTH');
    expect(testingStrategy).not.toContain('both Zoom and Google connected');
    expect(docsRegistry).toContain(
      '| `docs/testing-strategy.md`                                                                              | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
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
