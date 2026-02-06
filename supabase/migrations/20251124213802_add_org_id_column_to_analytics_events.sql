-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251124213802
-- name: add_org_id_column_to_analytics_events
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================

-- Add org_id column to analytics_events table (schema expects org_id but table has organization_id)
-- Adding org_id as an alias column to match the Drizzle schema

ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Copy data from organization_id to org_id if organization_id exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'analytics_events' AND column_name = 'organization_id') THEN
        UPDATE analytics_events SET org_id = organization_id WHERE org_id IS NULL;
    END IF;
END $$;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_analytics_events_org_id ON analytics_events(org_id);
