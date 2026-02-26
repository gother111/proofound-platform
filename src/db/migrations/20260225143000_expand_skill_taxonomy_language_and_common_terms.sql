-- Migration: Historical backfill marker for taxonomy language/common-terms wave
-- Date: 2026-02-25
-- Purpose:
--   - Reconcile canonical migration ledger parity for version
--     20260225143000_expand_skill_taxonomy_language_and_common_terms.
--   - Preserve deterministic migration ordering without mutating schema/data.
--
-- Note:
--   The original SQL body for this historical version was not recoverable from
--   repository history. This marker is intentionally a no-op and exists solely
--   for ledger parity with already-applied environments.

DO $$
BEGIN
  RAISE NOTICE 'No-op historical backfill marker: 20260225143000_expand_skill_taxonomy_language_and_common_terms';
END;
$$;
