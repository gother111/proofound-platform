-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251031112455
-- name: fix_is_org_member_use_bypass
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Use a completely different approach: check organization_members using SECURITY DEFINER
-- with explicit RLS bypass by querying the table directly without policy evaluation

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- SECURITY DEFINER functions run with the privileges of the function owner
  -- and should bypass RLS when querying tables directly
  -- Use explicit table qualification and simple query
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members
    WHERE org_id = p_org_id
      AND user_id = p_user_id
      AND status = 'active'
  );
$$;

-- Ensure the function owner has necessary privileges
-- The function should already bypass RLS as SECURITY DEFINER
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) TO anon;
