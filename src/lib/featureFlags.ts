/**
 * Feature flags for gating experimental or in-development features.
 *
 * MATCHING_ENABLED: Gates the entire matching system (routes, APIs, UI).
 */

export const MATCHING_ENABLED = process.env.MATCHING_FEATURE_ENABLED === 'true';
