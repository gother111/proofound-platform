alter table public.matching_profiles
  add column if not exists engagement_type text;
