-- Update search_vector for all existing skills
-- This populates the full-text search column that was added by the migration

UPDATE skills_taxonomy
SET search_vector =
    setweight(to_tsvector('english', COALESCE(name_i18n->>'en', '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(slug, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(description_i18n->>'en', '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'D')
WHERE search_vector IS NULL OR search_vector = ''::tsvector;

-- Return count of updated rows
SELECT COUNT(*) as updated_count FROM skills_taxonomy WHERE search_vector IS NOT NULL;
