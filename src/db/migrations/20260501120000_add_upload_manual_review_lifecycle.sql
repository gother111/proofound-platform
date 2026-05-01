BEGIN;

ALTER TABLE public.uploaded_files
  DROP CONSTRAINT IF EXISTS uploaded_files_safety_status_ck;

ALTER TABLE public.uploaded_files
  ADD CONSTRAINT uploaded_files_safety_status_ck
  CHECK (
    safety_status IN (
      'pending',
      'clean',
      'approved_after_manual_review',
      'rejected',
      'failed',
      'manual_review'
    )
  );

ALTER TABLE public.uploaded_file_events
  DROP CONSTRAINT IF EXISTS uploaded_file_events_type_ck;

ALTER TABLE public.uploaded_file_events
  ADD CONSTRAINT uploaded_file_events_type_ck
  CHECK (
    event_type IN (
      'received',
      'validated',
      'scan_clean',
      'scan_failed',
      'promotion_started',
      'promoted_private',
      'promoted_public',
      'attach_blocked',
      'manual_review_approved',
      'manual_review_rejected',
      'deleted',
      'cleanup_failed'
    )
  );

COMMIT;
