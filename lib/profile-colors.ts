/**
 * Proofound Profile Color System
 *
 * EXACT color values from the design specification.
 * Use these instead of hardcoding colors throughout the profile pages.
 *
 * @example
 * ```tsx
 * import { profileColors } from '@/lib/profile-colors';
 *
 * <div style={{ color: profileColors.sage }}>
 *   <div style={{ backgroundColor: profileColors.sageAlpha(0.1) }}>
 *     Sage background with 10% opacity
 *   </div>
 * </div>
 * ```
 */

export const profileColors = {
  // Primary Brand Colors
  sage: 'rgb(122, 146, 120)',           // Person nodes, primary actions
  terracotta: 'rgb(198, 123, 92)',      // Organizations, secondary actions
  teal: 'rgb(92, 139, 137)',            // Government/Education
  ochre: 'rgb(212, 165, 116)',          // Skills, accents

  // Base Colors
  bgBase: '#F5F3EE',                    // Page background
  cardBg: '#FDFCFA',                    // Card background
  textPrimary: '#2C2A27',               // Primary text
  mutedBg: '#E8E4DC',                   // Muted background

  // Helper functions for opacity variants
  sageAlpha: (opacity: number) => `rgba(122, 146, 120, ${opacity})`,
  terracottaAlpha: (opacity: number) => `rgba(198, 123, 92, ${opacity})`,
  tealAlpha: (opacity: number) => `rgba(92, 139, 137, ${opacity})`,
  ochreAlpha: (opacity: number) => `rgba(212, 165, 116, ${opacity})`,
} as const;

/**
 * Common opacity values used in the design
 */
export const profileOpacity = {
  sage: {
    5: 'rgba(122, 146, 120, 0.05)',
    10: 'rgba(122, 146, 120, 0.1)',
    20: 'rgba(122, 146, 120, 0.2)',
    30: 'rgba(122, 146, 120, 0.3)',
  },
  terracotta: {
    5: 'rgba(198, 123, 92, 0.05)',
    10: 'rgba(198, 123, 92, 0.1)',
    20: 'rgba(198, 123, 92, 0.2)',
    60: 'rgba(198, 123, 92, 0.6)',
  },
  teal: {
    10: 'rgba(92, 139, 137, 0.1)',
    60: 'rgba(92, 139, 137, 0.6)',
  },
  ochre: {
    10: 'rgba(212, 165, 116, 0.1)',
    30: 'rgba(212, 165, 116, 0.3)',
  },
} as const;

/**
 * Cover image gradient (default when no custom cover)
 */
export const coverGradient = {
  background: 'linear-gradient(to bottom right, rgb(122,146,120), rgb(92,139,137), rgb(212,165,116))',
  stripes: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)',
} as const;

/**
 * Tab theme colors
 */
export const tabThemes = {
  impact: {
    color: profileColors.sage,
    alpha: profileOpacity.sage,
  },
  journey: {
    color: profileColors.terracotta,
    alpha: profileOpacity.terracotta,
  },
  learning: {
    color: profileColors.teal,
    alpha: profileOpacity.teal,
  },
  service: {
    color: profileColors.terracotta,
    alpha: profileOpacity.terracotta,
  },
  network: {
    color: profileColors.sage,
    alpha: profileOpacity.sage,
  },
} as const;

/**
 * Icon color mappings for different sections
 */
export const iconColors = {
  mission: profileColors.sage,
  values: profileColors.terracotta,
  causes: profileColors.teal,
  skills: profileColors.ochre,
  verified: profileColors.sage,
} as const;
