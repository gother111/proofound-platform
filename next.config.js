import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

// Wrap with Sentry config for error tracking
const config = withNextIntl(nextConfig);

export default withSentryConfig(config, {
  // Sentry webpack plugin options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true, // Suppresses source map uploading logs
  widenClientFileUpload: true, // Upload more client files for better error context
  hideSourceMaps: true, // Hides source maps from browser DevTools
  disableLogger: true, // Automatically tree-shake Sentry logger statements
  automaticVercelMonitors: true, // Enable automatic Vercel cron monitoring
});
