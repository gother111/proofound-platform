'use client';

import { useEffect, useState } from 'react';

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
        console.error('Failed to load assistive AI feature flag', error);
      }
    };

    void load();
  }, []);

  return enabled;
}
