-- Create Admin User Script
-- This script helps you set up an admin user for the Proofound MVP platform

-- ============================================================================
-- OPTION 1: Make an EXISTING user an admin
-- ============================================================================
-- Replace 'user@example.com' with the email address of the user you want to make admin
-- This user must already exist in your auth.users table (they must have signed up first)

UPDATE profiles
SET is_admin = true
WHERE email = 'admin@proofound.com'; -- CHANGE THIS EMAIL

-- Verify the update
SELECT id, email, full_name, is_admin, account_type
FROM profiles
WHERE email = 'admin@proofound.com'; -- CHANGE THIS EMAIL

-- ============================================================================
-- OPTION 2: Create a NEW admin user directly (Advanced)
-- ============================================================================
-- IMPORTANT: This approach requires you to manually create the user in Supabase Auth first
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" and create a user with email and password
-- 3. Copy the user's UUID
-- 4. Then run the following query, replacing the UUID and email:

-- Example (DO NOT RUN AS-IS, replace with your actual UUID):
/*
INSERT INTO profiles (
  id,
  email,
  full_name,
  account_type,
  is_admin,
  profile_completion_percentage,
  created_at,
  updated_at
) VALUES (
  'YOUR-USER-UUID-HERE'::uuid, -- Replace with the UUID from Supabase Auth
  'admin@proofound.com',        -- Admin email
  'Admin User',                  -- Admin name
  'individual',                  -- Account type
  true,                          -- is_admin = true
  100,                           -- Profile completion
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET is_admin = true;
*/

-- ============================================================================
-- VERIFY ADMIN ACCESS
-- ============================================================================
-- Run this query to see all admin users
SELECT
  id,
  email,
  full_name,
  account_type,
  is_admin,
  created_at
FROM profiles
WHERE is_admin = true
ORDER BY created_at DESC;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
--
-- RECOMMENDED APPROACH:
-- 1. First, sign up a regular user at your application (e.g., admin@proofound.com)
-- 2. Then run OPTION 1 above to make that user an admin
-- 3. Log in with that user to access the admin dashboard at /admin
--
-- After running this migration:
-- - The admin user can access /admin route
-- - They will see the Admin Dashboard with moderation queue
-- - They can view reports, analytics, and manage users
--
-- SECURITY NOTE:
-- - Keep admin credentials secure
-- - Don't commit this file with real email addresses
-- - Consider using environment variables for admin emails in production
--
