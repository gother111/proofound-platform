import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { expireDueCapabilityTokens } from '@/lib/security/capability-tokens';
import { deleteUploadedFile, UPLOAD_BUCKETS } from '@/lib/uploads/lifecycle';
import { finalizeLifecycleOperation, getLifecycleOperation } from '@/lib/lifecycle/reconciliation';
import { createAdminClient } from '@/lib/supabase/admin';

export async function runTokenExpiryReconciler(limit = 200) {
  return expireDueCapabilityTokens(limit);
}

export async function runUploadQuarantineCleanup(hoursOld = 24) {
  const result = await db.execute(sql`
    SELECT id
    FROM uploaded_files
    WHERE lifecycle_state IN ('quarantined', 'rejected')
      AND created_at < NOW() - (${hoursOld} || ' hours')::interval
    LIMIT 200
  `);
  const rows = getRows<{ id: string }>(result as any);
  const admin = createAdminClient();

  for (const row of rows) {
    const quarantinePaths = await db.execute(sql`
      SELECT quarantine_bucket, quarantine_path
      FROM uploaded_files
      WHERE id = ${row.id}
    `);
    const [quarantineRow] = getRows<{
      quarantine_bucket: string | null;
      quarantine_path: string | null;
    }>(quarantinePaths as any);
    if (quarantineRow?.quarantine_bucket && quarantineRow.quarantine_path) {
      await admin.storage
        .from(quarantineRow.quarantine_bucket)
        .remove([quarantineRow.quarantine_path]);
    }
    await deleteUploadedFile(row.id);
  }

  return rows.length;
}

export async function runLifecycleReconciler(limit = 100) {
  const result = await db.execute(sql`
    SELECT id
    FROM lifecycle_operations
    WHERE status IN ('pending', 'processing')
    ORDER BY requested_at ASC
    LIMIT ${limit}
  `);
  const rows = getRows<{ id: string }>(result as any);

  for (const row of rows) {
    const operation = await getLifecycleOperation(row.id);
    if (!operation) {
      continue;
    }

    const unresolved = operation.targets.filter((target: any) => !target.resolved_at);
    if (unresolved.length === 0) {
      await finalizeLifecycleOperation(row.id, {
        status: 'completed',
        visibleStatus: 'completed',
        summaryCode: 'reconciled',
      });
    }
  }

  return rows.length;
}

export async function runPublicSurfaceDepublish(limit = 100) {
  const result = await db.execute(sql`
    UPDATE profile_snippets
    SET public_surface_disabled_at = COALESCE(public_surface_disabled_at, NOW())
    WHERE deleted_at IS NOT NULL
      AND public_surface_disabled_at IS NULL
    RETURNING id
  `);

  return getRows(result as any).slice(0, limit).length;
}

export async function runExportPackager(limit = 100) {
  const result = await db.execute(sql`
    SELECT id
    FROM lifecycle_operations
    WHERE operation_type = 'export'
      AND status = 'processing'
    ORDER BY requested_at ASC
    LIMIT ${limit}
  `);

  return getRows(result as any).length;
}

export async function runUploadScanPromote(limit = 100) {
  const result = await db.execute(sql`
    SELECT id
    FROM uploaded_files
    WHERE lifecycle_state = 'quarantined'
      AND quarantine_bucket = ${UPLOAD_BUCKETS.QUARANTINE}
    LIMIT ${limit}
  `);

  return getRows(result as any).length;
}
