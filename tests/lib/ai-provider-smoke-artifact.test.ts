// @vitest-environment node

import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  readAiProviderSmokeArtifact,
  resolveAiProviderSmokeArtifactPath,
  resolveLastSuccessfulAiProviderSmokeAt,
  writeAiProviderSmokeArtifact,
  type AiProviderSmokeArtifact,
} from '@/lib/ai/provider-smoke-artifact';

const artifactPath = path.join(
  process.cwd(),
  '.artifacts/test-ai-provider-smoke/ai-provider-smoke.json'
);

const artifact: AiProviderSmokeArtifact = {
  schemaVersion: 1,
  provider: 'gemini',
  generatedAt: '2026-05-04T09:00:00.000Z',
  success: true,
  defaultModel: {
    model: 'gemini-3.1-flash-lite',
    accepted: true,
    usageMetadataState: 'returned',
    errorCode: null,
  },
  fallbackModel: {
    configured: false,
    model: null,
    accepted: null,
    usageMetadataState: 'missing_safe',
  },
  jsonSchemaResponseWorks: true,
  disabledFailureSafe: true,
};

describe('AI provider smoke artifact', () => {
  afterEach(async () => {
    await rm(path.dirname(artifactPath), { recursive: true, force: true });
  });

  it('writes and reads the safe smoke artifact without secrets or prompts', async () => {
    await writeAiProviderSmokeArtifact(artifact, artifactPath);

    const saved = await readAiProviderSmokeArtifact({ artifactPath });

    expect(saved).toEqual(artifact);
    expect(JSON.stringify(saved)).not.toContain('api-key');
    expect(JSON.stringify(saved)).not.toContain('Return exactly');
  });

  it('returns the last success timestamp only from successful artifacts or env override', async () => {
    await writeAiProviderSmokeArtifact(artifact, artifactPath);

    await expect(resolveLastSuccessfulAiProviderSmokeAt({ artifactPath })).resolves.toBe(
      '2026-05-04T09:00:00.000Z'
    );
    await expect(
      resolveLastSuccessfulAiProviderSmokeAt({
        artifactPath,
        env: { AI_PROVIDER_SMOKE_LAST_SUCCESS_AT: '2026-05-04T10:00:00.000Z' },
      })
    ).resolves.toBe('2026-05-04T10:00:00.000Z');
  });

  it('ignores malformed env timestamps instead of treating them as successful smoke', async () => {
    await expect(
      resolveLastSuccessfulAiProviderSmokeAt({
        artifactPath,
        env: { AI_PROVIDER_SMOKE_LAST_SUCCESS_AT: 'not-a-date' },
      })
    ).resolves.toBeNull();
  });

  it('requires smoke evidence to match the configured model when expected models are provided', async () => {
    await writeAiProviderSmokeArtifact(artifact, artifactPath);

    await expect(
      resolveLastSuccessfulAiProviderSmokeAt({
        artifactPath,
        expectedDefaultModel: 'gemini-3.1-flash-lite',
      })
    ).resolves.toBe('2026-05-04T09:00:00.000Z');

    await expect(
      resolveLastSuccessfulAiProviderSmokeAt({
        artifactPath,
        env: { AI_PROVIDER_SMOKE_LAST_SUCCESS_AT: '2026-05-04T10:00:00.000Z' },
        expectedDefaultModel: 'gemini-3.1-flash-lite',
      })
    ).resolves.toBe('2026-05-04T09:00:00.000Z');

    await expect(
      resolveLastSuccessfulAiProviderSmokeAt({
        artifactPath,
        env: { AI_PROVIDER_SMOKE_LAST_SUCCESS_AT: '2026-05-04T10:00:00.000Z' },
        expectedDefaultModel: 'gemini-3.1-flash-lite-preview',
      })
    ).resolves.toBeNull();
  });

  it('requires configured fallback smoke evidence before accepting fallback verification', async () => {
    await writeAiProviderSmokeArtifact(
      {
        ...artifact,
        fallbackModel: {
          configured: true,
          model: 'gemini-3.1-flash',
          accepted: true,
          usageMetadataState: 'returned',
          errorCode: null,
        },
      },
      artifactPath
    );

    await expect(
      resolveLastSuccessfulAiProviderSmokeAt({
        artifactPath,
        expectedDefaultModel: 'gemini-3.1-flash-lite',
        expectedFallbackModel: 'gemini-3.1-flash',
      })
    ).resolves.toBe('2026-05-04T09:00:00.000Z');

    await expect(
      resolveLastSuccessfulAiProviderSmokeAt({
        artifactPath,
        expectedDefaultModel: 'gemini-3.1-flash-lite',
        expectedFallbackModel: 'gemini-3.1-pro',
      })
    ).resolves.toBeNull();
  });

  it('treats malformed artifacts as missing evidence', async () => {
    await mkdir(path.dirname(artifactPath), { recursive: true });
    await writeFile(artifactPath, '{"success":true}', 'utf8');

    await expect(readAiProviderSmokeArtifact({ artifactPath })).resolves.toBeNull();
    await expect(resolveLastSuccessfulAiProviderSmokeAt({ artifactPath })).resolves.toBeNull();
  });

  it('treats partially shaped successful artifacts as missing evidence', async () => {
    await mkdir(path.dirname(artifactPath), { recursive: true });
    await writeFile(
      artifactPath,
      JSON.stringify({
        schemaVersion: 1,
        provider: 'gemini',
        generatedAt: '2026-05-04T09:00:00.000Z',
        success: true,
        fallbackModel: artifact.fallbackModel,
        jsonSchemaResponseWorks: true,
        disabledFailureSafe: true,
      }),
      'utf8'
    );

    await expect(readAiProviderSmokeArtifact({ artifactPath })).resolves.toBeNull();
    await expect(
      resolveLastSuccessfulAiProviderSmokeAt({
        artifactPath,
        expectedDefaultModel: 'gemini-3.1-flash-lite',
      })
    ).resolves.toBeNull();
  });

  it('treats successful artifacts with failed default smoke evidence as missing evidence', async () => {
    await writeAiProviderSmokeArtifact(
      {
        ...artifact,
        success: true,
        defaultModel: {
          ...artifact.defaultModel,
          accepted: false,
          usageMetadataState: 'missing_safe',
          errorCode: 'missing_api_key',
        },
      },
      artifactPath
    );

    await expect(
      resolveLastSuccessfulAiProviderSmokeAt({
        artifactPath,
        expectedDefaultModel: 'gemini-3.1-flash-lite',
      })
    ).resolves.toBeNull();
  });

  it('treats successful artifacts without schema or disabled-mode proof as missing evidence', async () => {
    await writeAiProviderSmokeArtifact(
      {
        ...artifact,
        success: true,
        jsonSchemaResponseWorks: false,
      },
      artifactPath
    );

    await expect(
      resolveLastSuccessfulAiProviderSmokeAt({
        artifactPath,
        expectedDefaultModel: 'gemini-3.1-flash-lite',
      })
    ).resolves.toBeNull();

    await writeAiProviderSmokeArtifact(
      {
        ...artifact,
        success: true,
        disabledFailureSafe: false,
      },
      artifactPath
    );

    await expect(
      resolveLastSuccessfulAiProviderSmokeAt({
        artifactPath,
        expectedDefaultModel: 'gemini-3.1-flash-lite',
      })
    ).resolves.toBeNull();
  });

  it('treats artifacts with malformed smoke timestamps as missing evidence', async () => {
    await mkdir(path.dirname(artifactPath), { recursive: true });
    await writeFile(
      artifactPath,
      JSON.stringify({
        ...artifact,
        generatedAt: 'not-a-date',
      }),
      'utf8'
    );

    await expect(readAiProviderSmokeArtifact({ artifactPath })).resolves.toBeNull();
    await expect(
      resolveLastSuccessfulAiProviderSmokeAt({
        artifactPath,
        expectedDefaultModel: 'gemini-3.1-flash-lite',
      })
    ).resolves.toBeNull();
  });

  it('treats successful artifacts with malformed fallback evidence as missing evidence', async () => {
    await mkdir(path.dirname(artifactPath), { recursive: true });
    await writeFile(
      artifactPath,
      JSON.stringify({
        ...artifact,
        fallbackModel: {
          configured: true,
          model: 'gemini-3.1-flash',
          accepted: true,
        },
      }),
      'utf8'
    );

    await expect(readAiProviderSmokeArtifact({ artifactPath })).resolves.toBeNull();
    await expect(
      resolveLastSuccessfulAiProviderSmokeAt({
        artifactPath,
        expectedDefaultModel: 'gemini-3.1-flash-lite',
        expectedFallbackModel: 'gemini-3.1-flash',
      })
    ).resolves.toBeNull();
  });

  it('treats successful artifacts with rejected configured fallback evidence as missing evidence', async () => {
    await writeAiProviderSmokeArtifact(
      {
        ...artifact,
        success: true,
        fallbackModel: {
          configured: true,
          model: 'gemini-3.1-flash',
          accepted: false,
          usageMetadataState: 'missing_safe',
          errorCode: 'model_rejected',
        },
      },
      artifactPath
    );

    await expect(
      resolveLastSuccessfulAiProviderSmokeAt({
        artifactPath,
        expectedDefaultModel: 'gemini-3.1-flash-lite',
      })
    ).resolves.toBeNull();
  });

  it('uses a stable default artifact path unless env overrides it', () => {
    expect(resolveAiProviderSmokeArtifactPath({})).toBe('.artifacts/ai-provider-smoke.json');
    expect(
      resolveAiProviderSmokeArtifactPath({
        AI_PROVIDER_SMOKE_ARTIFACT_PATH: '.artifacts/custom-ai-smoke.json',
      })
    ).toBe('.artifacts/custom-ai-smoke.json');
  });
});
