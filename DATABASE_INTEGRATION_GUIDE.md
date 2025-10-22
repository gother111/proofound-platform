# 🗄️ Database Integration Guide

This guide shows you how to migrate from localStorage to database persistence.

## 📋 Overview

Currently, the profile system uses **localStorage** for data persistence. This is great for prototyping but has limitations:

- Data is device-specific
- No backup/recovery
- Limited storage (5-10MB)
- No multi-device sync

This guide will help you integrate with your existing database schema.

---

## ✅ Prerequisites (Already Done!)

You already have:

1. ✅ Database schema defined in `src/db/schema.ts`
2. ✅ Migration file at `drizzle/0001_small_talon.sql`
3. ✅ RLS policies in `src/db/policies.sql`
4. ✅ Triggers in `src/db/triggers.sql`

---

## 🚀 Step-by-Step Integration

### Step 1: Apply Database Migration

```bash
# Ensure DATABASE_URL is in your .env file
# Example: DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Apply the migration
npx drizzle-kit push
```

### Step 2: Apply RLS Policies

In your Supabase SQL Editor, run:

```sql
-- Copy contents from src/db/policies.sql and execute
-- This enables Row Level Security for all new tables

-- Then copy contents from src/db/triggers.sql
-- This adds updated_at triggers
```

### Step 3: Create Server Actions

Create `src/app/actions/profile.ts`:

```typescript
'use server';

import { db } from '@/db';
import {
  individualProfiles,
  impactStories,
  experiences,
  education,
  volunteering,
  profiles,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type {
  ProfileData,
  BasicInfo,
  ImpactStory,
  Experience,
  Education,
  Volunteering,
  Value,
  Skill,
} from '@/types/profile';

// ========================================
// READ Operations
// ========================================

export async function getProfileData(): Promise<ProfileData | null> {
  const user = await requireAuth();

  // Fetch individual profile
  const [individualProfile] = await db
    .select()
    .from(individualProfiles)
    .leftJoin(profiles, eq(individualProfiles.userId, profiles.id))
    .where(eq(individualProfiles.userId, user.id))
    .limit(1);

  if (!individualProfile) {
    // Create empty profile for new users
    await db.insert(individualProfiles).values({
      userId: user.id,
      headline: null,
      bio: null,
      skills: [],
      location: null,
      visibility: 'network',
      tagline: null,
      mission: null,
      coverImageUrl: null,
      verified: false,
      values: [],
      causes: [],
    });

    return {
      basicInfo: {
        name: user.displayName || 'Your Name',
        tagline: null,
        location: null,
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        avatar: user.avatarUrl || null,
        coverImage: null,
      },
      mission: null,
      values: [],
      causes: [],
      skills: [],
      impactStories: [],
      experiences: [],
      education: [],
      volunteering: [],
    };
  }

  // Fetch all related data in parallel
  const [userImpactStories, userExperiences, userEducation, userVolunteering] = await Promise.all([
    db.select().from(impactStories).where(eq(impactStories.userId, user.id)),
    db.select().from(experiences).where(eq(experiences.userId, user.id)),
    db.select().from(education).where(eq(education.userId, user.id)),
    db.select().from(volunteering).where(eq(volunteering.userId, user.id)),
  ]);

  const profile = individualProfile.individual_profiles;
  const userProfile = individualProfile.profiles;

  return {
    basicInfo: {
      name: userProfile?.displayName || 'Your Name',
      tagline: profile?.tagline || null,
      location: profile?.location || null,
      joinedDate: userProfile?.createdAt
        ? new Date(userProfile.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      avatar: userProfile?.avatarUrl || null,
      coverImage: profile?.coverImageUrl || null,
    },
    mission: profile?.mission || null,
    values: (profile?.values as Value[]) || [],
    causes: profile?.causes || [],
    skills: (profile?.skills || []).map((skill: string | Skill) =>
      typeof skill === 'string' ? { id: skill, name: skill, verified: false } : skill
    ),
    impactStories: userImpactStories.map((story) => ({
      id: story.id,
      title: story.title,
      orgDescription: story.orgDescription,
      impact: story.impact,
      businessValue: story.businessValue,
      outcomes: story.outcomes,
      timeline: story.timeline,
      verified: story.verified || false,
    })),
    experiences: userExperiences.map((exp) => ({
      id: exp.id,
      title: exp.title,
      orgDescription: exp.orgDescription,
      duration: exp.duration,
      learning: exp.learning,
      growth: exp.growth,
      verified: exp.verified || false,
    })),
    education: userEducation.map((edu) => ({
      id: edu.id,
      institution: edu.institution,
      degree: edu.degree,
      duration: edu.duration,
      skills: edu.skills,
      projects: edu.projects,
      verified: edu.verified || false,
    })),
    volunteering: userVolunteering.map((vol) => ({
      id: vol.id,
      title: vol.title,
      orgDescription: vol.orgDescription,
      duration: vol.duration,
      cause: vol.cause,
      impact: vol.impact,
      skillsDeployed: vol.skillsDeployed,
      personalWhy: vol.personalWhy,
      verified: vol.verified || false,
    })),
  };
}

// ========================================
// UPDATE Operations - Basic Info
// ========================================

export async function updateBasicInfo(updates: Partial<BasicInfo>) {
  const user = await requireAuth();

  // Update individual_profiles table
  const profileUpdates: any = {};
  if (updates.tagline !== undefined) profileUpdates.tagline = updates.tagline;
  if (updates.location !== undefined) profileUpdates.location = updates.location;
  if (updates.coverImage !== undefined) profileUpdates.coverImageUrl = updates.coverImage;

  if (Object.keys(profileUpdates).length > 0) {
    await db
      .update(individualProfiles)
      .set(profileUpdates)
      .where(eq(individualProfiles.userId, user.id));
  }

  // Update profiles table if name or avatar changed
  const userUpdates: any = {};
  if (updates.name !== undefined) userUpdates.displayName = updates.name;
  if (updates.avatar !== undefined) userUpdates.avatarUrl = updates.avatar;

  if (Object.keys(userUpdates).length > 0) {
    await db.update(profiles).set(userUpdates).where(eq(profiles.id, user.id));
  }

  revalidatePath('/i/profile');
}

export async function updateMission(mission: string) {
  const user = await requireAuth();
  await db
    .update(individualProfiles)
    .set({ mission })
    .where(eq(individualProfiles.userId, user.id));
  revalidatePath('/i/profile');
}

export async function updateValues(values: Value[]) {
  const user = await requireAuth();
  await db
    .update(individualProfiles)
    .set({ values: values as any })
    .where(eq(individualProfiles.userId, user.id));
  revalidatePath('/i/profile');
}

export async function updateCauses(causes: string[]) {
  const user = await requireAuth();
  await db.update(individualProfiles).set({ causes }).where(eq(individualProfiles.userId, user.id));
  revalidatePath('/i/profile');
}

export async function updateSkills(skills: Skill[]) {
  const user = await requireAuth();
  const skillsData = skills.map((s) => s.name); // Store as string array for now
  await db
    .update(individualProfiles)
    .set({ skills: skillsData })
    .where(eq(individualProfiles.userId, user.id));
  revalidatePath('/i/profile');
}

// ========================================
// CREATE Operations - Content
// ========================================

export async function createImpactStory(story: Omit<ImpactStory, 'id'>) {
  const user = await requireAuth();
  const [created] = await db
    .insert(impactStories)
    .values({
      userId: user.id,
      title: story.title,
      orgDescription: story.orgDescription,
      impact: story.impact,
      businessValue: story.businessValue,
      outcomes: story.outcomes,
      timeline: story.timeline,
      verified: story.verified,
    })
    .returning();
  revalidatePath('/i/profile');
  return created;
}

export async function createExperience(experience: Omit<Experience, 'id'>) {
  const user = await requireAuth();
  const [created] = await db
    .insert(experiences)
    .values({
      userId: user.id,
      title: experience.title,
      orgDescription: experience.orgDescription,
      duration: experience.duration,
      learning: experience.learning,
      growth: experience.growth,
      verified: experience.verified,
    })
    .returning();
  revalidatePath('/i/profile');
  return created;
}

export async function createEducation(edu: Omit<Education, 'id'>) {
  const user = await requireAuth();
  const [created] = await db
    .insert(education)
    .values({
      userId: user.id,
      institution: edu.institution,
      degree: edu.degree,
      duration: edu.duration,
      skills: edu.skills,
      projects: edu.projects,
      verified: edu.verified,
    })
    .returning();
  revalidatePath('/i/profile');
  return created;
}

export async function createVolunteering(vol: Omit<Volunteering, 'id'>) {
  const user = await requireAuth();
  const [created] = await db
    .insert(volunteering)
    .values({
      userId: user.id,
      title: vol.title,
      orgDescription: vol.orgDescription,
      duration: vol.duration,
      cause: vol.cause,
      impact: vol.impact,
      skillsDeployed: vol.skillsDeployed,
      personalWhy: vol.personalWhy,
      verified: vol.verified,
    })
    .returning();
  revalidatePath('/i/profile');
  return created;
}

// ========================================
// DELETE Operations
// ========================================

export async function deleteImpactStory(id: string) {
  const user = await requireAuth();
  await db.delete(impactStories).where(eq(impactStories.id, id));
  revalidatePath('/i/profile');
}

export async function deleteExperience(id: string) {
  const user = await requireAuth();
  await db.delete(experiences).where(eq(experiences.id, id));
  revalidatePath('/i/profile');
}

export async function deleteEducation(id: string) {
  const user = await requireAuth();
  await db.delete(education).where(eq(education.id, id));
  revalidatePath('/i/profile');
}

export async function deleteVolunteering(id: string) {
  const user = await requireAuth();
  await db.delete(volunteering).where(eq(volunteering.id, id));
  revalidatePath('/i/profile');
}
```

### Step 4: Update useProfileData Hook

Modify `src/hooks/useProfileData.ts` to use server actions instead of localStorage:

```typescript
import { useState, useEffect, useCallback } from 'react';
import {
  ProfileData,
  Value,
  Skill,
  ImpactStory,
  Experience,
  Education,
  Volunteering,
} from '@/types/profile';
import {
  getProfileData,
  updateBasicInfo as updateBasicInfoAction,
  updateMission as updateMissionAction,
  updateValues as updateValuesAction,
  updateCauses as updateCausesAction,
  updateSkills as updateSkillsAction,
  createImpactStory as createImpactStoryAction,
  deleteImpactStory as deleteImpactStoryAction,
  createExperience as createExperienceAction,
  deleteExperience as deleteExperienceAction,
  createEducation as createEducationAction,
  deleteEducation as deleteEducationAction,
  createVolunteering as createVolunteeringAction,
  deleteVolunteering as deleteVolunteeringAction,
} from '@/app/actions/profile';
import { calculateProfileCompletion } from '@/lib/profileStorage';

export function useProfileData() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(5);

  // Load profile from server on mount
  useEffect(() => {
    getProfileData().then((data) => {
      if (data) {
        setProfile(data);
        setProfileCompletion(calculateProfileCompletion(data));
      }
      setIsLoading(false);
    });
  }, []);

  // Recalculate completion whenever profile changes
  useEffect(() => {
    if (profile) {
      setProfileCompletion(calculateProfileCompletion(profile));
    }
  }, [profile]);

  // Basic Info
  const updateBasicInfo = useCallback(
    async (updates: Partial<ProfileData['basicInfo']>) => {
      if (!profile) return;

      // Optimistic update
      setProfile((prev) => ({
        ...prev!,
        basicInfo: { ...prev!.basicInfo, ...updates },
      }));

      // Server update
      await updateBasicInfoAction(updates);
    },
    [profile]
  );

  // Mission
  const updateMission = useCallback(
    async (mission: string) => {
      if (!profile) return;

      setProfile((prev) => ({ ...prev!, mission }));
      await updateMissionAction(mission);
    },
    [profile]
  );

  // Values
  const addValue = useCallback(
    async (value: Omit<Value, 'id'>) => {
      if (!profile) return;

      const newValue = { ...value, id: Date.now().toString() };
      const newValues = [...profile.values, newValue];
      setProfile((prev) => ({ ...prev!, values: newValues }));
      await updateValuesAction(newValues);
    },
    [profile]
  );

  const deleteValue = useCallback(
    async (id: string) => {
      if (!profile) return;

      const newValues = profile.values.filter((v) => v.id !== id);
      setProfile((prev) => ({ ...prev!, values: newValues }));
      await updateValuesAction(newValues);
    },
    [profile]
  );

  // Causes
  const addCause = useCallback(
    async (cause: string) => {
      if (!profile) return;

      const newCauses = [...profile.causes, cause];
      setProfile((prev) => ({ ...prev!, causes: newCauses }));
      await updateCausesAction(newCauses);
    },
    [profile]
  );

  const deleteCause = useCallback(
    async (cause: string) => {
      if (!profile) return;

      const newCauses = profile.causes.filter((c) => c !== cause);
      setProfile((prev) => ({ ...prev!, causes: newCauses }));
      await updateCausesAction(newCauses);
    },
    [profile]
  );

  // Skills
  const addSkill = useCallback(
    async (skill: Omit<Skill, 'id'>) => {
      if (!profile) return;

      const newSkill = { ...skill, id: Date.now().toString() };
      const newSkills = [...profile.skills, newSkill];
      setProfile((prev) => ({ ...prev!, skills: newSkills }));
      await updateSkillsAction(newSkills);
    },
    [profile]
  );

  const deleteSkill = useCallback(
    async (id: string) => {
      if (!profile) return;

      const newSkills = profile.skills.filter((s) => s.id !== id);
      setProfile((prev) => ({ ...prev!, skills: newSkills }));
      await updateSkillsAction(newSkills);
    },
    [profile]
  );

  // Impact Stories
  const addImpactStory = useCallback(
    async (story: Omit<ImpactStory, 'id'>) => {
      if (!profile) return;

      const created = await createImpactStoryAction(story);
      setProfile((prev) => ({
        ...prev!,
        impactStories: [...prev!.impactStories, { ...story, id: created.id }],
      }));
    },
    [profile]
  );

  const deleteImpactStory = useCallback(
    async (id: string) => {
      if (!profile) return;

      setProfile((prev) => ({
        ...prev!,
        impactStories: prev!.impactStories.filter((s) => s.id !== id),
      }));
      await deleteImpactStoryAction(id);
    },
    [profile]
  );

  // Experiences
  const addExperience = useCallback(
    async (experience: Omit<Experience, 'id'>) => {
      if (!profile) return;

      const created = await createExperienceAction(experience);
      setProfile((prev) => ({
        ...prev!,
        experiences: [...prev!.experiences, { ...experience, id: created.id }],
      }));
    },
    [profile]
  );

  const deleteExperience = useCallback(
    async (id: string) => {
      if (!profile) return;

      setProfile((prev) => ({
        ...prev!,
        experiences: prev!.experiences.filter((e) => e.id !== id),
      }));
      await deleteExperienceAction(id);
    },
    [profile]
  );

  // Education
  const addEducation = useCallback(
    async (education: Omit<Education, 'id'>) => {
      if (!profile) return;

      const created = await createEducationAction(education);
      setProfile((prev) => ({
        ...prev!,
        education: [...prev!.education, { ...education, id: created.id }],
      }));
    },
    [profile]
  );

  const deleteEducation = useCallback(
    async (id: string) => {
      if (!profile) return;

      setProfile((prev) => ({
        ...prev!,
        education: prev!.education.filter((e) => e.id !== id),
      }));
      await deleteEducationAction(id);
    },
    [profile]
  );

  // Volunteering
  const addVolunteering = useCallback(
    async (volunteering: Omit<Volunteering, 'id'>) => {
      if (!profile) return;

      const created = await createVolunteeringAction(volunteering);
      setProfile((prev) => ({
        ...prev!,
        volunteering: [...prev!.volunteering, { ...volunteering, id: created.id }],
      }));
    },
    [profile]
  );

  const deleteVolunteering = useCallback(
    async (id: string) => {
      if (!profile) return;

      setProfile((prev) => ({
        ...prev!,
        volunteering: prev!.volunteering.filter((v) => v.id !== id),
      }));
      await deleteVolunteeringAction(id);
    },
    [profile]
  );

  return {
    profile,
    isLoading,
    profileCompletion,
    updateBasicInfo,
    updateMission,
    addValue,
    updateValue: () => {}, // Not needed with new approach
    deleteValue,
    addCause,
    deleteCause,
    addSkill,
    updateSkill: () => {}, // Not needed with new approach
    deleteSkill,
    addImpactStory,
    updateImpactStory: () => {}, // Can add if needed for editing
    deleteImpactStory,
    addExperience,
    updateExperience: () => {}, // Can add if needed for editing
    deleteExperience,
    addEducation,
    updateEducation: () => {}, // Can add if needed for editing
    deleteEducation,
    addVolunteering,
    updateVolunteering: () => {}, // Can add if needed for editing
    deleteVolunteering,
  };
}
```

### Step 5: Update Page to Use Server Data

No changes needed to `src/app/i/profile/page.tsx` - it already just renders `<EditableProfileView />`!

### Step 6: Handle Images Properly

For production, move images to Supabase Storage instead of base64:

```typescript
// src/lib/imageUpload.ts
import { createClient } from '@/lib/supabase/client';

export async function uploadProfileImage(
  file: File,
  userId: string,
  type: 'avatar' | 'cover'
): Promise<string> {
  const supabase = createClient();

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${type}-${Date.now()}.${fileExt}`;
  const filePath = `profile-images/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage.from('profile-images').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('profile-images').getPublicUrl(data.path);

  return publicUrl;
}
```

Update `AvatarUpload.tsx` and `CoverUpload.tsx`:

```typescript
// Instead of:
const base64 = reader.result as string;
onUpload(base64);

// Do:
const publicUrl = await uploadProfileImage(file, userId, 'avatar');
onUpload(publicUrl);
```

---

## ⚡ Quick Migration Path

If you want to migrate existing localStorage data to the database:

```typescript
// src/lib/migrateLocalStorageToDb.ts
import { loadProfile } from '@/lib/profileStorage';
import {
  updateBasicInfo,
  updateMission,
  updateValues,
  updateCauses,
  updateSkills,
  createImpactStory,
  createExperience,
  createEducation,
  createVolunteering,
} from '@/app/actions/profile';

export async function migrateLocalStorageData() {
  const localProfile = loadProfile();

  // Update basic info
  await updateBasicInfo(localProfile.basicInfo);

  // Update mission
  if (localProfile.mission) {
    await updateMission(localProfile.mission);
  }

  // Update values, causes, skills
  if (localProfile.values.length > 0) await updateValues(localProfile.values);
  if (localProfile.causes.length > 0) await updateCauses(localProfile.causes);
  if (localProfile.skills.length > 0) await updateSkills(localProfile.skills);

  // Migrate content
  for (const story of localProfile.impactStories) {
    await createImpactStory(story);
  }

  for (const exp of localProfile.experiences) {
    await createExperience(exp);
  }

  for (const edu of localProfile.education) {
    await createEducation(edu);
  }

  for (const vol of localProfile.volunteering) {
    await createVolunteering(vol);
  }

  // Clear localStorage after successful migration
  localStorage.removeItem('proofound_profile_data');
}
```

Add a "Migrate Data" button in your UI for users who have localStorage data.

---

## 🧪 Testing

After integration:

1. **Create a new profile** - Verify data persists to database
2. **Edit all sections** - Verify updates work
3. **Delete items** - Verify deletions work
4. **Refresh page** - Verify data loads from database
5. **Test on multiple devices** - Verify sync works
6. **Test with multiple users** - Verify RLS works

---

## 🐛 Troubleshooting

### Issue: Data not saving

- Check browser console for errors
- Verify `DATABASE_URL` is set
- Check RLS policies are applied
- Verify authentication is working

### Issue: Data not loading

- Check server action is being called
- Verify table names match schema
- Check user has permission to read data

### Issue: Images not uploading

- Verify Supabase Storage bucket exists
- Check bucket permissions (public read)
- Verify file size limits

---

## ✅ Verification Checklist

After completing integration:

- [ ] Database migration applied successfully
- [ ] RLS policies enabled on all tables
- [ ] Triggers applied for updated_at
- [ ] Server actions created and working
- [ ] Hook updated to use server actions
- [ ] Images moved to Supabase Storage
- [ ] Authentication check re-enabled
- [ ] Testing completed on all CRUD operations
- [ ] localStorage migration path provided
- [ ] Error handling added
- [ ] Revalidation working correctly

---

## 🎉 Success!

Once complete, you'll have:

- ✅ Database-backed profile system
- ✅ Multi-device sync
- ✅ Proper authentication and authorization
- ✅ Scalable image storage
- ✅ Data backup and recovery
- ✅ Production-ready deployment

Time estimate: **4-6 hours** for a developer familiar with the codebase.
