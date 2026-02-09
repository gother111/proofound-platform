alter table assignments add column if not exists outcomes jsonb default '[]'::jsonb;
