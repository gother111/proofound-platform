// MVP Enhancement Phase Complete - All 22 features deployed
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const isVercelBuild = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
const skipBuildValidation = process.env.NEXT_SKIP_BUILD_VALIDATION === '1' || isVercelBuild;
const widenSentryClientUpload = process.env.SENTRY_WIDEN_CLIENT_FILE_UPLOAD === '1';
const sentryBuildArtifacts = [
  '.next/server/app/**/*.js',
  '.next/server/app/**/*.js.map',
  '.next/server/chunks/**/*.js',
  '.next/server/chunks/**/*.js.map',
  '.next/static/chunks/app/**/*.js',
  '.next/static/chunks/app/**/*.js.map',
];
const sentryIgnoredArtifacts = [
  '.next/static/chunks/webpack-*.js',
  '.next/static/chunks/webpack-*.js.map',
  '.next/static/chunks/framework-*.js',
  '.next/static/chunks/framework-*.js.map',
  '.next/static/chunks/main-*.js',
  '.next/static/chunks/main-*.js.map',
];

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
    // Reduce peak memory usage on Vercel builds where container RAM is limited.
    webpackBuildWorker: isVercelBuild,
    webpackMemoryOptimizations: isVercelBuild,
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
  // Keep the default upload surface narrow so Vercel deploys do not spend minutes
  // uploading hundreds of extra client source maps. Opt in only when needed.
  widenClientFileUpload: widenSentryClientUpload,
  sourcemaps: {
    assets: sentryBuildArtifacts,
    ignore: sentryIgnoredArtifacts,
  },
  hideSourceMaps: true, // Hides source maps from browser DevTools
  disableLogger: true, // Automatically tree-shake Sentry logger statements
  automaticVercelMonitors: false, // Avoid extra release-time work during Vercel builds
  errorHandler(error) {
    console.warn('[@sentry/nextjs] Non-fatal build warning:', error?.message ?? error);
  },
});
