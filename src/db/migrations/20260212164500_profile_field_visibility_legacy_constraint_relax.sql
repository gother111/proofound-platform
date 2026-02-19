-- Relax legacy constraints that conflict with profile_id-based visibility rows.
-- This keeps backward compatibility while allowing the current API contract to operate.

ALTER TABLE IF EXISTS public.profile_field_visibility
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE IF EXISTS public.profile_field_visibility
  ALTER COLUMN field_name DROP NOT NULL;
