create table if not exists organization_slug_history (
  id bigserial primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  old_slug text not null,
  changed_at timestamptz not null default now()
);

create index if not exists idx_org_slug_history_old_slug
  on organization_slug_history(old_slug);
