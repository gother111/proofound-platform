-- Migration: Extend Organization Profile to match Figma Design
-- Created: 2025-01-30
-- Description: Adds comprehensive organization profile fields as shown in Figma empty state design

-- Add organization business details
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS vision TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS organization_size TEXT CHECK (organization_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001+')),
  ADD COLUMN IF NOT EXISTS impact_area TEXT,
  ADD COLUMN IF NOT EXISTS legal_form TEXT CHECK (legal_form IN ('sole_proprietorship', 'partnership', 'llc', 'corporation', 'nonprofit', 'cooperative', 'benefit_corporation', 'other')),
  ADD COLUMN IF NOT EXISTS founded_date DATE,
  ADD COLUMN IF NOT EXISTS registration_country TEXT,
  ADD COLUMN IF NOT EXISTS registration_region TEXT,
  ADD COLUMN IF NOT EXISTS organization_number TEXT,
  ADD COLUMN IF NOT EXISTS locations TEXT[], -- Array of location strings
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add organization values (similar to individual profiles)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS values JSONB; -- Array of {icon: string, label: string, description: string}

-- Add ownership and control structure
CREATE TABLE IF NOT EXISTS organization_ownership (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('individual', 'organization', 'collective', 'government')),
  entity_name TEXT NOT NULL,
  ownership_percentage NUMERIC(5, 2), -- Percentage of ownership (0.00 to 100.00)
  control_type TEXT NOT NULL CHECK (control_type IN ('voting_rights', 'board_seat', 'veto_power', 'management', 'other')),
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add licenses and certifications
CREATE TABLE IF NOT EXISTS organization_certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  certification_type TEXT NOT NULL CHECK (certification_type IN ('license', 'certification', 'accreditation', 'award')),
  name TEXT NOT NULL, -- e.g., "B Corp", "ISO 9001", "Fair Trade"
  issuer TEXT NOT NULL, -- e.g., "B Lab", "ISO"
  issued_date DATE,
  expiry_date DATE,
  credential_id TEXT,
  credential_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add strategic projects
CREATE TABLE IF NOT EXISTS organization_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_created TEXT NOT NULL,
  business_value TEXT NOT NULL,
  outcomes TEXT NOT NULL, -- Measurable results
  start_date DATE NOT NULL,
  end_date DATE, -- NULL for ongoing projects
  status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'completed', 'on_hold', 'cancelled')) DEFAULT 'active',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add strategic partnerships
CREATE TABLE IF NOT EXISTS organization_partnerships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  partner_type TEXT CHECK (partner_type IN ('company', 'ngo', 'government', 'academic', 'network', 'other')),
  partnership_scope TEXT NOT NULL, -- What the partnership involves
  impact_created TEXT NOT NULL, -- Impact achieved together
  start_date DATE NOT NULL,
  end_date DATE, -- NULL for ongoing
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'suspended')) DEFAULT 'active',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add organizational structure
CREATE TABLE IF NOT EXISTS organization_structure (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('executive_team', 'department', 'team', 'working_group')),
  name TEXT NOT NULL,
  description TEXT,
  team_size INTEGER,
  focus_area TEXT,
  parent_id UUID REFERENCES organization_structure(id) ON DELETE CASCADE, -- For hierarchical structure
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add statute/governance provisions
CREATE TABLE IF NOT EXISTS organization_statute (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  section_title TEXT NOT NULL,
  section_content TEXT NOT NULL,
  section_order INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add work culture description
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS work_culture JSONB; -- {collaboration: text, decision_making: text, learning: text, wellbeing: text, inclusion: text}

-- Add organizational goals
CREATE TABLE IF NOT EXISTS organization_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('sustainability', 'diversity', 'innovation', 'growth', 'impact', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_date DATE,
  current_progress NUMERIC(5, 2), -- Percentage (0.00 to 100.00)
  metrics TEXT, -- How progress is measured
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'achieved', 'abandoned')) DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add RLS policies for new tables
ALTER TABLE organization_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_statute ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to read public organization data
CREATE POLICY "Public organization ownership is viewable by all authenticated users"
  ON organization_ownership FOR SELECT
  USING (auth.role() = 'authenticated' AND is_public = true);

-- RLS Policy: Allow org members to read all ownership data
CREATE POLICY "Organization members can view ownership data"
  ON organization_ownership FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM organization_members
      WHERE org_id = organization_ownership.org_id
      AND status = 'active'
    )
  );

-- RLS Policy: Allow org admins/owners to manage ownership data
CREATE POLICY "Organization admins can manage ownership"
  ON organization_ownership FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM organization_members
      WHERE org_id = organization_ownership.org_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- Similar policies for other new tables (certifications, projects, etc.)
-- Public read, members read all, admins manage
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN 
    SELECT unnest(ARRAY['organization_certifications', 'organization_projects', 'organization_partnerships', 
                        'organization_structure', 'organization_statute', 'organization_goals'])
  LOOP
    EXECUTE format('
      CREATE POLICY "%s_public_read"
        ON %s FOR SELECT
        USING (auth.role() = ''authenticated'');
        
      CREATE POLICY "%s_members_manage"
        ON %s FOR ALL
        USING (
          auth.uid() IN (
            SELECT user_id FROM organization_members
            WHERE org_id = %s.org_id
            AND role IN (''owner'', ''admin'')
            AND status = ''active''
          )
        );
    ', table_name, table_name, table_name, table_name, table_name);
  END LOOP;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_ownership_org_id ON organization_ownership(org_id);
CREATE INDEX IF NOT EXISTS idx_org_certifications_org_id ON organization_certifications(org_id);
CREATE INDEX IF NOT EXISTS idx_org_projects_org_id ON organization_projects(org_id);
CREATE INDEX IF NOT EXISTS idx_org_partnerships_org_id ON organization_partnerships(org_id);
CREATE INDEX IF NOT EXISTS idx_org_structure_org_id ON organization_structure(org_id);
CREATE INDEX IF NOT EXISTS idx_org_structure_parent_id ON organization_structure(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_statute_org_id ON organization_statute(org_id);
CREATE INDEX IF NOT EXISTS idx_org_goals_org_id ON organization_goals(org_id);

-- Add updated_at trigger for new tables
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN 
    SELECT unnest(ARRAY['organization_ownership', 'organization_certifications', 'organization_projects', 
                        'organization_partnerships', 'organization_structure', 'organization_statute', 'organization_goals'])
  LOOP
    EXECUTE format('
      CREATE TRIGGER update_%s_updated_at
      BEFORE UPDATE ON %s
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    ', table_name, table_name);
  END LOOP;
END $$;

-- Comment on new columns for documentation
COMMENT ON COLUMN organizations.tagline IS 'Brief statement capturing the organization''s purpose';
COMMENT ON COLUMN organizations.vision IS 'Long-term aspiration and future the organization is working toward';
COMMENT ON COLUMN organizations.industry IS 'Primary industry or sector';
COMMENT ON COLUMN organizations.organization_size IS 'Number of employees/members';
COMMENT ON COLUMN organizations.impact_area IS 'Primary area of impact (e.g., Climate, Education, Health)';
COMMENT ON COLUMN organizations.legal_form IS 'Legal structure of the organization';
COMMENT ON COLUMN organizations.founded_date IS 'Date the organization was founded';
COMMENT ON COLUMN organizations.registration_country IS 'Country where organization is registered';
COMMENT ON COLUMN organizations.registration_region IS 'State/province/region of registration';
COMMENT ON COLUMN organizations.organization_number IS 'Official registration number';
COMMENT ON COLUMN organizations.locations IS 'Array of office locations';
COMMENT ON COLUMN organizations.values IS 'Core organizational values as JSON array';
COMMENT ON COLUMN organizations.work_culture IS 'Description of work culture aspects as JSON object';

