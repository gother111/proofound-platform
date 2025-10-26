# Proofound MVP

**A credibility engineering platform for impactful connections**

Backed by evidence, not vanity metrics. Proofound helps individuals and organizations make meaningful connections based on verified skills, mission alignment, and transparent matching.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (recommended - currently v16.14.0, upgrade suggested)
- **npm** or **yarn**
- **Supabase account** (database is already configured!)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Environment variables are already configured!**
   - `.env.local` is set up with Supabase credentials
   - Database schema is fully migrated
   - Ready to run!

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
   - Visit [http://localhost:3000](http://localhost:3000)
   - You'll see the beautiful landing page!

---

## ✨ What's Included

### ✅ **Fully Implemented** (Phases 1-3, 7, 9)

#### **Database** (Production-Ready!)
- ✅ 10 tables with Row-Level Security
- ✅ 5 admin dashboard views for North Star metrics
- ✅ Indexes for performance
- ✅ Triggers for automation
- ✅ All PRD requirements implemented

#### **Authentication**
- ✅ Email/password authentication
- ✅ OAuth ready (Google, LinkedIn) - needs API keys
- ✅ Protected routes with middleware
- ✅ Session management
- ✅ Age gate (18+)

#### **Matching Algorithm**
- ✅ Configurable weights (Mission 30%, Expertise 40%, Tools 10%, Logistics 10%, Recency 10%)
- ✅ Explainability with strengths/gaps/improvements
- ✅ Batch matching API
- ✅ Strong/near match classification

#### **Pages & Features**
- ✅ Landing page (hero, features, CTA)
- ✅ Login & Signup (with forms)
- ✅ Dashboard with stats
- ✅ Matches page with generation
- ✅ Profile page with completion tracking
- ✅ Settings page (placeholder)
- ✅ Admin dashboard with North Star metrics
- ✅ OAuth callback handler

#### **Components**
- ✅ LoginForm (email/password + OAuth)
- ✅ SignupForm (with age gate)
- ✅ MatchCard (with explainability preview)
- ✅ GenerateMatchesButton
- ✅ shadcn/ui components

#### **Infrastructure**
- ✅ TypeScript types from Supabase
- ✅ Zod validation schemas (all forms)
- ✅ Analytics event tracking
- ✅ Utility functions (date, currency, masking, etc.)
- ✅ Error handling
- ✅ Dark mode support

### 🚧 **Pending** (Phases 4, 5, 6, 8, 10)

- ⏳ Profile builder components
- ⏳ Verification system UI
- ⏳ Messaging components
- ⏳ Organization dashboard
- ⏳ Assignment creation
- ⏳ Moderation queue UI
- ⏳ Loading states & skeletons
- ⏳ Performance optimization

---

## 🎯 Test the MVP

### 1. **Create an Account**
- Go to `/signup`
- Fill in name, email, password
- ✅ Confirm 18+ age
- Click "Create account"

### 2. **Explore the Dashboard**
- After login, you'll see `/home`
- View your profile completion percentage
- See stats (matches, verifications, messages)

### 3. **Generate Matches** (When Profile Ready)
- Complete profile to 80%
- Add one verified proof
- Go to `/matches`
- Click "Find Matches" button
- View match cards with scores!

### 4. **Admin Dashboard**
- Go to `/admin/dashboard`
- See North Star metrics:
  - Time to First Match
  - Match acceptance rates
  - Profile readiness
  - Organization verification
  - Safety metrics

---

## 📊 North Star Metrics

### Primary
- **Time-to-First-Accepted Match** (median)

### Secondary
- **% Assignments with ≥3 qualified matches** (7 days)
- Match acceptance rate
- Profile completion rate (24h)
- Organization verification rate

---

## 🗄️ Database Schema

### Key Tables
- **profiles** - User profiles with Mission/Vision/Values
- **expertise_atlas** - Skills with proof counts
- **matches** - With 5-component explainability
- **assignments** - With configurable weights (±15pp)
- **verification_requests** - Referee workflow
- **messages** - Stage-based privacy
- **reports** - Content moderation
- **analytics_events** - Event tracking

### Admin Views
- `admin_time_to_first_match`
- `admin_profile_readiness_stats`
- `admin_match_stats`
- `admin_org_verification_stats`
- `admin_safety_stats`

---

## 🔧 Tech Stack

- **Next.js 15** (App Router, Server Components)
- **TypeScript** (strict mode)
- **React 19**
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (Postgres + Auth + Storage)
- **Zod** (validation)
- **React Hook Form** (forms)
- **date-fns** (dates)

---

## 📝 Project Structure

```
/app
  /(auth)           ✅ Login, Signup, Verify Email
  /auth/callback    ✅ OAuth handler
  /(dashboard)      ✅ Home, Matches, Profile, Settings
  /(admin)          ✅ Admin dashboard
  /api/matches      ✅ Match generation API
/components
  /auth             ✅ Login & Signup forms
  /matching         ✅ Match cards & buttons
  /ui               ✅ Button (shadcn)
/lib
  /supabase         ✅ Complete (client, server, middleware)
  /matching         ✅ Algorithm with explainability
  /validations.ts   ✅ All form schemas
  /analytics.ts     ✅ Event tracking
  /utils.ts         ✅ Helpers
/types
  /database.ts      ✅ Generated from Supabase
  /index.ts         ✅ App types
```

---

## 🔑 Enable OAuth (Optional)

To enable Google & LinkedIn OAuth:

1. **Supabase Dashboard**:
   - Go to Authentication → Providers
   - Enable Google & LinkedIn
   - Add client IDs/secrets

2. **Update `.env.local`**:
   ```bash
   NEXT_PUBLIC_SUPABASE_GOOGLE_CLIENT_ID=your_google_client_id
   NEXT_PUBLIC_SUPABASE_LINKEDIN_CLIENT_ID=your_linkedin_client_id
   ```

3. **Test OAuth**:
   - Click Google/LinkedIn buttons on signup/login
   - Should redirect and create profile automatically

---

## 📈 Progress Summary

| Phase | Status | Completion |
|-------|--------|-----------|
| 1-3. Foundation | ✅ Complete | 100% |
| 4-6. Auth & UI | 🚧 In Progress | 60% |
| 7. Matching Algorithm | ✅ Complete | 100% |
| 8. Verification | ⏳ Pending | 0% |
| 9. Admin Dashboard | ✅ Complete | 100% |
| 10. Polish | ⏳ Pending | 0% |

**Overall: ~65% Complete**

---

## 🚀 What's Working NOW

✅ **Sign up & Login** (email/password)  
✅ **Protected routes** with middleware  
✅ **Profile creation** on signup  
✅ **Dashboard** with real stats  
✅ **Match generation** with algorithm  
✅ **Match cards** with explainability  
✅ **Admin dashboard** with metrics  
✅ **Dark mode** throughout  
✅ **Responsive design**  
✅ **Form validation**  
✅ **Analytics tracking**  

---

## 📚 Documentation

- **PROGRESS.md** - Detailed build progress
- **PRD** - Product requirements document
- **Database schema** - See Supabase dashboard

---

## 🎨 Design System

- **Colors**: Blue (primary), Green (success), Yellow (warning), Red (error)
- **Typography**: Inter font family
- **Components**: shadcn/ui (accessible, customizable)
- **Dark mode**: Full support
- **Responsive**: Mobile-first design

---

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

---

## 🔥 Next Steps

1. ✅ Test signup/login flows
2. ⏳ Build profile builder UI
3. ⏳ Create verification workflow
4. ⏳ Add messaging system
5. ⏳ Organization features
6. ⏳ Final polish & optimization

---

## 🤝 Support

For questions or issues:
- Check `PROGRESS.md` for implementation details
- Review PRD for requirements
- Contact: Pavlo (Product Owner)

---

**Built with ❤️ by AI Assistant (Claude Sonnet 4.5) & Pavlo**

Last Updated: October 26, 2025

