import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')) as T;
}

describe('launch gate package configuration', () => {
  it('pins the clean-checkout runtime and package manager', () => {
    const packageJson = readJson<{
      packageManager?: string;
      engines?: { node?: string };
    }>('package.json');
    const nvmrc = fs.readFileSync(path.join(repoRoot, '.nvmrc'), 'utf8').trim();
    const npmrc = fs.readFileSync(path.join(repoRoot, '.npmrc'), 'utf8');

    expect(nvmrc).toBe('20.20.0');
    expect(packageJson.engines?.node).toBe('>=20.20.0 <21');
    expect(packageJson.packageManager).toBe('npm@10.8.2');
    expect(npmrc).toContain('engine-strict=true');
  });

  it('keeps every documented launch-critical npm command present', () => {
    const packageJson = readJson<{ scripts?: Record<string, string> }>('package.json');
    const scripts = packageJson.scripts ?? {};

    expect(scripts.lint).toBeTruthy();
    expect(scripts.typecheck).toBeTruthy();
    expect(scripts.build).toBeTruthy();
    expect(scripts.test).toBe('vitest run');
    expect(scripts['test:privacy']).toContain('tests/privacy/rls-policies.test.ts');
    expect(scripts['test:privacy:extended']).toContain(
      'tests/privacy/rls-policies-extended.test.ts'
    );
    expect(scripts['test:launch:smoke']).toBe('node --import tsx ./scripts/launch-smoke-runner.ts');
    expect(scripts['monitor:launch']).toBe(
      'node --import tsx ./scripts/run-launch-synthetic-monitors.ts'
    );
  });

  it('keeps archived and removed non-MVP tests out of the default release signal', () => {
    const vitestConfig = fs.readFileSync(path.join(repoRoot, 'vitest.config.ts'), 'utf8');
    const archivedConfig = fs.readFileSync(
      path.join(repoRoot, 'vitest.archived.config.ts'),
      'utf8'
    );

    expect(vitestConfig).toContain("'**/src/archive/**'");
    expect(vitestConfig).toContain("'**/tests/api/messages-legacy-route.test.ts'");
    expect(vitestConfig).toContain("'**/tests/ui/organization-settings-integrations.test.tsx'");
    expect(archivedConfig).toContain('src/archive/**/*.test.ts');
    expect(archivedConfig).toContain('tests/api/messages-legacy-route.test.ts');
  });
});
