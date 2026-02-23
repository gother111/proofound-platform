/**
 * Feature flag keys and client-safe defaults.
 *
 * Server-side audience and percentage rollout evaluation lives in:
 * - src/lib/feature-flags/server.ts
 */

export const FEATURE_FLAG_KEYS = {
  MATCHING_ENABLED: 'matching_enabled',
  ACTIVATION_TIERING: 'FF_ACTIVATION_TIERING',
  ASSIGNMENT_BASIC_MODE: 'FF_ASSIGNMENT_BASIC_MODE',
  UI_VOCAB_PLAIN: 'FF_UI_VOCAB_PLAIN',
  PRIVACY_SUMMARY: 'FF_PRIVACY_SUMMARY',
} as const;

// Legacy env gate retained for compatibility.
export const MATCHING_ENABLED = process.env.MATCHING_FEATURE_ENABLED === 'true';

/**
 * Client-safe env defaults used before server-resolved flags load.
 * Defaults to true to preserve currently shipped behavior.
 */
export const CLIENT_FF_DEFAULTS = {
  activationTiering: process.env.NEXT_PUBLIC_FF_ACTIVATION_TIERING !== 'false',
  assignmentBasicMode: process.env.NEXT_PUBLIC_FF_ASSIGNMENT_BASIC_MODE !== 'false',
  uiVocabPlain: process.env.NEXT_PUBLIC_FF_UI_VOCAB_PLAIN !== 'false',
  privacySummary: process.env.NEXT_PUBLIC_FF_PRIVACY_SUMMARY !== 'false',
} as const;
