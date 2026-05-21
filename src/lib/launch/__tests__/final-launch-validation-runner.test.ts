import fs from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildFinalLaunchValidationGates,
  computeFinalLaunchVerdict,
  FINAL_LAUNCH_VALIDATION_REPORT_FILE_NAME,
  redactSensitiveOutput,
  runFinalLaunchValidation,
  type FinalLaunchGateResult,
} from '@/lib/launch/final-launch-validation-runner';

const strictEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  NEXT_PUBLIC_USE_MOCK_SUPABASE: 'false',
} as const;

describe('final launch validation runner', () => {
  it('keeps the locked launch gate order explicit', () => {
    const gates = buildFinalLaunchValidationGates({
      env: {
        ...process.env,
        ...strictEnv,
        BASE_URL: 'http://localhost:3000',
        CRON_SECRET: 'cron-secret',
      },
      outputDir: '.artifacts/launch-validation-test',
    });

    expect(gates.map((gate) => gate.id)).toEqual([
      'deploy_readiness',
      'lint',
      'typecheck',
      'production_build',
      'launch_surface_inventory_tests',
      'launch_page_inventory_tests',
      'privacy_rls_baseline_tests',
      'privacy_rls_extended_tests',
      'upload_privacy_tests',
      'org_corridor_workflow_tests',
      'export_delete_tests',
      'strict_org_corridor_e2e',
      'launch_smoke',
      'perf_budgets',
      'launch_synthetics',
      'launch_status',
      'go_no_go',
      'production_dependency_audit',
    ]);

    expect(gates.find((gate) => gate.id === 'strict_org_corridor_e2e')?.skip).toBeUndefined();
    expect(gates.find((gate) => gate.id === 'launch_smoke')?.command?.display).toContain(
      '--base-url http://localhost:3000'
    );
    expect(gates.find((gate) => gate.id === 'perf_budgets')?.command?.display).toBe(
      'npm run perf:budgets'
    );
    expect(gates.find((gate) => gate.id === 'launch_synthetics')?.command?.display).toContain(
      'npm run monitor:launch'
    );
    expect(gates.find((gate) => gate.id === 'launch_status')?.command?.display).toBe(
      'npm run launch:status'
    );
    expect(gates.find((gate) => gate.id === 'go_no_go')?.command?.display).toBe('npm run go:no-go');
  });

  it('does not silently pass skipped launch gates', () => {
    const gates = buildFinalLaunchValidationGates({
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: '',
        SUPABASE_URL: '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
        SUPABASE_ANON_KEY: '',
        SUPABASE_SERVICE_ROLE_KEY: '',
        DATABASE_URL: '',
        NEXT_PUBLIC_SITE_URL: '',
        SITE_URL: '',
        BASE_URL: '',
      },
      outputDir: '.artifacts/launch-validation-test',
    });

    expect(gates.find((gate) => gate.id === 'strict_org_corridor_e2e')?.skip).toMatchObject({
      status: 'UNVERIFIED',
    });
    expect(gates.find((gate) => gate.id === 'launch_smoke')?.skip).toMatchObject({
      status: 'NOT APPLICABLE',
    });
    expect(gates.find((gate) => gate.id === 'perf_budgets')?.skip).toMatchObject({
      status: 'NOT APPLICABLE',
    });
    expect(gates.find((gate) => gate.id === 'launch_synthetics')?.skip).toMatchObject({
      status: 'NOT APPLICABLE',
    });
    expect(gates.find((gate) => gate.id === 'launch_status')?.skip).toMatchObject({
      status: 'NOT APPLICABLE',
    });
    expect(gates.find((gate) => gate.id === 'go_no_go')?.skip).toMatchObject({
      status: 'NOT APPLICABLE',
    });
  });

  it('blocks production-candidate authenticated gates when CRON_SECRET is missing', () => {
    const gates = buildFinalLaunchValidationGates({
      env: {
        ...process.env,
        ...strictEnv,
        BASE_URL: 'https://preview.proofound.example',
        CRON_SECRET: '',
      },
      outputDir: '.artifacts/launch-validation-test',
    });

    expect(gates.find((gate) => gate.id === 'launch_smoke')?.command?.display).toContain(
      '--base-url https://preview.proofound.example'
    );
    expect(gates.find((gate) => gate.id === 'perf_budgets')?.command?.display).toBe(
      'npm run perf:budgets'
    );
    for (const gateId of ['launch_synthetics', 'launch_status', 'go_no_go']) {
      expect(gates.find((gate) => gate.id === gateId)?.skip).toMatchObject({
        status: 'UNVERIFIED',
      });
    }
  });

  it('treats P0 UNVERIFIED as a blocking no-go state', () => {
    const gates = [
      {
        id: 'strict_org_corridor_e2e',
        priority: 'P0',
        status: 'UNVERIFIED',
      },
      {
        id: 'launch_smoke',
        priority: 'P0',
        status: 'NOT APPLICABLE',
      },
    ] as FinalLaunchGateResult[];

    expect(computeFinalLaunchVerdict(gates)).toEqual({
      verdict: 'NO_GO',
      p0BlockingGateIds: ['strict_org_corridor_e2e'],
    });
  });

  it('writes the markdown report and commands artifact', async () => {
    const outputDir = await fs.mkdtemp(
      path.join(process.cwd(), '.artifacts/launch-validation-test-')
    );
    const result = await runFinalLaunchValidation({
      outputDir,
      now: new Date('2026-04-29T12:00:00.000Z'),
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: '',
        SUPABASE_URL: '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
        SUPABASE_ANON_KEY: '',
        SUPABASE_SERVICE_ROLE_KEY: '',
        DATABASE_URL: '',
        NEXT_PUBLIC_SITE_URL: '',
        SITE_URL: '',
        BASE_URL: '',
      },
      executor: async () => ({
        exitCode: 0,
        signal: null,
        output: 'ok',
        durationMs: 1,
      }),
    });

    const commands = JSON.parse(await fs.readFile(result.commandsPath, 'utf8')) as {
      verdict: string;
      statusCounts: Record<string, number>;
      p0BlockingGateIds: string[];
    };
    const report = await fs.readFile(result.reportPath, 'utf8');

    expect(path.basename(result.reportPath)).toBe(FINAL_LAUNCH_VALIDATION_REPORT_FILE_NAME);
    expect(commands.verdict).toBe('NO_GO');
    expect(commands.statusCounts.UNVERIFIED).toBe(1);
    expect(commands.statusCounts['NOT APPLICABLE']).toBe(5);
    expect(commands.p0BlockingGateIds).toContain('strict_org_corridor_e2e');
    expect(report).toContain('| 12 | P0 | Strict org corridor E2E | UNVERIFIED |');
    expect(report).toContain('| 13 | P0 | Launch smoke | NOT APPLICABLE |');
  });

  it('redacts secret-shaped command output before artifact persistence', () => {
    expect(
      redactSensitiveOutput(
        'SUPABASE_SERVICE_ROLE_KEY=abc123\n{"CRON_SECRET":"secret"}\npostgres://user:pass@db.test/proofound'
      )
    ).toContain('SUPABASE_SERVICE_ROLE_KEY=[REDACTED]');
    expect(
      redactSensitiveOutput(
        'SUPABASE_SERVICE_ROLE_KEY=abc123\n{"CRON_SECRET":"secret"}\npostgres://user:pass@db.test/proofound'
      )
    ).toContain('"CRON_SECRET":"[REDACTED]"');
    expect(
      redactSensitiveOutput(
        'SUPABASE_SERVICE_ROLE_KEY=abc123\n{"CRON_SECRET":"secret"}\npostgres://user:pass@db.test/proofound'
      )
    ).toContain('postgres://[REDACTED]@db.test/proofound');
  });
});
