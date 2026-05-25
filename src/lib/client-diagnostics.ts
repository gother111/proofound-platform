'use client';

export type ClientDiagnosticDetail = Record<string, unknown>;

function getClientDiagnosticErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'unknown';
}

export function dispatchClientDiagnostic(
  reason: string,
  detail: ClientDiagnosticDetail = {}
): void {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }

  try {
    window.dispatchEvent(
      new CustomEvent('proofound:client-diagnostic', {
        detail: {
          reason,
          ...detail,
        },
      })
    );
  } catch {
    // Diagnostics must never affect the user flow.
  }
}

export function dispatchClientErrorDiagnostic(reason: string, error: unknown): void {
  dispatchClientDiagnostic(reason, {
    error: getClientDiagnosticErrorMessage(error),
  });
}
