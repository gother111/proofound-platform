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
          forest: '#1C4D3A',      // Primary brand
          terracotta: '#C76B4A',  // Accent
          parchment: '#F7F6F1',   // Background
          charcoal: '#2D3330',    // Text
          stone: '#E8E6DD',       // Borders
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
        // shadcn/ui semantic tokens
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
          DEFAULT: 'var(--accent)',
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
          DEFAULT: 'var(--muted)',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'var(--card)',
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
      fontSize: brandTokens.typography.fontSizes,
      fontWeight: {
        normal: brandTokens.typography.fontWeights.regular,
        medium: brandTokens.typography.fontWeights.medium,
        semibold: brandTokens.typography.fontWeights.semibold,
      },
      lineHeight: brandTokens.typography.lineHeights,
      letterSpacing: brandTokens.typography.letterSpacing,
      borderRadius: {
        ...brandTokens.borderRadius,
        lg: '0.75rem',  // 12px - cards, buttons
        md: '0.5rem',   // 8px - inputs
        sm: '0.25rem',  // 4px - small elements
        xl: '1rem',     // 16px - icon containers
        '2xl': '1.5rem', // 24px - large cards
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        breathe: 'breathe 4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
