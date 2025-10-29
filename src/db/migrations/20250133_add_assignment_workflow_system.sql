-- Migration: Add Assignment Workflow and Sensitive Field System
-- Date: 2025-02-02
-- Description: Implements multi-stakeholder assignment creation pipeline,
--              outcome tracking, expertise matrix, and sensitive field visibility
--              as specified in Proofound_Matching_Conversation.md (lines 388-409)

-- ============================================================================
-- ASSIGNMENT OUTCOMES & BUSINESS VALUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS assignment_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    outcome_type TEXT NOT NULL CHECK (outcome_type IN ('continuous', 'milestone')),

    -- Outcome description
    title TEXT NOT NULL,
    description TEXT,
    success_criteria TEXT NOT NULL, -- Clear definition of success

    -- Measurable metrics
    metrics JSONB DEFAULT '[]'::jsonb,
    -- Example: [
    --   {"name": "New sales leads", "target": 10000, "unit": "leads", "current": 0},
    --   {"name": "Revenue increase", "target": 50000, "unit": "USD", "current": 0}
    -- ]

    -- Timing
    target_date DATE,
    is_blocking BOOLEAN NOT NULL DEFAULT false, -- Must complete before next milestone

    -- Progress tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled')),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
    completed_at TIMESTAMP,

    -- Linkage
    depends_on UUID REFERENCES assignment_outcomes(id) ON DELETE SET NULL,
    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Business value tracking for assignment
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS business_value TEXT;
-- Example: "Increase sales outreach capacity", "Achieve ISO 27001 certification", "Launch MVP within Q1"

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS expected_impact TEXT;
-- High-level impact statement

-- ============================================================================
-- EXPERTISE MATRIX (Multi-Stakeholder Skill Requirements)
-- ============================================================================

CREATE TABLE IF NOT EXISTS assignment_expertise_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,

    -- Stakeholder who added this requirement
    stakeholder_role TEXT NOT NULL, -- 'hr', 'tech_lead', 'ceo', 'hiring_manager', 'custom'
    stakeholder_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    custom_role_name TEXT, -- If stakeholder_role = 'custom'

    -- Skill requirement
    skill_code TEXT NOT NULL REFERENCES skills_taxonomy(code) ON DELETE CASCADE,
    min_level INTEGER NOT NULL CHECK (min_level BETWEEN 1 AND 5), -- C1-C5
    weight NUMERIC NOT NULL DEFAULT 1.0 CHECK (weight > 0),
    is_required BOOLEAN NOT NULL DEFAULT true, -- vs nice-to-have

    -- Linkage to outcomes
    linked_outcome_id UUID REFERENCES assignment_outcomes(id) ON DELETE SET NULL,
    outcome_rationale TEXT, -- Why this skill is needed for this outcome

    -- Context
    notes TEXT, -- Additional context from stakeholder
    examples TEXT, -- Example tasks requiring this skill

    -- Approval workflow
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMP,
    approval_notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ASSIGNMENT CREATION PIPELINE (Multi-Stakeholder Workflow)
-- ============================================================================

CREATE TABLE IF NOT EXISTS assignment_creation_pipeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,

    -- Pipeline step
    step_order INTEGER NOT NULL CHECK (step_order > 0),
    step_name TEXT NOT NULL, -- 'business_value', 'outcomes', 'cultural_fit', 'technical_skills', 'review', etc.
    stakeholder_role TEXT NOT NULL, -- Who completes this step
    stakeholder_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'rejected')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Data collected in this step
    step_data JSONB DEFAULT '{}'::jsonb,
    -- Example for 'cultural_fit' step:
    -- {
    --   "values_required": ["transparency", "sustainability"],
    --   "causes_required": ["climate_action"],
    --   "work_style": "collaborative"
    -- }

    -- Feedback
    notes TEXT,
    rejection_reason TEXT,

    -- Notifications
    notified_at TIMESTAMP,
    reminder_sent_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (assignment_id, step_order)
);

-- ============================================================================
-- SENSITIVE FIELD VISIBILITY SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS assignment_field_visibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,

    -- Field identification
    field_name TEXT NOT NULL, -- e.g., 'comp_max', 'org_internal_code', 'hiring_manager_notes'
    field_category TEXT CHECK (field_category IN ('compensation', 'internal', 'strategic', 'personal', 'other')),

    -- Visibility rules
    visibility_level TEXT NOT NULL CHECK (visibility_level IN (
        'public',                    -- Visible to all (in listings)
        'post_match',                -- Visible after mutual interest
        'post_conversation_start',   -- Visible after conversation starts
        'hidden_used_for_matching',  -- Used in algorithm but never shown to candidates
        'internal_only'              -- Only visible to org members
    )),

    -- Staged reveal (for post_match visibility)
    reveal_stage INTEGER CHECK (reveal_stage IN (1, 2)),
    -- Stage 1: Masked identity, Stage 2: Full reveal

    -- Conditional visibility
    conditional_rules JSONB DEFAULT '{}'::jsonb,
    -- Example: {"show_if": "candidate_score > 0.8", "hide_until": "2025-03-01"}

    -- Redaction strategy
    redaction_type TEXT CHECK (redaction_type IN ('hide', 'mask', 'generic_label')),
    generic_label TEXT, -- e.g., "Competitive salary", "Confidential requirement met"

    -- Audit
    set_by UUID NOT NULL REFERENCES profiles(id),
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (assignment_id, field_name)
);

-- Default sensitive fields for all assignments (auto-populated on assignment creation)
CREATE TABLE IF NOT EXISTS assignment_field_visibility_defaults (
    field_name TEXT PRIMARY KEY,
    field_category TEXT NOT NULL,
    default_visibility TEXT NOT NULL,
    default_redaction_type TEXT NOT NULL,
    default_generic_label TEXT,
    description TEXT,
    is_system_field BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================================
-- ASSIGNMENT CREATION WORKFLOW STATE MACHINE
-- ============================================================================

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS creation_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (creation_status IN (
        'draft',                -- Initial creation
        'pipeline_in_progress', -- Going through stakeholder steps
        'pending_review',       -- All steps done, awaiting final review
        'ready_to_publish',     -- Approved, ready to activate
        'published'             -- Active and visible to candidates
    ));

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS pipeline_completed_at TIMESTAMP;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES profiles(id);
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Assignment outcomes indexes
CREATE INDEX IF NOT EXISTS idx_assignment_outcomes_assignment ON assignment_outcomes(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_outcomes_type ON assignment_outcomes(outcome_type);
CREATE INDEX IF NOT EXISTS idx_assignment_outcomes_status ON assignment_outcomes(status);
CREATE INDEX IF NOT EXISTS idx_assignment_outcomes_depends ON assignment_outcomes(depends_on);

-- Expertise matrix indexes
CREATE INDEX IF NOT EXISTS idx_expertise_matrix_assignment ON assignment_expertise_matrix(assignment_id);
CREATE INDEX IF NOT EXISTS idx_expertise_matrix_skill_code ON assignment_expertise_matrix(skill_code);
CREATE INDEX IF NOT EXISTS idx_expertise_matrix_stakeholder ON assignment_expertise_matrix(stakeholder_user_id);
CREATE INDEX IF NOT EXISTS idx_expertise_matrix_outcome ON assignment_expertise_matrix(linked_outcome_id);

-- Pipeline indexes
CREATE INDEX IF NOT EXISTS idx_creation_pipeline_assignment ON assignment_creation_pipeline(assignment_id);
CREATE INDEX IF NOT EXISTS idx_creation_pipeline_stakeholder ON assignment_creation_pipeline(stakeholder_user_id);
CREATE INDEX IF NOT EXISTS idx_creation_pipeline_status ON assignment_creation_pipeline(status);
CREATE INDEX IF NOT EXISTS idx_creation_pipeline_step_order ON assignment_creation_pipeline(assignment_id, step_order);

-- Field visibility indexes
CREATE INDEX IF NOT EXISTS idx_field_visibility_assignment ON assignment_field_visibility(assignment_id);
CREATE INDEX IF NOT EXISTS idx_field_visibility_level ON assignment_field_visibility(visibility_level);
CREATE INDEX IF NOT EXISTS idx_field_visibility_field_name ON assignment_field_visibility(field_name);

-- Assignment creation status index
CREATE INDEX IF NOT EXISTS idx_assignments_creation_status ON assignments(creation_status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE assignment_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_expertise_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_creation_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_field_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_field_visibility_defaults ENABLE ROW LEVEL SECURITY;

-- Outcomes visible via assignment access
CREATE POLICY "Public read for published assignment outcomes" ON assignment_outcomes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments a
            WHERE a.id = assignment_id
              AND a.status IN ('active', 'paused')
              AND a.creation_status = 'published'
        )
    );

CREATE POLICY "Org members can manage assignment outcomes" ON assignment_outcomes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assignments a
            INNER JOIN organization_members om ON a.org_id = om.org_id
            WHERE a.id = assignment_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- Expertise matrix visible via assignment access
CREATE POLICY "Public read for published expertise matrix" ON assignment_expertise_matrix
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments a
            WHERE a.id = assignment_id
              AND a.status IN ('active', 'paused')
              AND a.creation_status = 'published'
        )
    );

CREATE POLICY "Org members can manage expertise matrix" ON assignment_expertise_matrix
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assignments a
            INNER JOIN organization_members om ON a.org_id = om.org_id
            WHERE a.id = assignment_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- Pipeline visible to org members and assigned stakeholders
CREATE POLICY "Org members and stakeholders can view pipeline" ON assignment_creation_pipeline
    FOR SELECT USING (
        auth.uid() = stakeholder_user_id
        OR EXISTS (
            SELECT 1 FROM assignments a
            INNER JOIN organization_members om ON a.org_id = om.org_id
            WHERE a.id = assignment_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Stakeholders can update their pipeline steps" ON assignment_creation_pipeline
    FOR UPDATE USING (
        auth.uid() = stakeholder_user_id
        OR EXISTS (
            SELECT 1 FROM assignments a
            INNER JOIN organization_members om ON a.org_id = om.org_id
            WHERE a.id = assignment_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin')
        )
    );

-- Field visibility: org members only
CREATE POLICY "Org members can manage field visibility" ON assignment_field_visibility
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assignments a
            INNER JOIN organization_members om ON a.org_id = om.org_id
            WHERE a.id = assignment_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- Defaults are public read-only
CREATE POLICY "Public read access to visibility defaults" ON assignment_field_visibility_defaults
    FOR SELECT USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get current pipeline step for assignment
CREATE OR REPLACE FUNCTION get_current_pipeline_step(p_assignment_id UUID)
RETURNS assignment_creation_pipeline AS $$
DECLARE
    current_step assignment_creation_pipeline;
BEGIN
    SELECT *
    INTO current_step
    FROM assignment_creation_pipeline
    WHERE assignment_id = p_assignment_id
      AND status IN ('pending', 'in_progress')
    ORDER BY step_order ASC
    LIMIT 1;

    RETURN current_step;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if assignment pipeline is complete
CREATE OR REPLACE FUNCTION is_pipeline_complete(p_assignment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    incomplete_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO incomplete_count
    FROM assignment_creation_pipeline
    WHERE assignment_id = p_assignment_id
      AND status NOT IN ('completed', 'skipped');

    RETURN incomplete_count = 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to auto-populate sensitive field visibility on assignment creation
CREATE OR REPLACE FUNCTION auto_populate_field_visibility()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default visibility rules for all system fields
    INSERT INTO assignment_field_visibility (
        assignment_id,
        field_name,
        field_category,
        visibility_level,
        redaction_type,
        generic_label,
        set_by
    )
    SELECT
        NEW.id,
        d.field_name,
        d.field_category,
        d.default_visibility,
        d.default_redaction_type,
        d.default_generic_label,
        NEW.created_by
    FROM assignment_field_visibility_defaults d
    WHERE d.is_system_field = true
    ON CONFLICT (assignment_id, field_name) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_populate_field_visibility
    AFTER INSERT ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_field_visibility();

-- Function to update assignment creation_status based on pipeline
CREATE OR REPLACE FUNCTION update_assignment_creation_status()
RETURNS TRIGGER AS $$
DECLARE
    assignment_id UUID;
    is_complete BOOLEAN;
BEGIN
    -- Get assignment_id from the updated pipeline step
    IF TG_OP = 'DELETE' THEN
        assignment_id := OLD.assignment_id;
    ELSE
        assignment_id := NEW.assignment_id;
    END IF;

    -- Check if pipeline is complete
    is_complete := is_pipeline_complete(assignment_id);

    IF is_complete THEN
        UPDATE assignments
        SET
            creation_status = 'pending_review',
            pipeline_completed_at = NOW(),
            updated_at = NOW()
        WHERE id = assignment_id
          AND creation_status = 'pipeline_in_progress';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_assignment_creation_status
    AFTER UPDATE OF status ON assignment_creation_pipeline
    FOR EACH ROW
    EXECUTE FUNCTION update_assignment_creation_status();

-- ============================================================================
-- SEED DATA (Default Sensitive Fields)
-- ============================================================================

INSERT INTO assignment_field_visibility_defaults (field_name, field_category, default_visibility, default_redaction_type, default_generic_label, description, is_system_field) VALUES
-- Compensation fields
('comp_max', 'compensation', 'hidden_used_for_matching', 'generic_label', 'Competitive salary', 'Maximum compensation budget', true),
('comp_min', 'compensation', 'post_match', 'mask', 'Salary range available after mutual interest', 'Minimum compensation budget', true),
('bonus_structure', 'compensation', 'post_conversation_start', 'hide', NULL, 'Performance bonus details', true),

-- Internal fields
('hiring_manager_notes', 'internal', 'internal_only', 'hide', NULL, 'Internal notes from hiring manager', true),
('org_internal_code', 'internal', 'internal_only', 'hide', NULL, 'Internal job requisition code', true),
('budget_approval_status', 'internal', 'internal_only', 'hide', NULL, 'Budget approval workflow status', true),

-- Strategic fields
('replacement_role', 'strategic', 'hidden_used_for_matching', 'hide', NULL, 'Whether this replaces an existing role', true),
('growth_plans', 'strategic', 'post_conversation_start', 'hide', NULL, 'Future growth plans for this role', true),
('team_expansion', 'strategic', 'hidden_used_for_matching', 'hide', NULL, 'Part of larger team expansion', true),

-- Personal fields (for hiring manager)
('hiring_manager_contact', 'personal', 'post_match', 'mask', 'Contact available after mutual interest', 'Direct contact for hiring manager', true),
('interview_process_details', 'personal', 'post_match', 'hide', NULL, 'Detailed interview process', true)
ON CONFLICT (field_name) DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE assignment_outcomes IS 'Expected outcomes and milestones for assignments (continuous or discrete)';
COMMENT ON TABLE assignment_expertise_matrix IS 'Multi-stakeholder skill requirements with outcome linkage and rationale';
COMMENT ON TABLE assignment_creation_pipeline IS 'State machine for multi-stakeholder assignment creation workflow';
COMMENT ON TABLE assignment_field_visibility IS 'Per-assignment visibility rules for sensitive fields';
COMMENT ON TABLE assignment_field_visibility_defaults IS 'Default visibility rules for system fields (applied on creation)';

COMMENT ON COLUMN assignment_outcomes.outcome_type IS 'continuous: ongoing metric (e.g., revenue) | milestone: one-time goal (e.g., launch)';
COMMENT ON COLUMN assignment_expertise_matrix.stakeholder_role IS 'Who added this requirement: hr, tech_lead, ceo, hiring_manager, custom';
COMMENT ON COLUMN assignment_field_visibility.visibility_level IS 'Controls when field is visible: public > post_match > hidden_used_for_matching > internal_only';
COMMENT ON COLUMN assignments.creation_status IS 'Workflow: draft > pipeline_in_progress > pending_review > ready_to_publish > published';

COMMENT ON FUNCTION get_current_pipeline_step IS 'Returns next pending/in_progress pipeline step for assignment';
COMMENT ON FUNCTION is_pipeline_complete IS 'Returns true if all pipeline steps are completed or skipped';
COMMENT ON FUNCTION auto_populate_field_visibility IS 'Trigger: auto-creates visibility rules from defaults on assignment insert';
COMMENT ON FUNCTION update_assignment_creation_status IS 'Trigger: updates creation_status to pending_review when pipeline completes';
