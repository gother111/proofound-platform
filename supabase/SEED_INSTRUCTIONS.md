# Demo Data Seed Instructions

## What Was Successfully Seeded

✅ **3 Organizations** (ready to use)
✅ **3 Assignments** (published and live)
✅ **2 Demo Profiles** (updated from existing)

## What Still Needs Setup

### Individual Profiles from demo_profiles.sql

The script includes 5 detailed individual profiles:
- Sofia Martinez (UX Designer)
- James Chen (Software Engineer)
- Amara Okafor (Community Organizer)
- Dr. Yuki Tanaka (Data Scientist)
- Alex Rivera (Social Entrepreneur)

**To add these profiles, follow these steps:**

1. **Create Auth Users in Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/[your-project]/auth/users
   - Create 5 test users (use demo emails from the SQL file)

2. **Link Profiles to Auth Users:**
   - Get the auth user IDs from the dashboard
   - Update the demo_profiles.sql INSERT statements to use those IDs instead of `gen_random_uuid()`

3. **Run the Individual Profile Inserts:**
   ```sql
   -- Run each INSERT block from demo_profiles.sql
   -- Make sure to replace gen_random_uuid() with actual auth.users.id values
   ```

## Current Demo Data You Can Use

### Organizations
- GreenTech Innovations - Clean energy startup
- Code for Good Foundation - Education NGO
- Impact Capital Partners - Impact investment firm

### Assignments
- Senior Solar Engineer (GreenTech) - €75K-95K
- Community Outreach Coordinator (GreenTech) - €45K-60K
- Lead Instructor - Web Development (Code for Good) - Volunteer

## Testing the Platform

You can now test:
- Organization dashboard with real data
- Assignment posting and viewing
- Assignment matching (once individual profiles are added)

For questions, see the main README or supabase/SETUP_GUIDE.md
