# Proofound Platform MVP

Production-ready scaffold for a credibility and connection platform with Individual and Organization personas.

## Overview

Proofound is a platform built for authenticity, not algorithms. It features:

- **Dual Personas**: Individual contributors and Organizations (companies, NGOs, governments, networks)
- **Proof-first Profiles**: Verifiable achievements and transparent operations
- **Privacy by Design**: Row-level security, user-controlled visibility
- **Steward-owned Governance**: Built for long-term sustainability

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript + React Server Components
- **Styling**: Tailwind CSS + shadcn/ui (Radix primitives)
- **Database**: Supabase Postgres + Drizzle ORM
- **Auth**: Supabase Auth (email/password + magic link)
- **Email**: Resend + React Email
- **i18n**: next-intl (English, Swedish)
- **Testing**: Vitest (unit) + Playwright (e2e) + @axe-core (a11y)
- **CI/CD**: GitHub Actions + Vercel

## Brand Tokens

Design system extracted from Figma "Proofound Style Guidelines":

- **Colors**: Forest Green (primary), Parchment (background), Terracotta (accent)
- **Typography**: Crimson Pro (display), Inter (UI)
- **Motion**: Calm, purposeful animations (100-600ms durations)

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Resend account (free tier works)
- Vercel account (optional, for deployment)

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd proofound-platform
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your project URL and anon key
4. Copy your service role key (keep this secret!)
5. Go to Project Settings → Database
6. Copy your connection string

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=local

# Supabase (from step 2)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres

# Resend
RESEND_API_KEY=re_your_key
EMAIL_FROM="Proofound <no-reply@proofound.com>"

# Rate Limiting
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX=30
```

### 4. Set Up Database

Run migrations and triggers:

```bash
# Generate migration files
npm run db:generate

# Push schema to Supabase
npm run db:push

# Manually run RLS policies and triggers in Supabase SQL Editor
# Copy contents from:
# - src/db/policies.sql
# - src/db/triggers.sql
```

**Important**: Run the SQL files manually in your Supabase SQL Editor to enable RLS and triggers.

### 5. Seed Database (Optional)

```bash
npm run db:seed
```

This creates feature flags. Demo users should be created via the signup flow.

### 6. Set Up Resend

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain
3. Configure DNS records (SPF, DKIM, DMARC):
   - **SPF**: Add TXT record: `v=spf1 include:_spf.resend.com ~all`
   - **DKIM**: Add CNAME records provided by Resend
   - **DMARC**: Add TXT record: `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`
4. Get your API key from the dashboard
5. Update `RESEND_API_KEY` and `EMAIL_FROM` in `.env.local`

### 7. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── actions/              # Server Actions (auth, profile, org, onboarding)
├── app/                  # Next.js App Router pages
│   ├── (auth)/          # Auth pages (login, signup, reset)
│   ├── app/             # Protected app routes
│   │   ├── i/          # Individual shell
│   │   └── o/[slug]/   # Organization shell
│   ├── onboarding/     # Onboarding wizard
│   └── page.tsx        # Landing page
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── brand/          # Logo, Wordmark, ThemeToggle
│   ├── auth/           # Auth forms
│   ├── onboarding/     # Onboarding steps
│   ├── individual/     # Individual-specific
│   ├── organization/   # Org-specific
│   └── landing/        # Landing page sections
├── db/                 # Database schema, policies, seed
├── design/             # Brand tokens (JSON)
├── i18n/               # Internationalization (en, sv)
├── lib/                # Utilities (auth, supabase, email, motion)
└── middleware.ts       # Session refresh, route guards

emails/                 # React Email templates
e2e/                    # Playwright E2E tests
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Lint code
npm run format           # Format with Prettier
npm run typecheck        # TypeScript type checking

# Database
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run migrations
npm run db:push          # Push schema to database
npm run db:studio        # Open Drizzle Studio
npm run db:seed          # Seed database

# Brand Tokens
npm run tokens:sync      # Sync tokens from Figma (requires setup)

# Testing
npm run test             # Run unit tests (Vitest)
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:e2e:ui      # Run E2E tests with UI
```

> **Troubleshooting:** If `npm run lint` reports that `next` cannot be found, follow the steps in [`docs/TROUBLESHOOTING_LINT.md`](docs/TROUBLESHOOTING_LINT.md).

## Database Schema

### Core Tables

- `profiles` - User profiles (extends Supabase auth.users)
- `individual_profiles` - Individual-specific data
- `organizations` - Organization entities
- `organization_members` - Membership with roles (owner/admin/member/viewer)
- `org_invitations` - Pending invitations
- `audit_logs` - Audit trail for important actions
- `feature_flags` - Feature toggle system
- `rate_limits` - Rate limiting tracking

### RLS (Row-Level Security)

All tables have RLS enabled with policies:

- Users can read their own data and public data
- Organization data is scoped to members
- Admins/owners can manage org settings and members
- Audit logs are readable by relevant users/org members

## Authentication Flow

1. **Sign Up** → Email verification → Onboarding
2. **Login** → Check persona → Redirect to appropriate shell
3. **Onboarding**:
   - Choose: Individual or Organization
   - **Individual**: Set handle, name, locale → `/app/i/home`
   - **Organization**: Create org → Invite team → `/app/o/[slug]/home`

## App Shells

### Individual Shell (`/app/i/*`)

- Home: Dashboard with quick actions
- Profile: Edit headline, bio, skills, location, visibility
- Settings: Account, notifications, security, language

### Organization Shell (`/app/o/[slug]/*`)

- Home: Org overview, member count, activity
- Profile: Edit mission, logo, website
- Members: Invite, manage roles, remove members
- Settings: Org branding, audit log viewer

## Testing

### Unit Tests

```bash
npm run test
```

Tests for:

- Auth helpers
- RBAC functions
- Zod schemas
- Utility functions

### E2E Tests

```bash
npm run test:e2e
```

Test scenarios:

- Individual signup → onboarding → profile
- Organization creation → invite → accept
- RLS enforcement (cross-org access denied)
- Accessibility (axe-core checks)

### A11y Testing

E2E tests include `@axe-core/playwright` for WCAG AA compliance checks on key pages.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

**Environment Variable Groups:**

- **Supabase**: URL, anon key, service role key, DATABASE_URL
- **Resend**: API key, FROM email
- **App**: NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_APP_ENV=production

**Build Settings:**

- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**Post-Deployment:**

- Run migrations via Supabase dashboard or `npm run db:push`
- Verify email sending works
- Test auth flows end-to-end

### Database Migrations on Deploy

Option 1: Run migrations manually in Supabase SQL Editor after schema changes

Option 2: Add migration command to Vercel build:

```json
{
  "build": "npm run db:push && next build"
}
```

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR:

1. Install dependencies
2. Lint
3. Type check
4. Run unit tests
5. Build

Protect your `main` branch:

- Require PR reviews
- Require CI to pass
- No direct pushes

## Security

- **RLS**: All tables have row-level security
- **Rate Limiting**: Auth routes are rate-limited
- **Env Vars**: Never commit secrets; use `.env.local`
- **Service Role**: Only used server-side, never exposed to client
- **HTTPS**: Enforced in production (Vercel default)

## Internationalization

Supported locales: English (en), Swedish (sv)

- Messages in `src/i18n/messages/{locale}.json`
- Language switcher in user menu and footer
- Server-side rendering with next-intl

## Accessibility

- WCAG 2.1 AA compliance target
- Focus-visible rings on all interactive elements
- Color contrast tested against brand tokens
- Keyboard navigation support
- Screen reader tested
- Automated axe-core checks in E2E tests

## Brand & Design

Design tokens from Figma Style Guidelines:

- **Colors**: `src/design/brand-tokens.json`
- **Motion**: `src/design/motion-tokens.json`
- Tailwind config extends from tokens
- Dark mode support (media + class strategy)
- Reduced motion respected (`prefers-reduced-motion`)

## What's Next

### Phase 2 Features

- Public organization pages (`/org/[slug]`)
- Verifications module (proofs, endorsements)
- Connections & network graph
- Activity feeds and notifications
- Search & discovery
- 2FA implementation
- Export data (GDPR compliance)

### Design Enhancements

- Animated illustrations with expressive motion
- Micro-interactions (success animations, hover effects)
- Advanced data visualization (org analytics charts)

### Platform Features

- API for third-party integrations
- Admin dashboard with analytics
- Advanced RBAC (custom roles, permissions)
- Webhooks for org events
- SSO (SAML, OAuth providers)

## Troubleshooting

### "Database connection error"

- Check `DATABASE_URL` in `.env.local`
- Verify Supabase project is active
- Check if IP is whitelisted (if using IP restrictions)

### "Email not sending"

- Verify Resend API key
- Check domain verification status
- Review DNS records (SPF, DKIM, DMARC)
- Check Resend dashboard logs

### "RLS policy error"

- Ensure policies.sql was run in Supabase
- Check if user is authenticated
- Verify org membership in `organization_members` table

### "Onboarding redirect loop"

- Check `profiles.persona` value
- Verify middleware logic
- Clear cookies and try again

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For questions or issues:

- Open a GitHub issue
- Check existing documentation
- Review Supabase/Resend docs

---

Built with ❤️ for authentic human connections.
