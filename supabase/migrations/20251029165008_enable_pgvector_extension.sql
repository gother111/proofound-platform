-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251029165008
-- name: enable_pgvector_extension
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;
