-- Update the platform constraint to include 'manual' option
ALTER TABLE interviews DROP CONSTRAINT IF EXISTS interviews_platform_check;

ALTER TABLE interviews ADD CONSTRAINT interviews_platform_check 
CHECK (platform = ANY (ARRAY['zoom'::text, 'google_meet'::text, 'manual'::text]));
