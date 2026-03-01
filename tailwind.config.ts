import type { Config } from 'tailwindcss';
import brandTokens from './src/design/brand-tokens.json';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'section-pad',
    // Figma brand colors
    'bg-proofound-forest',
    'bg-proofound-terracotta',
    'bg-proofound-parchment',
    'text-proofound-charcoal',
    'border-proofound-stone',
    // Extended palette
    'bg-[#7A9278]',
    'bg-[#5C8B89]',
    'bg-[#D4A574]',
    'bg-[#C9A57B]',
    // Typography
    "font-['Crimson_Pro']",
    // Common utilities
    'bg-card',
    'text-muted',
    'bg-accent',
  ],
  theme: {
    extend: {
      colors: {
        // Figma Design System Colors - Primary Brand
        proofound: {
          forest: '#1C4D3A', // Primary brand
          terracotta: '#C76B4A', // Accent
          parchment: '#F7F6F1', // Background
          charcoal: '#2D3330', // Text
          stone: '#E8E6DD', // Borders
        },
        // Extended Japandi Palette
        extended: {
          sage: '#7A9278',
          teal: '#5C8B89',
          ochre: '#D4A574',
          clay: '#C9A57B',
          sand: '#E0D5C7',
          bamboo: '#6B7F5F',
        },
        // V3 semantic tokens
        'proofound-success-tint': '#E8F5E1',
        // shadcn/ui semantic tokens
        'japandi-bg': '#F7F6F1',
        'japandi-sage': '#8A9A5B',
        'japandi-terracotta': '#E2725B',
        'japandi-charcoal': '#333333',
        'japandi-gray': '#E5E5E5',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: brandTokens.colors.primary['500'],
          ...brandTokens.colors.primary,
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: brandTokens.colors.secondary['100'],
          ...brandTokens.colors.secondary,
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        'neutral-dark': {
          DEFAULT: brandTokens.colors.neutralDark['700'],
          ...brandTokens.colors.neutralDark,
        },
        'neutral-light': {
          DEFAULT: brandTokens.colors.neutralLight['200'],
          ...brandTokens.colors.neutralLight,
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: brandTokens.colors.semantic.success,
        warning: brandTokens.colors.semantic.warning,
        error: brandTokens.colors.semantic.error,
        info: brandTokens.colors.semantic.info,
        // Nature-inspired colors (direct from design system)
        sage: '#7A9278',
        teal: '#5C8B89',
        clay: '#C9A57B',
        sand: '#E0D5C7',
        bamboo: '#6B7F5F',
        ochre: '#D4A574',
        olive: '#8B9556',
      },
      fontFamily: {
        display: brandTokens.typography.fontFamilies.display.split(','),
        sans: brandTokens.typography.fontFamilies.body.split(','),
      },
      fontSize: {
        ...brandTokens.typography.fontSizes,
        // Fluid scales for headings
        h1: 'clamp(2.5rem, 5vw + 1rem, 4.5rem)', // 40px to 72px
        h2: 'clamp(2rem, 4vw + 1rem, 3.5rem)', // 32px to 56px
        h3: 'clamp(1.5rem, 3vw + 0.5rem, 2.5rem)', // 24px to 40px
        h4: 'clamp(1.25rem, 2vw + 0.5rem, 1.75rem)', // 20px to 28px
        // Fluid scales for body text to maintain reading comfort
        'body-lg': 'clamp(1.125rem, 1vw + 0.875rem, 1.25rem)', // 18px to 20px
      },
      fontWeight: {
        normal: brandTokens.typography.fontWeights.regular,
        medium: brandTokens.typography.fontWeights.medium,
        semibold: brandTokens.typography.fontWeights.semibold,
      },
      lineHeight: brandTokens.typography.lineHeights,
      letterSpacing: brandTokens.typography.letterSpacing,
      borderRadius: {
        ...brandTokens.borderRadius,
        lg: '0.75rem', // 12px - cards, buttons
        md: '0.5rem', // 8px - inputs
        sm: '0.25rem', // 4px - small elements
        xl: '1rem', // 16px - icon containers
        '2xl': '1.5rem', // 24px - large cards
        '3xl': '2rem', // 32px - extra large panels
      },
      boxShadow: brandTokens.shadows,
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        // Shimmer effect for skeleton loaders
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        breathe: 'breathe 4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite linear',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function ({ addUtilities }: any) {
      addUtilities({
        '.hanging-punctuation': {
          'hanging-punctuation': 'first last',
        },
      });
    },
  ],
};

export default config;
