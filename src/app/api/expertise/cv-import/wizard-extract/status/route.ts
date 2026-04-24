import { NextRequest, NextResponse } from 'next/server';

import { requireApiAuthContext } from '@/lib/auth';
import {
  CV_IMPORT_EXTRACT_POLL_AFTER_MS,
  CvImportWizardExtractStatusResponseSchema,
} from '@/lib/expertise/cv-import-wizard-extract';
import { readCvImportExtractJob } from '@/lib/expertise/cv-import-extract-job-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authContext = await requireApiAuthContext();
  if (!authContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobId = request.nextUrl.searchParams.get('job_id')?.trim();
  if (!jobId) {
    return NextResponse.json({ error: 'Missing job_id.' }, { status: 400 });
  }

  const job = readCvImportExtractJob(authContext.user.id, jobId);
  if (!job) {
    return NextResponse.json(
      {
        job_id: jobId,
        status: 'failed',
        error: 'CV extraction job not found',
        message: 'The CV extraction job could not be found. Please upload the PDF again.',
        code: 'CV_IMPORT_JOB_NOT_FOUND',
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    CvImportWizardExtractStatusResponseSchema.parse({
      ...job,
      poll_after_ms: job.status === 'completed' ? undefined : CV_IMPORT_EXTRACT_POLL_AFTER_MS,
    })
  );
}
