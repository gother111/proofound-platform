-- Phase 4: Fix Function Security (Search Path)
-- Set explicit search_path on functions to prevent search_path attacks

-- Fix handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';

-- Fix update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';

-- Fix handle_updated_at
ALTER FUNCTION public.handle_updated_at() SET search_path = 'public';
