import { rm } from 'node:fs/promises';
import { join } from 'node:path';

async function removeNextCache() {
  const cacheDir = join(process.cwd(), '.next', 'cache');

  try {
    await rm(cacheDir, { recursive: true, force: true });
    console.log(`🧹 Removed Next.js build cache at ${cacheDir}`);
  } catch (error) {
    console.warn('⚠️ Unable to remove Next.js build cache', error);
  }
}

removeNextCache();
