# 🔐 Demo Account Credentials

**Last Updated:** November 5, 2025

---

## 👥 Individual User Accounts (5)

### 1. Sofia Martinez - UX/Product Designer 🎨

**Use Case:** Climate tech designer, perfect match for SkillBridge UX role

- **Email:** `sofia.martinez@proofound-demo.com`
- **Handle:** `@sofia-martinez`
- **Password:** _[Set during account creation]_
- **Profile:** Barcelona-based UX designer specializing in sustainable design
- **Skills:** UI/UX Design, User Research, Figma, Product Strategy, Design Systems
- **Best Matches:** SkillBridge UX Designer role

---

### 2. James Chen - Full-Stack Engineer 💻

**Use Case:** Fintech engineer, perfect match for SkillBridge engineering role

- **Email:** `james.chen@proofound-demo.com`
- **Handle:** `@james-chen`
- **Password:** _[Set during account creation]_
- **Profile:** Singapore-based full-stack engineer in payment systems
- **Skills:** TypeScript, React, Node.js, PostgreSQL, System Architecture
- **Best Matches:** SkillBridge Full-Stack Engineer role

---

### 3. Amara Okafor - Social Impact Strategist 🌍

**Use Case:** NGO professional, matches multiple impact roles

- **Email:** `amara.okafor@proofound-demo.com`
- **Handle:** `@amara-okafor`
- **Password:** _[Set during account creation]_
- **Profile:** Lagos-based social impact strategist in education equity
- **Skills:** Program Management, Community Engagement, Impact Measurement
- **Best Matches:** GreenPath Impact Analyst, CircularCraft Supply Chain roles

---

### 4. Yuki Tanaka - AI/ML Engineer 🔬

**Use Case:** Healthcare AI researcher, matches data-focused roles

- **Email:** `yuki.tanaka@proofound-demo.com`
- **Handle:** `@yuki-tanaka`
- **Password:** _[Set during account creation]_
- **Profile:** Tokyo-based AI/ML engineer in healthcare
- **Skills:** Python, Machine Learning, Data Analysis, TensorFlow, PyTorch
- **Best Matches:** CircularCraft Data Analyst, GreenPath Impact Analyst roles

---

### 5. Alex Rivera - Community Organizer ✊

**Use Case:** Grassroots activist, matches community-focused roles

- **Email:** `alex.rivera@proofound-demo.com`
- **Handle:** `@alex-rivera`
- **Password:** _[Set during account creation]_
- **Profile:** Mexico City-based community organizer for education justice
- **Skills:** Community Organizing, Campaign Strategy, Public Speaking
- **Best Matches:** GreenPath Community Organizer role

---

## 🏢 Organization Accounts (3)

### 1. GreenPath NGO - Environmental Nonprofit 🌱

**Use Case:** Test NGO hiring workflow, community-focused roles

- **Email:** `demo@greenpath-ngo.org`
- **Slug:** `greenpath-ngo`
- **Password:** _[Set during account creation]_
- **Type:** NGO (Nonprofit)
- **Location:** Amsterdam, Netherlands
- **Active Roles:**
  - Community Organizer for Urban Garden Project
  - Impact Measurement Analyst

---

### 2. SkillBridge - EdTech Startup 📚

**Use Case:** Test tech company hiring, offers visa sponsorship

- **Email:** `demo@skillbridge.tech`
- **Slug:** `skillbridge`
- **Password:** _[Set during account creation]_
- **Type:** Company (EdTech)
- **Location:** Berlin, Germany
- **Active Roles:**
  - UX Designer for Mobile Learning App
  - Full-Stack Engineer (EdTech Platform)
- **Benefits:** Visa sponsorship, relocation support

---

### 3. CircularCraft - Social Enterprise ♻️

**Use Case:** Test social enterprise hiring, impact-focused

- **Email:** `demo@circularcraft.eu`
- **Slug:** `circularcraft`
- **Password:** _[Set during account creation]_
- **Type:** Social Enterprise (B-Corp)
- **Location:** Copenhagen, Denmark
- **Active Roles:**
  - Supply Chain Consultant with Fair Trade Experience
  - Data Analyst for Social Impact Metrics

---

## 🔑 How to Get Passwords

### Option 1: Check Your Supabase Auth Dashboard

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication → Users**
3. Find the demo accounts by email
4. You can send password reset emails or set new passwords

### Option 2: Reset Password Flow

1. Go to your platform's login page
2. Click "Forgot Password"
3. Enter the demo email address
4. Check the email inbox (or Supabase Auth logs)
5. Set a new password

### Option 3: Use Supabase MCP to Query

Run this to see all demo accounts:

```bash
node scripts/list-demo-users.mjs
```

---

## 🧪 Testing Scenarios

### Scenario 1: Perfect Match

**Goal:** Test high-score matching

1. **Login as:** Sofia Martinez
2. **Navigate to:** Matches/Jobs page
3. **Expected:** See SkillBridge UX Designer role with high match score (85-95%)
4. **Test:** View "Why this match?" explainer, express interest

---

### Scenario 2: Multi-Match Candidate

**Goal:** Test candidate matching multiple roles

1. **Login as:** Amara Okafor
2. **Navigate to:** Matches/Jobs page
3. **Expected:** See 3 matching roles (GreenPath Impact Analyst, CircularCraft Supply Chain & Data Analyst)
4. **Test:** Compare match scores, filter by compensation/location

---

### Scenario 3: Organization Hiring

**Goal:** Test organization viewing candidates

1. **Login as:** GreenPath NGO (`demo@greenpath-ngo.org`)
2. **Navigate to:** Posted assignments
3. **Expected:** See 2 active job postings with matched candidates
4. **Test:** Review candidate profiles, initiate conversations

---

### Scenario 4: Interview Scheduling

**Goal:** Test Zoom integration

1. **Login as:** Sofia Martinez
2. **Express interest** in SkillBridge UX role
3. **Wait for mutual interest** (or simulate as org)
4. **Schedule interview** via Zoom
5. **Expected:** Meeting link generated, calendar invite sent

---

### Scenario 5: Values-Driven Matching

**Goal:** Test values alignment scoring

1. **Login as:** Alex Rivera
2. **Navigate to:** Matches page
3. **Expected:** GreenPath Community Organizer shows high match due to shared values (Social Justice, Community Empowerment)
4. **Test:** Click "Why this match?" to see values breakdown

---

## 🎯 Default Test Credentials Template

If you want to set a **consistent password for all demo accounts** for easy testing:

**Suggested Password:** `Demo2025!Proofound`

This makes it easy to remember during testing while still being secure enough for a demo environment.

---

## 🔐 Security Notes

⚠️ **Important:**

- These are **demo accounts only** - don't use real personal data
- Passwords shown above are suggestions - actual passwords depend on what was set
- For production, always use unique, strong passwords per account
- Consider using a password manager for demo account credentials

---

## 📊 Account Summary

| Account Type         | Count | Purpose                                         |
| -------------------- | ----- | ----------------------------------------------- |
| **Individual Users** | 5     | Test candidate profiles, matching, applications |
| **Organizations**    | 3     | Test employer workflow, job postings, hiring    |
| **Total Accounts**   | 8     | Complete end-to-end platform testing            |

---

## 🚀 Quick Start Testing Guide

1. **Pick a scenario** from above
2. **Login** with the relevant demo account
3. **Follow the test flow**
4. **Verify functionality** works as expected
5. **Check database** to confirm data syncs properly

---

## 📝 Need to Reset Demo Data?

If you need to refresh the demo accounts:

```bash
# Re-seed users (keeps auth, updates profile data)
node scripts/seed-demo-users.mjs --yes

# Re-seed organizations
node scripts/seed-demo-organizations.mjs --yes

# Re-create matching profiles
node scripts/create-demo-matching-profiles.mjs
```

---

## 🆘 Troubleshooting

### Can't Login?

1. Check email is correct (copy from this file)
2. Try password reset flow
3. Check Supabase Auth dashboard for account status
4. Verify account exists: `node scripts/check-demo-data-status.mjs`

### No Matches Showing?

1. Verify matching profiles exist: `node scripts/check-demo-data-status.mjs`
2. Run matching engine (may need to trigger manually)
3. Check assignments are in "active" status

### Missing Profile Data?

1. Re-run seeding: `node scripts/seed-demo-users.mjs --yes`
2. Check database directly via Supabase dashboard

---

**🎊 Happy Testing!**

If you encounter any issues, all demo accounts and data can be verified with:

```bash
node scripts/check-platform-health.mjs
```
