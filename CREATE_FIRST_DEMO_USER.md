# Create Your First Demo User (5 Minutes)

Follow these exact steps to create a working demo user you can log in with.

---

## Step 1: Go to Supabase Dashboard

**Open this URL in your browser:**
```
https://app.supabase.com/project/avtrsvggevjcnsretlmq/auth/users
```

This takes you directly to the Authentication → Users page for your Proofound project.

---

## Step 2: Create Auth User

1. Click the green **"Add User"** button (top right)
2. Select **"Create new user"**
3. Fill in these EXACT values:

   **Email:** `demo@proofound.com`

   **Password:** `Demo123!`

   **✅ Check the box:** "Auto Confirm User"

4. Click **"Create User"**

---

## Step 3: Copy the User ID

After creating the user, you'll see a list with your new user.

**IMPORTANT:** Find the user you just created and **COPY THE ENTIRE UUID** (looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

Keep this UUID handy - you'll need it in the next step.

---

## Step 4: Create the Profile

1. In the Supabase sidebar, click **"SQL Editor"**
2. Click **"New Query"**
3. Paste this SQL (REPLACE `YOUR-UUID-HERE` with the UUID you copied):

```sql
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
  'YOUR-UUID-HERE'::uuid,
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
```

4. Click **"Run"** (or press Cmd/Ctrl + Enter)

You should see: `Success. No rows returned`

---

## Step 5: Verify It Works

Run this query to confirm the profile exists:

```sql
SELECT
  id,
  full_name,
  email,
  account_type,
  profile_completion_percentage || '%' as completion
FROM profiles
WHERE email = 'demo@proofound.com';
```

You should see one row with "Demo User".

---

## Step 6: Test Login

Now go to your login page:
```
http://localhost:3000/login
```

**Login with:**
- **Email:** `demo@proofound.com`
- **Password:** `Demo123!`

✅ **You should now be able to log in successfully!**

---

## Troubleshooting

### Still getting "Invalid login credentials"?

1. Go back to: https://app.supabase.com/project/avtrsvggevjcnsretlmq/auth/users
2. Verify the user `demo@proofound.com` exists in the list
3. Check that "Email Confirmed" shows a green checkmark (if not, you forgot to check "Auto Confirm User")

### Getting "Profile not found"?

1. Go to SQL Editor
2. Run the verification query from Step 5
3. If you see no rows, re-run the INSERT query from Step 4

### Wrong UUID error?

Make sure you copied the ENTIRE UUID from the auth user, including all dashes.

---

## What's Next?

After this works, you can create more demo users:
- See `QUICK_START_DEMO.md` for 2 more pre-configured demo users
- See `DEMO_CREDENTIALS.md` for all 8 demo profiles

---

**🎯 Goal:** Get you logged in and testing in under 5 minutes!
