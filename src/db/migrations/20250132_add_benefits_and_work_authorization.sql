-- Migration: Add Benefits Matrix and Work Authorization System
-- Date: 2025-02-01
-- Description: Implements benefits taxonomy, work authorization tracking, and visa sponsorship
--              for practical fit matching as specified in Proofound_Matching_Conversation.md (lines 354-386)

-- ============================================================================
-- BENEFITS TAXONOMY
-- ============================================================================

CREATE TABLE IF NOT EXISTS benefits_taxonomy (
    code TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('insurance', 'equity', 'transport', 'wellness', 'learning', 'time_off', 'financial', 'family', 'other')),
    slug TEXT UNIQUE NOT NULL,
    name_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
    description_i18n JSONB DEFAULT '{}'::jsonb,
    icon TEXT,
    display_order INTEGER NOT NULL,
    is_common BOOLEAN NOT NULL DEFAULT false, -- Frequently offered benefits
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDIVIDUAL BENEFITS PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_benefits_prefs (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    benefit_code TEXT NOT NULL REFERENCES benefits_taxonomy(code) ON DELETE CASCADE,
    importance TEXT NOT NULL CHECK (importance IN ('required', 'preferred', 'nice_to_have', 'not_important')),
    notes TEXT, -- Optional details (e.g., "Need comprehensive health for family of 4")
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, benefit_code)
);

-- ============================================================================
-- ASSIGNMENT BENEFITS OFFERED
-- ============================================================================

CREATE TABLE IF NOT EXISTS assignment_benefits_offered (
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    benefit_code TEXT NOT NULL REFERENCES benefits_taxonomy(code) ON DELETE CASCADE,
    details TEXT, -- Specific details (e.g., "90% health insurance coverage", "$10k learning budget")
    is_highlight BOOLEAN NOT NULL DEFAULT false, -- Highlight this benefit in listing
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (assignment_id, benefit_code)
);

-- ============================================================================
-- WORK AUTHORIZATION & VISA SPONSORSHIP
-- ============================================================================

-- Add work authorization fields to matching_profiles
ALTER TABLE matching_profiles ADD COLUMN IF NOT EXISTS needs_sponsorship BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE matching_profiles ADD COLUMN IF NOT EXISTS wishes_sponsorship BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE matching_profiles ADD COLUMN IF NOT EXISTS work_authorization JSONB DEFAULT '{}'::jsonb;
-- Example work_authorization structure:
-- {
--   "type": "citizen" | "permanent_resident" | "work_permit" | "student_visa" | "other",
--   "countries": ["US", "UK", "CA"],
--   "expires_at": "2026-12-31",
--   "restrictions": "Can work up to 20 hours/week during semester"
-- }

ALTER TABLE matching_profiles ADD COLUMN IF NOT EXISTS relocation_willing BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE matching_profiles ADD COLUMN IF NOT EXISTS relocation_countries TEXT[] DEFAULT '{}';
ALTER TABLE matching_profiles ADD COLUMN IF NOT EXISTS relocation_max_distance_km INTEGER;

-- Add sponsorship fields to assignments
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS can_sponsor_visa BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS sponsorship_countries TEXT[] DEFAULT '{}';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS sponsorship_details TEXT;
-- Example: "H1-B sponsorship available for US roles", "Tier 2 visa for UK"

-- Add relocation support
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS offers_relocation_support BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS relocation_package JSONB DEFAULT '{}'::jsonb;
-- Example: {"budget": 10000, "currency": "USD", "includes": ["moving_costs", "temp_housing", "flight"]}

-- ============================================================================
-- AVAILABILITY BITMAP (7x48 weekly schedule)
-- ============================================================================

-- Add 7x48 availability bitmap to matching_profiles (replacing simple availability dates)
ALTER TABLE matching_profiles ADD COLUMN IF NOT EXISTS availability_bitmap BIT(336); -- 7 days * 48 half-hours = 336 bits
-- Bit layout: Monday 00:00-00:30 = bit 0, Monday 00:30-01:00 = bit 1, ..., Sunday 23:30-00:00 = bit 335

-- Add required availability for assignments
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS required_availability_bitmap BIT(336);
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS required_availability_overlap_min NUMERIC DEFAULT 0.5 CHECK (required_availability_overlap_min BETWEEN 0 AND 1);
-- Minimum overlap required (e.g., 0.5 = 50% of required hours must overlap)

-- ============================================================================
-- COMPENSATION CURRENCY NORMALIZATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS currency_exchange_rates (
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate NUMERIC NOT NULL CHECK (rate > 0),
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    source TEXT, -- 'ecb', 'openexchangerates', 'manual'
    PRIMARY KEY (from_currency, to_currency)
);

-- Function to normalize compensation to USD for comparison
CREATE OR REPLACE FUNCTION normalize_compensation_to_usd(
    amount NUMERIC,
    currency TEXT
)
RETURNS NUMERIC AS $$
DECLARE
    rate NUMERIC;
BEGIN
    IF currency = 'USD' THEN
        RETURN amount;
    END IF;

    SELECT r.rate INTO rate
    FROM currency_exchange_rates r
    WHERE r.from_currency = currency
      AND r.to_currency = 'USD'
    ORDER BY r.last_updated DESC
    LIMIT 1;

    IF rate IS NULL THEN
        -- Fallback to 1:1 if rate not found (log warning in production)
        RETURN amount;
    END IF;

    RETURN amount * rate;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Benefits taxonomy indexes
CREATE INDEX IF NOT EXISTS idx_benefits_taxonomy_category ON benefits_taxonomy(category);
CREATE INDEX IF NOT EXISTS idx_benefits_taxonomy_common ON benefits_taxonomy(is_common);

-- Benefits preferences indexes
CREATE INDEX IF NOT EXISTS idx_profile_benefits_user ON profile_benefits_prefs(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_benefits_benefit ON profile_benefits_prefs(benefit_code);
CREATE INDEX IF NOT EXISTS idx_profile_benefits_importance ON profile_benefits_prefs(importance);

-- Assignment benefits indexes
CREATE INDEX IF NOT EXISTS idx_assignment_benefits_assignment ON assignment_benefits_offered(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_benefits_benefit ON assignment_benefits_offered(benefit_code);
CREATE INDEX IF NOT EXISTS idx_assignment_benefits_highlight ON assignment_benefits_offered(is_highlight);

-- Work authorization indexes
CREATE INDEX IF NOT EXISTS idx_matching_profiles_needs_sponsorship ON matching_profiles(needs_sponsorship);
CREATE INDEX IF NOT EXISTS idx_matching_profiles_relocation ON matching_profiles(relocation_willing);
CREATE INDEX IF NOT EXISTS idx_assignments_can_sponsor ON assignments(can_sponsor_visa);
CREATE INDEX IF NOT EXISTS idx_assignments_relocation_support ON assignments(offers_relocation_support);

-- Currency rates index
CREATE INDEX IF NOT EXISTS idx_currency_rates_from_to ON currency_exchange_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_currency_rates_updated ON currency_exchange_rates(last_updated DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE benefits_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_benefits_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_benefits_offered ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_exchange_rates ENABLE ROW LEVEL SECURITY;

-- Benefits taxonomy is public read-only
CREATE POLICY "Public read access to benefits taxonomy" ON benefits_taxonomy
    FOR SELECT USING (true);

-- Users can manage their own benefit preferences
CREATE POLICY "Users can view their own benefits prefs" ON profile_benefits_prefs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own benefits prefs" ON profile_benefits_prefs
    FOR ALL USING (auth.uid() = user_id);

-- Assignment benefits visible via assignment access
CREATE POLICY "Public read access to assignment benefits" ON assignment_benefits_offered
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments a
            WHERE a.id = assignment_id AND a.status IN ('active', 'paused')
        )
    );

CREATE POLICY "Org members can manage assignment benefits" ON assignment_benefits_offered
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assignments a
            INNER JOIN organization_members om ON a.org_id = om.org_id
            WHERE a.id = assignment_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- Currency rates are public read-only
CREATE POLICY "Public read access to currency rates" ON currency_exchange_rates
    FOR SELECT USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate availability overlap (bitmap intersection)
CREATE OR REPLACE FUNCTION calculate_availability_overlap(
    candidate_bitmap BIT(336),
    required_bitmap BIT(336)
)
RETURNS NUMERIC AS $$
DECLARE
    overlap_bits INTEGER;
    required_bits INTEGER;
BEGIN
    IF candidate_bitmap IS NULL OR required_bitmap IS NULL THEN
        RETURN 1.0; -- No constraint = full overlap
    END IF;

    -- Count 1s in required bitmap
    required_bits := bit_count(required_bitmap);

    IF required_bits = 0 THEN
        RETURN 1.0; -- No hours required = full overlap
    END IF;

    -- Count 1s in (candidate AND required)
    overlap_bits := bit_count(candidate_bitmap & required_bitmap);

    RETURN overlap_bits::NUMERIC / required_bits::NUMERIC;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate benefits match ratio
CREATE OR REPLACE FUNCTION calculate_benefits_match(
    p_user_id UUID,
    p_assignment_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
    required_count INTEGER;
    matched_count INTEGER;
BEGIN
    -- Count required benefits from user preferences
    SELECT COUNT(*)
    INTO required_count
    FROM profile_benefits_prefs
    WHERE user_id = p_user_id
      AND importance = 'required';

    IF required_count = 0 THEN
        RETURN 1.0; -- No required benefits = perfect match
    END IF;

    -- Count how many required benefits are offered
    SELECT COUNT(*)
    INTO matched_count
    FROM profile_benefits_prefs pbp
    INNER JOIN assignment_benefits_offered abo ON pbp.benefit_code = abo.benefit_code
    WHERE pbp.user_id = p_user_id
      AND pbp.importance = 'required'
      AND abo.assignment_id = p_assignment_id;

    RETURN matched_count::NUMERIC / required_count::NUMERIC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check work authorization compatibility
CREATE OR REPLACE FUNCTION check_work_auth_compatible(
    p_user_id UUID,
    p_assignment_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    needs_sponsorship BOOLEAN;
    can_sponsor BOOLEAN;
    user_countries TEXT[];
    sponsor_countries TEXT[];
BEGIN
    -- Get user's sponsorship need
    SELECT mp.needs_sponsorship
    INTO needs_sponsorship
    FROM matching_profiles mp
    WHERE mp.profile_id = p_user_id;

    -- If user doesn't need sponsorship, always compatible
    IF NOT needs_sponsorship THEN
        RETURN true;
    END IF;

    -- Check if assignment can sponsor
    SELECT a.can_sponsor_visa, a.sponsorship_countries
    INTO can_sponsor, sponsor_countries
    FROM assignments a
    WHERE a.id = p_assignment_id;

    -- If assignment can't sponsor, not compatible
    IF NOT can_sponsor THEN
        RETURN false;
    END IF;

    -- If no country restrictions, compatible
    IF sponsor_countries IS NULL OR array_length(sponsor_countries, 1) IS NULL THEN
        RETURN true;
    END IF;

    -- Check if user's work auth countries overlap with sponsorship countries
    SELECT (mp.work_authorization->'countries')::TEXT[]
    INTO user_countries
    FROM matching_profiles mp
    WHERE mp.profile_id = p_user_id;

    IF user_countries IS NULL THEN
        RETURN true; -- No restrictions = compatible
    END IF;

    -- Check overlap
    RETURN EXISTS (
        SELECT 1
        FROM unnest(user_countries) AS uc
        WHERE uc = ANY(sponsor_countries)
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate compensation match score (sigmoid)
CREATE OR REPLACE FUNCTION calculate_compensation_score(
    candidate_comp_target NUMERIC,
    candidate_currency TEXT,
    assignment_budget_min NUMERIC,
    assignment_budget_max NUMERIC,
    assignment_currency TEXT,
    k NUMERIC DEFAULT 10.0 -- Steepness of sigmoid
)
RETURNS NUMERIC AS $$
DECLARE
    target_usd NUMERIC;
    budget_mid_usd NUMERIC;
    diff_ratio NUMERIC;
BEGIN
    -- Normalize to USD
    target_usd := normalize_compensation_to_usd(candidate_comp_target, candidate_currency);
    budget_mid_usd := normalize_compensation_to_usd(
        (assignment_budget_min + assignment_budget_max) / 2.0,
        assignment_currency
    );

    IF budget_mid_usd = 0 THEN
        RETURN 1.0; -- No budget constraint
    END IF;

    -- Calculate difference ratio
    diff_ratio := (budget_mid_usd - target_usd) / budget_mid_usd;

    -- Sigmoid: 1 / (1 + exp(-k * diff_ratio))
    -- Positive diff_ratio (budget > target) → score approaches 1
    -- Negative diff_ratio (target > budget) → score approaches 0
    RETURN 1.0 / (1.0 + EXP(-k * diff_ratio));
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- SEED DATA (Common Benefits)
-- ============================================================================

INSERT INTO benefits_taxonomy (code, category, slug, name_i18n, description_i18n, display_order, is_common) VALUES
-- Insurance
('health_insurance', 'insurance', 'health-insurance', '{"en": "Health Insurance", "sv": "Sjukförsäkring"}', '{"en": "Medical coverage for employee and family", "sv": "Medicinsk täckning för anställd och familj"}', 1, true),
('dental_insurance', 'insurance', 'dental-insurance', '{"en": "Dental Insurance", "sv": "Tandförsäkring"}', '{"en": "Dental coverage", "sv": "Tandvård"}', 2, true),
('vision_insurance', 'insurance', 'vision-insurance', '{"en": "Vision Insurance", "sv": "Synförsäkring"}', '{"en": "Eye care coverage", "sv": "Ögonvård"}', 3, true),
('life_insurance', 'insurance', 'life-insurance', '{"en": "Life Insurance", "sv": "Livförsäkring"}', '{"en": "Life insurance policy", "sv": "Livförsäkring"}', 4, true),

-- Equity
('stock_options', 'equity', 'stock-options', '{"en": "Stock Options", "sv": "Aktieoptioner"}', '{"en": "Equity compensation through stock options", "sv": "Aktiebaserad kompensation"}', 5, true),
('rsus', 'equity', 'rsus', '{"en": "RSUs", "sv": "RSU:er"}', '{"en": "Restricted Stock Units", "sv": "Bundna aktier"}', 6, false),
('profit_sharing', 'equity', 'profit-sharing', '{"en": "Profit Sharing", "sv": "Vinstdelning"}', '{"en": "Share in company profits", "sv": "Andel i företagets vinst"}', 7, false),

-- Transport
('company_car', 'transport', 'company-car', '{"en": "Company Car", "sv": "Tjänstebil"}', '{"en": "Company-provided vehicle", "sv": "Företagsbil"}', 8, false),
('commute_allowance', 'transport', 'commute-allowance', '{"en": "Commute Allowance", "sv": "Pendlingsersättning"}', '{"en": "Monthly commuting stipend", "sv": "Månatlig pendlingsersättning"}', 9, true),
('parking', 'transport', 'parking', '{"en": "Parking", "sv": "Parkering"}', '{"en": "Free parking at office", "sv": "Gratis parkering vid kontoret"}', 10, true),

-- Wellness
('gym_membership', 'wellness', 'gym-membership', '{"en": "Gym Membership", "sv": "Gymmedlemskap"}', '{"en": "Fitness center access or reimbursement", "sv": "Tillgång till gym eller ersättning"}', 11, true),
('mental_health', 'wellness', 'mental-health', '{"en": "Mental Health Support", "sv": "Psykisk hälsa"}', '{"en": "Counseling and mental health services", "sv": "Rådgivning och psykisk hälsovård"}', 12, true),
('wellness_stipend', 'wellness', 'wellness-stipend', '{"en": "Wellness Stipend", "sv": "Friskvårdsbidrag"}', '{"en": "Monthly wellness budget", "sv": "Månatlig friskvårdsbudget"}', 13, false),

-- Learning
('learning_budget', 'learning', 'learning-budget', '{"en": "Learning & Development Budget", "sv": "Utbildningsbudget"}', '{"en": "Annual budget for courses and conferences", "sv": "Årlig budget för kurser och konferenser"}', 14, true),
('conference_attendance', 'learning', 'conference-attendance', '{"en": "Conference Attendance", "sv": "Konferensdeltagande"}', '{"en": "Paid attendance at industry conferences", "sv": "Betald deltagande på branschkonferenser"}', 15, true),
('tuition_reimbursement', 'learning', 'tuition-reimbursement', '{"en": "Tuition Reimbursement", "sv": "Studieavgiftsersättning"}', '{"en": "Reimbursement for degree programs", "sv": "Ersättning för utbildningsprogram"}', 16, false),

-- Time Off
('flexible_pto', 'time_off', 'flexible-pto', '{"en": "Flexible PTO", "sv": "Flexibel semester"}', '{"en": "Unlimited or flexible paid time off", "sv": "Obegränsad eller flexibel betald ledighet"}', 17, true),
('parental_leave', 'time_off', 'parental-leave', '{"en": "Parental Leave", "sv": "Föräldraledighet"}', '{"en": "Paid leave for new parents", "sv": "Betald föräldraledighet"}', 18, true),
('sabbatical', 'time_off', 'sabbatical', '{"en": "Sabbatical", "sv": "Sabbatsår"}', '{"en": "Extended leave after tenure", "sv": "Förlängd ledighet efter tjänstgöringstid"}', 19, false),

-- Financial
('retirement_401k', 'financial', 'retirement-401k', '{"en": "401(k) / Pension", "sv": "Pension"}', '{"en": "Retirement savings with employer match", "sv": "Pensionssparande med arbetsgivaravgift"}', 20, true),
('bonuses', 'financial', 'bonuses', '{"en": "Performance Bonuses", "sv": "Prestationsbonusar"}', '{"en": "Annual or quarterly performance bonuses", "sv": "Årliga eller kvartalsvisa prestationsbonusar"}', 21, true),
('relocation_package', 'financial', 'relocation-package', '{"en": "Relocation Package", "sv": "Flyttpaket"}', '{"en": "Financial support for relocation", "sv": "Ekonomiskt stöd vid flytt"}', 22, false),

-- Family
('childcare_support', 'family', 'childcare-support', '{"en": "Childcare Support", "sv": "Barnomsorgsstöd"}', '{"en": "Childcare stipend or on-site daycare", "sv": "Barnomsorgsbidrag eller förskola på plats"}', 23, false),
('family_health', 'family', 'family-health', '{"en": "Family Health Coverage", "sv": "Familjehälsotäckning"}', '{"en": "Health insurance for family members", "sv": "Sjukförsäkring för familjemedlemmar"}', 24, true)
ON CONFLICT (code) DO NOTHING;

-- Seed common currency rates (USD as base)
INSERT INTO currency_exchange_rates (from_currency, to_currency, rate, source) VALUES
('USD', 'USD', 1.0, 'manual'),
('EUR', 'USD', 1.10, 'manual'), -- Update with real rates
('GBP', 'USD', 1.27, 'manual'),
('SEK', 'USD', 0.096, 'manual'),
('CAD', 'USD', 0.74, 'manual'),
('AUD', 'USD', 0.67, 'manual')
ON CONFLICT (from_currency, to_currency) DO UPDATE SET rate = EXCLUDED.rate, last_updated = NOW();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE benefits_taxonomy IS 'Codified list of employment benefits (insurance, equity, transport, wellness, etc.)';
COMMENT ON TABLE profile_benefits_prefs IS 'Individual preferences for benefits with importance levels';
COMMENT ON TABLE assignment_benefits_offered IS 'Benefits offered by assignments/organizations';
COMMENT ON TABLE currency_exchange_rates IS 'Exchange rates for compensation normalization (updated periodically)';

COMMENT ON COLUMN matching_profiles.availability_bitmap IS '7x48 bitmap (336 bits): Monday 00:00 = bit 0, Sunday 23:30 = bit 335';
COMMENT ON COLUMN matching_profiles.work_authorization IS 'JSONB: {type, countries[], expires_at, restrictions}';
COMMENT ON COLUMN assignments.required_availability_bitmap IS '7x48 bitmap of required work hours';
COMMENT ON COLUMN assignments.required_availability_overlap_min IS 'Minimum overlap required (0-1, e.g., 0.5 = 50%)';

COMMENT ON FUNCTION calculate_availability_overlap IS 'Returns overlap ratio (0-1) between candidate and required availability bitmaps';
COMMENT ON FUNCTION calculate_benefits_match IS 'Returns ratio (0-1) of required benefits that are offered';
COMMENT ON FUNCTION check_work_auth_compatible IS 'Returns true if work authorization/sponsorship is compatible';
COMMENT ON FUNCTION calculate_compensation_score IS 'Returns sigmoid score (0-1) based on comp target vs budget mid';
