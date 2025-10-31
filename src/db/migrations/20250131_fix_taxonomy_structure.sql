-- Migration: Fix Taxonomy Structure - Clean Slate for Re-seeding
-- Date: 2025-10-31
-- Description: Truncates existing taxonomy and user skills data to allow
--              clean re-seeding with globally unique primary keys

-- ============================================================================
-- TRUNCATE TAXONOMY TABLES (CASCADE will handle dependencies)
-- ============================================================================

-- Truncate L4 skills taxonomy (will cascade to user skills)
TRUNCATE TABLE skills_taxonomy CASCADE;

-- Truncate L3 subcategories (will cascade to L4)
TRUNCATE TABLE skills_l3 CASCADE;

-- Truncate L2 categories (will cascade to L3)
TRUNCATE TABLE skills_subcategories CASCADE;

-- Note: L1 (skills_categories) is already correct from previous migration

-- ============================================================================
-- TRUNCATE USER SKILLS AND RELATED TABLES
-- ============================================================================

-- Truncate user skills (per user requirement 3b: can reset)
TRUNCATE TABLE skills CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables are empty
DO $$
DECLARE
  l2_count INTEGER;
  l3_count INTEGER;
  l4_count INTEGER;
  skills_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO l2_count FROM skills_subcategories;
  SELECT COUNT(*) INTO l3_count FROM skills_l3;
  SELECT COUNT(*) INTO l4_count FROM skills_taxonomy;
  SELECT COUNT(*) INTO skills_count FROM skills;
  
  RAISE NOTICE 'Post-truncate counts:';
  RAISE NOTICE '  - L2 categories: %', l2_count;
  RAISE NOTICE '  - L3 subcategories: %', l3_count;
  RAISE NOTICE '  - L4 skills: %', l4_count;
  RAISE NOTICE '  - User skills: %', skills_count;
  
  IF l2_count = 0 AND l3_count = 0 AND l4_count = 0 AND skills_count = 0 THEN
    RAISE NOTICE '✅ All tables successfully truncated';
  ELSE
    RAISE WARNING '⚠️ Some tables still contain data';
  END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE skills_subcategories IS 'L2 categories with globally unique subcat_id (primary key)';
COMMENT ON TABLE skills_l3 IS 'L3 subcategories with globally unique l3_id (primary key)';
COMMENT ON TABLE skills_taxonomy IS 'L4 granular skills (~20K) with hierarchical code';


