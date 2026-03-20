CREATE TABLE IF NOT EXISTS public.internal_ops_queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  linked_entity_type TEXT NOT NULL,
  linked_entity_id UUID NOT NULL,
  summary TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_actor_type TEXT NOT NULL,
  created_by_actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by_actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT internal_ops_queue_items_queue_type_check CHECK (
    queue_type IN ('verification', 'privacy_reveal_exception', 'correction_revocation', 'pilot_ops')
  ),
  CONSTRAINT internal_ops_queue_items_status_check CHECK (
    status IN ('open', 'in_progress', 'resolved', 'cancelled')
  ),
  CONSTRAINT internal_ops_queue_items_priority_check CHECK (
    priority IN ('low', 'normal', 'high', 'urgent')
  ),
  CONSTRAINT internal_ops_queue_items_linked_entity_type_check CHECK (
    linked_entity_type IN (
      'verification_request',
      'verification_bundle',
      'conversation',
      'decision',
      'engagement_verification',
      'match',
      'organization'
    )
  )
);

CREATE INDEX IF NOT EXISTS internal_ops_queue_type_status_idx
  ON public.internal_ops_queue_items (queue_type, status);

CREATE INDEX IF NOT EXISTS internal_ops_queue_linked_entity_idx
  ON public.internal_ops_queue_items (linked_entity_type, linked_entity_id, status);
