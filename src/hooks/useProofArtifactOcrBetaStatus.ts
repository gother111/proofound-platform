'use client';

import { useEffect, useState } from 'react';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

type ProofArtifactOcrBetaStatus = {
  visible: boolean;
  available: boolean;
  unavailableReason: string | null;
  limits: {
    maxFileSizeMb: number;
    maxPages: number;
    allowedMimeTypes: string[];
  };
};

const DEFAULT_STATUS: ProofArtifactOcrBetaStatus = {
  visible: false,
  available: false,
  unavailableReason: null,
  limits: {
    maxFileSizeMb: 5,
    maxPages: 4,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
};

export function useProofArtifactOcrBetaStatus() {
  const [status, setStatus] = useState<ProofArtifactOcrBetaStatus>(DEFAULT_STATUS);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/proof-artifacts/text-extraction/status');
        if (!response.ok) return;
        const payload = (await response.json()) as Partial<ProofArtifactOcrBetaStatus>;
        setStatus({
          visible: payload.visible === true,
          available: payload.available === true,
          unavailableReason:
            typeof payload.unavailableReason === 'string' ? payload.unavailableReason : null,
          limits: {
            maxFileSizeMb:
              typeof payload.limits?.maxFileSizeMb === 'number'
                ? payload.limits.maxFileSizeMb
                : DEFAULT_STATUS.limits.maxFileSizeMb,
            maxPages:
              typeof payload.limits?.maxPages === 'number'
                ? payload.limits.maxPages
                : DEFAULT_STATUS.limits.maxPages,
            allowedMimeTypes: Array.isArray(payload.limits?.allowedMimeTypes)
              ? payload.limits.allowedMimeTypes.filter((item) => typeof item === 'string')
              : DEFAULT_STATUS.limits.allowedMimeTypes,
          },
        });
      } catch (error) {
        dispatchClientErrorDiagnostic('feature_flags.proof_artifact_ocr_status.load_failed', error);
      }
    };

    void load();
  }, []);

  return status;
}
