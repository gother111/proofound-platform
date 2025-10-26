-- Update handle_new_user function to read persona from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_persona TEXT;
BEGIN
  -- Read persona from user metadata, default to 'unknown'
  user_persona := COALESCE(NEW.raw_user_meta_data->>'persona', 'unknown');
  
  -- Validate persona value
  IF user_persona NOT IN ('individual', 'org_member', 'unknown') THEN
    user_persona := 'unknown';
  END IF;

  INSERT INTO public.profiles (id, display_name, persona, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    user_persona,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

