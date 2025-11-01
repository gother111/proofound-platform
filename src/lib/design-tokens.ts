/**
 * Proofound Design System Tokens
 * 
 * Central source of truth for all design values from Figma.
 * Import these instead of hardcoding colors/spacing.
 * 
 * @example
 * ```tsx
 * import { colors, typography, spacing } from '@/lib/design-tokens';
 * 
 * <div style={{ color: colors.brand.forest }}>
 *   <h1 className={typography.displayClass}>Title</h1>
 * </div>
 * ```
 */

export const colors = {
  // Primary Brand Colors
  brand: {
    forest: '#1C4D3A',      // Primary green - main CTAs, headers
    terracotta: '#C76B4A',  // Accent - highlights, secondary actions
    parchment: '#F7F6F1',   // Background - main page background
    charcoal: '#2D3330',    // Text - primary text color
    stone: '#E8E6DD',       // Border - subtle dividers
  },
  
  // Extended Japandi Palette
  extended: {
    sage: '#7A9278',        // Success states, nature elements
    teal: '#5C8B89',        // Interactive elements, links
    ochre: '#D4A574',       // Warnings, highlights
    clay: '#C9A57B',        // Secondary accents
    sand: '#E0D5C7',        // Subtle backgrounds
    bamboo: '#6B7F5F',      // Supporting green tones
  },
  
  // Semantic Colors (Light Mode)
  semantic: {
    success: '#7A9278',
    warning: '#D4A574',
    error: '#C76B4A',
    info: '#5C8B89',
  },
  
  // Dark Mode Palette
  dark: {
    background: '#1A1D2E',      // Deep navy night
    foreground: '#E8DCC4',      // Cream canvas
    primary: '#D4C4A8',         // Warm beige stone
    secondary: '#C86B4A',       // Deep terracotta
    surface: '#252834',         // Card backgrounds
    surfaceInteractive: '#2C3244', // Interactive surfaces
    border: 'rgba(212, 196, 168, 0.1)',
    text: {
      primary: '#E8DCC4',
      secondary: '#A8A299',
      muted: '#6B6760',
    },
  },
  
  // UI Surfaces
  surfaces: {
    white: '#FFFFFF',
    offWhite: '#FDFCFA',
    lightParchment: '#FAF9F6',
    darkParchment: '#F0EDE6',
  },
  
  // Text Colors
  text: {
    primary: '#2D3330',
    secondary: '#6B6760',
    muted: '#9B9891',
    inverse: '#FFFFFF',
  },
  
  // State Colors
  state: {
    hover: 'rgba(28, 77, 58, 0.05)',
    active: 'rgba(28, 77, 58, 0.1)',
    disabled: 'rgba(45, 51, 48, 0.3)',
    focus: 'rgba(28, 77, 58, 0.2)',
  },
  
  // Transparency Levels
  alpha: {
    10: '1a',
    20: '33',
    30: '4d',
    40: '66',
    50: '80',
    60: '99',
    70: 'b3',
    80: 'cc',
    90: 'e6',
  },
} as const;

export const typography = {
  // Font Families
  fonts: {
    display: "'Crimson Pro', serif",
    body: "'Inter', sans-serif",
    mono: "'Monaco', 'Courier New', monospace",
  },
  
  // Tailwind Classes for Typography
  displayClass: "font-['Crimson_Pro']",
  bodyClass: "", // Default Inter
  
  // Font Sizes (maps to Tailwind, but can be used with inline styles)
  sizes: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
    '8xl': '6rem',      // 96px
  },
  
  // Line Heights
  leading: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  
  // Font Weights
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const spacing = {
  // Section Spacing
  section: {
    xs: '1.5rem',   // 24px
    sm: '2rem',     // 32px
    md: '3rem',     // 48px
    lg: '4rem',     // 64px
    xl: '6rem',     // 96px
    '2xl': '8rem',  // 128px
  },
  
  // Component Spacing
  component: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
  },
  
  // Card/Container Padding
  container: {
    mobile: '1rem',     // 16px
    tablet: '1.5rem',   // 24px
    desktop: '2rem',    // 32px
  },
  
  // Gaps
  gap: {
    tight: '0.5rem',    // 8px
    normal: '1rem',     // 16px
    relaxed: '1.5rem',  // 24px
    loose: '2rem',      // 32px
  },
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.25rem',      // 4px
  DEFAULT: '0.5rem',  // 8px
  md: '0.625rem',     // 10px
  lg: '0.75rem',      // 12px
  xl: '1rem',         // 16px
  '2xl': '1.5rem',    // 24px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(45, 51, 48, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(45, 51, 48, 0.1), 0 1px 2px -1px rgba(45, 51, 48, 0.1)',
  md: '0 4px 6px -1px rgba(45, 51, 48, 0.1), 0 2px 4px -2px rgba(45, 51, 48, 0.1)',
  lg: '0 10px 15px -3px rgba(45, 51, 48, 0.1), 0 4px 6px -4px rgba(45, 51, 48, 0.1)',
  xl: '0 20px 25px -5px rgba(45, 51, 48, 0.1), 0 8px 10px -6px rgba(45, 51, 48, 0.1)',
  '2xl': '0 25px 50px -12px rgba(45, 51, 48, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(45, 51, 48, 0.05)',
  none: 'none',
  
  // Dark mode shadows
  dark: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
  },
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
  max: 9999,
} as const;

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
  },
  
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Tailwind class utilities
  classes: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-250',
    slow: 'transition-all duration-350',
  },
} as const;

export const iconSizes = {
  xs: 'w-3 h-3',      // 12px
  sm: 'w-4 h-4',      // 16px
  md: 'w-5 h-5',      // 20px
  lg: 'w-6 h-6',      // 24px
  xl: 'w-8 h-8',      // 32px
  '2xl': 'w-12 h-12', // 48px
} as const;

// Utility functions
export const getAlphaColor = (color: string, alpha: keyof typeof colors.alpha) => {
  return `${color}${colors.alpha[alpha]}`;
};

export const getDarkModeStyles = (lightColor: string, darkColor: string) => {
  return {
    light: lightColor,
    dark: darkColor,
    className: `text-[${lightColor}] dark:text-[${darkColor}]`,
  };
};

// Common style combinations
export const commonStyles = {
  page: {
    background: colors.brand.parchment,
    backgroundDark: colors.dark.background,
    className: 'bg-[#F7F6F1] dark:bg-[#1A1D2E] min-h-screen',
  },
  
  card: {
    background: colors.surfaces.white,
    backgroundDark: colors.dark.surface,
    border: colors.brand.stone,
    className: 'bg-white dark:bg-[#252834] border border-[#E8E6DD] dark:border-[#D4C4A8]/10 rounded-lg',
  },
  
  header: {
    background: colors.surfaces.offWhite,
    backgroundDark: colors.dark.surface,
    border: colors.brand.stone,
    className: 'bg-[#FDFCFA] dark:bg-[#252834] border-b border-[#E8E6DD] dark:border-[#D4C4A8]/10',
  },
  
  button: {
    primary: {
      background: colors.brand.forest,
      backgroundDark: colors.dark.primary,
      text: colors.surfaces.white,
      className: 'bg-[#1C4D3A] dark:bg-[#D4C4A8] text-white dark:text-[#1A1D2E] hover:bg-[#2D5D4A] dark:hover:bg-[#E4D4B8]',
    },
    
    secondary: {
      background: colors.brand.terracotta,
      text: colors.surfaces.white,
      className: 'bg-[#C76B4A] text-white hover:bg-[#D77B5A]',
    },
  },
  
  text: {
    primary: {
      light: colors.text.primary,
      dark: colors.dark.text.primary,
      className: 'text-[#2D3330] dark:text-[#E8DCC4]',
    },
    
    secondary: {
      light: colors.text.secondary,
      dark: colors.dark.text.secondary,
      className: 'text-[#6B6760] dark:text-[#A8A299]',
    },
    
    muted: {
      light: colors.text.muted,
      dark: colors.dark.text.muted,
      className: 'text-[#9B9891] dark:text-[#6B6760]',
    },
  },
} as const;

// Type exports for TypeScript
export type ColorKey = keyof typeof colors.brand;
export type ExtendedColorKey = keyof typeof colors.extended;
export type SpacingKey = keyof typeof spacing.section;
export type TypographySizeKey = keyof typeof typography.sizes;

