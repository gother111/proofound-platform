BEGIN;

ALTER TABLE experiences
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;

CREATE OR REPLACE FUNCTION public._proofound_parse_month_year_token(input TEXT)
RETURNS DATE
LANGUAGE plpgsql
AS $$
DECLARE
  normalized TEXT;
  month_token TEXT;
  year_token TEXT;
  month_value INT;
  year_value INT;
BEGIN
  IF input IS NULL THEN
    RETURN NULL;
  END IF;

  normalized := regexp_replace(trim(input), '\s+', ' ', 'g');
  month_token := lower(split_part(normalized, ' ', 1));
  year_token := split_part(normalized, ' ', 2);

  IF year_token !~ '^\d{4}$' THEN
    RETURN NULL;
  END IF;

  year_value := year_token::INT;
  month_value := CASE month_token
    WHEN 'jan' THEN 1
    WHEN 'january' THEN 1
    WHEN 'feb' THEN 2
    WHEN 'february' THEN 2
    WHEN 'mar' THEN 3
    WHEN 'march' THEN 3
    WHEN 'apr' THEN 4
    WHEN 'april' THEN 4
    WHEN 'may' THEN 5
    WHEN 'jun' THEN 6
    WHEN 'june' THEN 6
    WHEN 'jul' THEN 7
    WHEN 'july' THEN 7
    WHEN 'aug' THEN 8
    WHEN 'august' THEN 8
    WHEN 'sep' THEN 9
    WHEN 'sept' THEN 9
    WHEN 'september' THEN 9
    WHEN 'oct' THEN 10
    WHEN 'october' THEN 10
    WHEN 'nov' THEN 11
    WHEN 'november' THEN 11
    WHEN 'dec' THEN 12
    WHEN 'december' THEN 12
    ELSE NULL
  END;

  IF month_value IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN make_date(year_value, month_value, 1);
END;
$$;

WITH parsed AS (
  SELECT
    id,
    regexp_match(
      duration,
      '^\s*(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2}|present|current)\s*$',
      'i'
    ) AS parts
  FROM experiences
  WHERE start_date IS NULL
    AND end_date IS NULL
)
UPDATE experiences e
SET
  start_date = (parsed.parts)[1]::DATE,
  end_date = CASE
    WHEN lower((parsed.parts)[2]) IN ('present', 'current') THEN NULL
    ELSE (parsed.parts)[2]::DATE
  END
FROM parsed
WHERE e.id = parsed.id
  AND parsed.parts IS NOT NULL;

WITH parsed AS (
  SELECT
    id,
    regexp_match(
      duration,
      '^\s*(\d{4}-\d{2})\s*-\s*(\d{4}-\d{2}|present|current)\s*$',
      'i'
    ) AS parts
  FROM experiences
  WHERE start_date IS NULL
    AND end_date IS NULL
)
UPDATE experiences e
SET
  start_date = ((parsed.parts)[1] || '-01')::DATE,
  end_date = CASE
    WHEN lower((parsed.parts)[2]) IN ('present', 'current') THEN NULL
    ELSE ((parsed.parts)[2] || '-01')::DATE
  END
FROM parsed
WHERE e.id = parsed.id
  AND parsed.parts IS NOT NULL;

WITH parsed AS (
  SELECT
    id,
    regexp_match(
      duration,
      '^\s*([A-Za-z]{3,9}\s+\d{4})\s*-\s*([A-Za-z]{3,9}\s+\d{4}|present|current)\s*$',
      'i'
    ) AS parts
  FROM experiences
  WHERE start_date IS NULL
    AND end_date IS NULL
)
UPDATE experiences e
SET
  start_date = public._proofound_parse_month_year_token((parsed.parts)[1]),
  end_date = CASE
    WHEN lower((parsed.parts)[2]) IN ('present', 'current') THEN NULL
    ELSE public._proofound_parse_month_year_token((parsed.parts)[2])
  END
FROM parsed
WHERE e.id = parsed.id
  AND parsed.parts IS NOT NULL
  AND public._proofound_parse_month_year_token((parsed.parts)[1]) IS NOT NULL;

DROP FUNCTION IF EXISTS public._proofound_parse_month_year_token(TEXT);

UPDATE experiences
SET end_date = NULL
WHERE start_date IS NOT NULL
  AND end_date IS NOT NULL
  AND end_date < start_date;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'experiences_date_order_check'
  ) THEN
    ALTER TABLE experiences
      ADD CONSTRAINT experiences_date_order_check
      CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);
  END IF;
END
$$;

COMMIT;
