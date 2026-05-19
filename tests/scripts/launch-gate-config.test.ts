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
    expect(vitestConfig).toContain("'**/tests/api/messages-legacy-route.test.ts'");
    expect(vitestConfig).toContain("'**/tests/ui/organization-settings-integrations.test.tsx'");
    expect(archivedConfig).toContain('src/archive/**/*.test.ts');
    expect(archivedConfig).toContain('tests/api/messages-legacy-route.test.ts');
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
    expect(fs.existsSync(path.join(repoRoot, 'src/lib/wellbeing'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'src/lib/zen'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'src/archive/non_launch_wellbeing/README.md'))).toBe(
      true
    );
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
