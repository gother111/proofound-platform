CREATE TABLE IF NOT EXISTS public.capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_record_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  privacy_level text NOT NULL DEFAULT 'team' CHECK (privacy_level IN ('only_me','team','organization','public')),
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','pending','verified','rejected')),
  verification_source text,
  summary text,
  highlights text[] DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_count integer NOT NULL DEFAULT 0 CHECK (evidence_count >= 0),
  last_validated_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT capabilities_profile_skill_unique UNIQUE (profile_id, skill_record_id)
);

CREATE TABLE IF NOT EXISTS public.evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_id uuid NOT NULL REFERENCES public.capabilities(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  evidence_type text NOT NULL DEFAULT 'document' CHECK (evidence_type IN ('document','link','assessment','peer_review','credential')),
  url text,
  file_path text,
  issued_at timestamp,
  verified boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT evidence_url_or_file CHECK (url IS NOT NULL OR file_path IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.skill_endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_id uuid NOT NULL REFERENCES public.capabilities(id) ON DELETE CASCADE,
  endorser_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','revoked')),
  visibility text NOT NULL DEFAULT 'owner_only' CHECK (visibility IN ('private','owner_only','shared','public')),
  responded_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT skill_endorsements_unique UNIQUE (capability_id, endorser_profile_id)
);

CREATE TABLE IF NOT EXISTS public.growth_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  capability_id uuid REFERENCES public.capabilities(id) ON DELETE SET NULL,
  title text NOT NULL,
  goal text,
  target_level integer,
  target_date date,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','blocked','completed','archived')),
  milestones jsonb NOT NULL DEFAULT '[]'::jsonb,
  support_needs text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT growth_plans_target_level_check CHECK (target_level IS NULL OR target_level BETWEEN 0 AND 5)
);
