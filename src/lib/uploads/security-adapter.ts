import type { UploadMetadataFlags, UploadPrivacyReviewReason } from '@/lib/uploads/privacy';

export type UploadSecurityAdapterResult = {
  scannerEngine: string;
  malwareScanStatus: 'clean' | 'rejected' | 'unavailable';
  malwareReason: string | null;
  metadataStripStatus: 'not_required' | 'completed' | 'unavailable';
  metadataStripReason: string | null;
  reviewReasons: UploadPrivacyReviewReason[];
  safeForPublic: boolean;
};

const METADATA_RISK_FIELDS: Array<keyof UploadMetadataFlags> = [
  'hasExif',
  'hasGps',
  'hasAuthorMetadata',
  'hasTitleMetadata',
  'hasCreatorMetadata',
  'hasCompanyMetadata',
  'hasHiddenDocumentProperties',
];

export async function scanAndPrepareUpload(input: {
  metadataFlags: UploadMetadataFlags;
  isEvidenceUpload: boolean;
  promotePublic: boolean;
}): Promise<UploadSecurityAdapterResult> {
  const metadataRiskDetected = METADATA_RISK_FIELDS.some(
    (key) => input.metadataFlags[key] === true
  );
  const reviewReasons: UploadPrivacyReviewReason[] = [];

  if (input.isEvidenceUpload) {
    reviewReasons.push('malware_scanner_unavailable');
  }

  if (metadataRiskDetected) {
    reviewReasons.push('metadata_stripping_unavailable');
  }

  return {
    scannerEngine: input.isEvidenceUpload ? 'adapter_unavailable_v1' : 'signature_v1',
    malwareScanStatus: input.isEvidenceUpload ? 'unavailable' : 'clean',
    malwareReason: input.isEvidenceUpload ? 'malware_scanner_unavailable' : null,
    metadataStripStatus: metadataRiskDetected ? 'unavailable' : 'not_required',
    metadataStripReason: metadataRiskDetected ? 'metadata_stripping_unavailable' : null,
    reviewReasons: [...new Set(reviewReasons)],
    safeForPublic:
      !input.isEvidenceUpload &&
      input.promotePublic &&
      input.metadataFlags.publicSafeEligible &&
      !metadataRiskDetected,
  };
}
