# Proofound MVP - Quick Start Guide

## 🚀 Get Running in 10 Minutes

### Step 1: Create Supabase Project (3 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose a name (e.g., "proofound-dev")
4. Set a strong database password (save it!)
5. Select region closest to you
6. Wait for project to initialize

### Step 2: Configure Database (2 minutes)

1. In Supabase dashboard, go to **SQL Editor**
2. Create a new query and paste the contents of `src/db/policies.sql`
3. Run the query (Execute SQL)
4. Create another query and paste contents of `src/db/triggers.sql`
5. Run that query too

### Step 3: Get API Keys (1 minute)

1. In Supabase dashboard, go to **Settings → API**
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...` - keep this secret!)
3. Go to **Settings → Database** and copy **Connection string** (starts with `postgresql://`)

### Step 4: Get Resend API Key (2 minutes)

1. Go to [resend.com](https://resend.com) and sign up/login
2. Click **API Keys** in sidebar
3. Click **Create API Key**
4. Name it "Proofound Dev"
5. Copy the key (starts with `re_`)

### Step 5: Configure Environment Variables (1 minute)

Create `.env.local` in the project root:

```bash
# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=local

# Supabase (paste your values)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Resend (paste your value)
RESEND_API_KEY=re_...
EMAIL_FROM=Proofound <no-reply@proofound.com>
```

### Step 6: Install & Run (1 minute)

```bash
# Install dependencies
npm install

# Generate database migrations
npm run db:generate

# Run migrations (pushes schema to Supabase)
npm run db:migrate

# Optional: Seed demo data
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🧪 Test the App

### 1. Sign Up Flow

1. Go to http://localhost:3000
2. Click "Sign up" (or go to `/signup`)
3. Enter email and password
4. You'll be redirected to `/onboarding`

### 2. Onboarding

1. Choose "Individual" or "Organization"
2. ⚠️ **Note**: The setup forms are not fully implemented yet
3. For now, you'll need to manually update the database

### 3. Manual Database Setup (Temporary)

Until onboarding forms are complete, use Supabase SQL Editor:

**For Individual:**

```sql
-- Update your persona
UPDATE profiles SET persona = 'individual' WHERE id = 'your-user-id';

-- Create individual profile
INSERT INTO individual_profiles (user_id, headline, bio)
VALUES ('your-user-id', 'Your Headline', 'Your bio');
```

**For Organization:**

```sql
-- Update your persona
UPDATE profiles SET persona = 'org_member' WHERE id = 'your-user-id';

-- Create organization
INSERT INTO organizations (slug, display_name, type, created_by)
VALUES ('my-org', 'My Organization', 'company', 'your-user-id');

-- Add yourself as owner
INSERT INTO organization_members (org_id, user_id, role, status)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'my-org'),
  'your-user-id',
  'owner',
  'active'
);
```

### 4. Access the App

- **Individual**: http://localhost:3000/app/i/home
- **Organization**: http://localhost:3000/o/my-org/home

---

## 🛠️ Development Commands

```bash
# Development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Start production server
npm start

# Database commands
npm run db:generate  # Generate migrations from schema changes
npm run db:migrate   # Apply migrations to database
npm run db:studio    # Open Drizzle Studio (visual DB editor)
npm run seed         # Seed demo data

# Testing (when implemented)
npm test            # Run unit tests
npm run test:e2e    # Run E2E tests
```

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── app/               # Protected app routes
│   │   ├── i/            # Individual shell
│   │   └── o/[slug]/     # Organization shell
│   ├── onboarding/       # Onboarding flow
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
├── db/
│   ├── schema.ts         # Database schema
│   ├── policies.sql      # RLS policies
│   └── seed.ts           # Seed script
├── lib/
│   ├── supabase/         # Supabase clients
│   ├── auth.ts           # Auth helpers
│   ├── email.ts          # Email sending
│   └── utils.ts          # Utilities
├── actions/              # Server Actions
│   ├── auth.ts
│   ├── profile.ts
│   └── org.ts
└── design/               # Brand tokens from Figma
    ├── brand-tokens.json
    └── motion-tokens.json
```

---

## 🎨 Customizing Brand

### Colors

Edit `src/design/brand-tokens.json` and re-run `npm run dev`.

The design uses:

- **Forest Green** (#1C4D3A) - Primary, trust
- **Parchment** (#F7F6F1) - Background, warmth
- **Terracotta** (#C76B4A) - Accent, action
- **Stone Charcoal** (#2D3330) - Dark text
- **Warm Stone** (#E8E6DD) - Light borders

### Typography

- **Display** (H1-H3): Crimson Pro (serif)
- **Body** (UI, H4-H6): Inter (sans-serif)

Fonts are loaded from Google Fonts in `src/app/globals.css`.

### Motion

Motion timings and easing curves are in `src/design/motion-tokens.json`.

To apply animations, use Framer Motion:

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
>
  Content
</motion.div>;
```

---

## 🐛 Common Issues

### "Failed to fetch" on login

- Check that Supabase URL and keys are correct in `.env.local`
- Make sure your Supabase project is running
- Check browser console for CORS errors

### Database connection error

- Verify `DATABASE_URL` in `.env.local`
- Make sure you've run migrations: `npm run db:migrate`
- Check that your Supabase database is accessible

### Email not sending

- Check `RESEND_API_KEY` in `.env.local`
- Verify your Resend account is active
- For development, check Resend dashboard for logs

### TypeScript errors

- Run `npm run typecheck` to see all errors
- Common fix: restart VS Code TypeScript server (Cmd+Shift+P → "Restart TS Server")

### Build fails

- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check that all environment variables have fallbacks for build time

---

## 📚 Next Steps

1. **Complete the onboarding forms** - See `TODO` in the plan
2. **Add error boundaries** - Handle errors gracefully
3. **Implement password reset** - Complete the auth flow
4. **Write tests** - Ensure reliability
5. **Polish the landing page** - Add animations and copy

See `MVP_STATUS.md` for detailed progress tracking and `proofound-mvp-build.plan.md` for the complete implementation plan.

---

## 🆘 Need Help?

1. Check `README.md` for comprehensive documentation
2. Review `MVP_STATUS.md` for current implementation status
3. See `proofound-mvp-build.plan.md` for the original specification
4. Check Supabase logs in dashboard for backend issues
5. Use browser DevTools console for frontend issues

---

## 🎉 You're Ready!

The foundation is solid. The app is ready for development. Focus on:

1. Completing the onboarding flow (highest priority)
2. Adding remaining UI components as needed
3. Testing each feature thoroughly

Happy coding! 🚀
