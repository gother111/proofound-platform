-- ============================================================================
-- Protect profiles.platform_role From Client Writes
-- Migration: 20260208235500_profiles_platform_role_protect
-- Date: 2026-02-08
--
-- Purpose:
-- Supabase projects commonly grant table-level INSERT/UPDATE to anon/authenticated
-- and rely on RLS for row scoping. Because platform_role is security-critical,
-- enforce server-only writes with a trigger, independent of GRANTs.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_platform_role_server_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.platform_role IS NOT NULL THEN
        RAISE EXCEPTION 'platform_role is server-managed' USING ERRCODE = '42501';
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.platform_role IS DISTINCT FROM OLD.platform_role THEN
        RAISE EXCEPTION 'platform_role is server-managed' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_platform_role_on_insert ON public.profiles;
CREATE TRIGGER enforce_platform_role_on_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_platform_role_server_only();

DROP TRIGGER IF EXISTS enforce_platform_role_on_update ON public.profiles;
CREATE TRIGGER enforce_platform_role_on_update
BEFORE UPDATE OF platform_role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_platform_role_server_only();

