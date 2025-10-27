# 🧑‍💼 Quick Guide: Create Demo Users in Supabase

## Why Manual Creation?

Supabase Auth user creation requires dashboard access for security. But it's super simple!

## ⚡ Quick Steps (2 minutes)

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your Proofound project
3. Click **"Authentication"** in the left sidebar
4. Click **"Users"** tab

### Step 2: Create First Demo User
Click **"Add User"** button, then:
- **Email:** `test@example.com`
- **Password:** `Test123!`
- **Auto Confirm Email:** ✅ (check this box!)
- Click **"Create User"**

### Step 3: Create Organization User
Click **"Add User"** again:
- **Email:** `org@greentech.com`
- **Password:** `Test123!`
- **Auto Confirm Email:** ✅
- Click **"Create User"**

## ✅ That's It!

Now you can log in with:
- Email: `test@example.com` / Password: `Test123!` (Individual)
- Email: `org@greentech.com` / Password: `Test123!` (Organization)

## 🎯 What Happens Automatically

When you sign up or create users, Supabase automatically:
- Creates a profile record with the same UUID
- Links them to your database
- Enables all app features

## 🚀 Next Step

Run your dev server: `npm run dev`

Then go to: http://localhost:3000/login

Use the credentials above to log in!
