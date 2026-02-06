-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251031112443
-- name: improve_is_org_member_function_replace
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Improve the is_org_member function using CREATE OR REPLACE
-- This will update the function without dropping dependent policies

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  result BOOLEAN;
BEGIN
  -- Disable RLS explicitly for this session using set_config
  PERFORM set_config('row_security', 'off', true);
  
  -- Query with explicit schema qualification
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members
    WHERE organization_members.org_id = p_org_id
      AND organization_members.user_id = p_user_id
      AND organization_members.status = 'active'
  ) INTO result;
  
  RETURN COALESCE(result, false);
END;
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) TO anon;
