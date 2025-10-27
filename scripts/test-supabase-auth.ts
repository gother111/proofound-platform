/**
 * Test Supabase Authentication Connection
 * Run with: npx tsx scripts/test-supabase-auth.ts
 */

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase Connection...\n')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('Check your .env.local file for:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

console.log('✅ Supabase URL:', supabaseUrl)
console.log('✅ Anon Key found:', supabaseAnonKey.substring(0, 20) + '...')
console.log()

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  console.log('📧 Testing authentication with demo@proofound.com...\n')

  // Try to sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'demo@proofound.com',
    password: 'Demo123!'
  })

  if (error) {
    console.error('❌ Authentication failed!')
    console.error('Error:', error.message)
    console.error('Status:', error.status)
    console.error()

    if (error.message.includes('Invalid login credentials')) {
      console.log('💡 This means either:')
      console.log('1. The user does not exist in Supabase Auth')
      console.log('2. The password is incorrect')
      console.log('3. The email is not confirmed')
      console.log()
      console.log('🔧 To fix this:')
      console.log('1. Go to https://app.supabase.com')
      console.log('2. Select your project')
      console.log('3. Go to Authentication → Users')
      console.log('4. Check if demo@proofound.com exists')
      console.log('5. If not, click "Add user" and create it with password: Demo123!')
      console.log('6. Make sure "Auto Confirm User" is enabled')
    }

    return false
  }

  if (!data.user) {
    console.error('❌ No user data returned')
    return false
  }

  console.log('✅ Authentication successful!')
  console.log('User ID:', data.user.id)
  console.log('Email:', data.user.email)
  console.log('Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No')
  console.log()

  // Check if profile exists
  console.log('🔍 Checking for profile in database...\n')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (profileError) {
    console.error('❌ Profile not found!')
    console.error('Error:', profileError.message)
    console.log()
    console.log('💡 You need to create a profile for this user:')
    console.log(`
INSERT INTO profiles (
  id,
  full_name,
  email,
  account_type,
  region,
  availability_status,
  available_for_match,
  profile_completion_percentage,
  created_at,
  updated_at
) VALUES (
  '${data.user.id}'::uuid,
  'Demo User',
  'demo@proofound.com',
  'individual',
  'San Francisco, CA',
  'open_to_opportunities',
  true,
  60,
  NOW(),
  NOW()
);
    `)
    return false
  }

  console.log('✅ Profile found!')
  console.log('Name:', profile.full_name)
  console.log('Type:', profile.account_type)
  console.log('Region:', profile.region)
  console.log()

  console.log('🎉 Everything is working! You should be able to log in now.')

  return true
}

testAuth()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  })
