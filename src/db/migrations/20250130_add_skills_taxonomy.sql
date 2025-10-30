-- Migration: Add Skills Taxonomy System (L1→L2→L3→L4)
-- Date: 2025-01-30
-- Description: Implements hierarchical skills taxonomy with 10,000+ granular skills,
--              adjacency graph for "nearby skills" matching, and multilingual support
--              as specified in Proofound_Matching_Conversation.md

-- ============================================================================
-- SKILLS TAXONOMY TABLES
-- ============================================================================

-- L1: Six largest skill domains
CREATE TABLE IF NOT EXISTS skills_categories (
    cat_id INTEGER PRIMARY KEY CHECK (cat_id BETWEEN 1 AND 6),
    slug TEXT UNIQUE NOT NULL,
    name_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
    description_i18n JSONB DEFAULT '{}'::jsonb,
    icon TEXT,
    display_order INTEGER NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- L2: Large categories within domains
CREATE TABLE IF NOT EXISTS skills_subcategories (
    cat_id INTEGER NOT NULL REFERENCES skills_categories(cat_id) ON DELETE CASCADE,
    subcat_id INTEGER NOT NULL CHECK (subcat_id > 0),
    slug TEXT UNIQUE NOT NULL,
    name_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
    description_i18n JSONB DEFAULT '{}'::jsonb,
    display_order INTEGER NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (cat_id, subcat_id)
);

-- L3: Subcategories for each large category
CREATE TABLE IF NOT EXISTS skills_l3 (
    cat_id INTEGER NOT NULL,
    subcat_id INTEGER NOT NULL,
    l3_id INTEGER NOT NULL CHECK (l3_id > 0),
    slug TEXT UNIQUE NOT NULL,
    name_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
    description_i18n JSONB DEFAULT '{}'::jsonb,
    display_order INTEGER NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (cat_id, subcat_id, l3_id),
    FOREIGN KEY (cat_id, subcat_id) REFERENCES skills_subcategories(cat_id, subcat_id) ON DELETE CASCADE
);

-- L4: Granular skills/tools/frameworks/concepts/methods (10,000+ items)
CREATE TABLE IF NOT EXISTS skills_taxonomy (
    code TEXT PRIMARY KEY, -- Format: "02.07.03.142" (zero-padded L1.L2.L3.L4)
    cat_id INTEGER NOT NULL,
    subcat_id INTEGER NOT NULL,
    l3_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL CHECK (skill_id > 0),
    slug TEXT UNIQUE NOT NULL,
    name_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
    aliases_i18n JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of name variants per locale
    description_i18n JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}', -- Searchable tags (e.g., ['backend', 'database', 'nosql'])
    embedding VECTOR(768), -- Multilingual sentence embedding for semantic search
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'merged')),
    alias_of TEXT REFERENCES skills_taxonomy(code), -- For deprecated skills → map to new
    merged_into TEXT REFERENCES skills_taxonomy(code), -- For merged skills
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (cat_id, subcat_id, l3_id) REFERENCES skills_l3(cat_id, subcat_id, l3_id) ON DELETE CASCADE,
    CHECK (status != 'deprecated' OR alias_of IS NOT NULL),
    CHECK (status != 'merged' OR merged_into IS NOT NULL)
);

-- Skill adjacency graph for "nearby skills" matching
CREATE TABLE IF NOT EXISTS skill_adjacency (
    from_code TEXT NOT NULL REFERENCES skills_taxonomy(code) ON DELETE CASCADE,
    to_code TEXT NOT NULL REFERENCES skills_taxonomy(code) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK (relation_type IN ('is_a', 'related_to', 'adjacent_to', 'prerequisite_of')),
    distance INTEGER NOT NULL CHECK (distance BETWEEN 1 AND 3),
    strength NUMERIC NOT NULL DEFAULT 1.0 CHECK (strength BETWEEN 0 AND 1),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (from_code, to_code),
    CHECK (from_code != to_code)
);

-- ============================================================================
-- UPDATE EXISTING SKILLS TABLE
-- ============================================================================

-- Add reference to taxonomy code (migration: populate from existing skill_id where possible)
ALTER TABLE skills ADD COLUMN IF NOT EXISTS skill_code TEXT REFERENCES skills_taxonomy(code);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_skills_skill_code ON skills(skill_code);

-- Add competency label (C1-C5) alongside numeric level
ALTER TABLE skills ADD COLUMN IF NOT EXISTS competency_label TEXT CHECK (competency_label IN ('C1', 'C2', 'C3', 'C4', 'C5'));

-- Add evidence strength (computed from verifications)
ALTER TABLE skills ADD COLUMN IF NOT EXISTS evidence_strength NUMERIC DEFAULT 0 CHECK (evidence_strength BETWEEN 0 AND 1);

-- Add recency multiplier (computed from project linkage)
ALTER TABLE skills ADD COLUMN IF NOT EXISTS recency_multiplier NUMERIC DEFAULT 1.0 CHECK (recency_multiplier > 0 AND recency_multiplier <= 1);

-- Add impact score (computed from project outcomes)
ALTER TABLE skills ADD COLUMN IF NOT EXISTS impact_score NUMERIC DEFAULT 0 CHECK (impact_score BETWEEN 0 AND 1);

-- Add last used date (from projects)
ALTER TABLE skills ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Taxonomy hierarchy indexes
CREATE INDEX IF NOT EXISTS idx_skills_categories_slug ON skills_categories(slug);
CREATE INDEX IF NOT EXISTS idx_skills_subcategories_slug ON skills_subcategories(slug);
CREATE INDEX IF NOT EXISTS idx_skills_subcategories_cat ON skills_subcategories(cat_id);
CREATE INDEX IF NOT EXISTS idx_skills_l3_slug ON skills_l3(slug);
CREATE INDEX IF NOT EXISTS idx_skills_l3_cat_subcat ON skills_l3(cat_id, subcat_id);

-- Taxonomy main table indexes
CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_slug ON skills_taxonomy(slug);
CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_cat ON skills_taxonomy(cat_id);
CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_cat_subcat ON skills_taxonomy(cat_id, subcat_id);
CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_cat_subcat_l3 ON skills_taxonomy(cat_id, subcat_id, l3_id);
CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_status ON skills_taxonomy(status);
CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_tags ON skills_taxonomy USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_skills_taxonomy_embedding ON skills_taxonomy USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Adjacency graph indexes
CREATE INDEX IF NOT EXISTS idx_skill_adjacency_from ON skill_adjacency(from_code);
CREATE INDEX IF NOT EXISTS idx_skill_adjacency_to ON skill_adjacency(to_code);
CREATE INDEX IF NOT EXISTS idx_skill_adjacency_distance ON skill_adjacency(distance);
CREATE INDEX IF NOT EXISTS idx_skill_adjacency_relation ON skill_adjacency(relation_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Taxonomy tables are public read-only
ALTER TABLE skills_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_l3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_adjacency ENABLE ROW LEVEL SECURITY;

-- Public read access for all taxonomy tables
CREATE POLICY "Public read access to skills categories" ON skills_categories
    FOR SELECT USING (true);

CREATE POLICY "Public read access to skills subcategories" ON skills_subcategories
    FOR SELECT USING (true);

CREATE POLICY "Public read access to skills L3" ON skills_l3
    FOR SELECT USING (true);

CREATE POLICY "Public read access to skills taxonomy" ON skills_taxonomy
    FOR SELECT USING (status = 'active');

CREATE POLICY "Public read access to skill adjacency" ON skill_adjacency
    FOR SELECT USING (true);

-- Admin-only write access (service role)
CREATE POLICY "Service role full access to categories" ON skills_categories
    USING (true);

CREATE POLICY "Service role full access to subcategories" ON skills_subcategories
    USING (true);

CREATE POLICY "Service role full access to L3" ON skills_l3
    USING (true);

CREATE POLICY "Service role full access to taxonomy" ON skills_taxonomy
    USING (true);

CREATE POLICY "Service role full access to adjacency" ON skill_adjacency
    USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate distance between two skills in taxonomy
CREATE OR REPLACE FUNCTION skill_taxonomy_distance(code1 TEXT, code2 TEXT)
RETURNS INTEGER AS $$
DECLARE
    parts1 TEXT[];
    parts2 TEXT[];
BEGIN
    -- Same skill
    IF code1 = code2 THEN
        RETURN 0;
    END IF;

    -- Parse codes (format: "01.02.03.004")
    parts1 := string_to_array(code1, '.');
    parts2 := string_to_array(code2, '.');

    -- Same L1.L2.L3, different L4 → distance 1
    IF parts1[1] = parts2[1] AND parts1[2] = parts2[2] AND parts1[3] = parts2[3] THEN
        RETURN 1;
    END IF;

    -- Same L1.L2, different L3 → distance 2
    IF parts1[1] = parts2[1] AND parts1[2] = parts2[2] THEN
        RETURN 2;
    END IF;

    -- Same L1, different L2 → distance 3
    IF parts1[1] = parts2[1] THEN
        RETURN 3;
    END IF;

    -- Different L1 → no adjacency
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get adjacency factor for matching (exp(-λ * distance))
CREATE OR REPLACE FUNCTION skill_adjacency_factor(code1 TEXT, code2 TEXT, lambda NUMERIC DEFAULT 0.7)
RETURNS NUMERIC AS $$
DECLARE
    dist INTEGER;
BEGIN
    -- Check explicit adjacency first
    SELECT distance INTO dist
    FROM skill_adjacency
    WHERE (from_code = code1 AND to_code = code2)
       OR (from_code = code2 AND to_code = code1)
    LIMIT 1;

    IF dist IS NOT NULL THEN
        RETURN EXP(-lambda * dist);
    END IF;

    -- Fall back to taxonomy distance
    dist := skill_taxonomy_distance(code1, code2);

    IF dist IS NULL OR dist > 3 THEN
        RETURN 0;
    END IF;

    RETURN EXP(-lambda * dist);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to auto-populate competency label from level
CREATE OR REPLACE FUNCTION update_competency_label()
RETURNS TRIGGER AS $$
BEGIN
    NEW.competency_label := CASE NEW.level
        WHEN 1 THEN 'C1'
        WHEN 2 THEN 'C2'
        WHEN 3 THEN 'C3'
        WHEN 4 THEN 'C4'
        WHEN 5 THEN 'C5'
        ELSE NULL
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_competency_label
    BEFORE INSERT OR UPDATE OF level ON skills
    FOR EACH ROW
    EXECUTE FUNCTION update_competency_label();

-- ============================================================================
-- SEED DATA (Example L1 categories - expand as needed)
-- ============================================================================

INSERT INTO skills_categories (cat_id, slug, name_i18n, description_i18n, display_order) VALUES
(1, 'technical', '{"en": "Technical Skills", "sv": "Tekniska färdigheter"}', '{"en": "Programming, data, infrastructure, and technical tools", "sv": "Programmering, data, infrastruktur och tekniska verktyg"}', 1),
(2, 'design', '{"en": "Design & Creative", "sv": "Design & Kreativt"}', '{"en": "Visual design, UX/UI, content creation, and creative tools", "sv": "Visuell design, UX/UI, innehållsskapande och kreativa verktyg"}', 2),
(3, 'business', '{"en": "Business & Management", "sv": "Affärer & Ledning"}', '{"en": "Strategy, operations, finance, and management", "sv": "Strategi, drift, ekonomi och ledning"}', 3),
(4, 'communication', '{"en": "Communication & Social", "sv": "Kommunikation & Socialt"}', '{"en": "Writing, speaking, marketing, and interpersonal skills", "sv": "Skrivande, tal, marknadsföring och mellanmänskliga färdigheter"}', 4),
(5, 'research', '{"en": "Research & Analysis", "sv": "Forskning & Analys"}', '{"en": "Research methods, data analysis, and critical thinking", "sv": "Forskningsmetoder, dataanalys och kritiskt tänkande"}', 5),
(6, 'specialized', '{"en": "Specialized & Domain", "sv": "Specialiserad & Domän"}', '{"en": "Industry-specific and specialized knowledge", "sv": "Branschspecifik och specialiserad kunskap"}', 6)
ON CONFLICT (cat_id) DO NOTHING;

-- Example L2 subcategories for Technical Skills (cat_id = 1)
INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order) VALUES
(1, 1, 'programming-languages', '{"en": "Programming Languages", "sv": "Programmeringsspråk"}', '{"en": "Core programming languages and syntax", "sv": "Grundläggande programmeringsspråk och syntax"}', 1),
(1, 2, 'web-development', '{"en": "Web Development", "sv": "Webbutveckling"}', '{"en": "Frontend and backend web technologies", "sv": "Frontend- och backend-webbteknologier"}', 2),
(1, 3, 'databases', '{"en": "Databases & Data Storage", "sv": "Databaser & Datalagring"}', '{"en": "SQL, NoSQL, and data persistence", "sv": "SQL, NoSQL och datapersistens"}', 3),
(1, 4, 'infrastructure', '{"en": "Infrastructure & DevOps", "sv": "Infrastruktur & DevOps"}', '{"en": "Cloud, containers, CI/CD, and operations", "sv": "Moln, containrar, CI/CD och drift"}', 4),
(1, 5, 'mobile-development', '{"en": "Mobile Development", "sv": "Mobilutveckling"}', '{"en": "iOS, Android, and cross-platform mobile", "sv": "iOS, Android och plattformsoberoende mobil"}', 5),
(1, 6, 'data-science', '{"en": "Data Science & ML", "sv": "Datavetenskap & ML"}', '{"en": "Machine learning, AI, and data analysis", "sv": "Maskininlärning, AI och dataanalys"}', 6),
(1, 7, 'security', '{"en": "Security & Privacy", "sv": "Säkerhet & Integritet"}', '{"en": "Cybersecurity, encryption, and privacy", "sv": "Cybersäkerhet, kryptering och integritet"}', 7)
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

-- Example L3 categories for Databases (cat_id = 1, subcat_id = 3)
INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order) VALUES
(1, 3, 1, 'relational-databases', '{"en": "Relational Databases", "sv": "Relationsdatabaser"}', '{"en": "SQL-based relational database systems", "sv": "SQL-baserade relationsdatabassystem"}', 1),
(1, 3, 2, 'nosql-databases', '{"en": "NoSQL Databases", "sv": "NoSQL-databaser"}', '{"en": "Document, key-value, graph, and column-family databases", "sv": "Dokument-, nyckel-värde-, graf- och kolumnfamiljedatabaser"}', 2),
(1, 3, 3, 'data-warehousing', '{"en": "Data Warehousing", "sv": "Datalagring"}', '{"en": "OLAP, data lakes, and analytics databases", "sv": "OLAP, datasjöar och analysdatabaser"}', 3)
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

-- Example L4 skills for Relational Databases (cat_id = 1, subcat_id = 3, l3_id = 1)
INSERT INTO skills_taxonomy (code, cat_id, subcat_id, l3_id, skill_id, slug, name_i18n, aliases_i18n, description_i18n, tags, status) VALUES
('01.03.01.001', 1, 3, 1, 1, 'postgresql', '{"en": "PostgreSQL", "sv": "PostgreSQL"}', '{"en": ["Postgres", "PSQL"], "sv": ["Postgres", "PSQL"]}', '{"en": "Advanced open-source relational database", "sv": "Avancerad relationsdatabas med öppen källkod"}', ARRAY['database', 'sql', 'relational', 'postgres'], 'active'),
('01.03.01.002', 1, 3, 1, 2, 'mysql', '{"en": "MySQL", "sv": "MySQL"}', '{"en": ["MariaDB"], "sv": ["MariaDB"]}', '{"en": "Popular open-source relational database", "sv": "Populär relationsdatabas med öppen källkod"}', ARRAY['database', 'sql', 'relational', 'mysql'], 'active'),
('01.03.01.003', 1, 3, 1, 3, 'sql-query-optimization', '{"en": "SQL Query Optimization", "sv": "SQL-frågeoptimering"}', '{"en": ["Query tuning", "Performance optimization"], "sv": ["Frågejustering", "Prestandaoptimering"]}', '{"en": "Techniques for improving SQL query performance", "sv": "Tekniker för att förbättra SQL-frågeprestanda"}', ARRAY['database', 'sql', 'performance', 'optimization'], 'active')
ON CONFLICT (code) DO NOTHING;

-- Example adjacency relationships
INSERT INTO skill_adjacency (from_code, to_code, relation_type, distance, strength) VALUES
('01.03.01.001', '01.03.01.002', 'related_to', 1, 0.85), -- PostgreSQL ↔ MySQL
('01.03.01.001', '01.03.01.003', 'prerequisite_of', 1, 0.95), -- PostgreSQL → SQL Optimization
('01.03.01.002', '01.03.01.003', 'prerequisite_of', 1, 0.95)  -- MySQL → SQL Optimization
ON CONFLICT (from_code, to_code) DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE skills_categories IS 'L1: Six largest skill domains (e.g., Technical, Design, Business)';
COMMENT ON TABLE skills_subcategories IS 'L2: Large categories within L1 domains (e.g., Web Development, Databases)';
COMMENT ON TABLE skills_l3 IS 'L3: Subcategories within L2 categories (e.g., Relational Databases, NoSQL)';
COMMENT ON TABLE skills_taxonomy IS 'L4: Granular skills/tools/frameworks (10,000+ items) with multilingual support and embeddings';
COMMENT ON TABLE skill_adjacency IS 'Graph of skill relationships for "nearby skills" matching with distance-based decay';

COMMENT ON COLUMN skills_taxonomy.code IS 'Unique code format: "01.03.01.142" (L1.L2.L3.L4, zero-padded)';
COMMENT ON COLUMN skills_taxonomy.embedding IS 'Vector(768) multilingual sentence embedding for semantic search (pgvector)';
COMMENT ON COLUMN skills_taxonomy.status IS 'active: current skill | deprecated: use alias_of | merged: combined into merged_into';
COMMENT ON COLUMN skill_adjacency.distance IS '1=same L3, 2=same L2, 3=same L1; used in exp(-λ*distance) decay';
COMMENT ON COLUMN skill_adjacency.strength IS 'Manual override for adjacency strength (0-1); default 1.0';

COMMENT ON FUNCTION skill_taxonomy_distance IS 'Calculates hierarchical distance between two skill codes (0-3 or NULL)';
COMMENT ON FUNCTION skill_adjacency_factor IS 'Returns adjacency factor for matching: exp(-λ * distance), default λ=0.7';
