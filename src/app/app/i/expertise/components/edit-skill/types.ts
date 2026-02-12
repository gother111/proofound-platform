export interface Proof {
  id: string;
  proof_type: 'project' | 'certification' | 'media' | 'reference' | 'link';
  title: string;
  description?: string;
  url?: string;
  issued_date?: string;
  created_at?: string;
}

export type ProofDraft = {
  proofType: 'project' | 'certification' | 'media' | 'reference' | 'link';
  title: string;
  description: string;
  url: string;
  issuedDate: string;
};

export type VerificationDraft = {
  verifierEmail: string;
  verifierSource: 'peer' | 'manager' | 'external';
  message: string;
};

export type VerificationRequest = {
  id: string;
  status: 'pending' | 'accepted' | 'declined';
  verifier_source: 'peer' | 'manager' | 'external';
  verifier_email: string;
  message?: string;
  created_at: string;
  responded_at?: string;
};
