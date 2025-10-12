import type { Config } from 'tailwindcss';
import brandTokens from './src/design/brand-tokens.json';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
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
          DEFAULT: brandTokens.colors.accent['500'],
          ...brandTokens.colors.accent,
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
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
