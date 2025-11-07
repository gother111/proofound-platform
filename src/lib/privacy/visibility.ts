/**
 * Visibility Enforcement Utilities
 *
 * Applies field-level visibility rules to profile data based on relationship context
 *
 * PRD References:
 * - Part 5: F4 - Field-Level Visibility Controls
 * - Part 8: Privacy by default
 */

import type { VisibilityLevel } from '@/components/privacy/FieldVisibilityControl';

/**
 * Context for visibility enforcement
 */
export type VisibilityContext = 'public' | 'matched' | 'admin';

/**
 * Default visibility settings (privacy-first)
 */
export const DEFAULT_VISIBILITY: Record<string, VisibilityLevel> = {
  mission: 'public',
  vision: 'matched',
  values: 'public',
  causes: 'public',
  avatar: 'public',
  tagline: 'public',
  location: 'matched',
  skills: 'public',
  experiences: 'matched',
  education: 'matched',
  impactStories: 'matched',
  volunteering: 'matched',
  certifications: 'matched',
  contact: 'private', // Email, phone always private
  compensation: 'private', // Compensation expectations always private
};

/**
 * Check if a field should be visible in the given context
 */
export function isFieldVisible(
  fieldName: string,
  context: VisibilityContext,
  fieldVisibility?: Record<string, VisibilityLevel>
): boolean {
  // Admin can see everything
  if (context === 'admin') {
    return true;
  }

  // Get field's visibility setting
  const visibility = fieldVisibility?.[fieldName] || DEFAULT_VISIBILITY[fieldName] || 'matched';

  // Apply visibility rules
  if (visibility === 'private') {
    return false;
  }
  if (visibility === 'public') {
    return true;
  }
  if (visibility === 'matched') {
    return context === 'matched';
  }

  return false;
}

/**
 * Apply visibility rules to a profile object
 * Returns a filtered profile with only visible fields
 */
export function applyVisibility<T extends Record<string, any>>(
  profile: T,
  context: VisibilityContext,
  fieldVisibility?: Record<string, VisibilityLevel>,
  redactMode = false
): Partial<T> {
  const result: Partial<T> = {};

  for (const key in profile) {
    if (Object.prototype.hasOwnProperty.call(profile, key)) {
      const fieldName = key.toLowerCase();

      // Always include ID and basic metadata
      if (fieldName === 'id' || fieldName === 'userid' || fieldName === 'profileid') {
        result[key] = profile[key];
        continue;
      }

      // Apply visibility check
      if (isFieldVisible(fieldName, context, fieldVisibility)) {
        // Apply redact mode if enabled (replaces actual content with placeholders)
        if (redactMode && shouldRedact(fieldName)) {
          result[key] = redactField(profile[key], fieldName);
        } else {
          result[key] = profile[key];
        }
      }
    }
  }

  return result;
}

/**
 * Determine if a field should be redacted in redact mode
 */
function shouldRedact(fieldName: string): boolean {
  const redactableFields = [
    'email',
    'phone',
    'address',
    'location',
    'compensation',
    'salary',
    'linkedin',
    'github',
    'portfolio',
  ];

  return redactableFields.some((field) => fieldName.includes(field.toLowerCase()));
}

/**
 * Redact a field value with appropriate placeholder
 */
function redactField(value: any, fieldName: string): any {
  if (value === null || value === undefined) {
    return value;
  }

  // Array values
  if (Array.isArray(value)) {
    return value.map(() => '[REDACTED]');
  }

  // String values
  if (typeof value === 'string') {
    if (fieldName.includes('email')) {
      return 'user@[REDACTED].com';
    }
    if (fieldName.includes('phone')) {
      return '+1 (XXX) XXX-XXXX';
    }
    if (fieldName.includes('location') || fieldName.includes('address')) {
      return 'City, ST';
    }
    return '[REDACTED]';
  }

  // Number values
  if (typeof value === 'number') {
    return 0;
  }

  // Object values
  if (typeof value === 'object') {
    return { redacted: true };
  }

  return '[REDACTED]';
}

/**
 * Check if two users have a matched relationship
 * (for determining if "matched" visibility applies)
 */
export async function hasMatchedRelationship(
  userId1: string,
  userId2: string,
  db: any
): Promise<boolean> {
  try {
    // Check for mutual interest in matchInterest table
    const { matchInterest } = await import('@/db/schema');
    const { and, or, eq } = await import('drizzle-orm');

    const mutualInterest = await db
      .select()
      .from(matchInterest)
      .where(
        or(
          and(
            eq(matchInterest.actorProfileId, userId1),
            eq(matchInterest.targetProfileId, userId2)
          ),
          and(eq(matchInterest.actorProfileId, userId2), eq(matchInterest.targetProfileId, userId1))
        )
      )
      .limit(1);

    return mutualInterest.length > 0;
  } catch (error) {
    console.error('Failed to check matched relationship:', error);
    return false;
  }
}
