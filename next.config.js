// MVP Enhancement Phase Complete - All 22 features deployed
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const skipBuildValidation = process.env.NEXT_SKIP_BUILD_VALIDATION === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Keep lint as part of build by default. Explicitly opt out only when needed.
    ignoreDuringBuilds: skipBuildValidation,
  },
  typescript: {
    // Keep type checks as part of build by default. Explicitly opt out only when needed.
    ignoreBuildErrors: skipBuildValidation,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Silence multiple-lockfile root inference; set explicit tracing root to this app.
  // Use process.cwd() so it works both locally and on Vercel (no absolute machine path).
  outputFileTracingRoot: process.cwd(),
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
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // Additional API-specific headers
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
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
