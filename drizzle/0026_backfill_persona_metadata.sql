-- Backfill persona metadata for existing users
-- This migration ensures that all existing users have their persona stored in auth.users.raw_user_meta_data
-- so that the trigger works correctly for future operations

UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN 
      jsonb_build_object('persona', p.persona)
    ELSE 
      raw_user_meta_data || jsonb_build_object('persona', p.persona)
  END
FROM profiles p
WHERE auth.users.id = p.id
  AND p.persona IS NOT NULL
  AND p.persona != 'unknown'
  AND (raw_user_meta_data->>'persona' IS NULL OR raw_user_meta_data->>'persona' = '');

