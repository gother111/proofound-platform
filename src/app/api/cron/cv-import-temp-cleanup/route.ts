import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

import { requireInternalApiRequest } from '@/lib/api/auth';
import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import {
  resolveCvImportTempTtlHours,
  type CvImportExtractJobPayload,
} from '@/lib/expertise/cv-import-wizard-extract';
import { removeCvImportTempPdfs } from '@/lib/expertise/cv-import-temp-storage';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const unauthorized = requireInternalApiRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const ttlHours = resolveCvImportTempTtlHours();
  const admin = createAdminClient();

  const result = await db.execute(sql`
    SELECT id, payload
    FROM public.python_internal_jobs
    WHERE job_type = 'document_intelligence_extract_only'
      AND status IN ('completed', 'failed')
      AND created_at <= now() - (${ttlHours} * interval '1 hour')
    ORDER BY created_at ASC
    LIMIT 200;
  `);

  const rows = getRows(result) as Array<{ id: string; payload: CvImportExtractJobPayload | null }>;
  const storagePaths = rows.flatMap((row) => {
    const payload = row.payload;
    if (!payload || typeof payload !== 'object' || !Array.isArray((payload as any).documents)) {
      return [];
    }

    return (payload as any).documents
      .map((document: any) =>
        typeof document?.storage_path === 'string' && document.storage_path.trim().length > 0
          ? document.storage_path.trim()
          : null
      )
      .filter((value: string | null): value is string => Boolean(value));
  });

  const cleanup = await removeCvImportTempPdfs({
    admin,
    storagePaths,
  });

  return NextResponse.json({
    success: true,
    jobs_considered: rows.length,
    paths_attempted: storagePaths.length,
    failed_paths: cleanup.failedPaths,
  });
}
