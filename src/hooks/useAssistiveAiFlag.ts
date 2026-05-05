'use client';

import { useEffect, useState } from 'react';

export function useAssistiveAiFlag() {
  const [enabled, setEnabled] = useState(false);

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
