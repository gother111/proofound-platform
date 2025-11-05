# 🔐 Demo Account Authentication Status

**Checked:** November 5, 2025

---

## ✅ All Accounts Have Passwords Set!

| Email                               | Status          | Email Confirmed | Last Login      | Created      |
| ----------------------------------- | --------------- | --------------- | --------------- | ------------ |
| `sofia.martinez@proofound-demo.com` | ✅ Password Set | ✅ Yes          | **Nov 5, 2025** | Oct 27, 2025 |
| `james.chen@proofound-demo.com`     | ✅ Password Set | ✅ Yes          | Never           | Oct 27, 2025 |
| `amara.okafor@proofound-demo.com`   | ✅ Password Set | ✅ Yes          | Never           | Oct 27, 2025 |
| `yuki.tanaka@proofound-demo.com`    | ✅ Password Set | ✅ Yes          | Never           | Oct 27, 2025 |
| `alex.rivera@proofound-demo.com`    | ✅ Password Set | ✅ Yes          | Never           | Oct 27, 2025 |
| `demo@greenpath-ngo.org`            | ✅ Password Set | ✅ Yes          | Never           | Nov 3, 2025  |
| `demo@skillbridge.tech`             | ✅ Password Set | ✅ Yes          | Never           | Nov 3, 2025  |
| `demo@circularcraft.eu`             | ✅ Password Set | ✅ Yes          | Never           | Nov 3, 2025  |

---

## 🔍 Key Findings

✅ **All 8 accounts exist in Supabase Auth**
✅ **All accounts have passwords set** (encrypted, cannot be viewed)
✅ **All emails are confirmed**
✅ **Sofia Martinez has logged in once** (most recently on Nov 5)
⚠️ **7 accounts have never been logged into** (passwords set but never used)

---

## 🔐 Why Can't I See The Passwords?

Passwords are **encrypted** in the database for security. This is good! It means:

- ✅ Passwords are stored securely (hashed with bcrypt/argon2)
- ✅ Even database admins can't see them
- ✅ Only the user who set the password knows it

---

## 🆘 How to Access The Accounts

### Option 1: If You Know The Password

Just use it! All accounts are ready to login.

### Option 2: Reset Password Via Supabase Dashboard

**Step 1:** Go to **Supabase Dashboard → Authentication → Users**

**Step 2:** Find the user (e.g., `sofia.martinez@proofound-demo.com`)

**Step 3:** Click the **"..."** menu → **"Send Password Recovery"**

**Step 4:** Check your email logs in Supabase (or the actual email inbox if configured)

**Step 5:** Click the reset link and set a new password

### Option 3: Reset Password Via Your Platform

**Step 1:** Go to your platform's login page

**Step 2:** Click **"Forgot Password"**

**Step 3:** Enter the demo email

**Step 4:** Check Supabase email logs for the reset link

**Step 5:** Set a new password

---

## 💡 Recommended: Set a Universal Test Password

For easy testing, I recommend setting **all demo accounts** to the same password:

**Suggested Password:** `Demo2025!Proofound`

This makes testing much easier while still being secure for a demo environment.

### How to Set It:

For each account in Supabase Dashboard:

1. Go to **Authentication → Users**
2. Find the user
3. Click **"..." menu → "Reset Password"**
4. Send recovery email
5. Use the link to set password to: `Demo2025!Proofound`

Or use the Supabase dashboard's **"Update User"** feature if available.

---

## 🧪 Testing Status

Based on login history:

| Account        | Testing Status                  | Recommendation                       |
| -------------- | ------------------------------- | ------------------------------------ |
| Sofia Martinez | ✅ **Tested** (logged in Nov 5) | Password works! Use this one first   |
| All Others     | ⚠️ **Not tested yet**           | Reset passwords or try existing ones |

---

## 🔧 Quick Commands

```bash
# List all demo accounts
node scripts/list-demo-users.mjs

# Check auth status anytime
# (SQL query via Supabase dashboard)
```

---

## 🎯 Next Steps

1. **If you know the passwords:** Great! Just login and test
2. **If you don't know them:** Use password reset flow (Option 2 or 3 above)
3. **For easiest testing:** Set all to `Demo2025!Proofound` via Supabase dashboard

---

**Note:** The fact that all accounts have passwords set is excellent! It means they were properly created during the seeding process. You just need to either remember the passwords or reset them.
