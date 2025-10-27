-- ============================================================================
-- CREATE DEMO USERS WITH AUTH
-- ============================================================================
-- This script creates Supabase Auth users AND profiles that you can log in with
-- Run this in Supabase SQL Editor
-- ============================================================================

-- IMPORTANT: Replace 'CHANGE_THIS_PASSWORD' with your desired demo password
-- All demo users will use the same password for easy testing

BEGIN;

-- ============================================================================
-- DEMO USER 1: INDIVIDUAL - SIMPLE TEST USER
-- ============================================================================

-- Create auth user (this will generate a UUID)
-- Note: In Supabase, you typically create auth users via Dashboard or API
-- This SQL approach may not work depending on your Supabase setup
-- If this fails, use the Dashboard method below

-- For now, let's create profiles with placeholder IDs
-- You'll need to create the auth users manually first

-- ============================================================================
-- INSTRUCTIONS TO CREATE WORKING DEMO USERS
-- ============================================================================

/*

STEP 1: Create Auth Users in Supabase Dashboard
================================================

1. Go to: https://app.supabase.com
2. Select your Proofound project
3. Click "Authentication" → "Users" in sidebar
4. Click "Add User" button
5. For each user below:
   - Choose "Create new user"
   - Enter email
   - Enter password: Demo123!
   - Click "Create User"
   - COPY THE USER ID (UUID) that appears

CREATE THESE USERS:
-------------------
Email: demo@proofound.com
Password: Demo123!

Email: sofia.martinez@proofound.com
Password: Demo123!

Email: james.chen@proofound.com
Password: Demo123!


STEP 2: Create Profiles with Those User IDs
============================================

After creating auth users, run these INSERT statements
Replace 'YOUR-USER-ID-HERE' with the actual UUIDs from Step 1

*/

-- Demo User 1: Simple Individual Profile
INSERT INTO profiles (
  id, -- Use the UUID from Supabase Auth user you just created
  full_name,
  email,
  account_type,
  region,
  professional_summary,
  availability_status,
  available_for_match,
  profile_completion_percentage,
  profile_ready_for_match,
  created_at,
  updated_at
) VALUES (
  'REPLACE-WITH-AUTH-USER-ID-1'::uuid, -- Get this from Supabase Dashboard
  'Demo User',
  'demo@proofound.com',
  'individual',
  'San Francisco, CA',
  'A demo user for testing the Proofound platform.',
  'open_to_opportunities',
  true,
  60,
  true,
  NOW(),
  NOW()
);

-- Demo User 2: Sofia Martinez (from seed file)
INSERT INTO profiles (
  id,
  full_name,
  email,
  account_type,
  region,
  timezone,
  mission,
  professional_summary,
  industry,
  languages,
  availability_status,
  available_for_match,
  salary_band_min,
  salary_band_max,
  profile_completion_percentage,
  profile_ready_for_match,
  created_at,
  updated_at
) VALUES (
  'REPLACE-WITH-AUTH-USER-ID-2'::uuid,
  'Sofia Martinez',
  'sofia.martinez@proofound.com',
  'individual',
  'Barcelona, Spain',
  'Europe/Madrid',
  'To create digital experiences that are accessible and empowering for everyone.',
  'UX designer with 8 years of experience specializing in accessibility and inclusive design.',
  ARRAY['Design & UX', 'Technology', 'Education'],
  ARRAY['Spanish (Native)', 'English (Fluent)', 'Catalan (Native)'],
  'open_to_opportunities',
  true,
  65000,
  85000,
  85,
  true,
  NOW(),
  NOW()
);

-- Demo User 3: James Chen
INSERT INTO profiles (
  id,
  full_name,
  email,
  account_type,
  region,
  timezone,
  mission,
  professional_summary,
  industry,
  languages,
  availability_status,
  available_for_match,
  salary_band_min,
  salary_band_max,
  profile_completion_percentage,
  profile_ready_for_match,
  created_at,
  updated_at
) VALUES (
  'REPLACE-WITH-AUTH-USER-ID-3'::uuid,
  'James Chen',
  'james.chen@proofound.com',
  'individual',
  'Vancouver, BC, Canada',
  'America/Vancouver',
  'To build technology that accelerates the transition to a sustainable future.',
  'Full-stack software engineer with 5 years of experience building scalable climate tech solutions.',
  ARRAY['Technology', 'Climate Tech', 'Software Development'],
  ARRAY['English (Fluent)', 'Mandarin (Native)', 'French (Conversational)'],
  'available',
  true,
  80000,
  110000,
  82,
  true,
  NOW(),
  NOW()
);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this after creating users to verify they exist

SELECT
  id,
  full_name,
  email,
  account_type,
  profile_completion_percentage || '%' as completion
FROM profiles
WHERE email IN ('demo@proofound.com', 'sofia.martinez@proofound.com', 'james.chen@proofound.com')
ORDER BY full_name;
