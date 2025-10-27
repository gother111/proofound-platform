-- Create subscription_waitlist table
CREATE TABLE IF NOT EXISTS subscription_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  product_interest TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('individual', 'organization')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_waitlist_email ON subscription_waitlist(email);

-- Create index on product_interest
CREATE INDEX IF NOT EXISTS idx_subscription_waitlist_product ON subscription_waitlist(product_interest);

-- Enable RLS
ALTER TABLE subscription_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow insert for everyone (public can join waitlist)
CREATE POLICY "Anyone can join waitlist"
  ON subscription_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read waitlist
CREATE POLICY "Only admins can read waitlist"
  ON subscription_waitlist
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Add comment
COMMENT ON TABLE subscription_waitlist IS 'Stores subscription waitlist signups';
