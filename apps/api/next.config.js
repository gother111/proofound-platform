import path from 'node:path';
import { withSentryConfig } from '@sentry/nextjs';

const isVercelBuild = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
const isVercelProductionBuild = isVercelBuild && process.env.VERCEL_ENV === 'production';
const skipBuildValidation = process.env.NEXT_SKIP_BUILD_VALIDATION === '1' || isVercelBuild;
const disableVercelWebpackFileSystemCache =
  isVercelBuild && process.env.NEXT_DISABLE_VERCEL_WEBPACK_CACHE !== '0';
const disableSentryProductionBuildArtifacts =
  isVercelProductionBuild && process.env.SENTRY_ENABLE_BUILD_SOURCEMAPS !== '1';
const repoRoot = path.join(process.cwd(), '../..');
const sentryBuildArtifacts = [
  '.next/server/app/**/*.js',
  '.next/server/app/**/*.js.map',
  '.next/server/chunks/**/*.js',
  '.next/server/chunks/**/*.js.map',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: skipBuildValidation,
  },
  typescript: {
    ignoreBuildErrors: skipBuildValidation,
  },
  experimental: {
    externalDir: true,
    serverActions: {
      bodySizeLimit: '2mb',
    },
    webpackBuildWorker: isVercelBuild,
    webpackMemoryOptimizations: isVercelBuild,
  },
  outputFileTracingRoot: repoRoot,
  webpack: (config, { isServer }) => {
    if (disableVercelWebpackFileSystemCache) {
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
    return [
      {
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

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  sourcemaps: {
    disable: disableSentryProductionBuildArtifacts,
    assets: sentryBuildArtifacts,
  },
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
  errorHandler(error) {
    console.warn('[@sentry/nextjs] Non-fatal API app build warning:', error?.message ?? error);
  },
});
