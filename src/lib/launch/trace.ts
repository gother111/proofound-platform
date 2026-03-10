import { nanoid } from 'nanoid';
import * as Sentry from '@sentry/nextjs';

import { log } from '@/lib/log';

export const LAUNCH_TRACE_FLOW_VALUES = [
  'auth',
  'invite_redemption',
  'portfolio_publish',
  'shortlist_generation',
  'feedback_submission',
  'export',
  'delete_unpublish',
  'verification_request',
] as const;

export type LaunchTraceFlow = (typeof LAUNCH_TRACE_FLOW_VALUES)[number];
export type LaunchTraceOutcome = 'success' | 'fallback' | 'rejected' | 'failure';
export type LaunchTraceActorType =
  | 'anonymous'
  | 'user_account'
  | 'organization_member'
  | 'platform_operator'
  | 'system';

export type LaunchTraceSession = {
  flow: LaunchTraceFlow;
  requestId: string;
  actorId: string | null;
  actorType: LaunchTraceActorType;
  objectRefs: Record<string, string | null>;
  startedAtMs: number;
};

export function startLaunchTrace(params: {
  flow: LaunchTraceFlow;
  requestId?: string | null;
  actorId?: string | null;
  actorType?: LaunchTraceActorType;
  objectRefs?: Record<string, string | null | undefined>;
}): LaunchTraceSession {
  return {
    flow: params.flow,
    requestId: params.requestId?.trim() || nanoid(12),
    actorId: params.actorId ?? null,
    actorType: params.actorType ?? 'system',
    objectRefs: Object.fromEntries(
      Object.entries(params.objectRefs ?? {}).map(([key, value]) => [key, value ?? null])
    ),
    startedAtMs: Date.now(),
  };
}

export function emitLaunchTrace(
  session: LaunchTraceSession,
  params: {
    outcome: LaunchTraceOutcome;
    state: string;
    failureClass?: string | null;
    details?: Record<string, unknown>;
    finishedAtMs?: number;
  }
) {
  const finishedAtMs = params.finishedAtMs ?? Date.now();
  const latencyMs = Math.max(0, finishedAtMs - session.startedAtMs);

  const payload = {
    flow: session.flow,
    requestId: session.requestId,
    actorId: session.actorId,
    actorType: session.actorType,
    objectRefs: session.objectRefs,
    outcome: params.outcome,
    state: params.state,
    latencyMs,
    failureClass: params.failureClass ?? null,
    ...params.details,
  };

  if (params.outcome === 'failure') {
    log.error('launch.trace', payload);
  } else if (params.outcome === 'rejected') {
    log.warn('launch.trace', payload);
  } else {
    log.info('launch.trace', payload);
  }

  Sentry.addBreadcrumb({
    category: 'launch.trace',
    level:
      params.outcome === 'failure' ? 'error' : params.outcome === 'rejected' ? 'warning' : 'info',
    message: `${session.flow}:${params.outcome}:${params.state}`,
    data: payload,
  });

  return payload;
}
