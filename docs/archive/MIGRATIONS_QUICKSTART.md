# ⚡ Quick Migration Guide - 2 Minutes

## Step 1: Open Supabase Dashboard

Go to: **https://supabase.com/dashboard/project/cjpfrgmsxwxhuomnvciq**

## Step 2: Check Project Status

- If you see **"Project is paused"** → Click **"Resume Project"** (wait ~30 seconds)
- If active, continue to Step 3

## Step 3: Open SQL Editor

1. Click **"SQL Editor"** in the left sidebar
2. Click the **"+ New query"** button

## Step 4: Run Migration

1. **Open the file** `migrations-to-run.sql` in your code editor
2. **Select all** (Cmd+A) and **copy** (Cmd+C)
3. **Paste** into the Supabase SQL Editor
4. Click **"Run"** button (or press Cmd+Enter)

## Step 5: Verify Success

You should see output showing:

```
table_name          | row_count
--------------------|----------
interviews          | 0
fairness_reports    | 0
matching_profiles   | 0
```

✅ **Done!** All 3 critical gap tables are now created.

---

## 🎯 What These Tables Do

- **`interviews`** - Zoom/Google Meet scheduling (Gap 1)
- **`fairness_reports`** - Automated fairness monitoring (Gap 3)
- **`matching_profiles`** - User matching preferences (Gap 5)

---

## ⚠️ If You See Errors

**"relation already exists"**

- Tables are already created! ✅ You're good to go.

**"permission denied"**

- Make sure you're logged in as project owner
- Check your project is on a paid plan if needed

---

## 🚀 After Migrations Complete

Your critical gaps implementation is ready! Test the features:

1. **Interviews:** Try scheduling in the app
2. **Performance:** Check Vercel Analytics dashboard
3. **Fairness:** Visit `/fairness` page
4. **Matching:** Visit `/app/i/matching/preferences`

Need help? See `CRITICAL_GAPS_IMPLEMENTATION_COMPLETE.md` for full docs.
