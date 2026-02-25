ALTER TABLE individual_profiles
  ADD COLUMN IF NOT EXISTS mission_links jsonb,
  ADD COLUMN IF NOT EXISTS vision_links jsonb;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS mission_links jsonb,
  ADD COLUMN IF NOT EXISTS vision_links jsonb;

-- Backfill individual mission links from current values/causes when mission text exists.
UPDATE individual_profiles AS p
SET mission_links = jsonb_build_object(
  'values', COALESCE(normalized.values_json, '[]'::jsonb),
  'causes', COALESCE(normalized.causes_json, '[]'::jsonb)
)
FROM LATERAL (
  SELECT
    (
      SELECT COALESCE(jsonb_agg(value_label), '[]'::jsonb)
      FROM (
        SELECT DISTINCT label AS value_label
        FROM (
          SELECT NULLIF(BTRIM(elem #>> '{}'), '') AS label
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(p.values) = 'array' THEN p.values ELSE '[]'::jsonb END
          ) AS elem
          WHERE jsonb_typeof(elem) = 'string'

          UNION ALL

          SELECT NULLIF(BTRIM(elem ->> 'label'), '') AS label
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(p.values) = 'array' THEN p.values ELSE '[]'::jsonb END
          ) AS elem
          WHERE jsonb_typeof(elem) = 'object'
        ) AS value_labels
        WHERE label IS NOT NULL
      ) AS deduped_values
    ) AS values_json,
    (
      SELECT COALESCE(jsonb_agg(cause_label), '[]'::jsonb)
      FROM (
        SELECT DISTINCT cause AS cause_label
        FROM (
          SELECT NULLIF(BTRIM(cause), '') AS cause
          FROM unnest(COALESCE(p.causes, ARRAY[]::text[])) AS cause
        ) AS cause_labels
        WHERE cause IS NOT NULL
      ) AS deduped_causes
    ) AS causes_json
) AS normalized
WHERE p.mission_links IS NULL
  AND NULLIF(BTRIM(COALESCE(p.mission, '')), '') IS NOT NULL;

-- Backfill individual vision links from current values/causes when vision text exists.
UPDATE individual_profiles AS p
SET vision_links = jsonb_build_object(
  'values', COALESCE(normalized.values_json, '[]'::jsonb),
  'causes', COALESCE(normalized.causes_json, '[]'::jsonb)
)
FROM LATERAL (
  SELECT
    (
      SELECT COALESCE(jsonb_agg(value_label), '[]'::jsonb)
      FROM (
        SELECT DISTINCT label AS value_label
        FROM (
          SELECT NULLIF(BTRIM(elem #>> '{}'), '') AS label
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(p.values) = 'array' THEN p.values ELSE '[]'::jsonb END
          ) AS elem
          WHERE jsonb_typeof(elem) = 'string'

          UNION ALL

          SELECT NULLIF(BTRIM(elem ->> 'label'), '') AS label
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(p.values) = 'array' THEN p.values ELSE '[]'::jsonb END
          ) AS elem
          WHERE jsonb_typeof(elem) = 'object'
        ) AS value_labels
        WHERE label IS NOT NULL
      ) AS deduped_values
    ) AS values_json,
    (
      SELECT COALESCE(jsonb_agg(cause_label), '[]'::jsonb)
      FROM (
        SELECT DISTINCT cause AS cause_label
        FROM (
          SELECT NULLIF(BTRIM(cause), '') AS cause
          FROM unnest(COALESCE(p.causes, ARRAY[]::text[])) AS cause
        ) AS cause_labels
        WHERE cause IS NOT NULL
      ) AS deduped_causes
    ) AS causes_json
) AS normalized
WHERE p.vision_links IS NULL
  AND NULLIF(BTRIM(COALESCE(p.vision, '')), '') IS NOT NULL;

-- Backfill organization mission links from current values/causes when mission text exists.
UPDATE organizations AS o
SET mission_links = jsonb_build_object(
  'values', COALESCE(normalized.values_json, '[]'::jsonb),
  'causes', COALESCE(normalized.causes_json, '[]'::jsonb)
)
FROM LATERAL (
  SELECT
    (
      SELECT COALESCE(jsonb_agg(value_label), '[]'::jsonb)
      FROM (
        SELECT DISTINCT label AS value_label
        FROM (
          SELECT NULLIF(BTRIM(elem #>> '{}'), '') AS label
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(o.values) = 'array' THEN o.values ELSE '[]'::jsonb END
          ) AS elem
          WHERE jsonb_typeof(elem) = 'string'

          UNION ALL

          SELECT NULLIF(BTRIM(elem ->> 'label'), '') AS label
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(o.values) = 'array' THEN o.values ELSE '[]'::jsonb END
          ) AS elem
          WHERE jsonb_typeof(elem) = 'object'
        ) AS value_labels
        WHERE label IS NOT NULL
      ) AS deduped_values
    ) AS values_json,
    (
      SELECT COALESCE(jsonb_agg(cause_label), '[]'::jsonb)
      FROM (
        SELECT DISTINCT cause AS cause_label
        FROM (
          SELECT NULLIF(BTRIM(cause), '') AS cause
          FROM unnest(COALESCE(o.causes, ARRAY[]::text[])) AS cause
        ) AS cause_labels
        WHERE cause IS NOT NULL
      ) AS deduped_causes
    ) AS causes_json
) AS normalized
WHERE o.mission_links IS NULL
  AND NULLIF(BTRIM(COALESCE(o.mission, '')), '') IS NOT NULL;

-- Backfill organization vision links from current values/causes when vision text exists.
UPDATE organizations AS o
SET vision_links = jsonb_build_object(
  'values', COALESCE(normalized.values_json, '[]'::jsonb),
  'causes', COALESCE(normalized.causes_json, '[]'::jsonb)
)
FROM LATERAL (
  SELECT
    (
      SELECT COALESCE(jsonb_agg(value_label), '[]'::jsonb)
      FROM (
        SELECT DISTINCT label AS value_label
        FROM (
          SELECT NULLIF(BTRIM(elem #>> '{}'), '') AS label
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(o.values) = 'array' THEN o.values ELSE '[]'::jsonb END
          ) AS elem
          WHERE jsonb_typeof(elem) = 'string'

          UNION ALL

          SELECT NULLIF(BTRIM(elem ->> 'label'), '') AS label
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(o.values) = 'array' THEN o.values ELSE '[]'::jsonb END
          ) AS elem
          WHERE jsonb_typeof(elem) = 'object'
        ) AS value_labels
        WHERE label IS NOT NULL
      ) AS deduped_values
    ) AS values_json,
    (
      SELECT COALESCE(jsonb_agg(cause_label), '[]'::jsonb)
      FROM (
        SELECT DISTINCT cause AS cause_label
        FROM (
          SELECT NULLIF(BTRIM(cause), '') AS cause
          FROM unnest(COALESCE(o.causes, ARRAY[]::text[])) AS cause
        ) AS cause_labels
        WHERE cause IS NOT NULL
      ) AS deduped_causes
    ) AS causes_json
) AS normalized
WHERE o.vision_links IS NULL
  AND NULLIF(BTRIM(COALESCE(o.vision, '')), '') IS NOT NULL;
