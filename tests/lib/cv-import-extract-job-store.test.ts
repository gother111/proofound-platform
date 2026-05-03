import { describe, expect, it } from 'vitest';

import {
  readCvImportExtractJob,
  saveCvImportExtractJob,
} from '@/lib/expertise/cv-import-extract-job-store';

describe('cv import extraction result store', () => {
  it('does not allow one user to read another user extraction result', () => {
    const ownerUserId = '00000000-0000-4000-8000-000000000001';
    const otherUserId = '00000000-0000-4000-8000-000000000002';
    const stored = saveCvImportExtractJob(ownerUserId, {
      status: 'completed',
      documents: [
        {
          document_id: 'doc-1',
          file_name: 'candidate-secret-cv.pdf',
          text: 'Extracted text that belongs only to the owner.',
          context: 'cv',
        },
      ],
      failed_documents: [],
      cleanup_pending: false,
    });

    expect(readCvImportExtractJob(otherUserId, stored.job_id)).toBeNull();
    expect(JSON.stringify(readCvImportExtractJob(otherUserId, stored.job_id))).not.toContain(
      'candidate-secret-cv.pdf'
    );
    expect(JSON.stringify(readCvImportExtractJob(otherUserId, stored.job_id))).not.toContain(
      'Extracted text that belongs only to the owner.'
    );
    expect(readCvImportExtractJob(ownerUserId, stored.job_id)).toMatchObject({
      job_id: stored.job_id,
      status: 'completed',
    });
  });
});
