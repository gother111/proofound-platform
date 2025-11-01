# Null Taxonomy Bug Fix - Expertise Atlas

## Problem
After applying the foreign key migration to link `skills.skill_code` to `skills_taxonomy.code`, the Expertise Atlas page was still showing a "Something went wrong" error with console errors:

1. `TypeError: Cannot read properties of undefined (reading 'en')` 
2. Multiple `<path> attribute d: Expected path command` errors in Recharts components

## Root Cause
The issue was caused by **skills with `skill_code = NULL`** (custom user-created skills or skills created before the taxonomy). When these skills were joined with the `skills_taxonomy` table, the `taxonomy` field would be `NULL`, but multiple UI components were trying to access `skill.taxonomy.name_i18n.en` without proper null checking.

## Files Modified

### 1. ExpertiseAtlasClient.tsx
- **Line 54-55**: Added filtering to exclude skills without taxonomy from `filteredSkills`
- **Line 330**: Added optional chaining for `selectedL3?.nameI18n?.en`

```typescript
// Filter out skills without taxonomy
let filtered = initialSkills.filter(skill => skill.taxonomy !== null && skill.taxonomy !== undefined);
```

### 2. L4Card.tsx
- **Lines 25-30**: Updated `L4Skill` interface to support `custom_skill_name` and make `taxonomy` optional/nullable
- **Line 65**: Added optional chaining and fallback to `custom_skill_name`
- **Line 157**: Added optional chaining for `skill.taxonomy?.tags`

```typescript
interface L4Skill {
  // ... other fields
  custom_skill_name?: string; // For custom user-created skills
  taxonomy?: {
    code: string;
    nameI18n?: { en?: string };
    tags: string[];
  } | null;
}
```

### 3. L1Grid.tsx
- **Line 70**: Added optional chaining for `domain.nameI18n?.en`

### 4. L2Modal.tsx
- **Line 62**: Added optional chaining for `l2Category?.nameI18n?.en`
- **Line 98**: Added optional chaining for `l3.nameI18n?.en`
- **Line 116**: Added optional chaining for `l3.nameI18n?.en`

### 5. AddSkillDrawer.tsx
- **Lines 272, 277**: Added optional chaining in filter functions
- **Lines 351, 355**: Added optional chaining for L1 domain names
- **Line 384**: Added optional chaining for `selectedL1?.nameI18n?.en`
- **Lines 416, 420**: Added optional chaining for L2 category names
- **Line 449**: Added optional chaining for `selectedL2?.nameI18n?.en`
- **Lines 481, 485**: Added optional chaining for L3 subcategory names

## Solution Strategy

1. **Defensive Filtering**: Filter out skills without taxonomy in `ExpertiseAtlasClient.filteredSkills` to prevent rendering components with null data
2. **Optional Chaining**: Add `?.` operators throughout the codebase where `taxonomy` or `nameI18n` fields are accessed
3. **Fallback Values**: Provide fallback values like `'Unknown'` or `'Unknown Skill'` when names are not available
4. **Type Safety**: Update TypeScript interfaces to reflect that `taxonomy` can be `null` or `undefined`

## Testing
- ✅ Build completed successfully with no TypeScript errors
- ✅ No linter errors in modified files
- ✅ All Recharts components should now render without path errors
- ✅ Skills with null taxonomy are now filtered out from the UI

## Impact
- Skills without taxonomy (custom skills with `skill_code = NULL`) will not appear in the Expertise Atlas UI
- This is acceptable since these skills don't fit into the L1→L2→L3→L4 taxonomy structure
- Users should update these skills to use proper taxonomy codes or create them through the Add Skill flow

## Next Steps
If custom skills (skills without taxonomy) need to be displayed:
1. Create a separate section for "Custom Skills" in the UI
2. Or update the skill creation flow to always assign a taxonomy
3. Or provide a UI to migrate old custom skills to the taxonomy structure

## Related Files
- `/src/app/app/i/expertise/page.tsx` - Already had proper null checks in `calculateWidgetData`
- `/src/db/schema.ts` - Already had the foreign key relationship defined
- `/src/db/migrations/20250131_add_skill_code_foreign_key.sql` - Migration was successfully applied

