-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251104140504
-- name: add_org_impact_and_visibility
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Migration: Add impact_entries to organizations and create organization_field_visibility table
-- Date: 2025-01-04

-- Add impact_entries column to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS impact_entries JSONB DEFAULT '[]'::jsonb;

-- Create organization_field_visibility table for granular privacy controls
CREATE TABLE IF NOT EXISTS organization_field_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'public',
  mission TEXT NOT NULL DEFAULT 'public',
  vision TEXT NOT NULL DEFAULT 'public',
  causes TEXT NOT NULL DEFAULT 'public',
  work_culture TEXT NOT NULL DEFAULT 'post_match',
  structure TEXT NOT NULL DEFAULT 'post_match',
  projects TEXT NOT NULL DEFAULT 'post_match',
  partnerships TEXT NOT NULL DEFAULT 'post_match',
  goals TEXT NOT NULL DEFAULT 'post_match',
  impact TEXT NOT NULL DEFAULT 'post_match',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add comment to document visibility levels
COMMENT ON TABLE organization_field_visibility IS 'Granular field-level visibility controls for organizations. Visibility levels: public (anyone), post_match (after matching), post_conversation_start (after conversation starts), internal_only (org members only)';

-- Create index on org_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_org_field_visibility_org_id ON organization_field_visibility(org_id);

-- Add comment to impact_entries column
COMMENT ON COLUMN organizations.impact_entries IS 'JSONB array storing impact entries with metrics, timeframes, and outcomes';
