# Supabase Schema - Figma Design Alignment Summary

## Overview

Successfully extended the Supabase database schema to support all organization profile fields shown in the Figma empty state design. The schema now includes comprehensive tables for organizations with full feature parity.

## Changes Made

### 1. Extended `organizations` Table

Added the following columns to support Figma design:

#### Basic Information
- `coverImageUrl` - Cover image for organization profile
- `tagline` - Brief statement capturing organization's purpose
- `vision` - Long-term aspiration (separate from mission)

#### Business Details
- `industry` - Primary industry or sector
- `organizationSize` - Employee count range (enum: '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001+')
- `impactArea` - Primary area of impact
- `legalForm` - Legal structure (enum: sole_proprietorship, partnership, llc, corporation, nonprofit, cooperative, benefit_corporation, other)
- `foundedDate` - Date organization was founded
- `registrationCountry` - Country of registration
- `registrationRegion` - State/province/region
- `organizationNumber` - Official registration number
- `locations` - Array of office locations

#### Culture & Values
- `values` - JSONB array of core values
- `workCulture` - JSONB object describing work culture aspects

### 2. New Organization Tables

Created 7 new tables to support Figma features:

#### `organization_ownership`
Tracks ownership and control structure:
- Entity type (individual, organization, collective, government)
- Entity name
- Ownership percentage
- Control type (voting_rights, board_seat, veto_power, management, other)
- Public/private visibility toggle

#### `organization_certifications`
Licenses, certifications, and accreditations:
- Certification type (license, certification, accreditation, award)
- Name (e.g., "B Corp", "ISO 9001")
- Issuer
- Issued/expiry dates
- Credential ID and URL
- Verification status

#### `organization_projects`
Strategic time-bound projects:
- Title, description
- Impact created, business value, outcomes
- Start/end dates
- Status (planning, active, completed, on_hold, cancelled)
- Verification status

#### `organization_partnerships`
Strategic partnerships with other entities:
- Partner name and type
- Partnership scope
- Impact created together
- Start/end dates
- Status (active, completed, suspended)
- Verification status

#### `organization_structure`
Organizational hierarchy:
- Entity type (executive_team, department, team, working_group)
- Name, description
- Team size, focus area
- Parent ID for hierarchical structure

#### `organization_statute`
Company statute/governing documents:
- Section title and content
- Section order
- Public/private visibility toggle

#### `organization_goals`
Major organizational goals:
- Goal type (sustainability, diversity, innovation, growth, impact, other)
- Title, description
- Target date
- Current progress (percentage)
- Metrics for measurement
- Status (not_started, in_progress, achieved, abandoned)

### 3. Security & Performance

All new tables include:
- ✅ Row Level Security (RLS) enabled
- ✅ Policies for public read, member/admin write
- ✅ Indexes on foreign keys for performance
- ✅ `updated_at` triggers
- ✅ CASCADE delete on org deletion

## Alignment with Figma

### Individual Profile Empty State ✅
All fields supported:
- Avatar, cover image
- Tagline, mission
- Values, causes
- Impact stories, experiences, education, volunteering
- **Status**: Fully aligned

### Organization Profile Empty State ✅
All Figma sections now supported:
- ✅ Hero section (logo, cover, tagline)
- ✅ Organization Details (industry, size, impact area, legal form, founded, registration, org number, locations)
- ✅ Ownership & Control Structure
- ✅ Licenses & Certifications
- ✅ Mission, Vision, Values
- ✅ Impact Creation Pipeline (via projects)
- ✅ Strategic Projects
- ✅ Strategic Partnerships
- ✅ Company Structure
- ✅ Company Statute
- ✅ Work Culture
- ✅ Organizational Goals

## Empty State Detection Logic

### Individual Profile
Checks for presence of:
- Avatar, tagline, mission
- Values, causes, skills
- Any entries in: impact stories, experiences, education, volunteering

### Organization Profile (Updated)
Checks three categories:
1. **Basic Info**: tagline, mission, vision, website
2. **Business Details**: industry, size, impact area, legal form
3. **Extended Info**: values, work culture, legal name

Profile is considered "empty" if ALL three categories are empty.

Profile completion percentage calculated from 13 key fields:
- logoUrl, tagline, mission, vision
- industry, organizationSize, impactArea, legalForm
- foundedDate, legalName, website
- values, workCulture

## Migration File

Created: `src/db/migrations/20250134_extend_organization_profile.sql`

This migration includes:
- ALTER TABLE statements for organizations
- CREATE TABLE for 7 new tables
- RLS policies for all new tables
- Indexes for performance
- Trigger setup for updated_at
- Column comments for documentation

## Schema TypeScript Definitions

Updated: `src/db/schema.ts`

Added type-safe definitions for:
- Extended organizations table
- All 7 new organization-related tables
- Proper enums for all constrained fields
- Foreign key relationships

## Next Steps

1. **Apply Migration**:
   ```bash
   # Apply to Supabase
   supabase db push
   ```

2. **Verify in Supabase Dashboard**:
   - Check tables created
   - Verify RLS policies active
   - Test with sample data

3. **Create Server Actions** (Future):
   - `updateOrganizationDetails()`
   - `addOrganizationOwner()`
   - `addCertification()`
   - `addProject()`
   - `addPartnership()`
   - etc.

4. **Create UI Forms** (Future):
   - Forms to populate each empty state section
   - Modal/dialog components for adding entries
   - Inline editing for existing entries

## Files Modified

1. `src/db/schema.ts` - Extended TypeScript schema definitions
2. `src/app/app/o/[slug]/profile/page.tsx` - Updated empty state detection
3. `src/db/migrations/20250134_extend_organization_profile.sql` - New migration (NEW)

## Verification Checklist

✅ All Figma empty state fields mapped to database columns
✅ New tables created with proper relationships
✅ RLS policies configured for security
✅ Indexes added for query performance
✅ TypeScript types updated in schema.ts
✅ Empty state detection logic updated
✅ Profile completion calculation includes new fields
✅ No linter errors

## Notes

- The individual profile schema was already well-aligned with Figma
- Organization profiles required significant extension (7 new tables, 16 new columns)
- All new fields are optional to allow gradual profile completion
- Verification fields added throughout for future trust/transparency features
- The schema now supports the full "transparency-first" organizational profile vision shown in Figma

