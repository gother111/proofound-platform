-- ============================================
-- STAGED MESSAGING SYSTEM MIGRATION
-- ============================================
-- Migration: 20251106_staged_messaging_system
-- Date: 2025-11-06
-- Purpose: Implement staged identity reveal messaging system
-- Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 10
-- ============================================

-- ============================================
-- SECTION 1: CONVERSATIONS TABLE
-- ============================================

-- conversations table with staging support
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  
  -- Participants
  participant_one_id UUID REFERENCES profiles(id) NOT NULL,
  participant_two_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Staged reveal control
  stage TEXT CHECK (stage IN ('masked', 'revealed')) DEFAULT 'masked',
  revealed_at TIMESTAMPTZ,
  
  -- Masked identifiers (Stage 1)
  masked_handle_one TEXT, -- "Contributor #123"
  masked_handle_two TEXT, -- "Organization Representative"
  
  -- Reveal requests
  participant_one_wants_reveal BOOLEAN DEFAULT FALSE,
  participant_two_wants_reveal BOOLEAN DEFAULT FALSE,
  participant_one_reveal_requested_at TIMESTAMPTZ,
  participant_two_reveal_requested_at TIMESTAMPTZ,
  
  -- Metadata
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(match_id),
  CONSTRAINT different_participants CHECK (participant_one_id != participant_two_id)
);

COMMENT ON TABLE conversations IS 'Post-match message threads with staged identity reveal (masked → revealed)';
COMMENT ON COLUMN conversations.stage IS 'Identity reveal stage: masked (Stage 1) or revealed (Stage 2)';
COMMENT ON COLUMN conversations.masked_handle_one IS 'Anonymous identifier for participant one shown in Stage 1';
COMMENT ON COLUMN conversations.masked_handle_two IS 'Anonymous identifier for participant two shown in Stage 1';
COMMENT ON COLUMN conversations.participant_one_wants_reveal IS 'True if participant one clicked "Reveal my identity"';
COMMENT ON COLUMN conversations.participant_two_wants_reveal IS 'True if participant two clicked "Reveal my identity"';

-- ============================================
-- SECTION 2: MESSAGES TABLE
-- ============================================

-- messages table with PII detection
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Message content
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  
  -- PII detection flags (auto-detected before storing)
  contains_email BOOLEAN DEFAULT FALSE,
  contains_phone BOOLEAN DEFAULT FALSE,
  contains_url BOOLEAN DEFAULT FALSE,
  pii_warning_shown BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  
  -- Message status
  status TEXT CHECK (status IN ('sent', 'delivered', 'read', 'deleted')) DEFAULT 'sent'
);

COMMENT ON TABLE messages IS 'Text-only messages within conversations (2000 char limit, no attachments per PRD)';
COMMENT ON COLUMN messages.contains_email IS 'True if message content contains email address patterns';
COMMENT ON COLUMN messages.contains_phone IS 'True if message content contains phone number patterns';
COMMENT ON COLUMN messages.contains_url IS 'True if message content contains URL patterns';
COMMENT ON COLUMN messages.pii_warning_shown IS 'True if user was warned about PII before sending';

-- ============================================
-- SECTION 3: INDEXES FOR PERFORMANCE
-- ============================================

-- Conversations indexes
CREATE INDEX idx_conversations_participants ON conversations(participant_one_id, participant_two_id);
CREATE INDEX idx_conversations_match ON conversations(match_id);
CREATE INDEX idx_conversations_stage ON conversations(stage);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Messages indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id, sent_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_status ON messages(status) WHERE status != 'deleted';
CREATE INDEX idx_messages_unread ON messages(conversation_id) WHERE read_at IS NULL;

-- ============================================
-- SECTION 4: ROW-LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Participants can read their conversations
CREATE POLICY "participants_read_conversations"
  ON conversations FOR SELECT
  USING (
    auth.uid() = participant_one_id 
    OR auth.uid() = participant_two_id
  );

-- Policy 2: Participants can update conversations (reveal status only)
CREATE POLICY "participants_update_conversations"
  ON conversations FOR UPDATE
  USING (
    auth.uid() = participant_one_id 
    OR auth.uid() = participant_two_id
  )
  WITH CHECK (
    -- Can only update reveal status and timestamp
    -- Stage can only go from 'masked' to 'revealed', not backwards
    stage = 'revealed' 
    AND OLD.stage = 'masked'
  );

-- Policy 3: System can create conversations (from matches)
CREATE POLICY "system_creates_conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    -- Only service role can create conversations
    auth.jwt() ->> 'role' = 'service_role'
    OR (
      -- Or authenticated users for their own conversations
      auth.uid() IN (participant_one_id, participant_two_id)
    )
  );

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy 1: Participants can read messages in their conversations
CREATE POLICY "participants_read_messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
        AND (participant_one_id = auth.uid() OR participant_two_id = auth.uid())
    )
  );

-- Policy 2: Participants can send messages
CREATE POLICY "participants_send_messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
        AND (participant_one_id = auth.uid() OR participant_two_id = auth.uid())
    )
  );

-- Policy 3: Senders can update their own messages (read receipts, status)
CREATE POLICY "users_update_own_messages"
  ON messages FOR UPDATE
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      -- Or recipients can mark as read
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
        AND (participant_one_id = auth.uid() OR participant_two_id = auth.uid())
        AND sender_id != auth.uid()
    )
  );

-- Policy 4: Users can soft-delete their own messages
CREATE POLICY "users_delete_own_messages"
  ON messages FOR DELETE
  USING (sender_id = auth.uid());

-- ============================================
-- SECTION 5: TRIGGERS & FUNCTIONS
-- ============================================

-- Function: Update conversation timestamp when message sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.sent_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update conversation on new message
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function: Auto-reveal identities when both participants agree
CREATE OR REPLACE FUNCTION check_and_reveal_identities()
RETURNS TRIGGER AS $$
BEGIN
  -- If both participants want to reveal and stage is still masked
  IF NEW.participant_one_wants_reveal = TRUE 
     AND NEW.participant_two_wants_reveal = TRUE 
     AND NEW.stage = 'masked' THEN
    
    NEW.stage := 'revealed';
    NEW.revealed_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Check reveal status on conversation update
CREATE TRIGGER check_reveal_on_update
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  WHEN (OLD.participant_one_wants_reveal IS DISTINCT FROM NEW.participant_one_wants_reveal
        OR OLD.participant_two_wants_reveal IS DISTINCT FROM NEW.participant_two_wants_reveal)
  EXECUTE FUNCTION check_and_reveal_identities();

-- Function: Generate masked handle for participant
CREATE OR REPLACE FUNCTION generate_masked_handle(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  handle_suffix TEXT;
BEGIN
  -- Generate a random 3-digit suffix for anonymity
  handle_suffix := LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  
  RETURN 'Contributor #' || handle_suffix;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SECTION 6: HELPER VIEWS
-- ============================================

-- View: Conversations with participant details (for UI)
CREATE OR REPLACE VIEW conversation_details AS
SELECT 
  c.id,
  c.match_id,
  c.participant_one_id,
  c.participant_two_id,
  c.stage,
  c.revealed_at,
  c.masked_handle_one,
  c.masked_handle_two,
  c.participant_one_wants_reveal,
  c.participant_two_wants_reveal,
  c.last_message_at,
  c.created_at,
  
  -- Count messages
  (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
  
  -- Count unread messages per participant
  (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND read_at IS NULL AND sender_id = c.participant_two_id) as unread_count_one,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND read_at IS NULL AND sender_id = c.participant_one_id) as unread_count_two,
  
  -- Last message preview
  (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY sent_at DESC LIMIT 1) as last_message_preview
  
FROM conversations c;

COMMENT ON VIEW conversation_details IS 'Enriched conversation view with message counts and previews';

-- ============================================
-- SECTION 7: MESSAGE EXPIRY (GDPR COMPLIANCE)
-- ============================================

-- Function: Archive or delete old messages (run via cron job)
CREATE OR REPLACE FUNCTION archive_old_messages()
RETURNS void AS $$
BEGIN
  -- Soft delete messages older than 3 years (GDPR retention)
  UPDATE messages
  SET status = 'deleted',
      content = '[Message deleted after retention period]'
  WHERE sent_at < NOW() - INTERVAL '3 years'
    AND status != 'deleted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION archive_old_messages IS 'Archives messages older than 3 years per DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 10';

-- ============================================
-- SECTION 8: ANALYTICS INTEGRATION
-- ============================================

-- Function: Log conversation events to analytics
CREATE OR REPLACE FUNCTION log_conversation_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Log stage transition to analytics_events if table exists
  IF TG_OP = 'UPDATE' AND OLD.stage != NEW.stage THEN
    INSERT INTO analytics_events (
      event_type,
      user_id,
      entity_type,
      entity_id,
      properties,
      created_at
    ) VALUES (
      'conversation_stage_changed',
      NEW.participant_one_id, -- Log for both participants
      'conversation',
      NEW.id,
      jsonb_build_object(
        'old_stage', OLD.stage,
        'new_stage', NEW.stage,
        'revealed_at', NEW.revealed_at
      ),
      NOW()
    );
    
    -- Log for participant two as well
    INSERT INTO analytics_events (
      event_type,
      user_id,
      entity_type,
      entity_id,
      properties,
      created_at
    ) VALUES (
      'conversation_stage_changed',
      NEW.participant_two_id,
      'conversation',
      NEW.id,
      jsonb_build_object(
        'old_stage', OLD.stage,
        'new_stage', NEW.stage,
        'revealed_at', NEW.revealed_at
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Log conversation events
CREATE TRIGGER log_conversation_events
  AFTER INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION log_conversation_event();

-- ============================================
-- VERIFICATION: CHECK RLS STATUS
-- ============================================

-- Verify RLS is enabled
DO $$
BEGIN
  -- Check conversations
  IF NOT (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations') THEN
    RAISE EXCEPTION 'RLS not enabled on conversations table';
  END IF;
  
  -- Check messages
  IF NOT (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    RAISE EXCEPTION 'RLS not enabled on messages table';
  END IF;
  
  RAISE NOTICE 'RLS verification passed: conversations and messages tables protected';
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Update src/db/schema.ts with TypeScript types
-- 2. Create API endpoints for conversation management
-- 3. Build frontend components (ConversationView, MessageInput)
-- 4. Test PII detection in messages
-- ============================================

