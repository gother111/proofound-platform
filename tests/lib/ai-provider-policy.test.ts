// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  resolveAiProviderPolicyDecision,
  resolveConfiguredAiProviderId,
} from '@/lib/ai/provider/policy';

describe('AI provider policy', () => {
  it('defaults Start from CV to the existing Gemini adapter policy', () => {
    const decision = resolveAiProviderPolicyDecision({
      feature: 'start_from_cv',
      dataClassification: 'personal_data',
      env: {},
      requireLiveAdapter: true,
    });

    expect(decision).toMatchObject({
      ok: true,
      provider: 'gemini',
      reason: null,
    });
  });

  it('normalizes DeepSeek and NVIDIA trial provider names', () => {
    expect(resolveConfiguredAiProviderId({ START_FROM_CV_AI_PROVIDER: 'deepseek-v4-flash' })).toBe(
      'deepseek_v4_flash'
    );
    expect(
      resolveConfiguredAiProviderId({
        START_FROM_CV_AI_PROVIDER: 'nvidia-deepseek-v4-flash',
      })
    ).toBe('nvidia_deepseek_v4_flash');
  });

  it('requires an explicit personal-data gate before DeepSeek can receive real CV data', () => {
    const personalDataDecision = resolveAiProviderPolicyDecision({
      feature: 'start_from_cv',
      dataClassification: 'personal_data',
      env: { START_FROM_CV_AI_PROVIDER: 'deepseek-v4-flash' },
      requireLiveAdapter: true,
    });

    expect(personalDataDecision).toMatchObject({
      ok: false,
      provider: 'deepseek_v4_flash',
      reason: 'personal_data_not_enabled',
    });

    const enabledDecision = resolveAiProviderPolicyDecision({
      feature: 'start_from_cv',
      dataClassification: 'personal_data',
      env: {
        START_FROM_CV_AI_PROVIDER: 'deepseek-v4-flash',
        START_FROM_CV_DEEPSEEK_PERSONAL_DATA_ENABLED: 'true',
      },
      requireLiveAdapter: true,
    });

    expect(enabledDecision).toMatchObject({
      ok: true,
      provider: 'deepseek_v4_flash',
      reason: null,
    });
  });

  it('keeps NVIDIA-hosted DeepSeek blocked for live Start from CV calls', () => {
    const syntheticDecision = resolveAiProviderPolicyDecision({
      feature: 'start_from_cv',
      dataClassification: 'synthetic',
      env: { START_FROM_CV_AI_PROVIDER: 'nvidia-deepseek-v4-flash' },
      requireLiveAdapter: true,
    });

    expect(syntheticDecision).toMatchObject({
      ok: false,
      provider: 'nvidia_deepseek_v4_flash',
      reason: 'live_adapter_unavailable',
    });
  });
});
