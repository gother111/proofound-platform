alter table organizations
  add column if not exists slug text,
  add column if not exists slug_confirmed boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public' and indexname = 'organizations_slug_key'
  ) then
    alter table organizations
      add constraint organizations_slug_key unique (slug);
  end if;
end $$;
