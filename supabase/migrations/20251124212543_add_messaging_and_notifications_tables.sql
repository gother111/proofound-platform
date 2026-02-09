-- Create conversations table for privacy-first messaging
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  
  -- Participants
  participant_one_id UUID NOT NULL REFERENCES profiles(id),
  participant_two_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Staged reveal control
  stage TEXT DEFAULT 'masked' CHECK (stage IN ('masked', 'revealed')),
  revealed_at TIMESTAMP,
  
  -- Masked identifiers (Stage 1)
  masked_handle_one TEXT,  -- "Contributor #123"
  masked_handle_two TEXT,  -- "Organization Representative"
  
  -- Reveal requests
  participant_one_wants_reveal BOOLEAN DEFAULT FALSE,
  participant_two_wants_reveal BOOLEAN DEFAULT FALSE,
  participant_one_reveal_requested_at TIMESTAMP,
  participant_two_reveal_requested_at TIMESTAMP,
  
  -- Metadata
  last_message_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create messages table for text-only messaging with PII detection
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Message content (2000 char limit per PRD)
  content TEXT NOT NULL,
  
  -- PII detection flags
  contains_email BOOLEAN DEFAULT FALSE,
  contains_phone BOOLEAN DEFAULT FALSE,
  contains_url BOOLEAN DEFAULT FALSE,
  pii_warning_shown BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  read_at TIMESTAMP,
  edited_at TIMESTAMP,
  
  -- Message status
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'deleted'))
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification type and content
  type TEXT NOT NULL CHECK (type IN (
    'match_suggested',
    'intro_accepted',
    'message_received',
    'verification_requested',
    'verification_completed',
    'assignment_published',
    'interview_scheduled',
    'contract_signed'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Links and metadata
  action_url TEXT,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  read BOOLEAN DEFAULT FALSE NOT NULL,
  read_at TIMESTAMP,
  
  -- Audit fields
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- In-app notification preferences (by type)
  in_app_match_suggested BOOLEAN DEFAULT TRUE NOT NULL,
  in_app_intro_accepted BOOLEAN DEFAULT TRUE NOT NULL,
  in_app_message_received BOOLEAN DEFAULT TRUE NOT NULL,
  in_app_verification_requested BOOLEAN DEFAULT TRUE NOT NULL,
  in_app_verification_completed BOOLEAN DEFAULT TRUE NOT NULL,
  in_app_assignment_published BOOLEAN DEFAULT TRUE NOT NULL,
  in_app_interview_scheduled BOOLEAN DEFAULT TRUE NOT NULL,
  in_app_contract_signed BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Email notification preferences (by type)
  email_match_suggested BOOLEAN DEFAULT TRUE NOT NULL,
  email_intro_accepted BOOLEAN DEFAULT TRUE NOT NULL,
  email_message_received BOOLEAN DEFAULT FALSE NOT NULL,
  email_verification_requested BOOLEAN DEFAULT TRUE NOT NULL,
  email_verification_completed BOOLEAN DEFAULT TRUE NOT NULL,
  email_assignment_published BOOLEAN DEFAULT TRUE NOT NULL,
  email_interview_scheduled BOOLEAN DEFAULT TRUE NOT NULL,
  email_contract_signed BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Audit fields
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant_one ON conversations(participant_one_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_two ON conversations(participant_two_id);
CREATE INDEX IF NOT EXISTS idx_conversations_match_id ON conversations(match_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assignment_id ON conversations(assignment_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (
    auth.uid() = participant_one_id OR auth.uid() = participant_two_id
  );

CREATE POLICY "Users can create conversations they participate in" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant_one_id OR auth.uid() = participant_two_id
  );

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (
    auth.uid() = participant_one_id OR auth.uid() = participant_two_id
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = messages.conversation_id 
      AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id 
      AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own notification preferences" ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- Add comment for documentation
COMMENT ON TABLE conversations IS 'Privacy-first messaging with staged identity reveal. Stage 1: masked handles, Stage 2: full profiles revealed after mutual consent.';
COMMENT ON TABLE messages IS 'Text-only messages with 2000 character limit. PII detection flags warn users about sharing sensitive information.';
COMMENT ON TABLE notifications IS 'In-app notifications for various platform events.';
COMMENT ON TABLE notification_preferences IS 'User preferences for in-app and email notifications by type.';
