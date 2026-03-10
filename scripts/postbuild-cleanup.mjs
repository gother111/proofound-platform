import { rm } from 'node:fs/promises';
import { join } from 'node:path';

const isVercelBuild = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
const shouldCleanupCache = process.env.NEXT_CLEAN_BUILD_CACHE === '1' || isVercelBuild;

async function removeNextCache() {
  if (!shouldCleanupCache) {
    console.log('ℹ️ Skipping Next.js cache cleanup outside Vercel build context.');
    return;
  }

  const cacheDir = join(process.cwd(), '.next', 'cache');

  try {
    await rm(cacheDir, { recursive: true, force: true });
    console.log(`🧹 Removed Next.js build cache at ${cacheDir}`);
  } catch (error) {
    console.warn('⚠️ Unable to remove Next.js build cache', error);
  }
}

removeNextCache();
