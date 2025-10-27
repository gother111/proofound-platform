# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Proofound MVP is a credibility engineering platform built with Next.js 15, featuring a Japandi design system, real-time messaging, AI-powered matching, and comprehensive analytics. The platform supports both individual and organization accounts with role-based features.

## Common Commands

### Development
```bash
# Start development server (localhost:3000)
npm run dev

# Type checking without emitting files
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Format code with Prettier
npm run format

# Generate Prisma client (required after schema changes)
npx prisma generate
```

### Build & Deployment
```bash
# Production build
npm run build

# Start production server
npm run start

# Bundle analysis
npm run analyze

# Clean build artifacts
npm run clean
```

### Testing
Refer to `TESTING_GUIDE.md` for comprehensive testing procedures covering 15 major features.

## Architecture

### Next.js App Router Structure

The app uses Next.js 15 App Router with route groups for organization:

- **`(auth)/`** - Authentication routes (sign-in, sign-up, reset-password)
- **`(dashboard)/`** - Main app routes for authenticated users (home, profile, matches, settings, expertise, zen)
- **`(messaging)/`** - Real-time messaging interface
- **`(organization)/`** - Organization-specific features (dashboard, assignments)
- **`(admin)/`** - Admin dashboard and moderation tools
- **`api/`** - API routes for server-side operations

Route groups (parentheses) organize routes without affecting URLs.

### Supabase Client Patterns

**IMPORTANT**: Use the correct Supabase client for each context:

1. **Server Components**: Use `createServerSupabaseClient()` from `@/lib/supabase/server`
2. **Client Components**: Use `createClient()` or `getSupabaseBrowserClient()` from `@/lib/supabase/client`
3. **Middleware**: Uses special middleware client from `@/lib/supabase/middleware`

Helper functions available in `lib/supabase/server.ts`:
- `getCurrentUser()` - Get authenticated user
- `getCurrentProfile()` - Get user's profile with account_type
- `requireAuth()` - Throw if not authenticated
- `requireAccountType(type)` - Enforce individual/organization access

### Database & Types

- **ORM**: Prisma (schema in `prisma/schema.prisma`)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Type Safety**: Auto-generated types in `types/database.ts` from Supabase schema
- **Key Tables**: profiles, matches, messages, proofs, verification_requests, analytics_events, assignments

### Authentication Flow

1. Email/password authentication via Supabase Auth
2. OAuth providers (Google) configured via feature flags
3. Account types: `individual` or `organization`
4. Session management via middleware (`middleware.ts`)
5. Protected routes automatically redirect to `/sign-in` if unauthenticated

### Design System

**Japandi aesthetic** with centralized tokens in `lib/design-tokens.ts`:

```typescript
import { colors, typography, spacing, commonStyles } from '@/lib/design-tokens';
```

**Key Design Principles:**
- Colors: Forest (#1C4D3A), Terracotta (#C76B4A), Parchment (#F7F6F1)
- Typography: Crimson Pro (display), Inter (body)
- Spacing: 4px base unit
- Dark mode support via `dark:` Tailwind classes
- All design tokens exported as TypeScript constants

### Component Organization

```
components/
├── ui/              # shadcn/ui primitives (45+ components)
├── auth/            # Authentication forms and flows
├── profile/         # Profile management components
├── [Feature]View.tsx # Major feature views (Dashboard, Messaging, etc.)
└── [Feature].tsx    # Smaller feature components
```

**UI Library**: shadcn/ui components in `components/ui/` - fully customizable, built on Radix UI

### State Management

- **Server State**: Supabase queries with Server Components
- **Client State**: React hooks (useState, useEffect, custom hooks in `lib/hooks/`)
- **Real-time**: Supabase Realtime subscriptions for messages
- **Forms**: React Hook Form + Zod validation (`lib/validations.ts`)

### Analytics System

Privacy-first analytics in `lib/analytics.ts`:

- 60+ tracked events across all features
- GDPR-compliant with opt-out support
- Session tracking with unique IDs
- Events stored in `analytics_events` table
- No PII tracked without consent

**Usage:**
```typescript
import { trackEvent } from '@/lib/analytics';

trackEvent('feature_used', {
  feature: 'matching',
  action: 'accept_match'
});
```

## Key Architectural Patterns

### Route Protection

All protected routes use middleware for session refresh. Server Components call `requireAuth()` or `requireAccountType()` for fine-grained access control:

```typescript
// In a Server Component
import { requireAccountType } from '@/lib/supabase/server';

export default async function OrganizationDashboard() {
  const profile = await requireAccountType('organization');
  // Component logic
}
```

### Persona-Aware UI

The platform adjusts features based on `account_type`:
- **Individual**: Matching, skill atlas, profile completion
- **Organization**: Assignment posting, candidate management
- **Admin**: Moderation dashboard, analytics

Check `profile.account_type` to conditionally render features.

### Real-time Messaging

Uses Supabase Realtime channels:
1. Subscribe to `messages` table changes filtered by conversation
2. Update UI optimistically on send
3. Handle read receipts and typing indicators
4. Clean up subscriptions on unmount

See `components/MessagesView.tsx` for reference implementation.

### Verification Workflow

Multi-step process:
1. User submits proof with description and URL
2. System generates secure token
3. Email sent to referee with verification link
4. Referee verifies via `/verify/[token]` route
5. One-time verification updates proof status

Email sending via Resend API (`RESEND_API_KEY` required).

## Environment Configuration

Required variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=                    # Optional for Prisma
RESEND_API_KEY=                  # For verification emails
NEXT_PUBLIC_APP_URL=             # Base URL (production/staging)
```

Feature flags control OAuth providers (see `.env.example`).

## Common Patterns & Best Practices

### TypeScript Paths

Use `@/` alias for imports:
```typescript
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
```

### Dark Mode Support

Use `dark:` prefix for dark mode styles:
```tsx
<div className="bg-white dark:bg-[#252936] text-[#2D3330] dark:text-[#E8DCC4]">
```

Pre-built combinations available in `commonStyles` from `design-tokens.ts`.

### Form Validation

Define schemas in `lib/validations.ts` using Zod, then use with React Hook Form:
```typescript
import { signInSchema } from '@/lib/validations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(signInSchema),
});
```

### Error Handling

Use Sonner for toast notifications:
```typescript
import { toast } from 'sonner';

toast.error('Something went wrong');
toast.success('Operation completed');
```

## Deployment

Follow `DEPLOY_TO_VERCEL.md` for step-by-step deployment guide. Key points:

- Node.js 20+ required (configured in `.nvmrc` and `.node-version`)
- Environment variables must be set in Vercel dashboard
- Automatic deployments from `main` branch
- Preview deployments for PRs
- Custom domain setup in `DOMAIN_SETUP.md`

## Documentation

Comprehensive documentation available:
- `IMPLEMENTATION_SUMMARY.md` - Full feature overview
- `TESTING_GUIDE.md` - Testing procedures
- `DEPLOYMENT_CHECKLIST.md` - Pre-flight checks (150+ items)
- `PERFORMANCE_OPTIMIZATION.md` - Speed optimization guide
- `README.md` - Quick start and project overview
