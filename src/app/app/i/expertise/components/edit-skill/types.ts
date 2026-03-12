export interface Proof {
  id: string;
  proof_type: 'project' | 'certification' | 'media' | 'reference' | 'link' | 'document';
  title: string;
  description?: string;
  url?: string;
  file_path?: string;
  issued_date?: string;
  expires_date?: string;
  created_at?: string;
}

export type ProofDraft = {
  proofType: 'project' | 'certification' | 'media' | 'reference' | 'link' | 'document';
  title: string;
  description: string;
  url: string;
  filePath: string;
  uploadedFileId?: string;
  issuedDate: string;
  expiresDate: string;
};

export type VerificationDraft = {
  verifierEmail: string;
  relationship:
    | 'colleague'
    | 'peer'
    | 'manager'
    | 'skip_level_manager'
    | 'direct_report'
    | 'client'
    | 'partner'
    | 'mentor_coach';
  message: string;
};

export type VerificationRequest = {
  id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'failed';
  verifier_source: 'peer' | 'manager' | 'external';
  verifier_relationship?: string | null;
  request_kind?: 'generic_verification' | 'human_observed_attestation' | null;
  attestation_request?: {
    skillIds: string[];
    skillLabels: string[];
  } | null;
  verifier_email: string;
  custom_request_id?: string | null;
  message?: string;
  created_at: string;
  responded_at?: string;
};
