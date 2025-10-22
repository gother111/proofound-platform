-- Add slug + confirmation + basic profile fields for organizations
alter table public.organizations
  add column if not exists slug text,
  add column if not exists slug_confirmed boolean not null default false,
  add column if not exists logo_url text,
  add column if not exists tagline text,
  add column if not exists size text,
  add column if not exists industry text,
  add column if not exists founded_date date,
  add column if not exists legal_form text,
  add column if not exists locations jsonb,
  add column if not exists mission text,
  add column if not exists vision text,
  add column if not exists core_values jsonb,
  add column if not exists causes text[],
  add column if not exists verifications jsonb,
  add column if not exists impact_pipeline jsonb,
  add column if not exists website_url text,
  add column if not exists social_urls jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'organizations_slug_key'
  ) then
    alter table public.organizations add constraint organizations_slug_key unique (slug);
  end if;
end $$;

-- RLS (update allowed to active owner/admin)
drop policy if exists org_update_admins on public.organizations;
create policy org_update_admins on public.organizations
for update using (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = organizations.id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner','admin')
  )
);
