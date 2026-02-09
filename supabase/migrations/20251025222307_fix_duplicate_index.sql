-- Fix duplicate index on skills table
-- Drop the duplicate index, keeping the more descriptive one

DROP INDEX IF EXISTS public.idx_skills_profile;
