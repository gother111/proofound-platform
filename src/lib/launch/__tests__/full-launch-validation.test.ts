import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  spawnSync: vi.fn(),
  runRepoReadyValidationBundle: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  default: {
    spawnSync: mocks.spawnSync,
  },
  spawnSync: mocks.spawnSync,
}));

vi.mock('@/lib/launch/repo-ready-validation', () => ({
  REPO_READY_VALIDATION_FILE_NAME: 'repo-ready-validation.json',
  runRepoReadyValidationBundle: mocks.runRepoReadyValidationBundle,
}));

import { runFullLaunchValidationBundle } from '@/lib/launch/full-launch-validation';

const createdDirs: string[] = [];

async function createWorkspaceFixture() {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'proofound-full-launch-validation-'));
  const outputDir = path.join(workspace, '.artifacts/launch-validation-test');
  await fs.mkdir(outputDir, { recursive: true });
  createdDirs.push(workspace);

  mocks.runRepoReadyValidationBundle.mockResolvedValue({
    outputDir,
    bundle: {
      gates: [],
    },
  });

  return { workspace, outputDir };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('CRON_SECRET', 'cron-secret-value');
  vi.stubEnv('LAUNCH_TRUSTED_BASE_URLS', '');
  mocks.spawnSync.mockImplementation((_bin: string, args: string[]) => {
    if (args.join(' ') === 'rev-parse HEAD') {
      return { status: 0, stdout: 'fixture-head\n', stderr: '', signal: null };
    }

    if (args.join(' ') === 'rev-parse --abbrev-ref HEAD') {
      return { status: 0, stdout: 'master\n', stderr: '', signal: null };
    }

    return { status: 1, stdout: 'smoke skipped in unit test\n', stderr: '', signal: null };
  });
});

afterEach(async () => {
  vi.unstubAllEnvs();
  while (createdDirs.length > 0) {
    const dir = createdDirs.pop();
    if (!dir) continue;
    await fs.rm(dir, { recursive: true, force: true });
  }
});

describe('full launch validation', () => {
  it('only sends the cron secret to trusted live launch-status origins', async () => {
    const { workspace } = await createWorkspaceFixture();
    const fetchCalls: Array<{ url: string; authorization: string | null }> = [];
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      const requestUrl = String(url);
      fetchCalls.push({
        url: requestUrl,
        authorization: new Headers(init?.headers).get('authorization'),
      });

      return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
    }) as typeof fetch;

    await runFullLaunchValidationBundle({
      workspaceRoot: workspace,
      liveBaseUrl: 'https://evil.example',
      fetchImpl,
      now: new Date('2026-05-20T10:00:00.000Z'),
    });

    expect(fetchCalls).toEqual(
      expect.arrayContaining([
        { url: 'https://evil.example/api/health', authorization: null },
        { url: 'https://evil.example/api/monitoring/launch-status', authorization: null },
      ])
    );

    fetchCalls.length = 0;
    vi.stubEnv('LAUNCH_TRUSTED_BASE_URLS', 'https://staging.proofound.example');
    await runFullLaunchValidationBundle({
      workspaceRoot: workspace,
      liveBaseUrl: 'https://staging.proofound.example',
      fetchImpl,
      now: new Date('2026-05-20T10:05:00.000Z'),
    });

    expect(fetchCalls).toEqual(
      expect.arrayContaining([
        { url: 'https://staging.proofound.example/api/health', authorization: null },
        {
          url: 'https://staging.proofound.example/api/monitoring/launch-status',
          authorization: 'Bearer cron-secret-value',
        },
      ])
    );
  });
});
