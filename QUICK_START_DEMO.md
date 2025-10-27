# 🚀 Quick Start: Create Working Demo Users

This guide shows you the fastest way to create demo users you can actually log in with.

## ⚡ Fastest Method: Supabase Dashboard (5 minutes)

### Step 1: Create Auth Users

1. Go to https://app.supabase.com
2. Select your Proofound project
3. Click **Authentication** → **Users**
4. Click **Add User** → **Create new user**

Create these 3 users:

| Email | Password | Name |
|-------|----------|------|
| `demo@proofound.com` | `Demo123!` | Demo User |
| `sofia.martinez@proofound.com` | `Demo123!` | Sofia Martinez |
| `james.chen@proofound.com` | `Demo123!` | James Chen |

### Step 2: Get User IDs

After creating each user, **copy their User ID (UUID)** from the Supabase dashboard.

### Step 3: Create Profiles

Go to **SQL Editor** and run this script (**replace the UUIDs** with the ones you copied):

```sql
-- Demo User
INSERT INTO profiles (
  id,
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
  'PASTE-UUID-FROM-DASHBOARD-HERE'::uuid,
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

-- Sofia Martinez
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
  'PASTE-UUID-FROM-DASHBOARD-HERE'::uuid,
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

-- James Chen
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
  'PASTE-UUID-FROM-DASHBOARD-HERE'::uuid,
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
```

### Step 4: Verify

Run this query to confirm:

```sql
SELECT
  id,
  full_name,
  email,
  account_type,
  profile_completion_percentage || '%' as completion
FROM profiles
WHERE email IN ('demo@proofound.com', 'sofia.martinez@proofound.com', 'james.chen@proofound.com')
ORDER BY full_name;
```

You should see all 3 profiles!

### Step 5: Login!

Now go to `http://localhost:3000/login` and use:

```
Email: demo@proofound.com
Password: Demo123!
```

✅ **You should now be able to log in successfully!**

---

## 🛠️ Alternative: Automated Script (Advanced)

If you have the Supabase Service Role Key, you can automate this:

### 1. Add Service Role Key to .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **Never commit the service role key to git!**

### 2. Install tsx

```bash
npm install -D tsx
```

### 3. Run the Setup Script

```bash
npx tsx scripts/setup-demo-users.ts
```

This will automatically:
- Create 3 auth users
- Create their profiles
- Auto-confirm emails

---

## 🧪 Test Your Demo Users

After setup, test each user:

### Demo User
- **Email:** demo@proofound.com
- **What to test:** Basic navigation, profile editing
- **Profile:** 60% complete, simple test account

### Sofia Martinez
- **Email:** sofia.martinez@proofound.com
- **What to test:** UX Designer persona, accessibility focus
- **Profile:** 85% complete, detailed professional data

### James Chen
- **Email:** james.chen@proofound.com
- **What to test:** Software Engineer persona, climate tech
- **Profile:** 82% complete, technical skills

---

## 🔧 Troubleshooting

### "Invalid login credentials"

**Cause:** Auth user doesn't exist in Supabase Authentication

**Fix:**
1. Go to Supabase Dashboard → Authentication → Users
2. Check if the email exists
3. If not, create it using Step 1 above

### "Profile not found"

**Cause:** Auth user exists but no profile in database

**Fix:**
1. Go to SQL Editor
2. Run the INSERT INTO profiles query from Step 3
3. Make sure you use the correct UUID from the auth user

### "Email already registered"

**Cause:** You already created this auth user

**Fix:**
1. Find the existing user in Authentication → Users
2. Copy their UUID
3. Just run the INSERT INTO profiles query with that UUID

---

## 📚 Next Steps

After creating demo users:

1. **Test login flow** - Try logging in and out
2. **Test dashboard** - See persona-specific views
3. **Test profile editing** - Update information
4. **Create an admin** - Follow `ADMIN_SETUP.md`
5. **Add more data** - Run full seed script: `supabase/seed/demo_profiles.sql`

---

## 💡 Pro Tips

- Use the same password (`Demo123!`) for all demo accounts
- Keep demo emails in a simple format for easy remembering
- Start with just 1-2 users if testing basic features
- Add more users as you test specific features
- Use organization accounts for testing org-specific features

---

**🎯 Goal:** Get you up and running with working demo accounts in under 5 minutes!

**Questions?** Check `SUPABASE_DATABASE_ACCESS.md` for more details.
