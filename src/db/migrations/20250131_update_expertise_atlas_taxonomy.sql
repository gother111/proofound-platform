-- Migration: Update Expertise Atlas Taxonomy with Correct L1 Domains
-- Date: 2025-10-31
-- Description: Updates L1 domain names to match Expertise Atlas documentation
--              and adds relevance field to skills table

-- ============================================================================
-- UPDATE L1 DOMAIN NAMES
-- ============================================================================

-- Clear existing L1 categories and seed with correct taxonomy
TRUNCATE TABLE skills_categories CASCADE;

INSERT INTO skills_categories (cat_id, slug, name_i18n, description_i18n, icon, display_order) VALUES
(1, 'universal-capabilities', 
 '{"en": "Universal Capabilities", "sv": "Universella förmågor"}', 
 '{"en": "Core transferable capabilities applicable across all domains", "sv": "Kärnöverförbara förmågor tillämpliga över alla domäner"}',
 'U',
 1),
(2, 'functional-competencies', 
 '{"en": "Functional Competencies", "sv": "Funktionella kompetenser"}', 
 '{"en": "Role-specific and operational competencies", "sv": "Rollspecifika och operativa kompetenser"}',
 'F',
 2),
(3, 'tools-technologies', 
 '{"en": "Tools & Technologies", "sv": "Verktyg & teknologier"}', 
 '{"en": "Software, platforms, and technical tools", "sv": "Programvara, plattformar och tekniska verktyg"}',
 'T',
 3),
(4, 'languages-culture', 
 '{"en": "Languages & Culture", "sv": "Språk & kultur"}', 
 '{"en": "Natural languages and cross-cultural competencies", "sv": "Naturliga språk och tvärkulturella kompetenser"}',
 'L',
 4),
(5, 'methods-practices', 
 '{"en": "Methods & Practices", "sv": "Metoder & praxis"}', 
 '{"en": "Methodologies, frameworks, and professional practices", "sv": "Metoder, ramverk och professionell praxis"}',
 'M',
 5),
(6, 'domain-knowledge', 
 '{"en": "Domain Knowledge", "sv": "Domänkunskap"}', 
 '{"en": "Theoretical foundations and specialized domain knowledge", "sv": "Teoretiska grunder och specialiserad domänkunskap"}',
 'D',
 6);

-- ============================================================================
-- ADD RELEVANCE FIELD TO SKILLS TABLE
-- ============================================================================

-- Add relevance enum field for tracking skill currency
ALTER TABLE skills ADD COLUMN IF NOT EXISTS relevance TEXT 
CHECK (relevance IN ('obsolete', 'current', 'emerging'));

-- Set default to 'current' for existing skills
UPDATE skills SET relevance = 'current' WHERE relevance IS NULL;

-- Add index for filtering by relevance
CREATE INDEX IF NOT EXISTS idx_skills_relevance ON skills(relevance);

-- ============================================================================
-- HELPER FUNCTION TO MAP L1 CODE TO CAT_ID
-- ============================================================================

CREATE OR REPLACE FUNCTION l1_code_to_cat_id(code TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE code
        WHEN 'U' THEN 1
        WHEN 'F' THEN 2
        WHEN 'T' THEN 3
        WHEN 'L' THEN 4
        WHEN 'M' THEN 5
        WHEN 'D' THEN 6
        ELSE NULL
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION l1_code_to_cat_id IS 'Maps L1 letter codes (U/F/T/L/M/D) to numeric cat_id (1-6)';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN skills.relevance IS 'Skill currency: obsolete (outdated), current (in-use), emerging (cutting-edge)';

