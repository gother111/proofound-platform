-- Contract-alignment marker migration.
--
-- Purpose:
--   src/db/schema.ts was updated to reference shared domain constants for assignment
--   status and interview platform enum metadata used by Drizzle type generation.
--
-- Runtime impact:
--   No physical table shape change is required for this refactor in canonical SQL.
--   This migration exists to keep schema + migration ledger parity and satisfy drift checks.

SELECT 1;
