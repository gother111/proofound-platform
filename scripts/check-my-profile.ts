/**
 * Check Your Profile Data
 * Run with: npx tsx scripts/check-my-profile.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkProfile() {
  console.log('🔍 Checking profile for: y.bakurov@icloud.com\n')

  // First authenticate
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'y.bakurov@icloud.com',
    password: process.env.YOUR_PASSWORD || 'YOUR-PASSWORD-HERE'
  })

  if (authError) {
    console.error('❌ Authentication failed:', authError.message)
    console.log('\n💡 Set your password as an environment variable:')
    console.log('YOUR_PASSWORD="your-password" npx tsx scripts/check-my-profile.ts')
    return
  }

  console.log('✅ Authenticated successfully')
  console.log(`User ID: ${authData.user.id}\n`)

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  if (profileError) {
    console.error('❌ Profile fetch error:', profileError.message)
    return
  }

  console.log('📋 YOUR PROFILE DATA:')
  console.log('═══════════════════════════════════════\n')

  // Display each field and whether it's filled
  const fields = [
    { name: 'ID', value: profile.id, auto: true },
    { name: 'Email', value: profile.email, auto: true },
    { name: 'Full Name', value: profile.full_name, auto: false },
    { name: 'Avatar URL', value: profile.avatar_url, auto: false },
    { name: 'Phone', value: profile.phone, auto: false },
    { name: 'Account Type', value: profile.account_type, auto: true },
    { name: 'Professional Summary', value: profile.professional_summary, auto: false },
    { name: 'Mission', value: profile.mission, auto: false },
    { name: 'Vision', value: profile.vision, auto: false },
    { name: 'Region', value: profile.region, auto: false },
    { name: 'Timezone', value: profile.timezone, auto: false },
    { name: 'Languages', value: profile.languages, auto: false },
    { name: 'Industry', value: profile.industry, auto: false },
    { name: 'Availability Status', value: profile.availability_status, auto: true },
    { name: 'Available for Match', value: profile.available_for_match, auto: true },
    { name: 'Salary Min', value: profile.salary_band_min, auto: false },
    { name: 'Salary Max', value: profile.salary_band_max, auto: false },
    { name: 'Profile Completion', value: `${profile.profile_completion_percentage}%`, auto: true },
    { name: 'Is Admin', value: profile.is_admin, auto: true },
    { name: 'Created At', value: new Date(profile.created_at).toLocaleString(), auto: true },
    { name: 'Updated At', value: new Date(profile.updated_at).toLocaleString(), auto: true },
  ]

  fields.forEach(field => {
    const isEmpty = field.value === null ||
                    field.value === undefined ||
                    field.value === '' ||
                    (Array.isArray(field.value) && field.value.length === 0)

    const symbol = isEmpty ? '⚪' : '🟢'
    const autoText = field.auto ? ' (auto)' : ''
    const valueText = isEmpty ? '(empty)' : field.value

    console.log(`${symbol} ${field.name}${autoText}: ${valueText}`)
  })

  console.log('\n═══════════════════════════════════════')
  console.log('\n📊 SUMMARY:')
  console.log(`Profile Completion: ${profile.profile_completion_percentage}%`)

  const filledFields = fields.filter(f => {
    const val = profile[f.name.toLowerCase().replace(/\s+/g, '_')]
    return val !== null && val !== undefined && val !== '' &&
           (!Array.isArray(val) || val.length > 0)
  })

  console.log(`Fields Filled: ${filledFields.length}/${fields.length}`)
  console.log(`\n🟢 = Filled | ⚪ = Empty | (auto) = Auto-populated\n`)
}

checkProfile()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err)
    process.exit(1)
  })
