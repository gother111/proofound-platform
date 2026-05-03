import { describe, expect, it } from 'vitest';

import { buildAiLaunchSmokeState } from '@/lib/launch/ai-smoke-state';

describe('AI launch smoke state', () => {
  it('reports production pilot disabled fallback without requiring a model call', () => {
    expect(
      buildAiLaunchSmokeState({
        executionMode: 'live',
        env: { AI_ASSISTANTS_ENABLED: 'false' },
      })
    ).toEqual({
      assistantsEnabled: false,
      rawPromptLoggingEnabled: false,
      modelCallRequired: false,
      state: 'disabled_fallback_verified',
    });
  });

  it('reports enabled state without requiring a smoke model call', () => {
    expect(
      buildAiLaunchSmokeState({
        executionMode: 'live',
        env: { AI_ASSISTANTS_ENABLED: 'true' },
      })
    ).toEqual({
      assistantsEnabled: true,
      rawPromptLoggingEnabled: false,
      modelCallRequired: false,
      state: 'enabled_without_smoke_model_call',
    });
  });
});
