ALTER TABLE public.internal_ops_queue_items
  DROP CONSTRAINT IF EXISTS internal_ops_queue_items_linked_entity_type_check;

ALTER TABLE public.internal_ops_queue_items
  ADD CONSTRAINT internal_ops_queue_items_linked_entity_type_check CHECK (
    linked_entity_type IN (
      'verification_request',
      'verification_bundle',
      'conversation',
      'decision',
      'engagement_verification',
      'match',
      'organization',
      'uploaded_file'
    )
  );
