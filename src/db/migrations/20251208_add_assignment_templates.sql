-- Migration: Add assignment templates / presets by role family
-- Date: 2025-12-08
-- Purpose: Speed up assignment creation with reusable templates that prefill the 5-step flow

-- 1) Table
CREATE TABLE IF NOT EXISTS assignment_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role_family TEXT NOT NULL,
    summary TEXT,
    description TEXT,
    applies_to_steps TEXT[] NOT NULL DEFAULT '{}',
    preset_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_global BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfill new columns if table already existed
ALTER TABLE assignment_templates
    ADD COLUMN IF NOT EXISTS summary TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- 2) Indexes
CREATE INDEX IF NOT EXISTS assignment_templates_org_idx ON assignment_templates(org_id);
CREATE INDEX IF NOT EXISTS assignment_templates_role_family_idx ON assignment_templates(role_family);
CREATE INDEX IF NOT EXISTS assignment_templates_is_global_idx ON assignment_templates(is_global);

-- 3) Seed global presets (can be used by any org)
INSERT INTO assignment_templates (
    name,
    role_family,
    summary,
    description,
    applies_to_steps,
    preset_payload,
    is_global,
    status
) VALUES
(
    'Senior Backend Engineer',
    'software_engineering',
    'Reliability-focused backend engineer for distributed systems',
    'Prefills availability, latency, and observability outcomes plus core backend skills.',
    ARRAY['business_value','outcomes','weights','practicals','expertise'],
    $payload$
    {
      "role": "Senior Backend Engineer",
      "businessValue": "Improve platform reliability, unblock product teams, and reduce incidents.",
      "expectedImpact": "Cut Sev-2 incidents by 50% and improve deploy success rate within 90 days.",
      "stakeholders": ["cto", "team_lead"],
      "outcomes": [
        { "metric": "Service availability", "target": "99.9%", "timeframe": "quarter" },
        { "metric": "Latency p95", "target": "< 200ms", "timeframe": "quarter" },
        { "metric": "Deploy success rate", "target": "99%", "timeframe": "quarter" }
      ],
      "weights": { "mission": 30, "expertise": 50, "workMode": 20 },
      "workModeRequirement": "soft",
      "workModePreference": "remote",
      "compMin": 140000,
      "compMax": 180000,
      "currency": "USD",
      "hoursMin": 35,
      "hoursMax": 40,
      "locationMode": "remote",
      "duration": "permanent",
      "verificationGates": ["identity", "work_email"],
      "mustHaveSkills": [
        { "id": "backend_system_design", "label": "Backend & Systems Design", "level": 4, "linkedToBV": true, "linkedToTO": true },
        { "id": "cloud_infrastructure", "label": "Cloud Infrastructure (AWS/GCP/Azure)", "level": 4, "linkedToTO": true },
        { "id": "observability", "label": "Observability & Reliability", "level": 3, "linkedToTO": true }
      ],
      "niceToHaveSkills": [
        { "id": "security_practices", "label": "Security Practices", "level": 3 },
        { "id": "data_engineering", "label": "Data Engineering", "level": 2 }
      ],
      "educationRequired": false,
      "educationJustification": ""
    }
    $payload$::jsonb,
    true,
    'active'
),
(
    'Product Manager - B2B SaaS',
    'product_management',
    'Outcome-driven PM for B2B workflow product',
    'Prefills adoption, activation, and roadmap hygiene outcomes plus PM toolkit skills.',
    ARRAY['business_value','outcomes','weights','practicals','expertise'],
    $payload$
    {
      "role": "Product Manager (B2B SaaS)",
      "businessValue": "Drive activation and retention for the core workflow product.",
      "expectedImpact": "Increase WAU by 20% and activation by 15% within two quarters.",
      "stakeholders": ["ceo", "team_lead", "hr_lead"],
      "outcomes": [
        { "metric": "WAU growth", "target": "+20%", "timeframe": "2 quarters" },
        { "metric": "Activation rate", "target": "+15%", "timeframe": "2 quarters" },
        { "metric": "Roadmap confidence", "target": "Quarterly roadmap on-time", "timeframe": "quarter" }
      ],
      "weights": { "mission": 40, "expertise": 40, "workMode": 20 },
      "workModeRequirement": "soft",
      "workModePreference": "hybrid",
      "locationMode": "hybrid",
      "city": "Preferred hub",
      "country": "Any",
      "compMin": 120000,
      "compMax": 160000,
      "currency": "USD",
      "hoursMin": 35,
      "hoursMax": 40,
      "duration": "permanent",
      "verificationGates": ["identity", "work_email"],
      "mustHaveSkills": [
        { "id": "product_discovery", "label": "Product Discovery", "level": 4, "linkedToBV": true },
        { "id": "roadmap_management", "label": "Roadmap & Prioritization", "level": 4, "linkedToTO": true },
        { "id": "stakeholder_management", "label": "Stakeholder Management", "level": 3, "linkedToBV": true }
      ],
      "niceToHaveSkills": [
        { "id": "sql_analysis", "label": "SQL & Data Analysis", "level": 3 },
        { "id": "experimentation", "label": "Experimentation / A-B Testing", "level": 3 }
      ],
      "educationRequired": false,
      "educationJustification": ""
    }
    $payload$::jsonb,
    true,
    'active'
);

