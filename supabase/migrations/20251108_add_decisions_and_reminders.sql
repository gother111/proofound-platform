-- ============================================================================
-- DECISIONS & REMINDERS TABLES
-- Implements PRD: 48-hour decision window after interviews
-- ============================================================================

-- Decision records
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('hire', 'advance', 'hold', 'reject')),
  feedback TEXT,
  hours_since_interview NUMERIC(10, 2) NOT NULL,
  within_sla BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Decision reminders
CREATE TABLE IF NOT EXISTS decision_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '40h', '48h_deadline', '54h_overdue')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_decisions_interview_id ON decisions(interview_id);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at);
CREATE INDEX IF NOT EXISTS idx_decision_reminders_interview_id ON decision_reminders(interview_id);
CREATE INDEX IF NOT EXISTS idx_decision_reminders_sent_at ON decision_reminders(sent_at);

-- Row-Level Security
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_reminders ENABLE ROW LEVEL SECURITY;

-- Organizations can view decisions for their interviews
CREATE POLICY "Organizations can view their decisions"
  ON decisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interviews i
      INNER JOIN assignments a ON i.assignment_id = a.id
      WHERE i.id = decisions.interview_id
        AND a.organization_id = auth.uid()
    )
  );

-- Organizations can create decisions for their interviews
CREATE POLICY "Organizations can create decisions"
  ON decisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews i
      INNER JOIN assignments a ON i.assignment_id = a.id
      WHERE i.id = decisions.interview_id
        AND a.organization_id = auth.uid()
    )
  );

-- Organizations can view their reminders
CREATE POLICY "Organizations can view their reminders"
  ON decision_reminders FOR SELECT
  USING (organization_id = auth.uid());

-- System can insert reminders (cron job)
CREATE POLICY "System can insert reminders"
  ON decision_reminders FOR INSERT
  WITH CHECK (true);

-- Updated at trigger for decisions
CREATE OR REPLACE FUNCTION update_decisions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decisions_updated_at
  BEFORE UPDATE ON decisions
  FOR EACH ROW
  EXECUTE FUNCTION update_decisions_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON decisions TO authenticated;
GRANT SELECT, INSERT ON decision_reminders TO authenticated;
GRANT ALL ON decisions TO service_role;
GRANT ALL ON decision_reminders TO service_role;

