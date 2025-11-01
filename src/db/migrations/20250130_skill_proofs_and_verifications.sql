-- Migration: Add skill_proofs and skill_verification_requests tables
-- Date: 2025-01-30
-- Description: Enable proof attachment and verification requests for skills

-- Create skill_proofs table
CREATE TABLE IF NOT EXISTS skill_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proof_type TEXT NOT NULL CHECK (proof_type IN ('project', 'certification', 'media', 'reference', 'link')) DEFAULT 'link',
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  file_path TEXT,
  issued_date DATE,
  verified BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create skill_verification_requests table
CREATE TABLE IF NOT EXISTS skill_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  requester_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verifier_email TEXT NOT NULL,
  verifier_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verifier_source TEXT NOT NULL CHECK (verifier_source IN ('peer', 'manager', 'external')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  responded_at TIMESTAMP,
  response_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indexes for performance
CREATE INDEX idx_skill_proofs_skill_id ON skill_proofs(skill_id);
CREATE INDEX idx_skill_proofs_profile_id ON skill_proofs(profile_id);
CREATE INDEX idx_skill_proofs_type ON skill_proofs(proof_type);
CREATE INDEX idx_skill_proofs_created_at ON skill_proofs(created_at DESC);

CREATE INDEX idx_skill_verification_skill_id ON skill_verification_requests(skill_id);
CREATE INDEX idx_skill_verification_requester ON skill_verification_requests(requester_profile_id);
CREATE INDEX idx_skill_verification_verifier_email ON skill_verification_requests(verifier_email);
CREATE INDEX idx_skill_verification_verifier_profile ON skill_verification_requests(verifier_profile_id);
CREATE INDEX idx_skill_verification_status ON skill_verification_requests(status);
CREATE INDEX idx_skill_verification_created_at ON skill_verification_requests(created_at DESC);
CREATE INDEX idx_skill_verification_expires_at ON skill_verification_requests(expires_at);

-- Row-Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE skill_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_verification_requests ENABLE ROW LEVEL SECURITY;

-- skill_proofs policies
-- Users can view their own proofs
CREATE POLICY "Users can view their own skill proofs"
  ON skill_proofs FOR SELECT
  USING (auth.uid() = profile_id);

-- Users can insert proofs for their own skills
CREATE POLICY "Users can add proofs to their own skills"
  ON skill_proofs FOR INSERT
  WITH CHECK (
    auth.uid() = profile_id
    AND EXISTS (
      SELECT 1 FROM skills
      WHERE skills.id = skill_proofs.skill_id
      AND skills.profile_id = auth.uid()
    )
  );

-- Users can update their own proofs
CREATE POLICY "Users can update their own proofs"
  ON skill_proofs FOR UPDATE
  USING (auth.uid() = profile_id);

-- Users can delete their own proofs
CREATE POLICY "Users can delete their own proofs"
  ON skill_proofs FOR DELETE
  USING (auth.uid() = profile_id);

-- skill_verification_requests policies
-- Users can view verification requests they sent
CREATE POLICY "Users can view verification requests they sent"
  ON skill_verification_requests FOR SELECT
  USING (auth.uid() = requester_profile_id);

-- Users can view verification requests sent to them (by email or profile)
CREATE POLICY "Users can view verification requests sent to them"
  ON skill_verification_requests FOR SELECT
  USING (
    auth.uid() = verifier_profile_id
    OR verifier_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Users can create verification requests for their own skills
CREATE POLICY "Users can request verification for their own skills"
  ON skill_verification_requests FOR INSERT
  WITH CHECK (
    auth.uid() = requester_profile_id
    AND EXISTS (
      SELECT 1 FROM skills
      WHERE skills.id = skill_verification_requests.skill_id
      AND skills.profile_id = auth.uid()
    )
  );

-- Verifiers can update verification requests (respond to them)
CREATE POLICY "Verifiers can respond to verification requests"
  ON skill_verification_requests FOR UPDATE
  USING (
    auth.uid() = verifier_profile_id
    OR verifier_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_skill_proofs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER skill_proofs_updated_at
  BEFORE UPDATE ON skill_proofs
  FOR EACH ROW
  EXECUTE FUNCTION update_skill_proofs_updated_at();

-- Function to expire verification requests
CREATE OR REPLACE FUNCTION expire_verification_requests()
RETURNS void AS $$
BEGIN
  UPDATE skill_verification_requests
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE skill_proofs IS 'Evidence and proofs attached to user skills';
COMMENT ON TABLE skill_verification_requests IS 'Verification requests sent to peers, managers, or external sources';
COMMENT ON COLUMN skill_proofs.proof_type IS 'Type of proof: project, certification, media, reference, link';
COMMENT ON COLUMN skill_proofs.verified IS 'Whether this proof has been verified by a third party';
COMMENT ON COLUMN skill_verification_requests.verifier_source IS 'Source of verifier: peer, manager, external';
COMMENT ON COLUMN skill_verification_requests.status IS 'Status: pending, accepted, declined, expired';
COMMENT ON COLUMN skill_verification_requests.expires_at IS 'Verification requests expire after 30 days';


