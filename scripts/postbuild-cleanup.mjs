import { rm } from 'node:fs/promises';
import { join } from 'node:path';

const shouldCleanupCache =
  process.env.NEXT_CLEAN_BUILD_CACHE === '1' ||
  process.env.NEXT_CLEAN_BUILD_CACHE === 'true';

async function removeNextCache() {
  if (!shouldCleanupCache) {
    console.log('ℹ️ Skipping Next.js cache cleanup. Set NEXT_CLEAN_BUILD_CACHE=1 to force it.');
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
