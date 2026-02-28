-- PRO-113: Reframe impact story outcomes to change-first wording
-- Adds/normalizes measured_outcomes[*].change and recomputes legacy outcomes text

WITH normalized AS (
  SELECT
    s.id,
    COALESCE(
      (
        SELECT
          jsonb_agg(
            CASE
              WHEN jsonb_typeof(item.elem) <> 'object' THEN item.elem
              ELSE jsonb_set(
                item.elem,
                '{change}',
                to_jsonb(
                  CASE
                    WHEN NULLIF(BTRIM(item.elem->>'change'), '') IS NOT NULL THEN BTRIM(item.elem->>'change')
                    WHEN NULLIF(BTRIM(item.elem->>'label'), '') IS NULL THEN CONCAT('Outcome ', item.ord::text)
                    WHEN BTRIM(item.elem->>'label') ~* '^(increase|increased|decrease|decreased|reduce|reduced|improve|improved|grew|grow|growth|boost|boosted|raise|raised|lower|lowered|drop|dropped|cut|cuts|expand|expanded|gain|gained|enable|enabled|support|supported|deliver|delivered)'
                      THEN BTRIM(item.elem->>'label')
                    WHEN item.after_num IS NOT NULL
                      AND item.baseline_num IS NOT NULL
                      AND item.after_num > item.baseline_num
                      THEN CONCAT('Increased ', LOWER(BTRIM(item.elem->>'label')))
                    WHEN item.after_num IS NOT NULL
                      AND item.baseline_num IS NOT NULL
                      AND item.after_num < item.baseline_num
                      THEN CONCAT('Reduced ', LOWER(BTRIM(item.elem->>'label')))
                    WHEN item.value_mode = 'delta'
                      AND item.value_num IS NOT NULL
                      AND item.value_num > 0
                      THEN CONCAT('Increased ', LOWER(BTRIM(item.elem->>'label')))
                    WHEN item.value_mode = 'delta'
                      AND item.value_num IS NOT NULL
                      AND item.value_num < 0
                      THEN CONCAT('Reduced ', LOWER(BTRIM(item.elem->>'label')))
                    ELSE CONCAT('Change in ', LOWER(BTRIM(item.elem->>'label')))
                  END
                ),
                true
              )
            END
            ORDER BY item.ord
          )
        FROM (
          SELECT
            elem,
            ord,
            NULLIF(BTRIM(COALESCE(elem->>'valueMode', elem->>'value_mode')), '') AS value_mode,
            CASE
              WHEN COALESCE(elem->>'value', '') ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (elem->>'value')::numeric
              ELSE NULL
            END AS value_num,
            CASE
              WHEN COALESCE(elem->>'baseline', '') ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (elem->>'baseline')::numeric
              ELSE NULL
            END AS baseline_num,
            CASE
              WHEN COALESCE(elem->>'after', '') ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (elem->>'after')::numeric
              ELSE NULL
            END AS after_num
          FROM jsonb_array_elements(
            CASE
              WHEN jsonb_typeof(COALESCE(s.measured_outcomes, '[]'::jsonb)) = 'array'
                THEN COALESCE(s.measured_outcomes, '[]'::jsonb)
              ELSE '[]'::jsonb
            END
          ) WITH ORDINALITY AS x(elem, ord)
        ) AS item
      ),
      '[]'::jsonb
    ) AS next_measured_outcomes
  FROM public.impact_stories s
),
summaries AS (
  SELECT
    n.id,
    n.next_measured_outcomes,
    CASE
      WHEN jsonb_array_length(n.next_measured_outcomes) = 0 THEN NULL
      ELSE (
        SELECT
          string_agg(
            CASE
              WHEN NULLIF(BTRIM(outcome.elem->>'change'), '') IS NULL THEN NULL
              WHEN COALESCE(outcome.elem->>'value', '') ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN CONCAT(
                BTRIM(outcome.elem->>'change'),
                ': ',
                BTRIM(outcome.elem->>'value'),
                CASE
                  WHEN NULLIF(BTRIM(outcome.elem->>'unit'), '') IS NOT NULL
                    THEN CONCAT(' ', BTRIM(outcome.elem->>'unit'))
                  ELSE ''
                END
              )
              ELSE BTRIM(outcome.elem->>'change')
            END,
            '; '
            ORDER BY outcome.ord
          )
        FROM jsonb_array_elements(n.next_measured_outcomes) WITH ORDINALITY AS outcome(elem, ord)
      )
    END AS next_outcomes_text
  FROM normalized n
)
UPDATE public.impact_stories target
SET
  measured_outcomes = summaries.next_measured_outcomes,
  outcomes = COALESCE(summaries.next_outcomes_text, target.outcomes),
  updated_at = NOW()
FROM summaries
WHERE target.id = summaries.id
  AND (
    target.measured_outcomes IS DISTINCT FROM summaries.next_measured_outcomes
    OR target.outcomes IS DISTINCT FROM COALESCE(summaries.next_outcomes_text, target.outcomes)
  );
