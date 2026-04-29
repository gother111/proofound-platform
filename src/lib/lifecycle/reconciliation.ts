import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

import { db, profiles } from '@/db';
import { getRows } from '@/lib/db/rows';
import { revalidatePublicPortfolioByProfileId } from '@/lib/portfolio/public-invalidation';
import { deleteUploadedFile } from '@/lib/uploads/lifecycle';
import { revokeCapabilityTokensBySource } from '@/lib/security/capability-tokens';

type LifecycleStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'failed_requires_manual_review';

type LifecycleTargetType =
  | 'db_record'
  | 'legacy_record'
  | 'storage_object'
  | 'proof_pack'
  | 'snippet'
  | 'public_portfolio'
  | 'sitemap_metadata'
  | 'search_index_state'
  | 'analytics_snapshot'
  | 'audit_retention'
  | 'export_manifest_entry';

type LifecycleTargetInput = {
  targetType: LifecycleTargetType;
  targetRef: string;
  desiredState: string;
  metadata?: Record<string, unknown>;
};

export type LifecycleOperationRow = {
  id: string;
  operation_type: 'delete' | 'unpublish' | 'revoke' | 'export';
  subject_type: string;
  subject_id: string;
  requested_by: string | null;
  status: LifecycleStatus;
  visible_status: string;
  summary_code: string | null;
};

export async function createLifecycleOperation(params: {
  operationType: 'delete' | 'unpublish' | 'revoke' | 'export';
  subjectType: string;
  subjectId: string;
  requestedBy?: string | null;
  visibleStatus?: string;
  metadata?: Record<string, unknown>;
  targets: LifecycleTargetInput[];
}) {
  const operationResult = await db.execute(sql`
    INSERT INTO lifecycle_operations (
      operation_type,
      subject_type,
      subject_id,
      requested_by,
      status,
      visible_status,
      metadata
    ) VALUES (
      ${params.operationType},
      ${params.subjectType},
      ${params.subjectId}::uuid,
      ${params.requestedBy ?? null},
      'processing',
      ${params.visibleStatus ?? 'processing'},
      ${JSON.stringify(params.metadata ?? {})}::jsonb
    )
    RETURNING *
  `);
  const [operation] = getRows<LifecycleOperationRow>(operationResult as any);

  for (const target of params.targets) {
    await db.execute(sql`
      INSERT INTO lifecycle_operation_targets (
        operation_id,
        target_type,
        target_ref,
        desired_state,
        metadata
      ) VALUES (
        ${operation.id},
        ${target.targetType},
        ${target.targetRef},
        ${target.desiredState},
        ${JSON.stringify(target.metadata ?? {})}::jsonb
      )
    `);
  }

  return operation;
}

export async function resolveLifecycleTarget(
  operationId: string,
  targetType: LifecycleTargetType,
  targetRef: string,
  actualState: string
) {
  await db.execute(sql`
    UPDATE lifecycle_operation_targets
    SET
      actual_state = ${actualState},
      attempt_count = attempt_count + 1,
      last_attempt_at = NOW(),
      resolved_at = NOW(),
      updated_at = NOW()
    WHERE operation_id = ${operationId}
      AND target_type = ${targetType}
      AND target_ref = ${targetRef}
  `);
}

export async function failLifecycleTarget(
  operationId: string,
  targetType: LifecycleTargetType,
  targetRef: string,
  failureCode: string,
  failureDetail: string
) {
  await db.execute(sql`
    UPDATE lifecycle_operation_targets
    SET
      actual_state = 'failed',
      attempt_count = attempt_count + 1,
      last_attempt_at = NOW(),
      failure_code = ${failureCode},
      failure_detail = ${failureDetail},
      updated_at = NOW()
    WHERE operation_id = ${operationId}
      AND target_type = ${targetType}
      AND target_ref = ${targetRef}
  `);
}

export async function finalizeLifecycleOperation(
  operationId: string,
  params: {
    status: LifecycleStatus;
    visibleStatus: string;
    summaryCode?: string | null;
  }
) {
  await db.execute(sql`
    UPDATE lifecycle_operations
    SET
      status = ${params.status},
      visible_status = ${params.visibleStatus},
      summary_code = ${params.summaryCode ?? null},
      completed_at = CASE
        WHEN ${params.status} IN ('completed', 'partial')
        THEN NOW()
        ELSE completed_at
      END,
      failed_at = CASE
        WHEN ${params.status} IN ('failed', 'failed_requires_manual_review')
        THEN NOW()
        ELSE failed_at
      END,
      updated_at = NOW()
    WHERE id = ${operationId}
  `);
}

export async function getLifecycleOperation(operationId: string) {
  const result = await db.execute(sql`
    SELECT *
    FROM lifecycle_operations
    WHERE id = ${operationId}
    LIMIT 1
  `);
  const [operation] = getRows<LifecycleOperationRow>(result as any);
  if (!operation) {
    return null;
  }

  const targetResult = await db.execute(sql`
    SELECT *
    FROM lifecycle_operation_targets
    WHERE operation_id = ${operationId}
    ORDER BY created_at ASC
  `);

  return {
    operation,
    targets: getRows(targetResult as any),
  };
}

export async function executeAccountDeletionLifecycle(params: {
  userId: string;
  reason?: string | null;
  operationId: string;
}) {
  const snippetsResult = await db.execute(sql`
    SELECT id, capability_token_id
    FROM profile_snippets
    WHERE user_id = ${params.userId}::uuid
      AND deleted_at IS NULL
  `);
  const snippets = getRows<{ id: string; capability_token_id: string | null }>(
    snippetsResult as any
  );

  for (const snippet of snippets) {
    await db.execute(sql`
      UPDATE profile_snippets
      SET
        deleted_at = NOW(),
        revoked_at = NOW(),
        revoked_reason = ${params.reason ?? 'account_deleted'},
        public_surface_disabled_at = NOW(),
        updated_at = NOW()
      WHERE id = ${snippet.id}
    `);
    await revokeCapabilityTokensBySource('profile_snippets', snippet.id, {
      reason: params.reason ?? 'account_deleted',
    });
  }
  await resolveLifecycleTarget(params.operationId, 'snippet', 'profile_snippets', 'revoked');

  const proofPacksResult = await db.execute(sql`
    SELECT id
    FROM proof_packs
    WHERE owner_type = 'individual_profile'
      AND owner_id = ${params.userId}::uuid
      AND deleted_at IS NULL
  `);
  const proofPacksRows = getRows<{ id: string }>(proofPacksResult as any);
  for (const pack of proofPacksRows) {
    await db.execute(sql`
      UPDATE proof_packs
      SET
        visibility = 'owner_only',
        deleted_at = NOW(),
        delete_reason = ${params.reason ?? 'account_deleted'},
        public_surface_disabled_at = NOW(),
        cleanup_started_at = NOW(),
        cleanup_completed_at = NOW(),
        updated_at = NOW()
      WHERE id = ${pack.id}
    `);
  }
  await resolveLifecycleTarget(params.operationId, 'proof_pack', 'proof_packs', 'revoked');

  await db.execute(sql`
    UPDATE proof_artifacts
    SET
      lifecycle_state = 'deleted',
      visibility = 'owner_only',
      deleted_at = COALESCE(deleted_at, NOW()),
      delete_reason = ${params.reason ?? 'account_deleted'},
      public_surface_disabled_at = NOW(),
      cleanup_started_at = COALESCE(cleanup_started_at, NOW()),
      cleanup_completed_at = NOW(),
      updated_at = NOW()
    WHERE owner_type = 'individual_profile'
      AND owner_id = ${params.userId}::uuid
      AND deleted_at IS NULL
  `);

  await db.execute(sql`
    UPDATE verification_records
    SET
      status = 'revoked',
      verifier_profile_id = NULL,
      verifier_org_id = NULL,
      verifier_email_hash = NULL,
      verifier_domain_snapshot = NULL,
      risk_signals = '{}'::jsonb,
      claim_snapshot = '{}'::jsonb,
      metadata = jsonb_build_object('retention', 'account_deleted_minimized'),
      revoked_at = COALESCE(revoked_at, NOW()),
      updated_at = NOW()
    WHERE owner_type = 'individual_profile'
      AND owner_id = ${params.userId}::uuid
      AND revoked_at IS NULL
  `);

  const uploadedFilesResult = await db.execute(sql`
    SELECT id
    FROM uploaded_files
    WHERE owner_type = 'individual_profile'
      AND owner_id = ${params.userId}::uuid
      AND deleted_at IS NULL
  `);
  const uploadedFiles = getRows<{ id: string }>(uploadedFilesResult as any);
  const failedStorageDeletes: string[] = [];
  for (const file of uploadedFiles) {
    const deleted = await deleteUploadedFile(file.id, params.userId, 'system_cleanup');
    if (!deleted) {
      failedStorageDeletes.push(file.id);
    }
  }

  if (failedStorageDeletes.length > 0) {
    await failLifecycleTarget(
      params.operationId,
      'storage_object',
      'uploaded_files',
      'storage_delete_failed',
      `${failedStorageDeletes.length} uploaded file(s) failed storage deletion`
    );
    throw new Error('Account deletion storage cleanup failed');
  }
  await resolveLifecycleTarget(params.operationId, 'storage_object', 'uploaded_files', 'deleted');

  await db.execute(sql`
    DELETE FROM evidence
    WHERE profile_id = ${params.userId}::uuid
  `);

  await db.execute(sql`
    DELETE FROM capabilities
    WHERE profile_id = ${params.userId}::uuid
  `);

  await db.execute(sql`
    DELETE FROM skill_proofs
    WHERE profile_id = ${params.userId}::uuid
  `);

  await db.execute(sql`
    DELETE FROM skills
    WHERE profile_id = ${params.userId}::uuid
  `);

  await db.execute(sql`
    DELETE FROM impact_stories
    WHERE user_id = ${params.userId}::uuid
  `);

  await db.execute(sql`
    DELETE FROM experiences
    WHERE user_id = ${params.userId}::uuid
  `);

  await db.execute(sql`
    DELETE FROM education
    WHERE user_id = ${params.userId}::uuid
  `);

  await db.execute(sql`
    DELETE FROM volunteering
    WHERE user_id = ${params.userId}::uuid
  `);

  await db.execute(sql`
    DELETE FROM projects
    WHERE user_id = ${params.userId}::uuid
  `);

  await db.execute(sql`
    DELETE FROM individual_profiles
    WHERE user_id = ${params.userId}::uuid
  `);

  await db.execute(sql`
    DELETE FROM matching_profiles
    WHERE profile_id = ${params.userId}::uuid
  `);

  await db
    .update(profiles)
    .set({
      lifecycleState: 'deleted',
      publicPortfolioState: 'unavailable',
      searchIndexingEnabledAt: null,
      matchingEnabled: false,
      deleted: true,
      deletionRequestedAt: new Date(),
      deletionReason: params.reason ?? null,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, params.userId));

  await resolveLifecycleTarget(
    params.operationId,
    'db_record',
    `profiles:${params.userId}`,
    'deleted'
  );
  await resolveLifecycleTarget(
    params.operationId,
    'public_portfolio',
    `profiles:${params.userId}`,
    'disabled'
  );
  await revalidatePublicPortfolioByProfileId(params.userId);
  await resolveLifecycleTarget(
    params.operationId,
    'search_index_state',
    `profiles:${params.userId}`,
    'noindex_pending'
  );
  await resolveLifecycleTarget(
    params.operationId,
    'analytics_snapshot',
    `profiles:${params.userId}`,
    'retained_pseudonymized'
  );
}
