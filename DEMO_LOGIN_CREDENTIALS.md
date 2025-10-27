# 🔐 Demo Login Credentials for Proofound MVP

## Current Situation

The demo sync created 2 profiles in your database, but **no corresponding auth users** in Supabase Auth yet.

## How to Create Login Credentials

### Option 1: Sign Up Through Your App (Recommended for Testing)
1. Go to your signup page: `http://localhost:3000/signup` (or your domain)
2. Create accounts with these emails:
   - `demo.user1@proofound-demo.com` (password: `DemoUser123!`)
   - `demo.user2@proofound-demo.com` (password: `DemoUser123!`)
3. Complete the profile setup

### Option 2: Create Users via Supabase Dashboard
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Users**
3. Click "Add User" → "Create New User"
4. Create these users:

**User 1:**
- Email: `sofia.martinez@proofound-demo.com`
- Password: `DemoUser123!`
- Email Confirmed: ✅ (check the box)

**User 2:**
- Email: `james.chen@proofound-demo.com`
- Password: `DemoUser123!`
- Email Confirmed: ✅ (check the box)

5. After creating auth users, update the profiles to match the auth user IDs

### Option 3: Use Your Existing Test Accounts
If you already created accounts during development, you can use those!

## Quick Test Accounts (Create These First)

### Individual User
- **Email:** `test@example.com`
- **Password:** `Test123!`

### Organization User
- **Email:** `org@greentech.com`
- **Password:** `Test123!`

## Profile IDs Ready in Database

Your database has 2 profile records ready:
- `0119608f-9e1e-488c-b3a0-4375eab0455c`
- `064541e9-7c52-4bd1-9993-8ecab07d0aaf`

Once you create matching auth users, you'll have fully working demo accounts!

## Organizations You Can Log Into

If you create an organization user, you can access:
- **GreenTech Innovations** (Berlin, Germany)
- **Code for Good Foundation** (Nairobi, Kenya)
- **Impact Capital Partners** (London, UK)

---

**Next Step:** Create at least one auth user through your app's signup page, then try logging in! 🚀
