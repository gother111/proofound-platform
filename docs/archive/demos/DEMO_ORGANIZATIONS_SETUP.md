# Demo Organizations Setup Summary

## ✅ What Was Successfully Created

The demo organization seeding script (`scripts/seed-demo-organizations.mjs`) has been created and successfully populated most of the data:

### Organizations (3)

1. **GreenPath NGO** - Environmental NGO (Amsterdam)
   - Slug: `greenpath-ngo`
   - Type: NGO (nonprofit)
   - Mission: Community climate action

2. **SkillBridge** - EdTech Startup (Berlin)
   - Slug: `skillbridge`
   - Type: Company
   - Mission: Professional skills training

3. **CircularCraft** - Social Enterprise (Copenhagen)
   - Slug: `circularcraft`
   - Type: Company (benefit_corporation)
   - Mission: Sustainable products + refugee employment

### Successfully Seeded Data

- ✅ **3 Organizations** with full profiles (mission, vision, values, causes, work culture)
- ✅ **7 Organization Projects** (2-3 per org, mix of active/completed)
- ✅ **6 Organization Partnerships** (2 per org)
- ✅ **6 Organization Certifications** (B-Corp, ISO, Fair Trade, etc.)
- ✅ **9 Organization Goals** (3 per org with progress tracking)
- ✅ **6 Organization Structure** entries (teams/departments)
- ✅ **5 Ownership Records** (showing different ownership models)
- ✅ **5 Organization Members** (demo users linked as members):
  - Amara Okafor → GreenPath NGO (admin)
  - Alex Rivera → GreenPath NGO (member)
  - Sofia Martinez → SkillBridge (admin)
  - James Chen → SkillBridge (member)
  - Yuki Tanaka → CircularCraft (member)
- ✅ **11 Audit Logs** (tracking org creation and member additions)

### NOT Created (Requires Manual Fix)

- ❌ **0 Assignments** - Failed due to database trigger bug
- ❌ **0 Organization Verifications** - Table doesn't exist yet (migration not run)

---

## ⚠️ Issue Found: Assignment Trigger Bug

### Problem

Assignments cannot be created due to a bug in the database trigger `auto_populate_field_visibility()`.

**Error:** `record "new" has no field "created_by"`

**Root Cause:** The trigger function in `/src/db/migrations/20250133_add_assignment_workflow_system.sql` (line 383) tries to access `NEW.created_by`, but the `assignments` table does NOT have a `created_by` column.

### Solution

Run the following SQL fix in your **Supabase Dashboard → SQL Editor**:

```sql
-- Fix the auto_populate_field_visibility trigger
CREATE OR REPLACE FUNCTION auto_populate_field_visibility()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO assignment_field_visibility (
        assignment_id,
        field_name,
        field_category,
        visibility_level,
        redaction_type,
        generic_label,
        set_by
    )
    SELECT
        NEW.id,
        d.field_name,
        d.field_category,
        d.default_visibility,
        d.default_redaction_type,
        d.default_generic_label,
        auth.uid()  -- Changed from NEW.created_by to auth.uid()
    FROM assignment_field_visibility_defaults d
    WHERE d.is_system_field = true
    ON CONFLICT (assignment_id, field_name) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**After running this SQL**, you can create the assignments by running:

```bash
node scripts/add-demo-assignments.mjs
```

---

## 📋 Sample Assignments Ready to Create

Once the trigger is fixed, these 6 assignments will be created:

### GreenPath NGO (2 assignments)

1. **Community Organizer for Urban Garden Project**
   - Should match: Alex Rivera, Amara Okafor
   - Skills: community-organizing, program-management, stakeholder-management
   - Location: Amsterdam (hybrid)
   - Compensation: €35,000-45,000

2. **Impact Measurement Analyst**
   - Should match: Amara Okafor, Yuki Tanaka
   - Skills: impact-measurement, data-analysis, monitoring-evaluation
   - Location: Amsterdam (remote)
   - Compensation: €40,000-50,000

### SkillBridge (2 assignments)

3. **UX Designer for Mobile Learning App**
   - Should match: Sofia Martinez
   - Skills: ui-ux-design, mobile-design, user-research
   - Location: Berlin (remote)
   - Compensation: €55,000-75,000
   - Offers: Visa sponsorship, relocation support

4. **Full-Stack Engineer (EdTech Platform)**
   - Should match: James Chen
   - Skills: typescript, react, nodejs, postgresql
   - Location: Berlin (remote)
   - Compensation: €60,000-85,000
   - Offers: Visa sponsorship, relocation support

### CircularCraft (2 assignments)

5. **Supply Chain Consultant with Fair Trade Experience**
   - Should match: Amara Okafor
   - Skills: supply-chain, sustainability, stakeholder-management
   - Location: Copenhagen (hybrid)
   - Compensation: €50,000-65,000

6. **Data Analyst for Social Impact Metrics**
   - Should match: Yuki Tanaka
   - Skills: data-analysis, impact-measurement, python
   - Location: Copenhagen (hybrid)
   - Compensation: €45,000-60,000

---

## 🗂️ Scripts Created

1. **`scripts/seed-demo-organizations.mjs`** - Main seeding script (comprehensive)
2. **`scripts/add-demo-assignments.mjs`** - Standalone script to add just assignments
3. **`scripts/check-orgs.mjs`** - Quick verification script to check what exists
4. **`scripts/fix-assignment-trigger.sql`** - SQL fix for the trigger bug
5. **`scripts/run-fix-assignment-trigger.mjs`** - Helper to display the fix

---

## 🚀 Next Steps

### 1. Fix the Assignment Trigger (Manual)

Run the SQL fix in your Supabase Dashboard (see Solution section above)

### 2. Create the Assignments

```bash
node scripts/add-demo-assignments.mjs
```

### 3. (Optional) Run Migrations for org_verification Table

If you want organization verification records:

```bash
npm run db:push
```

Then run:

```bash
node scripts/seed-demo-organizations.mjs --yes
```

(It will skip existing data and only add verifications)

### 4. Verify Everything

```bash
node scripts/check-orgs.mjs
```

### 5. Test the Platform

1. Log in with one of the org emails:
   - `demo@greenpath-ngo.org`
   - `demo@skillbridge.tech`
   - `demo@circularcraft.eu`

2. Check that:
   - Organization profile displays correctly
   - Projects, partnerships, certifications, goals are visible
   - Assignments are listed (after fix)
   - Team members are shown

3. Test matching:
   - Log in as one of the demo individual users (Sofia, James, Amara, Yuki, Alex)
   - Check if assignments from orgs appear in their matches
   - Verify matching scores and recommendations

---

## 📊 Database Schema Alignment

All seeded data aligns with the current database schema (`src/db/schema.ts`):

- ✅ Organizations table
- ✅ Organization projects, partnerships, certifications, goals
- ✅ Organization structure, ownership
- ✅ Organization members
- ✅ Audit logs
- ⚠️ Assignments (ready but needs trigger fix)
- ⚠️ org_verification (table exists in schema, may need migration)

---

## 🎯 Testing the Matching System

Once assignments are created, you can test if the matching algorithm correctly identifies candidate-assignment pairs:

### Expected Matches

- **Alex Rivera** → GreenPath's Community Organizer role (high match)
- **Amara Okafor** → GreenPath's Impact Analyst + CircularCraft's Supply Chain role
- **Sofia Martinez** → SkillBridge's UX Designer role (high match)
- **James Chen** → SkillBridge's Full-Stack Engineer role (high match)
- **Yuki Tanaka** → GreenPath's Impact Analyst + CircularCraft's Data Analyst roles

### Matching Criteria Covered

- Skills alignment (must-have + nice-to-have)
- Values alignment (mission/values matching)
- Location preferences
- Compensation ranges
- Work mode (remote/hybrid/onsite)
- Sponsorship needs

---

## 📝 Notes

- All organizations have realistic data based on real-world examples
- Assignments are designed to test the full matching system
- Demo users are already members of relevant organizations
- The script is idempotent for most operations (won't duplicate data)
- All sensitive data (created_by, user IDs) handled correctly via service role

---

## ⚡ Quick Commands

```bash
# Check what exists
node scripts/check-orgs.mjs

# Add assignments (after trigger fix)
node scripts/add-demo-assignments.mjs

# Re-run full seed (skips existing data)
node scripts/seed-demo-organizations.mjs --yes

# List all users
node scripts/list-users.mjs
```

---

Built with ❤️ for comprehensive demo testing of the Proofound platform.
