BEGIN;

UPDATE public.skills_taxonomy_aliases
SET status = 'deprecated', updated_at = NOW()
WHERE locale = 'en'
  AND status = 'active'
  AND (
    (skill_code = '03.082.649.96351' AND alias_norm = public.normalize_skill_alias('c++'))
    OR (skill_code = '03.090.714.96411' AND alias_norm = public.normalize_skill_alias('pm'))
  );

INSERT INTO public.skills_taxonomy_aliases (
  skill_code,
  locale,
  alias,
  alias_norm,
  source,
  confidence,
  status
)
VALUES
  (
    '03.082.653.13641',
    'en',
    'C++',
    public.normalize_skill_alias('C++'),
    'curated',
    1.000,
    'active'
  ),
  (
    '03.082.653.13641',
    'en',
    'C plus plus',
    public.normalize_skill_alias('C plus plus'),
    'curated',
    0.990,
    'active'
  ),
  (
    '03.082.653.13641',
    'en',
    'cplusplus',
    public.normalize_skill_alias('cplusplus'),
    'curated',
    0.970,
    'active'
  ),
  (
    '03.082.655.95017',
    'en',
    'NodeJS',
    public.normalize_skill_alias('NodeJS'),
    'curated',
    0.990,
    'active'
  ),
  (
    '03.082.655.95017',
    'en',
    'Node.js',
    public.normalize_skill_alias('Node.js'),
    'curated',
    0.980,
    'active'
  )
ON CONFLICT (skill_code, locale, alias_norm) DO UPDATE
SET alias = EXCLUDED.alias,
    source = EXCLUDED.source,
    confidence = EXCLUDED.confidence,
    status = 'active',
    updated_at = NOW();

COMMIT;
