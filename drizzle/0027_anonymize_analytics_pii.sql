-- ============================================================================
-- MIGRATION: Anonymize Analytics PII (GDPR Compliance)
-- ============================================================================
-- 
-- Purpose: Replace raw IP addresses and User Agents with SHA-256 hashes
-- GDPR Impact: Moves from Article 4(1) violation to Article 4(5) compliance
-- 
-- Before: Stores raw PII (ip_address, user_agent)
-- After: Stores pseudonymized hashes (ip_hash, user_agent_hash)
-- 
-- Reference: CROSS_DOCUMENT_PRIVACY_AUDIT.md Section 5.4
-- 
-- ⚠️  CRITICAL NOTES:
-- 1. This migration is IRREVERSIBLE - original IPs cannot be recovered
-- 2. Replace ${PII_HASH_SALT} with your actual salt before running
-- 3. Backup your data before running this migration
-- 4. Ensure PII_HASH_SALT environment variable is set in production
-- 
-- ============================================================================

-- Step 1: Add new hashed columns
-- These will store SHA-256 hashes instead of raw PII
ALTER TABLE analytics_events
  ADD COLUMN IF NOT EXISTS ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS user_agent_hash TEXT;

-- Step 2: Migrate existing data (hash current values)
-- WARNING: This is ONE-WAY. Original values will be hashed and cannot be recovered.
-- 
-- ⚠️  BEFORE RUNNING: Replace ${PII_HASH_SALT} with your actual salt value
--    Generate salt with: openssl rand -hex 32
-- 
-- The encode(digest(...), 'hex') function:
-- - digest() creates SHA-256 hash (binary)
-- - encode(..., 'hex') converts binary to 64-character hex string
-- 
UPDATE analytics_events
SET
  ip_hash = CASE
    WHEN ip_address IS NOT NULL AND ip_address != '' 
    THEN encode(digest(ip_address || 'be059d0e80b53a26f6c6c4c5109ce9a91c74c380abc6e07d14351e923200a5d7', 'sha256'), 'hex')
    ELSE NULL
  END,
  user_agent_hash = CASE
    WHEN user_agent IS NOT NULL AND user_agent != ''
    THEN encode(digest(user_agent || 'be059d0e80b53a26f6c6c4c5109ce9a91c74c380abc6e07d14351e923200a5d7', 'sha256'), 'hex')
    ELSE NULL
  END
WHERE ip_address IS NOT NULL OR user_agent IS NOT NULL;

-- Step 3: Verify migration completed successfully
-- This query shows how many rows were migrated
DO $$
DECLARE
  total_events INTEGER;
  migrated_events INTEGER;
  unmigrated_events INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_events FROM analytics_events;
  SELECT COUNT(*) INTO migrated_events FROM analytics_events WHERE ip_hash IS NOT NULL OR user_agent_hash IS NOT NULL;
  SELECT COUNT(*) INTO unmigrated_events FROM analytics_events WHERE ip_address IS NOT NULL AND ip_hash IS NULL;
  
  RAISE NOTICE '✅ Analytics PII Migration Summary:';
  RAISE NOTICE '   Total events: %', total_events;
  RAISE NOTICE '   Migrated events: %', migrated_events;
  RAISE NOTICE '   Unmigrated events: %', unmigrated_events;
  
  IF unmigrated_events > 0 THEN
    RAISE WARNING '⚠️  % events still have raw PII but no hash. Check migration logic.', unmigrated_events;
  ELSE
    RAISE NOTICE '✅ All events successfully migrated!';
  END IF;
END $$;

-- Step 4: Drop old PII columns
-- ⚠️  ONLY RUN THIS AFTER VERIFYING:
--    1. All code has been updated to use ip_hash/user_agent_hash
--    2. No queries reference ip_address/user_agent columns
--    3. Migration verification (Step 3) shows 0 unmigrated events
-- 
-- UNCOMMENT THESE LINES AFTER CODE IS UPDATED:
-- ALTER TABLE analytics_events DROP COLUMN IF EXISTS ip_address;
-- ALTER TABLE analytics_events DROP COLUMN IF EXISTS user_agent;

-- Step 5: Add indexes on hashed columns for query performance
-- These indexes allow fast queries on hashed values (e.g., "find all events from this IP hash")
CREATE INDEX IF NOT EXISTS idx_analytics_events_ip_hash 
  ON analytics_events(ip_hash) 
  WHERE ip_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_agent_hash 
  ON analytics_events(user_agent_hash)
  WHERE user_agent_hash IS NOT NULL;

-- Step 6: Add index on event_type for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type 
  ON analytics_events(event_type);

-- Step 7: Add index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at 
  ON analytics_events(created_at DESC);

-- Step 8: Add composite index for user analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id_created_at 
  ON analytics_events(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- ============================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ============================================================================

-- Query 1: Check that hashes are 64 characters (SHA-256 in hex)
-- Expected: All hashes should be exactly 64 characters
SELECT 
  'Hash Length Check' as check_name,
  COUNT(*) as total_hashes,
  COUNT(*) FILTER (WHERE length(ip_hash) = 64) as valid_ip_hashes,
  COUNT(*) FILTER (WHERE length(user_agent_hash) = 64) as valid_ua_hashes
FROM analytics_events
WHERE ip_hash IS NOT NULL OR user_agent_hash IS NOT NULL;

-- Query 2: Verify no raw IPs remain
-- Expected: 0 rows (all IPs should be hashed)
SELECT 
  'Raw IP Check' as check_name,
  COUNT(*) as raw_ip_count
FROM analytics_events
WHERE ip_address IS NOT NULL;

-- Query 3: Show sample of hashed data
-- Expected: Hashes should look like '3a2f5c8d9e1b4f7a...' (64 hex chars)
SELECT 
  event_type,
  substring(ip_hash, 1, 16) || '...' as ip_hash_sample,
  substring(user_agent_hash, 1, 16) || '...' as ua_hash_sample,
  created_at
FROM analytics_events
WHERE ip_hash IS NOT NULL
LIMIT 5;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed before dropping columns)
-- ============================================================================
-- 
-- If you need to rollback BEFORE dropping the old columns:
-- 
-- 1. The old ip_address and user_agent columns still exist
-- 2. Simply drop the new columns:
--    ALTER TABLE analytics_events DROP COLUMN ip_hash;
--    ALTER TABLE analytics_events DROP COLUMN user_agent_hash;
-- 
-- If you need to rollback AFTER dropping the old columns:
-- 
-- 1. You CANNOT recover the original IPs (one-way hash)
-- 2. Restore from database backup taken before migration
-- 
-- ============================================================================

