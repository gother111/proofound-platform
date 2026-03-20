import { describe, expect, it } from 'vitest';

import {
  assessEvidenceUploadPrivacy,
  assessUploadFilenamePrivacy,
  classifyUploadSensitivity,
  collectUploadMetadataFlags,
  isUploadHeldForPrivacyReview,
  parseUploadPrivacyReviewReasons,
  resolveArtifactDisplayName,
  resolveArtifactDisplayNameForSurface,
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
      uploadKind: 'proof',
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

  it('uses the stored sanitized filename as the canonical artifact display name', () => {
    expect(
      resolveArtifactDisplayName({
        sanitizedFilename: 'safe_name.pdf',
        originalFilename: 'Jane Doe Resume.pdf',
        detectedMime: 'application/pdf',
        uploadKind: 'document',
      })
    ).toBe('safe_name.pdf');
  });

  it('uses generic typed labels for review and public surfaces', () => {
    expect(
      resolveArtifactDisplayNameForSurface(
        {
          sanitizedFilename: 'safe_name.pdf',
          originalFilename: 'Jane Doe Resume.pdf',
          detectedMime: 'application/pdf',
          uploadKind: 'document',
        },
        'review'
      )
    ).toBe('Uploaded PDF document');

    expect(
      resolveArtifactDisplayNameForSurface(
        {
          sanitizedFilename: 'safe_name.pdf',
          originalFilename: 'Jane Doe Resume.pdf',
          detectedMime: 'application/pdf',
          uploadKind: 'document',
        },
        'public'
      )
    ).toBe('Uploaded PDF document');
  });

  it('falls back to sanitizing legacy original filenames when needed', () => {
    expect(
      resolveArtifactDisplayName({
        sanitizedFilename: null,
        originalFilename: '../Jane Doe resume?.pdf',
        detectedMime: 'application/pdf',
        uploadKind: 'document',
      })
    ).toBe('Jane_Doe_resume_.pdf');
  });

  it('uses a typed generic label when no safe filename is available', () => {
    expect(
      resolveArtifactDisplayName({
        sanitizedFilename: null,
        originalFilename: null,
        detectedMime: 'application/pdf',
        uploadKind: 'document',
      })
    ).toBe('Uploaded PDF document');
  });

  it('classifies sensitive engagement documents as owner-only by default', () => {
    expect(
      classifyUploadSensitivity({
        originalFilename: 'signed_consulting_agreement.pdf',
        uploadKind: 'document',
      })
    ).toEqual({
      sensitiveDocument: true,
      sensitivityReason: 'engagement_document',
      recommendedVisibility: 'owner_only',
      recommendedRevealGate: 'conversation_started',
    });
  });
});
