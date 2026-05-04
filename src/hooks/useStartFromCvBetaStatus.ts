'use client';

import { useEffect, useState } from 'react';

type StartFromCvBetaStatus = {
  visible: boolean;
  available: boolean;
  blockers: string[];
};

const DEFAULT_STATUS: StartFromCvBetaStatus = {
  visible: false,
  available: false,
  blockers: [],
};

export function useStartFromCvBetaStatus() {
  const [status, setStatus] = useState<StartFromCvBetaStatus>(DEFAULT_STATUS);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/ai/start-from-cv/status');
        if (!response.ok) return;
        const payload = (await response.json()) as Partial<StartFromCvBetaStatus>;
        setStatus({
          visible: payload.visible === true,
          available: payload.available === true,
          blockers: Array.isArray(payload.blockers)
            ? payload.blockers.filter((item) => typeof item === 'string')
            : [],
        });
      } catch (error) {
        console.error('Failed to load Start from CV beta status', error);
      }
    };

    void load();
  }, []);

  return status;
}
