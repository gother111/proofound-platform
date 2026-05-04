#!/usr/bin/env node
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

import { generateJson } from '../src/lib/ai/provider';
import { AiProviderError } from '../src/lib/ai/provider/types';
import { resolveAiModelDefault, resolveAiModelFallback } from '../src/lib/ai/provider/config';
import {
  type AiProviderSmokeModelResult,
  writeAiProviderSmokeArtifact,
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

function usageMetadataState(totalTokens: number): AiProviderSmokeModelResult['usageMetadataState'] {
  return totalTokens > 0 ? 'returned' : 'missing_safe';
}

async function smokeModel(params: {
  model: string;
  label: 'default' | 'fallback';
}): Promise<AiProviderSmokeModelResult> {
  try {
    const result = await generateJson({
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
      errorCode: error instanceof AiProviderError ? error.code : 'unknown',
    };
  }
}

async function verifyDisabledFailureSafe(defaultModel: string): Promise<boolean> {
  const originalEnabled = process.env.AI_ASSISTANTS_ENABLED;
  process.env.AI_ASSISTANTS_ENABLED = 'false';
  try {
    await generateJson({
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
    return error instanceof AiProviderError && error.code === 'assistants_disabled';
  } finally {
    if (originalEnabled === undefined) {
      delete process.env.AI_ASSISTANTS_ENABLED;
    } else {
      process.env.AI_ASSISTANTS_ENABLED = originalEnabled;
    }
  }
}

async function main() {
  const defaultModel = resolveAiModelDefault();
  const fallbackModel = resolveAiModelFallback();
  const originalEnabled = process.env.AI_ASSISTANTS_ENABLED;
  process.env.AI_ASSISTANTS_ENABLED = 'true';

  const defaultResult = await smokeModel({ model: defaultModel, label: 'default' });
  const fallbackResult = fallbackModel
    ? {
        ...(await smokeModel({ model: fallbackModel, label: 'fallback' })),
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

  const disabledFailureSafe = await verifyDisabledFailureSafe(defaultModel);
  const success =
    defaultResult.accepted &&
    (!fallbackResult.configured || fallbackResult.accepted === true) &&
    disabledFailureSafe;

  const artifact = {
    schemaVersion: 1 as const,
    provider: 'gemini' as const,
    generatedAt: new Date().toISOString(),
    success,
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
  console.log(`Disabled failure mode: ${disabledFailureSafe ? 'safe' : 'unsafe'}`);

  if (!success) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'AI provider smoke failed.');
  process.exit(1);
});
