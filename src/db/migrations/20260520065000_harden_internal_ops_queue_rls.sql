BEGIN;

ALTER TABLE public.internal_ops_queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_ops_queue_items FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.internal_ops_queue_items FROM anon;
REVOKE ALL ON TABLE public.internal_ops_queue_items FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.internal_ops_queue_items TO service_role;

DROP POLICY IF EXISTS internal_ops_queue_items_service_select ON public.internal_ops_queue_items;
CREATE POLICY internal_ops_queue_items_service_select
  ON public.internal_ops_queue_items
  FOR SELECT
  TO service_role
  USING (true);

DROP POLICY IF EXISTS internal_ops_queue_items_service_insert ON public.internal_ops_queue_items;
CREATE POLICY internal_ops_queue_items_service_insert
  ON public.internal_ops_queue_items
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS internal_ops_queue_items_service_update ON public.internal_ops_queue_items;
CREATE POLICY internal_ops_queue_items_service_update
  ON public.internal_ops_queue_items
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS internal_ops_queue_items_service_delete ON public.internal_ops_queue_items;
CREATE POLICY internal_ops_queue_items_service_delete
  ON public.internal_ops_queue_items
  FOR DELETE
  TO service_role
  USING (true);

COMMENT ON TABLE public.internal_ops_queue_items IS
  'Internal launch-ops queue. Access is server-side/service-role only; client-facing admin APIs must return minimum-necessary DTOs.';

COMMIT;
