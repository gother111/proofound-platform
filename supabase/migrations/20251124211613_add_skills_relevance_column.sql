-- Add relevance column to skills table for tracking skill currency
ALTER TABLE skills ADD COLUMN IF NOT EXISTS relevance TEXT 
CHECK (relevance IN ('obsolete', 'current', 'emerging'));

-- Set default value for existing rows
UPDATE skills SET relevance = 'current' WHERE relevance IS NULL;

-- Add index for filtering by relevance
CREATE INDEX IF NOT EXISTS idx_skills_relevance ON skills(relevance);
