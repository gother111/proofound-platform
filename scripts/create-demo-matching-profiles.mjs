/**
 * Create matching profiles for demo users
 * This enables them to appear in matching results
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const [key, ...values] = line.split('=');
    if (key && !key.startsWith('#') && values.length > 0) {
      const value = values.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
} catch (err) {
  console.error('⚠️  Could not load .env.local file');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function getUserIdByHandle(handle) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('handle', handle)
    .single();
  
  if (error) {
    console.error(`❌ Error finding user ${handle}:`, error.message);
    return null;
  }
  
  return data?.id;
}

async function main() {
  console.log('🔗 Creating matching profiles for demo users...\n');
  
  // Define matching profiles for each demo user
  const matchingProfiles = [
    // Sofia Martinez - UX Designer looking for climate tech work
    {
      handle: 'sofia-martinez',
      profile: {
        values_tags: ['Innovation', 'Sustainability', 'User-Centered Design', 'Collaboration'],
        cause_tags: ['Climate Action', 'Circular Economy', 'Sustainable Innovation', 'Design'],
        timezone: 'Europe/Madrid',
        languages: [{ code: 'en', level: 'C1' }, { code: 'es', level: 'native' }],
        country: 'Spain',
        city: 'Barcelona',
        work_mode: 'remote',
        hours_min: 32,
        hours_max: 40,
        comp_min: 50000,
        comp_max: 75000,
        currency: 'EUR',
        availability_earliest: '2024-12-01',
        availability_latest: '2025-02-01',
        needs_sponsorship: false,
        relocation_willing: true,
        relocation_countries: ['Spain', 'Portugal', 'Netherlands', 'Germany'],
      },
    },
    // James Chen - Full-stack engineer in fintech
    {
      handle: 'james-chen',
      profile: {
        values_tags: ['Technical Excellence', 'Innovation', 'User Focus', 'Scalability'],
        cause_tags: ['Education Access', 'Technology', 'Financial Inclusion', 'Software Development'],
        timezone: 'Asia/Singapore',
        languages: [{ code: 'en', level: 'native' }, { code: 'zh', level: 'native' }],
        country: 'Singapore',
        city: 'Singapore',
        work_mode: 'remote',
        hours_min: 40,
        hours_max: 40,
        comp_min: 60000,
        comp_max: 90000,
        currency: 'EUR',
        availability_earliest: '2024-11-15',
        availability_latest: '2025-01-15',
        needs_sponsorship: false,
        relocation_willing: true,
        relocation_countries: ['Singapore', 'Germany', 'Netherlands', 'United Kingdom'],
      },
    },
    // Amara Okafor - Social impact strategist
    {
      handle: 'amara-okafor',
      profile: {
        values_tags: ['Social Justice', 'Community Empowerment', 'Education Equity', 'Transparency'],
        cause_tags: ['Education Access', 'Youth Empowerment', 'Community Development', 'Impact Measurement'],
        timezone: 'Africa/Lagos',
        languages: [{ code: 'en', level: 'native' }],
        country: 'Nigeria',
        city: 'Lagos',
        work_mode: 'hybrid',
        hours_min: 32,
        hours_max: 40,
        comp_min: 35000,
        comp_max: 55000,
        currency: 'EUR',
        availability_earliest: '2024-12-01',
        availability_latest: '2025-03-01',
        needs_sponsorship: false,
        relocation_willing: false,
      },
    },
    // Yuki Tanaka - AI/ML engineer in healthcare
    {
      handle: 'yuki-tanaka',
      profile: {
        values_tags: ['Innovation', 'Evidence-Based Practice', 'Ethics', 'Impact'],
        cause_tags: ['Healthcare', 'AI Ethics', 'Data Science', 'Technology'],
        timezone: 'Asia/Tokyo',
        languages: [{ code: 'en', level: 'C1' }, { code: 'ja', level: 'native' }],
        country: 'Japan',
        city: 'Tokyo',
        work_mode: 'remote',
        hours_min: 32,
        hours_max: 40,
        comp_min: 45000,
        comp_max: 70000,
        currency: 'EUR',
        availability_earliest: '2025-01-01',
        availability_latest: '2025-03-01',
        needs_sponsorship: false,
        relocation_willing: true,
        relocation_countries: ['Japan', 'Singapore', 'United States', 'Germany'],
      },
    },
    // Alex Rivera - Community organizer
    {
      handle: 'alex-rivera',
      profile: {
        values_tags: ['Social Justice', 'Community Empowerment', 'Grassroots Action', 'Collaboration'],
        cause_tags: ['Education Access', 'Social Justice', 'Community Development', 'Environmental Justice'],
        timezone: 'America/Mexico_City',
        languages: [{ code: 'es', level: 'native' }, { code: 'en', level: 'C1' }],
        country: 'Mexico',
        city: 'Mexico City',
        work_mode: 'hybrid',
        hours_min: 32,
        hours_max: 40,
        comp_min: 30000,
        comp_max: 45000,
        currency: 'EUR',
        availability_earliest: '2024-12-01',
        availability_latest: '2025-02-01',
        needs_sponsorship: false,
        relocation_willing: true,
        relocation_countries: ['Mexico', 'Spain', 'Netherlands', 'United States'],
      },
    },
  ];
  
  let created = 0;
  let skipped = 0;
  
  for (const userProfile of matchingProfiles) {
    const userId = await getUserIdByHandle(userProfile.handle);
    
    if (!userId) {
      console.log(`   ⚠️  Skipping ${userProfile.handle} - user not found`);
      continue;
    }
    
    // Check if matching profile already exists
    const { data: existing } = await supabase
      .from('matching_profiles')
      .select('profile_id')
      .eq('profile_id', userId)
      .single();
    
    if (existing) {
      console.log(`   ⚠️  Matching profile already exists for ${userProfile.handle}`);
      skipped++;
      continue;
    }
    
    // Create matching profile
    const { error } = await supabase
      .from('matching_profiles')
      .insert({
        profile_id: userId,
        ...userProfile.profile,
      });
    
    if (error) {
      console.error(`   ❌ Error creating matching profile for ${userProfile.handle}:`, error.message);
    } else {
      console.log(`   ✅ Created matching profile for ${userProfile.handle}`);
      created++;
    }
  }
  
  console.log(`\n✅ Successfully created ${created} matching profiles!`);
  if (skipped > 0) {
    console.log(`⚠️  Skipped ${skipped} existing profiles\n`);
  }
}

main();

