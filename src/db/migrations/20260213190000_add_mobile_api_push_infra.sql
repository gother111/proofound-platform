-- Mobile API + push delivery infrastructure

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS push_match_suggested boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_intro_accepted boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_message_received boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_verification_requested boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_verification_completed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_assignment_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_interview_scheduled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_contract_signed boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.mobile_device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'ios' CHECK (platform IN ('ios')),
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  enabled boolean NOT NULL DEFAULT true,
  app_version text,
  device_model text,
  os_version text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mobile_device_tokens_user_idx
  ON public.mobile_device_tokens(user_id);

CREATE TABLE IF NOT EXISTS public.push_delivery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  token_id uuid NOT NULL REFERENCES public.mobile_device_tokens(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_code text,
  error_message text,
  apns_id text,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_delivery_attempts_notification_idx
  ON public.push_delivery_attempts(notification_id);

CREATE INDEX IF NOT EXISTS push_delivery_attempts_token_idx
  ON public.push_delivery_attempts(token_id);

CREATE INDEX IF NOT EXISTS push_delivery_attempts_attempted_idx
  ON public.push_delivery_attempts(attempted_at);

ALTER TABLE public.mobile_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_delivery_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mobile tokens - own rows select" ON public.mobile_device_tokens;
CREATE POLICY "Mobile tokens - own rows select"
  ON public.mobile_device_tokens FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Mobile tokens - own rows insert" ON public.mobile_device_tokens;
CREATE POLICY "Mobile tokens - own rows insert"
  ON public.mobile_device_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Mobile tokens - own rows update" ON public.mobile_device_tokens;
CREATE POLICY "Mobile tokens - own rows update"
  ON public.mobile_device_tokens FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Mobile tokens - own rows delete" ON public.mobile_device_tokens;
CREATE POLICY "Mobile tokens - own rows delete"
  ON public.mobile_device_tokens FOR DELETE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Push delivery attempts - own rows select" ON public.push_delivery_attempts;
CREATE POLICY "Push delivery attempts - own rows select"
  ON public.push_delivery_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.mobile_device_tokens t
      WHERE t.id = push_delivery_attempts.token_id
        AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Push delivery attempts - service insert" ON public.push_delivery_attempts;
CREATE POLICY "Push delivery attempts - service insert"
  ON public.push_delivery_attempts FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Push delivery attempts - service update" ON public.push_delivery_attempts;
CREATE POLICY "Push delivery attempts - service update"
  ON public.push_delivery_attempts FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
