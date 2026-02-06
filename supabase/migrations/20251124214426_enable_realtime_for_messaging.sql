-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251124214426
-- name: enable_realtime_for_messaging
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Enable Supabase Realtime for messaging tables
-- This allows real-time subscriptions to new messages and conversation updates

-- Add messages table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Add conversations table to realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Enable replica identity full for better real-time event data
-- This ensures UPDATE and DELETE events include full row data
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;
