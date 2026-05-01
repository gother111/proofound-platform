import { lstat, mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';

const ARCHIVE_STALE_BUILD_STATE =
  process.env.PROOFOUND_ARCHIVE_STALE_BUILD_STATE === '1' ||
  process.env.PROOFOUND_ARCHIVE_STALE_BUILD_STATE === 'true';

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return unitIndex === 0 ? `${value} ${units[unitIndex]}` : `${value.toFixed(1)} ${units[unitIndex]}`;
}

async function getPathSizeBytes(path) {
  const stats = await lstat(path);
  if (!stats.isDirectory()) {
    return stats.size;
  }

  const entries = await readdir(path, { withFileTypes: true });
  const childSizes = await Promise.all(
    entries.map((entry) => getPathSizeBytes(join(path, entry.name)))
  );
  return childSizes.reduce((sum, size) => sum + size, 0);
}

async function cleanGeneratedPathIfPresent(path) {
  const source = join(process.cwd(), path);
  if (!existsSync(source)) {
    return null;
  }

  const sizeBytes = await getPathSizeBytes(source);

  if (!ARCHIVE_STALE_BUILD_STATE) {
    await rm(source, { recursive: true, force: true });
    console.log(`Removed stale generated build state: ${path}`);
    return {
      path,
      action: 'removed',
      sizeBytes,
      target: null,
    };
  }

  const staleDir = join(process.cwd(), '.artifacts', 'stale-build-state');
  await mkdir(staleDir, { recursive: true });

  const target = join(staleDir, `${basename(path)}.${timestamp()}`);
  await rename(source, target);
  console.log(`Moved stale generated build state: ${path} -> ${target}`);
  return {
    path,
    action: 'archived',
    sizeBytes,
    target,
  };
}

async function writeCleanupSummary(results) {
  const cleaned = results.filter(Boolean);
  if (cleaned.length === 0) {
    return;
  }

  const artifactDir = join(process.cwd(), '.artifacts');
  await mkdir(artifactDir, { recursive: true });

  const totalBytes = cleaned.reduce((sum, result) => sum + result.sizeBytes, 0);
  const lines = [
    '# Stale Build State Cleanup Summary',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${ARCHIVE_STALE_BUILD_STATE ? 'archive' : 'delete'}`,
    `Paths cleaned: ${cleaned.length}`,
    `Estimated ${ARCHIVE_STALE_BUILD_STATE ? 'moved' : 'reclaimed'} space: ${formatBytes(totalBytes)}`,
    '',
    '| Path | Action | Size |',
    '| --- | --- | ---: |',
    ...cleaned.map(
      (result) => `| \`${result.path}\` | ${result.action} | ${formatBytes(result.sizeBytes)} |`
    ),
    '',
    ARCHIVE_STALE_BUILD_STATE
      ? 'Generated build snapshots were archived because `PROOFOUND_ARCHIVE_STALE_BUILD_STATE` was enabled.'
      : 'Generated build snapshots were deleted. Re-run the build to regenerate current `.next` output.',
    '',
  ];

  await writeFile(join(artifactDir, 'stale-build-state-cleanup-summary.md'), lines.join('\n'));
}

const generatedPaths = ['.next', 'tsconfig.tsbuildinfo'];
const entries = await readdir(process.cwd(), { withFileTypes: true });
for (const entry of entries) {
  if (entry.isDirectory() && entry.name.startsWith('.next-dev')) {
    generatedPaths.push(entry.name);
  }
}

const cleanupResults = [];
for (const path of generatedPaths) {
  cleanupResults.push(await cleanGeneratedPathIfPresent(path));
}

await writeCleanupSummary(cleanupResults);
