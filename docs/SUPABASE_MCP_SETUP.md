# Supabase MCP Setup Guide

This guide explains how to use Supabase Model Context Protocol (MCP) alongside Drizzle ORM in your Proofound Platform project.

## What is Supabase MCP?

Supabase MCP provides AI-assisted database operations through a standardized protocol. It allows you to:

- Execute SQL queries and migrations
- Monitor database health and security
- Check for performance issues
- View logs and debug issues

## Dual-System Architecture

Your project uses **two complementary database systems**:

### 1. Drizzle ORM (Schema Management)

**Use for:**

- Defining database schema (`src/db/schema.ts`)
- Type-safe database queries
- Running migrations (`npm run db:push`, `npm run db:migrate`)
- Generating TypeScript types

**Files:**

- `src/db/schema.ts` - Database schema definitions
- `drizzle.config.ts` - Drizzle configuration
- `drizzle/*.sql` - Migration files

### 2. Supabase MCP (Database Operations)

**Use for:**

- Database monitoring and health checks
- Security and performance advisors
- Viewing logs
- Executing ad-hoc queries
- Checking migrations status

**Connection:**

- Configured in `mcp-config.json`
- Connects to: `https://mcp.supabase.com/mcp?project_ref=cjpfrgmsxwxhuomnvciq`

## Environment Variables Setup

⚠️ **IMPORTANT:** Since `.env.local` is gitignored, you need to create it manually.

### Step 1: Create `.env.local` file

Create a file named `.env.local` in your project root with these variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cjpfrgmsxwxhuomnvciq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_K719ETKMPgWJeEZGBqnTmQ_8AWJr6ZK

# Server-side URL (same as public)
SUPABASE_URL=https://cjpfrgmsxwxhuomnvciq.supabase.co
SUPABASE_ANON_KEY=sb_publishable_K719ETKMPgWJeEZGBqnTmQ_8AWJr6ZK

# Database connection for Drizzle (pooled connection)
DATABASE_URL=postgresql://postgres.cjpfrgmsxwxhuomnvciq:Gara1299442!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres

# Direct connection for migrations
DIRECT_URL=postgresql://postgres:Gara1299442!@db.cjpfrgmsxwxhuomnvciq.supabase.co:5432/postgres

# Service role key (get from Supabase Dashboard → Settings → API)
# This key bypasses RLS - keep it secure and never commit to git!
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Site URL for authentication
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
```

### Step 2: Get Service Role Key

🪄 **DO THIS MANUALLY:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (`cjpfrgmsxwxhuomnvciq`)
3. Navigate to **Settings** → **API**
4. Find the **service_role** key (it starts with `eyJ...`)
5. Copy it and paste into `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local`

### Step 3: Restart Your Dev Server

After creating `.env.local`:

```bash
npm run dev
```

## Using Supabase MCP

### Available MCP Tools

Once configured, you can use these tools through Cursor:

1. **List Tables** - View all tables in your database

   ```typescript
   // Example: List all tables
   mcp_supabase_list_tables();
   ```

2. **Check Security Advisors** - Find security vulnerabilities

   ```typescript
   mcp_supabase_get_advisors({ type: 'security' });
   ```

3. **Check Performance Advisors** - Find performance issues

   ```typescript
   mcp_supabase_get_advisors({ type: 'performance' });
   ```

4. **Execute SQL** - Run queries directly

   ```typescript
   mcp_supabase_execute_sql({
     query: 'SELECT COUNT(*) FROM profiles',
   });
   ```

5. **Apply Migrations** - Run DDL operations

   ```typescript
   mcp_supabase_apply_migration({
     name: 'add_new_column',
     query: 'ALTER TABLE profiles ADD COLUMN bio TEXT',
   });
   ```

6. **View Logs** - Check database logs
   ```typescript
   mcp_supabase_get_logs({ service: 'postgres' });
   ```

## When to Use Which Tool?

### Use Drizzle ORM when:

- ✅ Defining or updating your database schema
- ✅ Writing type-safe database queries in your app code
- ✅ Running migrations
- ✅ You want IDE autocomplete for queries
- ✅ You need to generate TypeScript types

**Example:**

```typescript
import { db } from '@/db';
import { profiles } from '@/db/schema';

// Type-safe query with autocomplete
const userProfile = await db.select().from(profiles).where(eq(profiles.id, userId));
```

### Use Supabase MCP when:

- ✅ You want to check database health and security
- ✅ You need to view logs for debugging
- ✅ You want to run ad-hoc queries without writing code
- ✅ You need to check migration status
- ✅ You want to monitor performance

**Example:**

```typescript
// Check for security issues
const issues = await mcp_supabase_get_advisors({ type: 'security' });

// View recent database activity
const logs = await mcp_supabase_get_logs({ service: 'postgres' });
```

## Testing the Connection

After setting up `.env.local`, test your connection:

```bash
# 1. Restart your dev server
npm run dev

# 2. Run database seed (if you have one)
npm run db:seed

# 3. Check if MCP can list tables
# In Cursor, try: "List all tables using Supabase MCP"
```

## Troubleshooting

### Issue: "Missing environment variables" error

**Solution:** Make sure `.env.local` exists and contains all required variables (see Step 1 above).

### Issue: "Can't connect to Supabase MCP"

**Solution:** Check your `mcp-config.json`:

```json
{
  "mcpServers": {
    "SupabaseMCP": {
      "url": "https://mcp.supabase.com/mcp?project_ref=cjpfrgmsxwxhuomnvciq"
    }
  }
}
```

### Issue: "Authentication failed"

**Solution:** Verify your service role key in Supabase Dashboard → Settings → API. Make sure you copied the full key.

### Issue: "Connection pooler timeout"

**Solution:** Use `DIRECT_URL` for migrations instead of `DATABASE_URL`:

```bash
DIRECT_URL=postgresql://postgres:Gara1299442!@db.cjpfrgmsxwxhuomnvciq.supabase.co:5432/postgres
```

## Best Practices

1. **Never commit sensitive keys** - `SUPABASE_SERVICE_ROLE_KEY` and passwords should never be in git
2. **Use connection pooler** - Use `DATABASE_URL` (pooled) for regular queries
3. **Use direct connection for migrations** - Use `DIRECT_URL` for schema changes
4. **Check advisors regularly** - Run security/performance advisors monthly
5. **Monitor logs** - Check logs when debugging issues

## Current Database Tables

Your Supabase project (`cjpfrgmsxwxhuomnvciq`) currently has these tables:

- `profiles` (4 rows) - User profiles
- `individual_profiles` (3 rows) - Individual user data
- `organizations` - Organization profiles
- `organization_members` - Org membership
- `org_invitations` - Pending invitations
- `assignments` - Job/role assignments
- `matches` - Matching results
- `matching_profiles` - User matching preferences
- `skills`, `capabilities`, `evidence` - Skills and proof
- `rate_limits`, `audit_logs`, `feature_flags` - System tables

All tables have **Row Level Security (RLS) enabled** for security.

## Next Steps

1. ✅ Create `.env.local` file with all credentials
2. ✅ Get your service role key from Supabase Dashboard
3. ✅ Test the connection using `npm run dev`
4. ✅ Try listing tables via Supabase MCP
5. ✅ Run security advisors to check for issues

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Your Project Schema](../src/db/schema.ts)
