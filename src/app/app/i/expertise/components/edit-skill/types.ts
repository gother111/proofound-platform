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
  verifierSource: 'peer' | 'manager' | 'external';
  message: string;
};

export type VerificationRequest = {
  id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'failed';
  verifier_source: 'peer' | 'manager' | 'external';
  verifier_email: string;
  custom_request_id?: string | null;
  message?: string;
  created_at: string;
  responded_at?: string;
};
