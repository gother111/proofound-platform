# Linear Setup Instructions

**Created:** January 31, 2025  
**Purpose:** Step-by-step guide to import all Proofound issues into Linear

---

## 🎯 Quick Start (3 Steps)

### Step 1: Get Your Linear API Key

1. Go to [Linear Settings → API](https://linear.app/settings/api)
2. Click "Create API Key"
3. Copy the key (it looks like: `lin_api_xxxxxxxxxxxxx`)
4. **Important:** Save it securely - you won't be able to see it again!

### Step 2: Set Up Environment Variable

**Option A: Export in Terminal (Temporary)**
```bash
export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxx"
```

**Option B: Add to .env.local (Permanent)**
```bash
# Add this line to your .env.local file
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxx
```

### Step 3: Run the Import Script

```bash
# Install dependencies (one-time)
npm install node-fetch dotenv

# Run the import script
node scripts/import-linear-issues.mjs
```

That's it! The script will:
- ✅ Create all labels
- ✅ Create all completed issues (marked as Done)
- ✅ Create all in-progress issues
- ✅ Create all backlog issues
- ✅ Set proper priorities, estimates, and labels

---

## 📋 What Gets Created

### Labels (40+ labels)
- Status labels: `completed`, `in-progress`, `todo`, `blocked`
- Priority labels: `priority-p0` through `priority-p3`
- Epic labels: `epic-1` through `epic-10`
- Type labels: `taxonomy`, `matching`, `ui`, `api`, `database`, etc.
- Component labels: `individual`, `organization`, `shared`

### Issues Created

**✅ Completed Work (12 issues)**
- Next.js Setup
- Design System
- Database Schema
- Supabase Integration
- Authentication Flow
- Auth Redesign
- Email Templates
- Dashboards (Individual & Organization)
- Profile Components
- Matching System

**🚧 In Progress (7 issues)**
- Individual Setup Form
- Organization Setup Form
- Password Reset Flow
- Email Verification
- Accept Invite Page
- Essential UI Components
- Middleware Guards

**📋 Backlog (6 Epic 1 issues)**
- E1-US1: Design & Seed L1 Categories
- E1-US2: Define L2 & L3 Subcategories
- E1-US3: Populate L4 Skills
- E1-US4: Implement Skill Embeddings
- E1-US5: Update Existing Skills Table
- E1-US6: Skills Taxonomy API Endpoints

**Total: 25 issues** (from LINEAR_ORGANIZATION_PLAN.md)

---

## 🔧 Troubleshooting

### Error: "LINEAR_API_KEY environment variable not set"

**Solution:** Make sure you've exported the API key:
```bash
export LINEAR_API_KEY="your_key_here"
# Then run the script again
```

### Error: "No teams found"

**Solution:** Create a team in Linear first:
1. Go to Linear → Settings → Teams
2. Create a new team (e.g., "Engineering")
3. Run the script again

### Error: "Failed to create label"

**Solution:** Labels might already exist. The script will skip existing labels and continue.

### Error: "GraphQL errors"

**Solution:** Check that your API key is valid and has proper permissions. You may need to regenerate it.

---

## 🎨 After Import: Organize Your Workspace

### 1. Create Projects (Optional)

In Linear, create these projects to organize issues:

- **Proofound MVP** - Current sprint work
- **Skills Taxonomy** - Epic 1 work
- **Matching System** - Epic 2-7 work
- **Infrastructure** - DevOps and maintenance

Then assign issues to projects manually.

### 2. Create Epics (Recommended)

For each Epic (E1-E10), create an Epic issue and link related user stories to it:

1. Create Epic: "Epic 1: Skills Taxonomy System"
2. Link issues: E1-US1, E1-US2, E1-US3, etc.
3. Set epic's estimate to sum of child issues (55 pts for E1)

### 3. Set Up Sprint Board

1. Create a new sprint in Linear
2. Add critical blockers to Sprint 1:
   - Individual Setup Form (8 pts)
   - Organization Setup Form (8 pts)
   - Password Reset Flow (5 pts)
   - Email Verification (3 pts)
   - Accept Invite Page (5 pts)
   - Complete Middleware (8 pts)
   - Essential UI Components (13 pts)

**Total Sprint 1:** ~50 points (prioritize top 4-5)

---

## 📊 Next Steps

After importing:

1. ✅ Review all issues in Linear
2. ✅ Assign issues to team members
3. ✅ Create sprint and add issues
4. ✅ Set up projects for organization
5. ✅ Create Epic issues and link user stories
6. ✅ Start Sprint 1!

---

## 🔄 Re-running the Script

If you need to run the script again:

- **Labels:** Will be skipped if they already exist
- **Issues:** Will create duplicates if run again (Linear doesn't check for duplicates)
- **Recommendation:** Only run once, or delete issues first if re-running

---

## 💡 Alternative: Manual Setup

If you prefer to set up Linear manually:

1. Use `LINEAR_ORGANIZATION_PLAN.md` as your guide
2. Create labels one by one
3. Create issues one by one
4. Copy/paste from the plan document

This will take ~30-60 minutes vs. 2 minutes with the script.

---

## 🆘 Need Help?

If you encounter issues:

1. Check that your API key is valid
2. Ensure you have a team created in Linear
3. Check the error message for specific details
4. Verify your `.env.local` file has the correct format

---

**Ready to import? Run:** `node scripts/import-linear-issues.mjs` 🚀

