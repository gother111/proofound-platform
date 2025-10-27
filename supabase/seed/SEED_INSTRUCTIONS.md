# Demo Data Seeding Instructions

**Created:** October 27, 2025  
**Purpose:** Guide for populating database with demo profiles

---

## Prerequisites

Before running the seed script, you need Supabase Auth users for each demo profile. The `profiles.id` field is a foreign key to `auth.users.id`.

---

## Option 1: Create Auth Users via Supabase Dashboard (Recommended)

### Step 1: Create Auth Users

Go to Supabase Dashboard → Authentication → Users → "Add User" (manually)

Create these 5 individual users:

1. **Sofia Martinez**
   - Email: `sofia.martinez@proofound-demo.com`
   - Password: `Demo123!` (change in production)
   - Auto Confirm: ✅ Yes

2. **James Chen**
   - Email: `james.chen@proofound-demo.com`
   - Password: `Demo123!`
   - Auto Confirm: ✅ Yes

3. **Amara Okafor**
   - Email: `amara.okafor@proofound-demo.com`
   - Password: `Demo123!`
   - Auto Confirm: ✅ Yes

4. **Dr. Yuki Tanaka**
   - Email: `yuki.tanaka@proofound-demo.com`
   - Password: `Demo123!`
   - Auto Confirm: ✅ Yes

5. **Alex Rivera**
   - Email: `alex.rivera@proofound-demo.com`
   - Password: `Demo123!`
   - Auto Confirm: ✅ Yes

### Step 2: Get Auth User IDs

After creating users, run this query to get their IDs:

```sql
SELECT id, email 
FROM auth.users 
WHERE email LIKE '%@proofound-demo.com'
ORDER BY email;
```

Copy these UUIDs - you'll need them for the next step.

### Step 3: Run Modified Seed Script

Replace the `@variable_id` placeholders in `demo_profiles.sql` with actual UUIDs from Step 2, then execute via Supabase SQL Editor or Prisma.

---

## Option 2: Simplified Automated Approach

If you want to automate the entire process, use the Supabase Management API to create auth users programmatically:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key required
)

async function createDemoUsers() {
  const demoUsers = [
    { email: 'sofia.martinez@proofound-demo.com', password: 'Demo123!', metadata: { full_name: 'Sofia Martinez' } },
    { email: 'james.chen@proofound-demo.com', password: 'Demo123!', metadata: { full_name: 'James Chen' } },
    { email: 'amara.okafor@proofound-demo.com', password: 'Demo123!', metadata: { full_name: 'Amara Okafor' } },
    { email: 'yuki.tanaka@proofound-demo.com', password: 'Demo123!', metadata: { full_name: 'Dr. Yuki Tanaka' } },
    { email: 'alex.rivera@proofound-demo.com', password: 'Demo123!', metadata: { full_name: 'Alex Rivera' } },
  ]

  for (const user of demoUsers) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: user.metadata
    })

    if (error) {
      console.error(`Error creating ${user.email}:`, error)
    } else {
      console.log(`Created user: ${user.email} (ID: ${data.user?.id})`)
    }
  }
}

createDemoUsers()
```

---

## Option 3: Use Existing Test Users

If you already have test accounts, you can adapt the seed script to use those user IDs instead.

---

## Verification

After seeding, verify the data:

```sql
-- Check profiles
SELECT 
  full_name,
  region,
  account_type,
  profile_completion_percentage,
  available_for_match,
  created_at
FROM profiles
WHERE account_type = 'individual'
ORDER BY full_name;

-- Check expertise
SELECT 
  p.full_name,
  COUNT(ea.*) as skill_count
FROM profiles p
LEFT JOIN expertise_atlas ea ON p.id = ea.profile_id
WHERE p.account_type = 'individual'
GROUP BY p.full_name
ORDER BY p.full_name;

-- Check proofs
SELECT 
  p.full_name,
  COUNT(pr.*) as proof_count,
  COUNT(CASE WHEN pr.verification_status = 'verified' THEN 1 END) as verified_count
FROM profiles p
LEFT JOIN proofs pr ON p.id = pr.profile_id
WHERE p.account_type = 'individual'
GROUP BY p.full_name
ORDER BY p.full_name;

-- Check organizations
SELECT 
  name,
  org_type,
  is_verified,
  headquarters_location,
  active_assignments_count
FROM organizations
ORDER BY name;

-- Check assignments
SELECT 
  o.name as organization,
  a.title,
  a.assignment_type,
  a.status,
  a.published_at
FROM assignments a
JOIN organizations o ON a.organization_id = o.id
ORDER BY o.name, a.created_at DESC;
```

---

## Troubleshooting

### Error: "violates foreign key constraint"
**Cause:** Auth users don't exist yet  
**Fix:** Complete Step 1 (create auth users) first

### Error: "duplicate key value"
**Cause:** Demo data already exists  
**Fix:** Delete existing demo data first:
```sql
DELETE FROM profiles WHERE email LIKE '%@proofound-demo.com';
DELETE FROM organizations WHERE slug IN ('greentech-innovations', 'code-for-good', 'impact-capital-partners');
```

### Error: "permission denied"
**Cause:** RLS policies preventing inserts  
**Fix:** Temporarily disable RLS or use service role key:
```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'organizations', 'expertise_atlas');

-- If needed, temporarily disable (BE CAREFUL!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ... insert data ...
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

---

## Clean Up Demo Data

To remove all demo data:

```sql
BEGIN;

-- Delete analytics events for demo users
DELETE FROM analytics_events 
WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@proofound-demo.com'
);

-- Delete verification requests
DELETE FROM verification_requests
WHERE requester_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@proofound-demo.com'
);

-- Delete artifacts
DELETE FROM artifacts
WHERE profile_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@proofound-demo.com'
);

-- Delete proofs
DELETE FROM proofs
WHERE profile_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@proofound-demo.com'
);

-- Delete expertise atlas
DELETE FROM expertise_atlas
WHERE profile_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@proofound-demo.com'
);

-- Delete assignments
DELETE FROM assignments
WHERE organization_id IN (
  SELECT id FROM organizations 
  WHERE slug IN ('greentech-innovations', 'code-for-good', 'impact-capital-partners')
);

-- Delete organizations
DELETE FROM organizations
WHERE slug IN ('greentech-innovations', 'code-for-good', 'impact-capital-partners');

-- Delete profiles
DELETE FROM profiles
WHERE email LIKE '%@proofound-demo.com';

-- Delete auth users (requires service role)
-- Do this via Supabase Dashboard or Auth Admin API

COMMIT;
```

---

## Notes

- All demo profiles have completion percentages between 82-90%
- Emails use `@proofound-demo.com` domain for easy identification
- Passwords are set to `Demo123!` (change for production)
- Organizations have 1-3 active assignments each
- Profile data is realistic and can be used for algorithm testing
- Images use Unsplash placeholders (replace with actual uploads)

---

## Next Steps

1. ✅ Create auth users (Option 1 or 2)
2. ✅ Run seed script with actual user IDs
3. ✅ Verify data using queries above
4. ✅ Test UI with demo profiles
5. ✅ Test matching algorithm with demo data
6. ⚠️ Replace placeholder images with real uploads
7. ⚠️ Change default passwords for production

