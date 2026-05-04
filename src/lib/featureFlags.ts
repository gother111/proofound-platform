/**
 * Feature flag keys and client-safe defaults.
 *
 * Server-side audience and percentage rollout evaluation lives in:
 * - src/lib/feature-flags/server.ts
 */

export {
  FEATURE_FLAG_CONTROL_TYPE_VALUES,
  FEATURE_FLAG_TAXONOMY_VALUES,
  type FeatureFlagControlType,
  type FeatureFlagTaxonomy,
} from '@/lib/contracts/launch-operations';

export const FEATURE_FLAG_KEYS = {
  MATCHING_ENABLED: 'matching_enabled',
  ACTIVATION_TIERING: 'FF_ACTIVATION_TIERING',
  ASSIGNMENT_BASIC_MODE: 'FF_ASSIGNMENT_BASIC_MODE',
  UI_VOCAB_PLAIN: 'FF_UI_VOCAB_PLAIN',
  PRIVACY_SUMMARY: 'FF_PRIVACY_SUMMARY',
  PLATFORM_PERF_CACHE: 'FF_PLATFORM_PERF_CACHE',
  QUALIFIED_INTRO_CORRIDOR: 'FF_QUALIFIED_INTRO_CORRIDOR',
  STRUCTURED_FEEDBACK_REQUIRED: 'FF_STRUCTURED_FEEDBACK_REQUIRED',
  EXACT_RANK_EXPOSURE: 'FF_EXACT_RANK_EXPOSURE',
  KILL_SWITCH_INTROS: 'FF_KILL_SWITCH_INTROS',
  KILL_SWITCH_EXACT_RANK: 'FF_KILL_SWITCH_EXACT_RANK',
  LEGACY_MVP_SURFACES: 'FF_LEGACY_MVP_SURFACES',
  ASSISTIVE_AI_UI: 'FF_ASSISTIVE_AI_UI',
  PROOF_ARTIFACT_OCR_BETA: 'FF_PROOF_ARTIFACT_OCR_BETA',
} as const;

export const CLIENT_FEATURE_FLAG_RESPONSE_MAP = {
  activationTiering: FEATURE_FLAG_KEYS.ACTIVATION_TIERING,
  assignmentBasicMode: FEATURE_FLAG_KEYS.ASSIGNMENT_BASIC_MODE,
  uiVocabPlain: FEATURE_FLAG_KEYS.UI_VOCAB_PLAIN,
  privacySummary: FEATURE_FLAG_KEYS.PRIVACY_SUMMARY,
  qualifiedIntroCorridor: FEATURE_FLAG_KEYS.QUALIFIED_INTRO_CORRIDOR,
  structuredFeedbackRequired: FEATURE_FLAG_KEYS.STRUCTURED_FEEDBACK_REQUIRED,
  exactRankExposure: FEATURE_FLAG_KEYS.EXACT_RANK_EXPOSURE,
  killSwitchIntros: FEATURE_FLAG_KEYS.KILL_SWITCH_INTROS,
  killSwitchExactRank: FEATURE_FLAG_KEYS.KILL_SWITCH_EXACT_RANK,
  legacyMvpSurfaces: FEATURE_FLAG_KEYS.LEGACY_MVP_SURFACES,
  assistiveAiUi: FEATURE_FLAG_KEYS.ASSISTIVE_AI_UI,
  proofArtifactOcrBeta: FEATURE_FLAG_KEYS.PROOF_ARTIFACT_OCR_BETA,
} as const;

// Legacy env gate retained for compatibility.
export const MATCHING_ENABLED = process.env.MATCHING_FEATURE_ENABLED === 'true';

function envFlagDefault(name: string, fallback: boolean) {
  const value = process.env[name];
  if (value == null) return fallback;
  return value === 'true';
}

export const FEATURE_FLAG_DEFAULTS = {
  [FEATURE_FLAG_KEYS.ACTIVATION_TIERING]: true,
  [FEATURE_FLAG_KEYS.ASSIGNMENT_BASIC_MODE]: true,
  [FEATURE_FLAG_KEYS.UI_VOCAB_PLAIN]: true,
  [FEATURE_FLAG_KEYS.PRIVACY_SUMMARY]: true,
  [FEATURE_FLAG_KEYS.PLATFORM_PERF_CACHE]: true,
  [FEATURE_FLAG_KEYS.QUALIFIED_INTRO_CORRIDOR]: true,
  [FEATURE_FLAG_KEYS.STRUCTURED_FEEDBACK_REQUIRED]: true,
  [FEATURE_FLAG_KEYS.EXACT_RANK_EXPOSURE]: false,
  [FEATURE_FLAG_KEYS.KILL_SWITCH_INTROS]: false,
  [FEATURE_FLAG_KEYS.KILL_SWITCH_EXACT_RANK]: true,
  [FEATURE_FLAG_KEYS.LEGACY_MVP_SURFACES]: false,
  [FEATURE_FLAG_KEYS.ASSISTIVE_AI_UI]: false,
  [FEATURE_FLAG_KEYS.PROOF_ARTIFACT_OCR_BETA]: false,
} as const;

export function getFeatureFlagDefault(
  key: (typeof FEATURE_FLAG_KEYS)[keyof typeof FEATURE_FLAG_KEYS]
): boolean {
  const fallback = FEATURE_FLAG_DEFAULTS[key as keyof typeof FEATURE_FLAG_DEFAULTS];
  if (typeof fallback !== 'boolean') return true;
  return envFlagDefault(`NEXT_PUBLIC_${key}`, fallback);
}

/**
 * Client-safe env defaults used before server-resolved flags load.
 * Defaults align to the proof-first launch corridor.
 */
export const CLIENT_FF_DEFAULTS = {
  activationTiering: getFeatureFlagDefault(FEATURE_FLAG_KEYS.ACTIVATION_TIERING),
  assignmentBasicMode: getFeatureFlagDefault(FEATURE_FLAG_KEYS.ASSIGNMENT_BASIC_MODE),
  uiVocabPlain: getFeatureFlagDefault(FEATURE_FLAG_KEYS.UI_VOCAB_PLAIN),
  privacySummary: getFeatureFlagDefault(FEATURE_FLAG_KEYS.PRIVACY_SUMMARY),
  qualifiedIntroCorridor: getFeatureFlagDefault(FEATURE_FLAG_KEYS.QUALIFIED_INTRO_CORRIDOR),
  structuredFeedbackRequired: getFeatureFlagDefault(FEATURE_FLAG_KEYS.STRUCTURED_FEEDBACK_REQUIRED),
  exactRankExposure: getFeatureFlagDefault(FEATURE_FLAG_KEYS.EXACT_RANK_EXPOSURE),
  killSwitchIntros: getFeatureFlagDefault(FEATURE_FLAG_KEYS.KILL_SWITCH_INTROS),
  killSwitchExactRank: getFeatureFlagDefault(FEATURE_FLAG_KEYS.KILL_SWITCH_EXACT_RANK),
  legacyMvpSurfaces: getFeatureFlagDefault(FEATURE_FLAG_KEYS.LEGACY_MVP_SURFACES),
  assistiveAiUi: getFeatureFlagDefault(FEATURE_FLAG_KEYS.ASSISTIVE_AI_UI),
  proofArtifactOcrBeta: getFeatureFlagDefault(FEATURE_FLAG_KEYS.PROOF_ARTIFACT_OCR_BETA),
} as const;
