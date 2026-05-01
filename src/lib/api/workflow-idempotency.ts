import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { stableHashPayload } from '@/lib/contracts/canonical-domain';
import { getRows } from '@/lib/db/rows';
import { log } from '@/lib/log';
import { sanitizeErrorForLog } from '@/lib/privacy/log-redaction';

type WorkflowIdempotencyScope = {
  userId: string;
  orgId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
};

type WorkflowIdempotencyRecord = {
  id: string;
  request_hash: string;
  response_status: number | null;
  response_body: unknown;
  state: string;
};

const IDEMPOTENCY_HEADER = 'idempotency-key';
const LEGACY_IDEMPOTENCY_HEADER = 'x-idempotency-key';
const VALID_IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{8,200}$/;
const REPLAY_WAIT_ATTEMPTS = 10;
const REPLAY_WAIT_MS = 50;

function getIdempotencyKey(request: NextRequest): string | null {
  const value =
    request.headers.get(IDEMPOTENCY_HEADER) ?? request.headers.get(LEGACY_IDEMPOTENCY_HEADER);
  const key = value?.trim();
  return key ? key : null;
}

function idempotencyHeaders(key: string, replayed = false) {
  return {
    'Idempotency-Key': key,
    ...(replayed ? { 'Idempotency-Replayed': 'true' } : {}),
  };
}

function replayResponse(key: string, record: WorkflowIdempotencyRecord) {
  return NextResponse.json(record.response_body ?? {}, {
    status: record.response_status ?? 200,
    headers: idempotencyHeaders(key, true),
  });
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function findRecord(scopeKey: string) {
  const result = await db.execute(sql`
    SELECT id, request_hash, response_status, response_body, state
    FROM workflow_idempotency_records
    WHERE scope_key = ${scopeKey}
    LIMIT 1
  `);
  return (getRows(result) as WorkflowIdempotencyRecord[])[0] ?? null;
}

async function waitForCompletedRecord(scopeKey: string) {
  for (let attempt = 0; attempt < REPLAY_WAIT_ATTEMPTS; attempt += 1) {
    await sleep(REPLAY_WAIT_MS);
    const record = await findRecord(scopeKey);
    if (record?.state === 'completed' && record.response_status !== null) {
      return record;
    }
  }
  return null;
}

export async function withWorkflowMutationIdempotency(
  request: NextRequest,
  scope: WorkflowIdempotencyScope,
  payload: unknown,
  handler: () => Promise<NextResponse>
) {
  const idempotencyKey = getIdempotencyKey(request);
  if (!idempotencyKey) {
    return handler();
  }

  if (!VALID_IDEMPOTENCY_KEY.test(idempotencyKey)) {
    return NextResponse.json(
      {
        error:
          'Invalid Idempotency-Key. Use 8-200 characters: letters, numbers, dot, underscore, colon, or dash.',
        code: 'INVALID_IDEMPOTENCY_KEY',
      },
      { status: 400 }
    );
  }

  const requestHash = stableHashPayload(payload ?? {});
  const scopeKey = stableHashPayload({
    userId: scope.userId,
    orgId: scope.orgId ?? null,
    action: scope.action,
    resourceType: scope.resourceType,
    resourceId: scope.resourceId,
    idempotencyKey,
  });

  const inserted = getRows(
    await db.execute(sql`
      INSERT INTO workflow_idempotency_records (
        user_id,
        org_id,
        action,
        resource_type,
        resource_id,
        idempotency_key,
        scope_key,
        request_hash,
        state
      )
      VALUES (
        ${scope.userId},
        ${scope.orgId ?? null},
        ${scope.action},
        ${scope.resourceType},
        ${scope.resourceId},
        ${idempotencyKey},
        ${scopeKey},
        ${requestHash},
        'processing'
      )
      ON CONFLICT (scope_key) DO NOTHING
      RETURNING id, request_hash, response_status, response_body, state
    `)
  ) as WorkflowIdempotencyRecord[];

  if (inserted.length === 0) {
    const existing = await findRecord(scopeKey);
    if (!existing) {
      return NextResponse.json(
        { error: 'Unable to resolve idempotency state', code: 'IDEMPOTENCY_STATE_UNAVAILABLE' },
        { status: 409, headers: idempotencyHeaders(idempotencyKey) }
      );
    }

    if (existing.request_hash !== requestHash) {
      return NextResponse.json(
        {
          error: 'Idempotency-Key replay used a different payload',
          code: 'IDEMPOTENCY_REPLAY_MISMATCH',
        },
        { status: 409, headers: idempotencyHeaders(idempotencyKey) }
      );
    }

    if (existing.state === 'completed' && existing.response_status !== null) {
      return replayResponse(idempotencyKey, existing);
    }

    const completed = await waitForCompletedRecord(scopeKey);
    if (completed) {
      return replayResponse(idempotencyKey, completed);
    }

    return NextResponse.json(
      { error: 'Matching request is still processing', code: 'IDEMPOTENCY_IN_PROGRESS' },
      { status: 409, headers: { ...idempotencyHeaders(idempotencyKey), 'Retry-After': '1' } }
    );
  }

  try {
    const response = await handler();
    const responseBody = await response
      .clone()
      .json()
      .catch(() => null);

    if (responseBody !== null && response.status < 500) {
      await db.execute(sql`
        UPDATE workflow_idempotency_records
        SET
          state = 'completed',
          response_status = ${response.status},
          response_body = ${JSON.stringify(responseBody)}::jsonb,
          completed_at = NOW(),
          updated_at = NOW()
        WHERE scope_key = ${scopeKey}
      `);
    } else {
      await db.execute(sql`
        UPDATE workflow_idempotency_records
        SET
          state = 'failed',
          updated_at = NOW()
        WHERE scope_key = ${scopeKey}
      `);
    }

    response.headers.set('Idempotency-Key', idempotencyKey);
    return response;
  } catch (error) {
    await db
      .execute(
        sql`
      UPDATE workflow_idempotency_records
      SET
        state = 'failed',
        error_message = ${error instanceof Error ? error.message : 'Unknown workflow error'},
        updated_at = NOW()
      WHERE scope_key = ${scopeKey}
    `
      )
      .catch((updateError) => {
        log.error('workflow_idempotency.mark_failed_error', {
          scope: {
            action: scope.action,
            resourceType: scope.resourceType,
            resourceId: scope.resourceId,
          },
          error: sanitizeErrorForLog(updateError),
        });
      });

    throw error;
  }
}
