import { describe, expect, it } from 'vitest';

import {
  assessEvidenceUploadPrivacy,
  assessUploadFilenamePrivacy,
  collectUploadMetadataFlags,
  isUploadHeldForPrivacyReview,
  parseUploadPrivacyReviewReasons,
  sanitizeUploadFilename,
} from '@/lib/uploads/privacy';

describe('upload privacy helpers', () => {
  it('sanitizes risky filenames and marks path-like names for manual review', () => {
    expect(sanitizeUploadFilename('../Jane Doe resume?.pdf')).toBe('Jane_Doe_resume_.pdf');

    const assessment = assessUploadFilenamePrivacy('../Jane Doe resume?.pdf');

    expect(assessment.sanitizedFilename).toBe('Jane_Doe_resume_.pdf');
    expect(assessment.materiallyChanged).toBe(true);
    expect(assessment.requiresReview).toBe(true);
    expect(assessment.reasons).toEqual(['filename_sanitized']);
  });

  it('detects metadata flags that require privacy review', () => {
    const buffer = Buffer.from('Exif GPS /Author xmp:meta');
    const metadataFlags = collectUploadMetadataFlags(buffer, 'image/jpeg');
    const assessment = assessEvidenceUploadPrivacy({
      originalFilename: 'portfolio.pdf',
      metadataFlags,
    });

    expect(metadataFlags.publicSafeEligible).toBe(false);
    expect(assessment.requiresReview).toBe(true);
    expect(assessment.reasons).toEqual([
      'metadata_exif',
      'metadata_gps',
      'metadata_author',
      'metadata_hidden_properties',
    ]);
    expect(parseUploadPrivacyReviewReasons(assessment.safetyReason)).toEqual(assessment.reasons);
    expect(
      isUploadHeldForPrivacyReview({
        safetyStatus: 'manual_review',
        safetyReason: assessment.safetyReason,
      })
    ).toBe(true);
  });
});
