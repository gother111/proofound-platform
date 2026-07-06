'use client';

import { useEffect, useState } from 'react';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

import { CLIENT_FF_DEFAULTS } from '@/lib/featureFlags';

export function useAssistiveAiFlag() {
  const [enabled, setEnabled] = useState(CLIENT_FF_DEFAULTS.assistiveAiUi);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/feature-flags');
        if (!response.ok) return;
        const payload = await response.json();
        setEnabled(payload?.flags?.assistiveAiUi === true);
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('Failed to parse URL')) {
          return;
        }
        dispatchClientErrorDiagnostic('feature_flags.assistive_ai.load_failed', error);
      }
    };

    void load();
  }, []);

  return enabled;
}
