-- Migration: Add Foreign Key Constraint for skill_code
-- Date: 2025-01-31
-- Description: Adds foreign key constraint from skills.skill_code to skills_taxonomy.code
--              to enable relationship-based query syntax in Supabase

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINT
-- ============================================================================

-- Add foreign key constraint for skill_code
-- This enables the query syntax: taxonomy:skill_code (...fields...)
ALTER TABLE skills 
ADD CONSTRAINT fk_skills_skill_code 
FOREIGN KEY (skill_code) 
REFERENCES skills_taxonomy(code) 
ON DELETE SET NULL;

-- ============================================================================
-- ADD INDEX FOR PERFORMANCE
-- ============================================================================

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_skills_skill_code ON skills(skill_code);

-- ============================================================================
-- ADD COMMENT
-- ============================================================================

-- Add comment for documentation
COMMENT ON CONSTRAINT fk_skills_skill_code ON skills IS 
'Foreign key to skills_taxonomy.code for L4 skill reference. Enables relationship-based queries in Supabase.';

