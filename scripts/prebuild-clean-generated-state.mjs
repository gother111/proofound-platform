import { mkdir, readdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function moveAsideIfPresent(path) {
  const source = join(process.cwd(), path);
  if (!existsSync(source)) {
    return;
  }

  const staleDir = join(process.cwd(), '.artifacts', 'stale-build-state');
  await mkdir(staleDir, { recursive: true });

  const target = join(staleDir, `${basename(path)}.${timestamp()}`);
  await rename(source, target);
  console.log(`Moved stale generated build state: ${path} -> ${target}`);
}

const generatedPaths = ['.next', 'tsconfig.tsbuildinfo'];
const entries = await readdir(process.cwd(), { withFileTypes: true });
for (const entry of entries) {
  if (entry.isDirectory() && entry.name.startsWith('.next-dev')) {
    generatedPaths.push(entry.name);
  }
}

for (const path of generatedPaths) {
  await moveAsideIfPresent(path);
}
