-- Migration: Purpose Edit Audit Trail
-- PRD: Part 2 - Purpose Block auditing requirement
-- Tracks changes to mission and vision fields for compliance and transparency

CREATE TABLE IF NOT EXISTS purpose_edit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Which field was changed ('mission' or 'vision')
  field_name TEXT NOT NULL CHECK (field_name IN ('mission', 'vision')),
  
  -- Old and new values (full text)
  old_value TEXT,
  new_value TEXT,
  
  -- When the change occurred
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Character counts for quick analysis
  old_char_count INTEGER GENERATED ALWAYS AS (LENGTH(old_value)) STORED,
  new_char_count INTEGER GENERATED ALWAYS AS (LENGTH(new_value)) STORED,
  
  -- Change magnitude (for detecting significant rewrites vs minor edits)
  is_major_change BOOLEAN GENERATED ALWAYS AS (
    ABS(LENGTH(old_value) - LENGTH(new_value)) > 50 OR
    old_value IS NULL OR
    new_value IS NULL
  ) STORED
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_purpose_edit_log_user_id ON purpose_edit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_purpose_edit_log_field_name ON purpose_edit_log(field_name);
CREATE INDEX IF NOT EXISTS idx_purpose_edit_log_changed_at ON purpose_edit_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_purpose_edit_log_user_field ON purpose_edit_log(user_id, field_name);

-- Comments for documentation
COMMENT ON TABLE purpose_edit_log IS 'Append-only audit trail of mission and vision changes';
COMMENT ON COLUMN purpose_edit_log.field_name IS 'Which purpose field was edited: mission or vision';
COMMENT ON COLUMN purpose_edit_log.is_major_change IS 'Automatically calculated: true if change is >50 chars or null→value or value→null';

