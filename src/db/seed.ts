import { db } from './index';
import { profiles, organizations, organizationMembers, featureFlags } from './schema';
import { nanoid } from 'nanoid';

async function seed() {
  console.log('🌱 Seeding database...');

  // Only seed in local environment
  if (process.env.NEXT_PUBLIC_APP_ENV !== 'local') {
    console.log('⚠️  Skipping seed - not in local environment');
    return;
  }

  try {
    // Insert feature flags
    console.log('📌 Creating feature flags...');
    await db
      .insert(featureFlags)
      .values([
        {
          key: 'onboarding_v1',
          enabled: true,
          audience: null,
        },
        {
          key: 'i18n_sv',
          enabled: true,
          audience: null,
        },
        {
          key: 'public_org_pages',
          enabled: false,
          audience: null,
        },
      ])
      .onConflictDoNothing();

    console.log('✅ Feature flags created');

    // Note: Demo users should be created via Supabase Auth signup
    // This seed script focuses on feature flags and can be extended
    // with demo data if you have service role access to create users

    console.log('🎉 Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
