-- Create profile_field_visibility table for controlling what fields are shown to organizations
CREATE TABLE IF NOT EXISTS profile_field_visibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, field_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profile_field_visibility_user_id ON profile_field_visibility(user_id);

-- Enable RLS
ALTER TABLE profile_field_visibility ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can read their own visibility settings
CREATE POLICY "Users can view their own field visibility"
ON profile_field_visibility
FOR SELECT
USING (auth.uid() = user_id);

-- RLS policy: users can update their own visibility settings
CREATE POLICY "Users can update their own field visibility"
ON profile_field_visibility
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policy: users can insert their own visibility settings
CREATE POLICY "Users can insert their own field visibility"
ON profile_field_visibility
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policy: users can delete their own visibility settings
CREATE POLICY "Users can delete their own field visibility"
ON profile_field_visibility
FOR DELETE
USING (auth.uid() = user_id);
