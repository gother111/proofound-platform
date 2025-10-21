/**
 * Feature flags for gating experimental or in-development features.
 *
 * Matching is now part of the core platform pipeline and always loads during boot.
 * Use flags here only for UI-level experiments (e.g., EXPERIMENT_MATCHING_UI).
 */

export const WIREFRAME_MODE = process.env.NEXT_PUBLIC_WIREFRAME_MODE === 'true';
