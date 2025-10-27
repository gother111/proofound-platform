/**
 * Script to create demo users with Supabase Auth + Profiles
 * Run with: npx tsx scripts/setup-demo-users.ts
 */

import { createClient } from '@supabase/supabase-js'

// Get these from your Supabase project settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key (keep secret!)

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const demoUsers = [
  {
    email: 'demo@proofound.com',
    password: 'Demo123!',
    profile: {
      full_name: 'Demo User',
      account_type: 'individual',
      region: 'San Francisco, CA',
      professional_summary: 'A demo user for testing the Proofound platform.',
      availability_status: 'open_to_opportunities',
      available_for_match: true,
      profile_completion_percentage: 60,
      profile_ready_for_match: true
    }
  },
  {
    email: 'sofia.martinez@proofound.com',
    password: 'Demo123!',
    profile: {
      full_name: 'Sofia Martinez',
      account_type: 'individual',
      region: 'Barcelona, Spain',
      timezone: 'Europe/Madrid',
      mission: 'To create digital experiences that are accessible and empowering for everyone.',
      professional_summary: 'UX designer with 8 years of experience specializing in accessibility and inclusive design.',
      industry: ['Design & UX', 'Technology', 'Education'],
      languages: ['Spanish (Native)', 'English (Fluent)', 'Catalan (Native)'],
      availability_status: 'open_to_opportunities',
      available_for_match: true,
      salary_band_min: 65000,
      salary_band_max: 85000,
      profile_completion_percentage: 85,
      profile_ready_for_match: true
    }
  },
  {
    email: 'james.chen@proofound.com',
    password: 'Demo123!',
    profile: {
      full_name: 'James Chen',
      account_type: 'individual',
      region: 'Vancouver, BC, Canada',
      timezone: 'America/Vancouver',
      mission: 'To build technology that accelerates the transition to a sustainable future.',
      professional_summary: 'Full-stack software engineer with 5 years of experience building scalable climate tech solutions.',
      industry: ['Technology', 'Climate Tech', 'Software Development'],
      languages: ['English (Fluent)', 'Mandarin (Native)', 'French (Conversational)'],
      availability_status: 'available',
      available_for_match: true,
      salary_band_min: 80000,
      salary_band_max: 110000,
      profile_completion_percentage: 82,
      profile_ready_for_match: true
    }
  }
]

async function createDemoUsers() {
  console.log('🚀 Creating demo users...\n')

  for (const user of demoUsers) {
    try {
      // 1. Create auth user
      console.log(`Creating auth user: ${user.email}`)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true // Auto-confirm email
      })

      if (authError) {
        console.error(`❌ Error creating auth user ${user.email}:`, authError.message)
        continue
      }

      if (!authData.user) {
        console.error(`❌ No user data returned for ${user.email}`)
        continue
      }

      console.log(`✅ Auth user created with ID: ${authData.user.id}`)

      // 2. Create profile
      console.log(`Creating profile for: ${user.email}`)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: user.email,
          ...user.profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error(`❌ Error creating profile for ${user.email}:`, profileError.message)
        continue
      }

      console.log(`✅ Profile created for: ${user.profile.full_name}`)
      console.log('---')

    } catch (error) {
      console.error(`❌ Unexpected error for ${user.email}:`, error)
    }
  }

  console.log('\n🎉 Demo user setup complete!')
  console.log('\n📝 Login credentials:')
  console.log('Email: demo@proofound.com')
  console.log('Password: Demo123!')
  console.log('\nOr use any of the other demo emails with password: Demo123!')
}

// Run the script
createDemoUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
