/**
 * Attribute Firewall - Privacy-preserving utility for blind-first matching.
 *
 * Removes PII and identifying information from objects before scoring
 * and before rendering Stage 1 (blind) match results.
 *
 * Stage 1 (blind): Skills, values, causes, location mode, availability
 * Stage 2 (revealed): All fields after mutual interest
 */

const DISALLOWED_FIELDS = [
  'name',
  'displayName',
  'photo',
  'avatarUrl',
  'age',
  'gender',
  'school',
  'institution',
  'ethnicity',
  'religion',
  'maritalStatus',
  'exact_birthday',
  'birthdate',
  'email',
  'phone',
  'address',
  'handle',
  'linkedIn',
  'twitter',
  'socialMedia',
  // Also scrub exact organization names in Stage 1
  'orgName',
  'legalName',
  'employerName',
] as const;

type DisallowedField = (typeof DISALLOWED_FIELDS)[number];

/**
 * Recursively scrubs disallowed fields from an object.
 * Returns a new object without mutation.
 */
export function scrubDisallowedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(scrubDisallowedFields) as T;
  }

  if (typeof obj === 'object') {
    const scrubbed: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Skip disallowed fields
      if (DISALLOWED_FIELDS.includes(key as DisallowedField)) {
        continue;
      }

      // Recursively scrub nested objects
      scrubbed[key] = scrubDisallowedFields(value);
    }

    return scrubbed as T;
  }

  return obj;
}

/**
 * Checks if an object contains any disallowed fields.
 * Useful for testing/validation.
 */
export function containsDisallowedFields(obj: unknown): boolean {
  if (obj === null || obj === undefined) {
    return false;
  }

  if (Array.isArray(obj)) {
    return obj.some(containsDisallowedFields);
  }

  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      if (DISALLOWED_FIELDS.includes(key as DisallowedField)) {
        return true;
      }
      if (containsDisallowedFields(value)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Export the list for testing purposes
 */
export { DISALLOWED_FIELDS };
