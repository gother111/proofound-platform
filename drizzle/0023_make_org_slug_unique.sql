-- Backfill missing slugs using display_name or id
update organizations
set slug = lower(regexp_replace(coalesce(display_name, id::text), '[^a-z0-9]+', '-', 'g'))
where slug is null;

-- Ensure uniqueness (if not existing)
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
