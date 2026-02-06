-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251025222244
-- name: fix_function_search_paths
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Phase 4: Fix Function Security (Search Path)
-- Set explicit search_path on functions to prevent search_path attacks

-- Fix handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';

-- Fix update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';

-- Fix handle_updated_at
ALTER FUNCTION public.handle_updated_at() SET search_path = 'public';
