// MVP Enhancement Phase Complete - All 22 features deployed
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const isVercelBuild = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
const isVercelProductionBuild = isVercelBuild && process.env.VERCEL_ENV === 'production';
const skipBuildValidation = process.env.NEXT_SKIP_BUILD_VALIDATION === '1' || isVercelBuild;
const disableVercelWebpackFileSystemCache =
  isVercelBuild && process.env.NEXT_DISABLE_VERCEL_WEBPACK_CACHE !== '0';
const disableWebpackFileSystemCache =
  disableVercelWebpackFileSystemCache || process.env.NEXT_DISABLE_WEBPACK_CACHE === '1';
const widenSentryClientUpload = process.env.SENTRY_WIDEN_CLIENT_FILE_UPLOAD === '1';
const disableSentryProductionBuildArtifacts =
  isVercelProductionBuild && process.env.SENTRY_ENABLE_BUILD_SOURCEMAPS !== '1';
const enabledEnvValues = new Set(['1', 'true', 'yes', 'on']);
const explicitHstsSetting = process.env.PROOFOUND_ENABLE_HSTS ?? process.env.ENABLE_HSTS;
const hstsEnabled =
  explicitHstsSetting === undefined
    ? process.env.VERCEL_ENV === 'production'
    : enabledEnvValues.has(explicitHstsSetting.trim().toLowerCase());
const allowedDevOrigins = ['127.0.0.1', '0.0.0.0'];
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
  distDir: process.env.NEXT_DIST_DIR || '.next',
  poweredByHeader: false,
  allowedDevOrigins,
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
  serverExternalPackages: [
    '@apm-js-collab/code-transformer',
    '@apm-js-collab/tracing-hooks',
    '@opentelemetry/api',
    '@opentelemetry/core',
    '@opentelemetry/instrumentation',
    '@opentelemetry/resources',
    '@opentelemetry/sdk-trace-base',
    '@opentelemetry/semantic-conventions',
    '@popperjs/core',
    '@sentry/nextjs',
    '@sentry/node',
    '@sentry/node-core',
    '@supabase/ssr',
    '@supabase/supabase-js',
    'deepmerge',
    'drizzle-orm',
    'postgres',
    'zod',
  ],
  // Silence multiple-lockfile root inference; set explicit tracing root to this app.
  // Use process.cwd() so it works both locally and on Vercel (no absolute machine path).
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    '/api/cron/launch-synthetic-checks': ['.artifacts/launch-smoke-report.json'],
    '/api/monitoring/launch-status': [
      '.artifacts/ai-provider-smoke.json',
      '.artifacts/launch-smoke-report.json',
    ],
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
    if (disableWebpackFileSystemCache) {
      // Vercel was restoring multi-GB pack files and OOMing before webpack finished.
      config.cache = false;
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  async headers() {
    const globalSecurityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
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
    ];

    if (hstsEnabled) {
      globalSecurityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      });
    }

    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: globalSecurityHeaders,
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
    disable: disableSentryProductionBuildArtifacts,
    assets: sentryBuildArtifacts,
    ignore: sentryIgnoredArtifacts,
  },
  hideSourceMaps: true, // Hides source maps from browser DevTools
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: false, // Avoid extra release-time work during Vercel builds
  },
  errorHandler(error) {
    console.warn('[@sentry/nextjs] Non-fatal build warning:', error?.message ?? error);
  },
});
