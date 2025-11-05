# How to Run Critical Gaps Migrations

## ✅ Recommended Method: Supabase Dashboard

1. **Open your Supabase project dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste the migration SQL**
   - Open the file `migrations-to-run.sql` in this project
   - Copy ALL the SQL content
   - Paste it into the Supabase SQL Editor

4. **Run the migration**
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for completion (should take ~2-5 seconds)

5. **Verify success**
   - You should see output showing the table counts
   - Should show 3 new tables:
     - `interviews` (for Gap 1: Interview Scheduling)
     - `fairness_reports` (for Gap 3: Fairness Reporting)
     - `matching_profiles` (for Gap 5: Matching Profile Editor)

## 📊 Expected Result

```
table_name          | row_count
--------------------|----------
interviews          | 0
fairness_reports    | 0
matching_profiles   | 0
```

## ⚠️ Troubleshooting

**If you get "relation already exists" errors:**

- This means the tables are already created
- You can safely ignore these errors
- Or drop the tables first (only in development):
  ```sql
  DROP TABLE IF EXISTS interviews CASCADE;
  DROP TABLE IF EXISTS fairness_reports CASCADE;
  DROP TABLE IF EXISTS matching_profiles CASCADE;
  ```

**If you get permission errors:**

- Make sure you're logged in as the project owner
- Check that you have database access enabled

---

## 🔧 Alternative: Command Line (Advanced)

If you prefer command line and have `psql` installed:

```bash
# Get your DATABASE_URL from .env.local
# Then run:
psql "your_database_url_here" < migrations-to-run.sql
```

---

## ✨ After Running Migrations

Once migrations are successful, you're ready to test the critical gaps features:

1. **Interview Scheduling** - Schedule test Zoom/Google Meet interviews
2. **Performance Monitoring** - Check Vercel Analytics dashboard
3. **Fairness Reports** - View `/fairness` page
4. **Match Explainer** - View match detail panels
5. **Matching Preferences** - Edit matching profile at `/app/i/matching/preferences`

---

**Need Help?** Check `CRITICAL_GAPS_IMPLEMENTATION_COMPLETE.md` for full implementation details.
