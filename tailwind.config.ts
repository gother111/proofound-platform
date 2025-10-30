import type { Config } from 'tailwindcss';
import animatePlugin from 'tailwindcss-animate';
import brandTokens from './src/design/brand-tokens.json';

const config = {
  darkMode: 'class',
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/styles/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'section-pad',
    'bg-bg-base',
    'text-fg-base',
    'border-border-subtle',
    'bg-card',
    'text-muted',
    'bg-accent',
    'bg-brand-sage',
    'bg-brand-terracotta',
    'bg-brand-teal',
    'bg-brand-ochre',
    // Figma colors
    'bg-proofound-forest',
    'bg-proofound-terracotta',
    'bg-proofound-parchment',
    'text-proofound-charcoal',
    'border-proofound-stone',
    "font-['Crimson_Pro']",
  ],
  theme: {
    extend: {
      colors: {
        // Figma Design System Colors - Direct hex values
        proofound: {
          forest: '#1C4D3A', // Primary brand
          terracotta: '#C76B4A', // Accent
          parchment: '#F7F6F1', // Background
          charcoal: '#2D3330', // Text
          stone: '#E8E6DD', // Borders
        },
        // New token-based colors (legacy bridge)
        bg: { base: 'var(--bg-base)' },
        fg: { base: 'var(--fg-base)' },
        brand: {
          sage: 'var(--brand-sage)',
          terracotta: 'var(--brand-terracotta)',
          teal: 'var(--brand-teal)',
          ochre: 'var(--brand-ochre)',
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
        // Japandi nature-inspired colors (legacy, bridged to new tokens)
        sage: 'var(--brand-sage)',
        terracotta: 'var(--brand-terracotta)',
        teal: 'var(--brand-teal)',
        clay: 'hsl(var(--clay))',
        sand: 'hsl(var(--sand))',
        bamboo: 'hsl(var(--bamboo))',
        ochre: 'var(--brand-ochre)',
        olive: 'hsl(var(--olive))',
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
        lg: 'var(--radius-lg)',
        md: 'calc(var(--radius-lg) - 2px)',
        sm: 'calc(var(--radius-lg) - 4px)',
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
  plugins: [animatePlugin],
} satisfies Config;

export default config;
