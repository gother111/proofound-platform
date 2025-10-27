# Profile Pages Integration Guide

## Overview

This guide explains how to integrate the new design system profile components with your existing data layer and forms.

## Architecture

```
┌─────────────────────────────────────────┐
│   Your Page (e.g., app/profile/page.tsx) │
└──────────────┬──────────────────────────┘
               │
               ├─ useProfileData() hook
               │  (fetches from Supabase)
               │
               v
┌──────────────────────────────────────────┐
│  EditableIndividualProfile (Adapter)     │
│  - Manages modal states                   │
│  - Transforms data                        │
│  - Handles callbacks                      │
└──────────────┬───────────────────────────┘
               │
               v
┌──────────────────────────────────────────┐
│  IndividualProfileView (Design System)   │
│  - Pure presentation                      │
│  - Animations & accessibility            │
│  - Exact design spec                      │
└──────────────────────────────────────────┘
```

## Quick Start

### 1. Use EditableIndividualProfile in your page

```typescript
// app/profile/page.tsx
import { EditableIndividualProfile } from '@/components/profile/individual/EditableIndividualProfile';
import { useProfileData } from '@/hooks/useProfileData';

export default function ProfilePage() {
  const profileData = useProfileData();

  return <EditableIndividualProfile profileData={profileData} />;
}
```

### 2. Connect Your Forms/Modals

Open `EditableIndividualProfile.tsx` and uncomment the modal imports/renders at the bottom:

```typescript
// Import your existing forms
import { EditProfileModal } from './modals/EditProfileModal';
import { MissionEditor } from './modals/MissionEditor';
import { ValuesEditor } from './modals/ValuesEditor';
import { CausesEditor } from './modals/CausesEditor';
import { SkillsEditor } from './modals/SkillsEditor';
import { ImpactStoryForm } from './forms/ImpactStoryForm';
import { ExperienceForm } from './forms/ExperienceForm';
import { EducationForm } from './forms/EducationForm';
import { VolunteerForm } from './forms/VolunteerForm';

// Then uncomment the JSX at the bottom of the component
```

## Components Created

### Foundation
- ✅ `lib/profile-colors.ts` - Exact RGB color system
- ✅ `lib/profile-types.ts` - TypeScript interfaces
- ✅ `lib/profile-data-transformer.ts` - Data transformation

### Shared Components
- ✅ `ProfileAvatar.tsx` - Avatar with upload
- ✅ `VerifiedBadge.tsx` - Verification badge
- ✅ `EmptyState.tsx` - Empty state templates
- ✅ `ContentCard.tsx` - Base card for content

### Individual Profile
- ✅ `CompletionBanner.tsx` - Profile completion banner
- ✅ `ProfileHero.tsx` - Hero with cover upload
- ✅ `MissionCard.tsx` - Mission display
- ✅ `ValuesCard.tsx` - Values display
- ✅ `CausesCard.tsx` - Causes display
- ✅ `SkillsCard.tsx` - Skills display
- ✅ `ProfileSidebar.tsx` - Sidebar wrapper
- ✅ `ProfileTabs.tsx` - Tab navigation
- ✅ `ImpactTab.tsx` - Impact stories
- ✅ `JourneyTab.tsx` - Experiences
- ✅ `LearningTab.tsx` - Education
- ✅ `ServiceTab.tsx` - Volunteering
- ✅ `NetworkTab.tsx` - Network stats
- ✅ `IndividualProfileView.tsx` - Main view
- ✅ `EditableIndividualProfile.tsx` - Adapter

### Organization Profile
- ✅ `OrganizationProfileView.tsx` - Main view
- ✅ `BasicInformationForm.tsx` - Editable form
- ✅ `OrganizationDetailsCard.tsx` - Read-only details

## Data Transformation

The `transformToComponentData()` function maps your hook data to component props:

```typescript
// Your hook format
{
  profile: {
    displayName: "John Doe",
    location: "San Francisco",
    // ...
  },
  impactStories: [...],
  // ...
}

// Transforms to component format
{
  basicInfo: {
    name: "John Doe",
    location: "San Francisco",
    // ...
  },
  impactStories: [...],
  // ...
}
```

## Customization

### Changing Colors

Edit `lib/profile-colors.ts`:

```typescript
export const profileColors = {
  sage: 'rgb(122, 146, 120)',     // Your brand color
  terracotta: 'rgb(198, 123, 92)', // Secondary
  teal: 'rgb(92, 139, 137)',       // Accent
  ochre: 'rgb(212, 165, 116)',     // Highlight
  // ...
};
```

### Adding Fields

1. Update `BasicInfo` interface in `lib/profile-types.ts`
2. Update `ProfileHero.tsx` to display new field
3. Update transformer in `lib/profile-data-transformer.ts`
4. Add field to your form component

### Modifying Animations

Edit Framer Motion props in components:

```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }} // Adjust timing
>
```

## File Upload

The adapter includes file upload handlers that convert files to base64:

```typescript
const handleAvatarUpload = async (file: File) => {
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64String = reader.result as string;
    updateBasicInfo({ avatar: base64String });
  };
  reader.readAsDataURL(file);
};
```

**To use cloud storage instead:**
1. Replace base64 conversion with upload to S3/Supabase Storage
2. Save URL instead of base64 string
3. Update `updateBasicInfo` to accept URL

## Features Preserved

✅ Exact design specs (RGB colors, spacing, typography)
✅ Framer Motion animations
✅ Full accessibility (ARIA labels, keyboard nav)
✅ Responsive design (mobile → desktop)
✅ Custom SVG empty states
✅ Hover effects and transitions
✅ Verified badges
✅ Profile completion tracking

## Next Steps

### Required
1. Create or import your form/modal components
2. Wire up modals in `EditableIndividualProfile.tsx`
3. Test all CRUD operations
4. Verify file uploads work correctly

### Optional
5. Add loading skeletons
6. Implement network visualization
7. Add toast notifications
8. Create edit history tracking
9. Add draft/autosave functionality

## Troubleshooting

### "Cannot find module" errors
- Ensure all imports match your file structure
- Check that `useProfileData` hook exists

### Data not displaying
- Check console for transformation errors
- Verify data structure matches `HookProfileData` interface
- Add console.logs in transformer

### Styles not applying
- Verify Tailwind is configured
- Check that color values in `profile-colors.ts` are correct
- Inspect elements to see if inline styles are applied

### Forms not opening
- Check modal state variables in `EditableIndividualProfile`
- Verify modal components are imported and rendered
- Check that callbacks are passed correctly

## Support

For issues or questions:
1. Check the component JSDoc comments
2. Review the TypeScript interfaces
3. Inspect the transformation logic
4. Test with sample data

## Example Data

See `lib/profile-types.ts` for example data structures:

```typescript
const sampleData: ProfileData = {
  basicInfo: {
    name: "Alex Rivera",
    location: "San Francisco, CA",
    joinedDate: "January 2024",
    avatar: null,
    coverImage: null,
    tagline: "Impact-driven product designer...",
  },
  // ... rest of data
};
```
