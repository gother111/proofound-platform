BEGIN;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS industry_key TEXT,
  ADD COLUMN IF NOT EXISTS industry_label TEXT,
  ADD COLUMN IF NOT EXISTS industry_legacy_text TEXT;

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS organization_industry_key TEXT,
  ADD COLUMN IF NOT EXISTS organization_industry_label TEXT,
  ADD COLUMN IF NOT EXISTS organization_industry_legacy_text TEXT;

ALTER TABLE public.matching_profiles
  ADD COLUMN IF NOT EXISTS preferred_industry_keys TEXT[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN IF NOT EXISTS preferred_industry_labels TEXT[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN IF NOT EXISTS preferred_industry_legacy TEXT[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN IF NOT EXISTS avoid_industry_keys TEXT[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN IF NOT EXISTS avoid_industry_labels TEXT[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN IF NOT EXISTS avoid_industry_legacy TEXT[] DEFAULT '{}'::text[] NOT NULL;

CREATE OR REPLACE FUNCTION pg_temp.resolve_industry_key(raw_value TEXT)
RETURNS TEXT
LANGUAGE SQL
AS $$
  WITH normalized AS (
    SELECT LOWER(REGEXP_REPLACE(BTRIM(COALESCE(raw_value, '')), '\\s+', ' ', 'g')) AS value
  )
  SELECT CASE
    WHEN value = '' THEN NULL
    WHEN value = 'agriculture, forestry and fishing' THEN 'agriculture_forestry_and_fishing'
    WHEN value = 'agriculture' THEN 'agriculture_forestry_and_fishing'
    WHEN value = 'mining and quarrying' THEN 'mining_and_quarrying'
    WHEN value = 'mining' THEN 'mining_and_quarrying'
    WHEN value = 'manufacturing' THEN 'manufacturing'
    WHEN value = 'electricity, gas, steam and air conditioning supply' THEN 'electricity_gas_steam_and_air_conditioning_supply'
    WHEN value = 'energy' THEN 'electricity_gas_steam_and_air_conditioning_supply'
    WHEN value = 'utilities' THEN 'electricity_gas_steam_and_air_conditioning_supply'
    WHEN value = 'water supply; sewerage, waste management and remediation activities' THEN 'water_supply_sewerage_waste_management_and_remediation_activities'
    WHEN value = 'construction' THEN 'construction'
    WHEN value = 'wholesale and retail trade; repair of motor vehicles and motorcycles' THEN 'wholesale_and_retail_trade_repair_of_motor_vehicles_and_motorcycles'
    WHEN value = 'retail' THEN 'wholesale_and_retail_trade_repair_of_motor_vehicles_and_motorcycles'
    WHEN value = 'commerce' THEN 'wholesale_and_retail_trade_repair_of_motor_vehicles_and_motorcycles'
    WHEN value = 'transportation and storage' THEN 'transportation_and_storage'
    WHEN value = 'transportation' THEN 'transportation_and_storage'
    WHEN value = 'logistics' THEN 'transportation_and_storage'
    WHEN value = 'accommodation and food service activities' THEN 'accommodation_and_food_service_activities'
    WHEN value = 'hospitality' THEN 'accommodation_and_food_service_activities'
    WHEN value = 'information and communication' THEN 'information_and_communication'
    WHEN value = 'technology' THEN 'information_and_communication'
    WHEN value = 'tech' THEN 'information_and_communication'
    WHEN value = 'information technology' THEN 'information_and_communication'
    WHEN value = 'it' THEN 'information_and_communication'
    WHEN value = 'media' THEN 'information_and_communication'
    WHEN value = 'communications' THEN 'information_and_communication'
    WHEN value = 'financial and insurance activities' THEN 'financial_and_insurance_activities'
    WHEN value = 'finance' THEN 'financial_and_insurance_activities'
    WHEN value = 'fintech' THEN 'financial_and_insurance_activities'
    WHEN value = 'banking' THEN 'financial_and_insurance_activities'
    WHEN value = 'real estate activities' THEN 'real_estate_activities'
    WHEN value = 'real estate' THEN 'real_estate_activities'
    WHEN value = 'professional, scientific and technical activities' THEN 'professional_scientific_and_technical_activities'
    WHEN value = 'professional services' THEN 'professional_scientific_and_technical_activities'
    WHEN value = 'consulting' THEN 'professional_scientific_and_technical_activities'
    WHEN value = 'administrative and support service activities' THEN 'administrative_and_support_service_activities'
    WHEN value = 'administration' THEN 'administrative_and_support_service_activities'
    WHEN value = 'public administration and defence; compulsory social security' THEN 'public_administration_and_defence_compulsory_social_security'
    WHEN value = 'government' THEN 'public_administration_and_defence_compulsory_social_security'
    WHEN value = 'public' THEN 'public_administration_and_defence_compulsory_social_security'
    WHEN value = 'education' THEN 'education'
    WHEN value = 'human health and social work activities' THEN 'human_health_and_social_work_activities'
    WHEN value = 'healthcare' THEN 'human_health_and_social_work_activities'
    WHEN value = 'health' THEN 'human_health_and_social_work_activities'
    WHEN value = 'medtech' THEN 'human_health_and_social_work_activities'
    WHEN value = 'arts, entertainment and recreation' THEN 'arts_entertainment_and_recreation'
    WHEN value = 'arts' THEN 'arts_entertainment_and_recreation'
    WHEN value = 'entertainment' THEN 'arts_entertainment_and_recreation'
    WHEN value = 'other service activities' THEN 'other_service_activities'
    WHEN value = 'nonprofit' THEN 'other_service_activities'
    WHEN value = 'non-profit' THEN 'other_service_activities'
    WHEN value = 'ngo' THEN 'other_service_activities'
    ELSE NULL
  END
  FROM normalized;
$$;

CREATE OR REPLACE FUNCTION pg_temp.resolve_industry_label(industry_key TEXT)
RETURNS TEXT
LANGUAGE SQL
AS $$
  SELECT CASE industry_key
    WHEN 'agriculture_forestry_and_fishing' THEN 'Agriculture, forestry and fishing'
    WHEN 'mining_and_quarrying' THEN 'Mining and quarrying'
    WHEN 'manufacturing' THEN 'Manufacturing'
    WHEN 'electricity_gas_steam_and_air_conditioning_supply' THEN 'Electricity, gas, steam and air conditioning supply'
    WHEN 'water_supply_sewerage_waste_management_and_remediation_activities' THEN 'Water supply; sewerage, waste management and remediation activities'
    WHEN 'construction' THEN 'Construction'
    WHEN 'wholesale_and_retail_trade_repair_of_motor_vehicles_and_motorcycles' THEN 'Wholesale and retail trade; repair of motor vehicles and motorcycles'
    WHEN 'transportation_and_storage' THEN 'Transportation and storage'
    WHEN 'accommodation_and_food_service_activities' THEN 'Accommodation and food service activities'
    WHEN 'information_and_communication' THEN 'Information and communication'
    WHEN 'financial_and_insurance_activities' THEN 'Financial and insurance activities'
    WHEN 'real_estate_activities' THEN 'Real estate activities'
    WHEN 'professional_scientific_and_technical_activities' THEN 'Professional, scientific and technical activities'
    WHEN 'administrative_and_support_service_activities' THEN 'Administrative and support service activities'
    WHEN 'public_administration_and_defence_compulsory_social_security' THEN 'Public administration and defence; compulsory social security'
    WHEN 'education' THEN 'Education'
    WHEN 'human_health_and_social_work_activities' THEN 'Human health and social work activities'
    WHEN 'arts_entertainment_and_recreation' THEN 'Arts, entertainment and recreation'
    ELSE 'Other service activities'
  END;
$$;

WITH org_source AS (
  SELECT
    o.id,
    NULLIF(BTRIM(o.industry), '') AS legacy_industry,
    COALESCE(NULLIF(BTRIM(o.industry_key), ''), pg_temp.resolve_industry_key(COALESCE(o.industry_label, o.industry))) AS next_key,
    COALESCE(NULLIF(BTRIM(o.industry_label), ''), pg_temp.resolve_industry_label(COALESCE(NULLIF(BTRIM(o.industry_key), ''), pg_temp.resolve_industry_key(COALESCE(o.industry_label, o.industry)), 'other_service_activities'))) AS next_label,
    NULLIF(BTRIM(o.industry_legacy_text), '') AS existing_legacy
  FROM public.organizations o
)
UPDATE public.organizations o
SET
  industry_key = COALESCE(org_source.next_key, 'other_service_activities'),
  industry_label = COALESCE(org_source.next_label, 'Other service activities'),
  industry = COALESCE(org_source.next_label, 'Other service activities'),
  industry_legacy_text = COALESCE(
    org_source.existing_legacy,
    CASE
      WHEN org_source.legacy_industry IS NULL THEN NULL
      WHEN org_source.next_key IS NULL THEN org_source.legacy_industry
      ELSE NULL
    END
  )
FROM org_source
WHERE o.id = org_source.id;

WITH exp_source AS (
  SELECT
    e.id,
    NULLIF(BTRIM(e.organization_industry), '') AS legacy_industry,
    COALESCE(NULLIF(BTRIM(e.organization_industry_key), ''), pg_temp.resolve_industry_key(COALESCE(e.organization_industry_label, e.organization_industry))) AS next_key,
    COALESCE(NULLIF(BTRIM(e.organization_industry_label), ''), pg_temp.resolve_industry_label(COALESCE(NULLIF(BTRIM(e.organization_industry_key), ''), pg_temp.resolve_industry_key(COALESCE(e.organization_industry_label, e.organization_industry)), 'other_service_activities'))) AS next_label,
    NULLIF(BTRIM(e.organization_industry_legacy_text), '') AS existing_legacy
  FROM public.experiences e
)
UPDATE public.experiences e
SET
  organization_industry_key = COALESCE(exp_source.next_key, 'other_service_activities'),
  organization_industry_label = COALESCE(exp_source.next_label, 'Other service activities'),
  organization_industry = COALESCE(exp_source.next_label, 'Other service activities'),
  organization_industry_legacy_text = COALESCE(
    exp_source.existing_legacy,
    CASE
      WHEN exp_source.legacy_industry IS NULL THEN NULL
      WHEN exp_source.next_key IS NULL THEN exp_source.legacy_industry
      ELSE NULL
    END
  )
FROM exp_source
WHERE e.id = exp_source.id;

WITH preferred_source AS (
  SELECT
    mp.profile_id,
    UNNEST(
      CASE
        WHEN ARRAY_LENGTH(mp.preferred_industry_labels, 1) IS NOT NULL
          AND ARRAY_LENGTH(mp.preferred_industry_labels, 1) > 0
          THEN mp.preferred_industry_labels
        ELSE COALESCE(mp.desired_industries, '{}'::text[])
      END
    ) AS raw_value
  FROM public.matching_profiles mp
),
preferred_mapped AS (
  SELECT
    ps.profile_id,
    ps.raw_value,
    pg_temp.resolve_industry_key(ps.raw_value) AS resolved_key
  FROM preferred_source ps
),
preferred_aggregated AS (
  SELECT
    pm.profile_id,
    ARRAY_AGG(DISTINCT COALESCE(pm.resolved_key, 'other_service_activities')) AS pref_keys,
    ARRAY_AGG(DISTINCT pg_temp.resolve_industry_label(COALESCE(pm.resolved_key, 'other_service_activities'))) AS pref_labels,
    ARRAY_REMOVE(
      ARRAY_AGG(
        DISTINCT CASE
          WHEN pm.resolved_key IS NULL AND NULLIF(BTRIM(pm.raw_value), '') IS NOT NULL THEN BTRIM(pm.raw_value)
          ELSE NULL
        END
      ),
      NULL
    ) AS pref_legacy
  FROM preferred_mapped pm
  GROUP BY pm.profile_id
),
avoid_source AS (
  SELECT
    mp.profile_id,
    UNNEST(COALESCE(mp.avoid_industry_labels, '{}'::text[])) AS raw_value
  FROM public.matching_profiles mp
),
avoid_mapped AS (
  SELECT
    avs.profile_id,
    avs.raw_value,
    pg_temp.resolve_industry_key(avs.raw_value) AS resolved_key
  FROM avoid_source avs
),
avoid_aggregated AS (
  SELECT
    am.profile_id,
    ARRAY_AGG(DISTINCT COALESCE(am.resolved_key, 'other_service_activities')) AS avoid_keys,
    ARRAY_AGG(DISTINCT pg_temp.resolve_industry_label(COALESCE(am.resolved_key, 'other_service_activities'))) AS avoid_labels,
    ARRAY_REMOVE(
      ARRAY_AGG(
        DISTINCT CASE
          WHEN am.resolved_key IS NULL AND NULLIF(BTRIM(am.raw_value), '') IS NOT NULL THEN BTRIM(am.raw_value)
          ELSE NULL
        END
      ),
      NULL
    ) AS avoid_legacy
  FROM avoid_mapped am
  GROUP BY am.profile_id
)
UPDATE public.matching_profiles mp
SET
  preferred_industry_keys = COALESCE(preferred_aggregated.pref_keys, mp.preferred_industry_keys, '{}'::text[]),
  preferred_industry_labels = COALESCE(preferred_aggregated.pref_labels, mp.preferred_industry_labels, '{}'::text[]),
  preferred_industry_legacy = COALESCE(preferred_aggregated.pref_legacy, mp.preferred_industry_legacy, '{}'::text[]),
  avoid_industry_keys = COALESCE(avoid_aggregated.avoid_keys, mp.avoid_industry_keys, '{}'::text[]),
  avoid_industry_labels = COALESCE(avoid_aggregated.avoid_labels, mp.avoid_industry_labels, '{}'::text[]),
  avoid_industry_legacy = COALESCE(avoid_aggregated.avoid_legacy, mp.avoid_industry_legacy, '{}'::text[]),
  desired_industries = COALESCE(preferred_aggregated.pref_labels, mp.desired_industries, '{}'::text[])
FROM preferred_aggregated
LEFT JOIN avoid_aggregated ON avoid_aggregated.profile_id = preferred_aggregated.profile_id
WHERE mp.profile_id = preferred_aggregated.profile_id;

WITH avoid_source AS (
  SELECT
    mp.profile_id,
    UNNEST(COALESCE(mp.avoid_industry_labels, '{}'::text[])) AS raw_value
  FROM public.matching_profiles mp
),
avoid_mapped AS (
  SELECT
    avs.profile_id,
    avs.raw_value,
    pg_temp.resolve_industry_key(avs.raw_value) AS resolved_key
  FROM avoid_source avs
),
avoid_aggregated AS (
  SELECT
    am.profile_id,
    ARRAY_AGG(DISTINCT COALESCE(am.resolved_key, 'other_service_activities')) AS avoid_keys,
    ARRAY_AGG(DISTINCT pg_temp.resolve_industry_label(COALESCE(am.resolved_key, 'other_service_activities'))) AS avoid_labels,
    ARRAY_REMOVE(
      ARRAY_AGG(
        DISTINCT CASE
          WHEN am.resolved_key IS NULL AND NULLIF(BTRIM(am.raw_value), '') IS NOT NULL THEN BTRIM(am.raw_value)
          ELSE NULL
        END
      ),
      NULL
    ) AS avoid_legacy
  FROM avoid_mapped am
  GROUP BY am.profile_id
)
UPDATE public.matching_profiles mp
SET
  avoid_industry_keys = COALESCE(avoid_aggregated.avoid_keys, mp.avoid_industry_keys, '{}'::text[]),
  avoid_industry_labels = COALESCE(
    avoid_aggregated.avoid_labels,
    mp.avoid_industry_labels,
    '{}'::text[]
  ),
  avoid_industry_legacy = COALESCE(
    avoid_aggregated.avoid_legacy,
    mp.avoid_industry_legacy,
    '{}'::text[]
  )
FROM avoid_aggregated
WHERE mp.profile_id = avoid_aggregated.profile_id;

COMMIT;
