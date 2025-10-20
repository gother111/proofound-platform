/**
 * Feature flags for gating experimental or in-development features.
 *
 * MATCHING_ENABLED: Gates the entire matching system (routes, APIs, UI).
 * WIREFRAME_MODE: Allows mock data in development for wireframe demonstrations.
 */

export const MATCHING_ENABLED = process.env.MATCHING_FEATURE_ENABLED === 'true';
export const WIREFRAME_MODE = process.env.NEXT_PUBLIC_WIREFRAME_MODE === 'true';
