import { isProductionDeployRuntime } from './env';

type DebugIngestPayload = {
  sessionId: string;
  runId: string;
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp?: number;
};

function resolveDebugIngestUrl(): string | null {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_DEBUG_INGEST_URL?.trim() || null;
  }

  return (
    process.env.DEBUG_INGEST_URL?.trim() || process.env.NEXT_PUBLIC_DEBUG_INGEST_URL?.trim() || null
  );
}

function isDebugIngestEnabled(): boolean {
  if (isProductionDeployRuntime()) {
    return false;
  }

  if (typeof window !== 'undefined') {
    return Boolean(process.env.NEXT_PUBLIC_DEBUG_INGEST_URL?.trim());
  }

  if (process.env.DEBUG_INGEST_ENABLED === 'true') {
    return true;
  }

  return Boolean(resolveDebugIngestUrl());
}

/**
 * Optional lightweight debug telemetry sink.
 * Disabled by default and only active when explicit env vars are configured.
 */
export function sendDebugIngest(payload: DebugIngestPayload): void {
  if (!isDebugIngestEnabled()) {
    return;
  }

  const endpoint = resolveDebugIngestUrl();
  if (!endpoint) {
    return;
  }

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      timestamp: payload.timestamp ?? Date.now(),
    }),
  }).catch(() => {});
}
