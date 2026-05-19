BEGIN;

ALTER TABLE public.interviews
  DROP CONSTRAINT IF EXISTS interviews_platform_check;

ALTER TABLE public.interviews
  ADD CONSTRAINT interviews_platform_check
  CHECK (platform IN ('manual', 'google_meet', 'zoom', 'google'));

COMMENT ON COLUMN public.interviews.platform IS
  'Launch-active values are manual and google_meet. zoom and google are retained only for legacy compatibility.';

COMMIT;
