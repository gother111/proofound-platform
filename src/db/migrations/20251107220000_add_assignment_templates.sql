-- Assignment templates / presets by role family
create table if not exists assignment_templates (
    id uuid primary key default gen_random_uuid(),
    org_id uuid references organizations(id) on delete cascade,
    name text not null,
    role_family text not null,
    description text,
    applies_to_steps text[] not null default '{}',
    preset_payload jsonb not null default '{}'::jsonb,
    is_global boolean not null default false,
    created_by uuid references profiles(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists assignment_templates_org_idx on assignment_templates (org_id);
create index if not exists assignment_templates_role_family_idx on assignment_templates (role_family);
create unique index if not exists assignment_templates_org_name_idx
  on assignment_templates (coalesce(org_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

-- Seed global starter templates (safe to re-run)
insert into assignment_templates (name, role_family, description, applies_to_steps, preset_payload, is_global)
values
  (
    'Backend Engineer (IC4)',
    'Engineering',
    'Stabilize core services and improve delivery velocity for backend-heavy teams.',
    array['business_value','target_outcomes','practicals','expertise','weight_matrix'],
    '{
      "role": "Senior Backend Engineer",
      "businessValue": "Own reliability and delivery for core services so the product team can ship confidently.",
      "expectedImpact": "Reduce P1 incidents and shrink lead time for backend changes.",
      "outcomes": [
        { "metric": "Availability", "target": "99.95% uptime for core APIs", "timeframe": "6mo" },
        { "metric": "Lead time", "target": "-20% average lead time per change", "timeframe": "6mo" }
      ],
      "weights": { "mission": 30, "expertise": 50, "workMode": 20 },
      "locationMode": "hybrid",
      "city": "New York",
      "country": "USA",
      "compMin": 130000,
      "compMax": 160000,
      "currency": "USD",
      "hoursMin": 35,
      "hoursMax": 40,
      "verificationGates": ["identity","work_email"],
      "workModeRequirement": "hard",
      "workModePreference": "hybrid",
      "mustHaveSkills": [
        { "id": "backend_architecture", "label": "Backend Architecture", "level": 4, "linkedToBV": true, "linkedToTO": true },
        { "id": "typescript", "label": "TypeScript", "level": 4, "linkedToBV": false, "linkedToTO": false },
        { "id": "observability", "label": "Observability", "level": 3, "linkedToBV": true, "linkedToTO": true }
      ],
      "niceToHaveSkills": [
        { "id": "aws", "label": "AWS", "level": 3 }
      ]
    }'::jsonb,
    true
  ),
  (
    'Enterprise Account Executive',
    'Sales',
    'Drive new enterprise revenue with structured discovery and multi-threaded deals.',
    array['business_value','target_outcomes','practicals','expertise'],
    '{
      "role": "Enterprise Account Executive",
      "businessValue": "Open and close new enterprise ARR across 3-5 target accounts.",
      "expectedImpact": "Land lighthouse customers and build repeatable mid-cycle hygiene.",
      "outcomes": [
        { "metric": "Pipeline creation", "target": "$1.5M qualified pipeline per quarter", "timeframe": "6mo" },
        { "metric": "Win rate", "target": "25% win rate on qualified deals", "timeframe": "12mo" }
      ],
      "weights": { "mission": 25, "expertise": 45, "workMode": 30 },
      "locationMode": "remote",
      "compMin": 90000,
      "compMax": 130000,
      "currency": "USD",
      "hoursMin": 40,
      "hoursMax": 40,
      "verificationGates": ["identity","linkedin"],
      "workModeRequirement": "soft",
      "workModePreference": "remote",
      "mustHaveSkills": [
        { "id": "enterprise_sales", "label": "Enterprise Sales", "level": 4, "linkedToBV": true, "linkedToTO": true },
        { "id": "meddpicc", "label": "MEDDPICC", "level": 3, "linkedToBV": true, "linkedToTO": true }
      ],
      "niceToHaveSkills": [
        { "id": "saas_security", "label": "SaaS Security Domain", "level": 2 }
      ]
    }'::jsonb,
    true
  ),
  (
    'Operations Lead',
    'Operations',
    'Improve cross-functional throughput, SLAs, and vendor efficiency.',
    array['business_value','target_outcomes','practicals','expertise'],
    '{
      "role": "Operations Lead",
      "businessValue": "Streamline processes and vendor stack to improve SLA reliability and margin.",
      "expectedImpact": "Reduce handoff delays and create predictable operating cadence.",
      "outcomes": [
        { "metric": "Cycle time", "target": "-25% average cross-team cycle time", "timeframe": "6mo" },
        { "metric": "Vendor savings", "target": "10% reduction in vendor costs", "timeframe": "12mo" }
      ],
      "weights": { "mission": 35, "expertise": 40, "workMode": 25 },
      "locationMode": "hybrid",
      "city": "Chicago",
      "country": "USA",
      "compMin": 100000,
      "compMax": 125000,
      "currency": "USD",
      "hoursMin": 35,
      "hoursMax": 40,
      "verificationGates": ["identity","work_email"],
      "workModeRequirement": "soft",
      "workModePreference": "hybrid",
      "mustHaveSkills": [
        { "id": "process_improvement", "label": "Process Improvement", "level": 4, "linkedToBV": true, "linkedToTO": true },
        { "id": "vendor_management", "label": "Vendor Management", "level": 3, "linkedToBV": true, "linkedToTO": false },
        { "id": "sql_analysis", "label": "SQL for Ops Analytics", "level": 3, "linkedToBV": false, "linkedToTO": true }
      ],
      "niceToHaveSkills": [
        { "id": "change_management", "label": "Change Management", "level": 2 }
      ]
    }'::jsonb,
    true
  );


