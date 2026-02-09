-- Migration: Add Project-Skills Linkage System
-- Date: 2025-01-31
-- Description: Implements projects table for tracking ongoing/concluded work,
--              links skills to projects for recency calculation and measurable outcomes

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    project_type TEXT NOT NULL CHECK (project_type IN ('work', 'volunteer', 'education', 'side_project', 'hobby')),
    status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'concluded', 'paused', 'archived')),

    -- Dates
    start_date DATE NOT NULL,
    end_date DATE, -- NULL if ongoing

    -- Organization/context (optional)
    organization_name TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    role_title TEXT,

    -- Outcomes & Impact
    outcomes JSONB NOT NULL DEFAULT '{}'::jsonb,

    impact_summary TEXT, -- Short description of impact

    -- Verification
    verified BOOLEAN NOT NULL DEFAULT false,
    verification_source TEXT, -- 'referee', 'employer', 'public_acknowledgment'
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES profiles(id),

    -- Artifacts
    artifacts JSONB DEFAULT '[]'::jsonb,

    -- Visibility
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'network', 'private')),

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PROJECT-SKILLS LINKAGE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill_code TEXT NOT NULL REFERENCES skills_taxonomy(code) ON DELETE CASCADE,

    -- Skill usage details
    proficiency_level INTEGER NOT NULL CHECK (proficiency_level BETWEEN 1 AND 5), -- C1-C5
    usage_frequency TEXT CHECK (usage_frequency IN ('daily', 'weekly', 'monthly', 'occasionally')),
    hours_used INTEGER, -- Total hours using this skill in this project

    -- Evidence specific to this skill in this project
    evidence_refs TEXT[], -- References to artifacts that prove this skill
    achievements TEXT, -- Specific achievements using this skill

    -- Contribution to outcomes
    outcome_contribution NUMERIC CHECK (outcome_contribution BETWEEN 0 AND 1),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (project_id, skill_code)
);

-- ============================================================================
-- UPDATE SKILLS TABLE WITH COMPUTED FIELDS
-- ============================================================================

-- Add function to compute last_used_at from projects
CREATE OR REPLACE FUNCTION compute_skill_last_used(p_user_id UUID, p_skill_code TEXT)
RETURNS TIMESTAMP AS $$
DECLARE
    last_used TIMESTAMP;
BEGIN
    SELECT COALESCE(
        MAX(
            CASE
                WHEN p.status = 'ongoing' THEN NOW()
                WHEN p.end_date IS NOT NULL THEN p.end_date::timestamp
                ELSE p.start_date::timestamp
            END
        ),
        NULL
    )
    INTO last_used
    FROM projects p
    INNER JOIN project_skills ps ON p.id = ps.project_id
    WHERE p.user_id = p_user_id
      AND ps.skill_code = p_skill_code
      AND p.status IN ('ongoing', 'concluded');

    RETURN last_used;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add function to compute recency multiplier (exp(-α * months_since_used))
CREATE OR REPLACE FUNCTION compute_skill_recency_multiplier(
    p_user_id UUID,
    p_skill_code TEXT,
    alpha NUMERIC DEFAULT 0.0578
)
RETURNS NUMERIC AS $$
DECLARE
    last_used TIMESTAMP;
    months_since NUMERIC;
BEGIN
    last_used := compute_skill_last_used(p_user_id, p_skill_code);

    IF last_used IS NULL THEN
        RETURN 0.5;
    END IF;

    months_since := EXTRACT(EPOCH FROM (NOW() - last_used)) / (30.44 * 24 * 3600);

    IF months_since < 0 THEN
        months_since := 0;
    END IF;

    RETURN EXP(-alpha * months_since);
END;
$$ LANGUAGE plpgsql STABLE;

-- Add function to compute impact score from project outcomes
CREATE OR REPLACE FUNCTION compute_skill_impact_score(p_user_id UUID, p_skill_code TEXT)
RETURNS NUMERIC AS $$
DECLARE
    avg_impact NUMERIC;
BEGIN
    SELECT COALESCE(
        AVG(ps.outcome_contribution * COALESCE((p.outcomes->>'impact_score')::NUMERIC, 0.5)),
        0
    )
    INTO avg_impact
    FROM projects p
    INNER JOIN project_skills ps ON p.id = ps.project_id
    WHERE p.user_id = p_user_id
      AND ps.skill_code = p_skill_code
      AND p.status IN ('ongoing', 'concluded');

    RETURN LEAST(avg_impact, 1.0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Add function to compute evidence strength from verifications
CREATE OR REPLACE FUNCTION compute_skill_evidence_strength(p_user_id UUID, p_skill_code TEXT)
RETURNS NUMERIC AS $$
DECLARE
    strength NUMERIC := 0;
    peer_count INTEGER;
    employer_count INTEGER;
    public_count INTEGER;
BEGIN
    SELECT
        COUNT(*) FILTER (WHERE p.verification_source = 'referee') AS peer,
        COUNT(*) FILTER (WHERE p.verification_source = 'employer') AS employer,
        COUNT(*) FILTER (WHERE p.verification_source = 'public_acknowledgment') AS public
    INTO peer_count, employer_count, public_count
    FROM projects p
    INNER JOIN project_skills ps ON p.id = ps.project_id
    WHERE p.user_id = p_user_id
      AND ps.skill_code = p_skill_code
      AND p.verified = true;

    strength := LEAST(
        0.3 * (1 - EXP(-0.5 * peer_count)) +
        0.5 * (1 - EXP(-0.5 * employer_count)) +
        0.2 * (1 - EXP(-0.5 * public_count)),
        1.0
    );

    RETURN strength;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- TRIGGER TO AUTO-UPDATE SKILL COMPUTED FIELDS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_skill_computed_fields()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE skills
    SET
        last_used_at = compute_skill_last_used(NEW.user_id, skill_code),
        recency_multiplier = compute_skill_recency_multiplier(NEW.user_id, skill_code),
        impact_score = compute_skill_impact_score(NEW.user_id, skill_code),
        evidence_strength = compute_skill_evidence_strength(NEW.user_id, skill_code),
        updated_at = NOW()
    WHERE profile_id = NEW.user_id
      AND skill_code IS NOT NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_skills_on_project_change
    AFTER INSERT OR UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_skill_computed_fields();

CREATE TRIGGER trigger_update_skills_on_project_skill_change
    AFTER INSERT OR UPDATE OR DELETE ON project_skills
    FOR EACH ROW
    EXECUTE FUNCTION update_skill_computed_fields();

-- ============================================================================
-- LINK EXISTING PROOF TABLES TO PROJECTS
-- ============================================================================

ALTER TABLE experiences ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE education ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE volunteering ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE impact_stories ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Indexes for project linkage
CREATE INDEX IF NOT EXISTS idx_experiences_project ON experiences(project_id);
CREATE INDEX IF NOT EXISTS idx_education_project ON education(project_id);
CREATE INDEX IF NOT EXISTS idx_volunteering_project ON volunteering(project_id);
CREATE INDEX IF NOT EXISTS idx_impact_stories_project ON impact_stories(project_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_projects_verified ON projects(verified);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_project_skills_project ON project_skills(project_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_skill_code ON project_skills(skill_code);
CREATE INDEX IF NOT EXISTS idx_project_skills_user_skill ON project_skills(skill_code)
    INCLUDE (project_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_skills ENABLE ROW LEVEL SECURITY;

-- Users can view their own projects
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view public projects
CREATE POLICY "Public projects are visible" ON projects
    FOR SELECT USING (visibility = 'public');

-- Users can view network projects if logged in
CREATE POLICY "Network projects visible to logged-in users" ON projects
    FOR SELECT USING (visibility = 'network' AND auth.uid() IS NOT NULL);

-- Users can create/update/delete their own projects
CREATE POLICY "Users can manage their own projects" ON projects
    FOR ALL USING (auth.uid() = user_id);

-- Project skills inherit project visibility
CREATE POLICY "Project skills visible via project" ON project_skills
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
              AND (p.user_id = auth.uid() OR p.visibility IN ('public', 'network'))
        )
    );

CREATE POLICY "Users can manage project skills" ON project_skills
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get total months of experience for a skill across all projects
CREATE OR REPLACE FUNCTION get_skill_total_months(p_user_id UUID, p_skill_code TEXT)
RETURNS INTEGER AS $$
DECLARE
    total_months INTEGER;
BEGIN
    SELECT COALESCE(
        SUM(
            EXTRACT(EPOCH FROM (
                COALESCE(p.end_date::timestamp, NOW()) - p.start_date::timestamp
            )) / (30.44 * 24 * 3600)
        )::INTEGER,
        0
    )
    INTO total_months
    FROM projects p
    INNER JOIN project_skills ps ON p.id = ps.project_id
    WHERE p.user_id = p_user_id
      AND ps.skill_code = p_skill_code
      AND p.status IN ('ongoing', 'concluded');

    RETURN total_months;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get all active (ongoing or recent) skills for a user
CREATE OR REPLACE FUNCTION get_user_active_skills(
    p_user_id UUID,
    recent_months INTEGER DEFAULT 24
)
RETURNS TABLE(
    skill_code TEXT,
    skill_name TEXT,
    last_used TIMESTAMP,
    total_projects INTEGER,
    avg_proficiency NUMERIC,
    recency_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ps.skill_code,
        (st.name_i18n->>'en')::TEXT AS skill_name,
        MAX(
            CASE
                WHEN p.status = 'ongoing' THEN NOW()
                ELSE COALESCE(p.end_date::timestamp, p.start_date::timestamp)
            END
        ) AS last_used,
        COUNT(DISTINCT p.id)::INTEGER AS total_projects,
        AVG(ps.proficiency_level) AS avg_proficiency,
        compute_skill_recency_multiplier(p_user_id, ps.skill_code) AS recency_score
    FROM projects p
    INNER JOIN project_skills ps ON p.id = ps.project_id
    INNER JOIN skills_taxonomy st ON ps.skill_code = st.code
    WHERE p.user_id = p_user_id
      AND p.status IN ('ongoing', 'concluded')
      AND (
          p.status = 'ongoing'
          OR p.end_date >= NOW() - (recent_months || ' months')::INTERVAL
      )
    GROUP BY ps.skill_code, st.name_i18n
    ORDER BY last_used DESC;
END;
$$ LANGUAGE plpgsql STABLE;
