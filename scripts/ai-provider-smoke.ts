#!/usr/bin/env node
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

import {
  type AiProviderSmokeModelResult,
  type AiProviderSmokePreflight,
} from '../src/lib/ai/provider-smoke-artifact';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ quiet: true });

const SmokeSchema = z.object({
  ok: z.literal(true),
  check: z.literal('proofound-ai-provider-smoke'),
});

const RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    check: { type: 'string' },
  },
  required: ['ok', 'check'],
} as const;

const PROVIDER_KEY_ENV_NAMES = [
  'AI_GEMINI_PROD_API_KEY',
  'AI_GEMINI_API_KEY',
  'GEMINI_API_KEY',
  'AI_GEMINI_STAGING_API_KEY',
  'CV_IMPORT_GEMINI_PRIMARY_API_KEY',
] as const;

function hasNonEmptyEnvValue(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function parseNonNegativeNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim().length === 0) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function hasMonthlyHardCap(): boolean {
  return (
    parseNonNegativeNumber(process.env.AI_MONTHLY_HARD_CAP_SEK) !== null ||
    parseNonNegativeNumber(process.env.AI_PROD_MONTHLY_HARD_CAP_SEK) !== null
  );
}

function isProductionLike(): boolean {
  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase();
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV || process.env.APP_ENV)?.trim().toLowerCase();
  return nodeEnv === 'production' || vercelEnv === 'production' || appEnv === 'production';
}

function resolvePreflight(): AiProviderSmokePreflight {
  return {
    databaseUrlConfigured: hasNonEmptyEnvValue('DATABASE_URL'),
    providerKeyConfigured: PROVIDER_KEY_ENV_NAMES.some((name) => hasNonEmptyEnvValue(name)),
    monthlyHardCapConfigured: hasMonthlyHardCap(),
    productionLike: isProductionLike(),
  };
}

function usageMetadataState(totalTokens: number): AiProviderSmokeModelResult['usageMetadataState'] {
  return totalTokens > 0 ? 'returned' : 'missing_safe';
}

type SmokeRuntime = {
  generateJson: typeof import('../src/lib/ai/provider').generateJson;
  AiProviderError: typeof import('../src/lib/ai/provider/types').AiProviderError;
};

async function smokeModel(
  params: {
    model: string;
    label: 'default' | 'fallback';
  },
  runtime: SmokeRuntime
): Promise<AiProviderSmokeModelResult> {
  try {
    const result = await runtime.generateJson({
      requestId: `ai-provider-smoke-${params.label}-${Date.now()}`,
      promptVersion: 'ai-provider-smoke-v1',
      feature: 'ai_provider_smoke',
      model: params.model,
      prompt:
        'Return exactly this JSON object and no other text: {"ok":true,"check":"proofound-ai-provider-smoke"}',
      schema: SmokeSchema,
      responseJsonSchema: RESPONSE_JSON_SCHEMA,
      maxOutputTokens: 80,
      temperature: 0,
    });

    return {
      model: result.model,
      accepted: true,
      usageMetadataState: usageMetadataState(result.tokenUsage.totalTokens),
      errorCode: null,
    };
  } catch (error) {
    return {
      model: params.model,
      accepted: false,
      usageMetadataState: 'missing_safe',
      errorCode: error instanceof runtime.AiProviderError ? error.code : 'unknown',
    };
  }
}

async function verifyDisabledFailureSafe(
  defaultModel: string,
  runtime: SmokeRuntime
): Promise<boolean> {
  const originalEnabled = process.env.AI_ASSISTANTS_ENABLED;
  process.env.AI_ASSISTANTS_ENABLED = 'false';
  try {
    await runtime.generateJson({
      requestId: `ai-provider-smoke-disabled-${Date.now()}`,
      promptVersion: 'ai-provider-smoke-v1',
      feature: 'ai_provider_smoke',
      model: defaultModel,
      prompt: 'Return JSON.',
      schema: SmokeSchema,
      responseJsonSchema: RESPONSE_JSON_SCHEMA,
      maxOutputTokens: 20,
      temperature: 0,
    });
    return false;
  } catch (error) {
    return error instanceof runtime.AiProviderError && error.code === 'assistants_disabled';
  } finally {
    if (originalEnabled === undefined) {
      delete process.env.AI_ASSISTANTS_ENABLED;
    } else {
      process.env.AI_ASSISTANTS_ENABLED = originalEnabled;
    }
  }
}

async function main() {
  const [
    { generateJson },
    { AiProviderError },
    { resolveAiModelDefault, resolveAiModelFallback },
    { writeAiProviderSmokeArtifact },
  ] = await Promise.all([
    import('../src/lib/ai/provider'),
    import('../src/lib/ai/provider/types'),
    import('../src/lib/ai/provider/config'),
    import('../src/lib/ai/provider-smoke-artifact'),
  ]);
  const runtime = { generateJson, AiProviderError };
  const defaultModel = resolveAiModelDefault();
  const fallbackModel = resolveAiModelFallback();
  const preflight = resolvePreflight();
  const originalEnabled = process.env.AI_ASSISTANTS_ENABLED;
  process.env.AI_ASSISTANTS_ENABLED = 'true';

  const defaultResult = await smokeModel({ model: defaultModel, label: 'default' }, runtime);
  const fallbackResult = fallbackModel
    ? {
        ...(await smokeModel({ model: fallbackModel, label: 'fallback' }, runtime)),
        configured: true as const,
      }
    : {
        configured: false as const,
        model: null,
        accepted: null,
        usageMetadataState: 'missing_safe' as const,
      };

  if (originalEnabled === undefined) {
    delete process.env.AI_ASSISTANTS_ENABLED;
  } else {
    process.env.AI_ASSISTANTS_ENABLED = originalEnabled;
  }

  const disabledFailureSafe = await verifyDisabledFailureSafe(defaultModel, runtime);
  const success =
    defaultResult.accepted &&
    (!fallbackResult.configured || fallbackResult.accepted === true) &&
    disabledFailureSafe;

  const artifact = {
    schemaVersion: 2 as const,
    provider: 'gemini' as const,
    generatedAt: new Date().toISOString(),
    success,
    preflight,
    defaultModel: defaultResult,
    fallbackModel: fallbackResult,
    jsonSchemaResponseWorks: defaultResult.accepted,
    disabledFailureSafe,
  };

  await writeAiProviderSmokeArtifact(artifact);

  console.log(`AI provider smoke: ${success ? 'passed' : 'failed'}`);
  console.log(
    `Default model: ${defaultResult.model} (${defaultResult.accepted ? 'accepted' : 'rejected'})`
  );
  console.log(
    fallbackResult.configured
      ? `Fallback model: ${fallbackResult.model} (${fallbackResult.accepted ? 'accepted' : 'rejected'})`
      : 'Fallback model: unset'
  );
  console.log(
    `Preflight: database ${preflight.databaseUrlConfigured ? 'configured' : 'missing'}, provider key ${
      preflight.providerKeyConfigured ? 'configured' : 'missing'
    }, monthly hard cap ${preflight.monthlyHardCapConfigured ? 'configured' : 'missing'}, runtime ${
      preflight.productionLike ? 'production-like' : 'non-production'
    }`
  );
  console.log(`Disabled failure mode: ${disabledFailureSafe ? 'safe' : 'unsafe'}`);

  if (!success) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'AI provider smoke failed.');
  process.exit(1);
});
