-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251025222256
-- name: fix_remaining_function_search_paths
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Fix remaining function search_path issues
-- Set explicit search_path on dentity and doentity functions

-- Fix dentity function
ALTER FUNCTION public.dentity() SET search_path = 'public';

-- Fix doentity function  
ALTER FUNCTION public.doentity() SET search_path = 'public';
