alter table organizations
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
  add column if not exists commitments jsonb,
  add column if not exists website_url text,
  add column if not exists social_urls jsonb;

-- Allow owners/admins of an org to update it
DROP POLICY IF EXISTS org_update_admins ON organizations;
CREATE POLICY org_update_admins ON organizations
FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM organization_members m
    WHERE m.organization_id = organizations.id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.role IN ('owner', 'admin')
  )
);
