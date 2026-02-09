-- Fix remaining function search_path issues
-- Set explicit search_path on dentity and doentity functions

-- Fix dentity function
ALTER FUNCTION public.dentity() SET search_path = 'public';

-- Fix doentity function  
ALTER FUNCTION public.doentity() SET search_path = 'public';
