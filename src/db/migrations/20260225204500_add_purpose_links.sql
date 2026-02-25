ALTER TABLE individual_profiles
  ADD COLUMN IF NOT EXISTS mission_links jsonb,
  ADD COLUMN IF NOT EXISTS vision_links jsonb;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS mission_links jsonb,
  ADD COLUMN IF NOT EXISTS vision_links jsonb;

-- Backfill individual mission links from current values/causes when mission text exists.
UPDATE individual_profiles AS p
SET mission_links = jsonb_build_object(
  'values',
  COALESCE(
    (
      SELECT jsonb_agg(v.value_label)
      FROM (
        SELECT DISTINCT label AS value_label
        FROM (
          SELECT NULLIF(BTRIM(elem #>> '{}'), '') AS label
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(p.values) = 'array' THEN p.values ELSE '[]'::jsonb END
          ) AS elem
          WHERE jsonb_typeof(elem) = 'string'

          UNION

          SELECT NULLIF(BTRIM(elem ->> 'label'), '') AS label
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(p.values) = 'array' THEN p.values ELSE '[]'::jsonb END
          ) AS elem
          WHERE jsonb_typeof(elem) = 'object'
        ) AS labels
        WHERE label IS NOT NULL
      ) AS v
    ),
    '[]'::jsonb
  ),
  'causes',
  COALESCE(
    (
      SELECT jsonb_agg(c.cause_label)
      FROM (
        SELECT DISTINCT NULLIF(BTRIM(raw.cause_value), '') AS cause_label
        FROM unnest(COALESCE(p.causes, ARRAY[]::text[])) AS raw(cause_value)
        WHERE NULLIF(BTRIM(raw.cause_value), '') IS NOT NULL
      ) AS c
    ),
    '[]'::jsonb
  )
)
WHERE p.mission_links IS NULL
  AND NULLIF(BTRIM(COALESCE(p.mission, '')), '') IS NOT NULL;

-- Backfill individual vision links from current values/causes when vision text exists.
UPDATE individual_profiles AS p
SET vision_links = jsonb_build_object(
  'values',
  COALESCE(
    (
      SELECT jsonb_agg(v.value_label)
      FROM (
        SELECT DISTINCT label AS value_label
        FROM (
          SELECT NULLIF(BTRIM(elem #>> '{}'), '') AS label
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(p.values) = 'array' THEN p.values ELSE '[]'::jsonb END
          ) AS elem
          WHERE jsonb_typeof(elem) = 'string'

          UNION

          SELECT NULLIF(BTRIM(elem ->> 'label'), '') AS label
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(p.values) = 'array' THEN p.values ELSE '[]'::jsonb END
          ) AS elem
          WHERE jsonb_typeof(elem) = 'object'
        ) AS labels
        WHERE label IS NOT NULL
      ) AS v
    ),
    '[]'::jsonb
  ),
  'causes',
  COALESCE(
    (
      SELECT jsonb_agg(c.cause_label)
      FROM (
        SELECT DISTINCT NULLIF(BTRIM(raw.cause_value), '') AS cause_label
        FROM unnest(COALESCE(p.causes, ARRAY[]::text[])) AS raw(cause_value)
        WHERE NULLIF(BTRIM(raw.cause_value), '') IS NOT NULL
      ) AS c
    ),
    '[]'::jsonb
  )
)
WHERE p.vision_links IS NULL
  AND NULLIF(BTRIM(COALESCE(p.vision, '')), '') IS NOT NULL;

-- Backfill organization mission links from current values/causes when mission text exists.
UPDATE organizations AS o
SET mission_links = jsonb_build_object(
  'values',
  COALESCE(
    (
      SELECT jsonb_agg(v.value_label)
      FROM (
        SELECT DISTINCT label AS value_label
        FROM (
          SELECT NULLIF(BTRIM(elem #>> '{}'), '') AS label
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(o.values) = 'array' THEN o.values ELSE '[]'::jsonb END
          ) AS elem
          WHERE jsonb_typeof(elem) = 'string'

          UNION

          SELECT NULLIF(BTRIM(elem ->> 'label'), '') AS label
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(o.values) = 'array' THEN o.values ELSE '[]'::jsonb END
          ) AS elem
          WHERE jsonb_typeof(elem) = 'object'
        ) AS labels
        WHERE label IS NOT NULL
      ) AS v
    ),
    '[]'::jsonb
  ),
  'causes',
  COALESCE(
    (
      SELECT jsonb_agg(c.cause_label)
      FROM (
        SELECT DISTINCT NULLIF(BTRIM(raw.cause_value), '') AS cause_label
        FROM unnest(COALESCE(o.causes, ARRAY[]::text[])) AS raw(cause_value)
        WHERE NULLIF(BTRIM(raw.cause_value), '') IS NOT NULL
      ) AS c
    ),
    '[]'::jsonb
  )
)
WHERE o.mission_links IS NULL
  AND NULLIF(BTRIM(COALESCE(o.mission, '')), '') IS NOT NULL;

-- Backfill organization vision links from current values/causes when vision text exists.
UPDATE organizations AS o
SET vision_links = jsonb_build_object(
  'values',
  COALESCE(
    (
      SELECT jsonb_agg(v.value_label)
      FROM (
        SELECT DISTINCT label AS value_label
        FROM (
          SELECT NULLIF(BTRIM(elem #>> '{}'), '') AS label
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(o.values) = 'array' THEN o.values ELSE '[]'::jsonb END
          ) AS elem
          WHERE jsonb_typeof(elem) = 'string'

          UNION

          SELECT NULLIF(BTRIM(elem ->> 'label'), '') AS label
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(o.values) = 'array' THEN o.values ELSE '[]'::jsonb END
          ) AS elem
          WHERE jsonb_typeof(elem) = 'object'
        ) AS labels
        WHERE label IS NOT NULL
      ) AS v
    ),
    '[]'::jsonb
  ),
  'causes',
  COALESCE(
    (
      SELECT jsonb_agg(c.cause_label)
      FROM (
        SELECT DISTINCT NULLIF(BTRIM(raw.cause_value), '') AS cause_label
        FROM unnest(COALESCE(o.causes, ARRAY[]::text[])) AS raw(cause_value)
        WHERE NULLIF(BTRIM(raw.cause_value), '') IS NOT NULL
      ) AS c
    ),
    '[]'::jsonb
  )
)
WHERE o.vision_links IS NULL
  AND NULLIF(BTRIM(COALESCE(o.vision, '')), '') IS NOT NULL;
