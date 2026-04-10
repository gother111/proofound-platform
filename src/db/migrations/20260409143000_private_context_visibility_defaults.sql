ALTER TABLE public.profile_field_visibility
  ALTER COLUMN experiences SET DEFAULT 'private',
  ALTER COLUMN education SET DEFAULT 'private',
  ALTER COLUMN volunteering SET DEFAULT 'private';
