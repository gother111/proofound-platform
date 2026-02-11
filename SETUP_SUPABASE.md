# ⚡ Quick Setup: Add Supabase MCP to Your Project

## What You Need to Do

Since `.env.local` is gitignored (which is good for security!), you need to create it manually. Here's exactly what to do:

### 🪄 Step 1: Create the `.env.local` file

1. Open your terminal in the project folder
2. Create a new file called `.env.local`:
   ```bash
   touch .env.local
   ```
3. Open the file in your text editor and paste this content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-side URL (same as public)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Database connection for Drizzle (pooled connection)
DATABASE_URL=postgresql://postgres.your-project-ref:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres

# Direct connection for migrations
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.your-project-ref.supabase.co:5432/postgres

# Service role key (IMPORTANT: Get this from Supabase Dashboard)
SUPABASE_SERVICE_ROLE_KEY=

# Site URL for authentication
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
```

### 🪄 Step 2: Get Your Service Role Key

This key is required for MCP to work properly. Here's where to find it:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/cjpfrgmsxwxhuomnvciq/settings/api)
2. Scroll down to find **"service_role"** key (NOT the anon key)
3. Copy the entire key (it's very long, starts with `eyJ...`)
4. Paste it into `SUPABASE_SERVICE_ROLE_KEY=` in your `.env.local` file

💡 **Why is this needed?** The service role key allows MCP to bypass Row Level Security (RLS) to perform administrative operations. This is safe because MCP only runs in your development environment and never in production.

### Step 3: Restart Your Dev Server

After creating `.env.local`:

```bash
npm run dev
```

### Step 4: Test the Connection

Try asking me to:

- "List all database tables"
- "Check for security issues"
- "Show migration status"

I should be able to respond using Supabase MCP! 🎉

## What's Already Configured

✅ **MCP Configuration** - Your `mcp-config.json` is already set up with:

- Figma MCP (for design tokens)
- Supabase MCP (for database operations)

✅ **Database Connection** - Successfully connected to project `cjpfrgmsxwxhuomnvciq`

✅ **Tables Found** - Your database has 23 tables including:

- `profiles` (4 rows)
- `individual_profiles` (3 rows)
- `organizations`
- `skills`, `capabilities`, `evidence`
- And 18 more tables!

✅ **Migrations** - Found 15 migrations in your database

## ⚠️ Security Note Found

When I checked your database, I found:

**Leaked Password Protection is Disabled**

- **What it means:** Your Supabase Auth isn't checking against HaveIBeenPwned.org
- **Why it matters:** Users might use passwords that have been leaked in data breaches
- **How to fix:** [Enable leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

## Using Drizzle vs Supabase MCP

### Use Drizzle for:

- Writing schema changes (`src/db/schema.ts`)
- Running migrations (`npm run db:push`)
- Type-safe queries in your code
- IDE autocomplete

### Use Supabase MCP for:

- Checking security issues
- Viewing database logs
- Running ad-hoc queries
- Monitoring performance

## Next Steps

After completing the steps above:

1. ✅ Test MCP by asking me questions about your database
2. ✅ Enable leaked password protection in Supabase Dashboard
3. ✅ Read the full guide in `docs/SUPABASE_MCP_SETUP.md`
4. ✅ Keep building your awesome platform! 🚀

## Need Help?

- **Can't find service role key?** It's under Settings → API → service_role
- **Getting connection errors?** Make sure `.env.local` exists in project root
- **Env variables not working?** Restart your dev server after creating `.env.local`
