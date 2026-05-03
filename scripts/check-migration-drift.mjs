#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function getBaseCommit() {
  const explicitBase = process.env.MIGRATION_DIFF_BASE?.trim();
  if (explicitBase) {
    return explicitBase;
  }

  const githubBaseRef = process.env.GITHUB_BASE_REF?.trim();
  if (githubBaseRef) {
    try {
      const remoteBase = `origin/${githubBaseRef}`;
      return runGit(['merge-base', 'HEAD', remoteBase]);
    } catch {
      // Fall through to local heuristic
    }
  }

  try {
    return runGit(['rev-parse', 'HEAD~1']);
  } catch {
    return null;
  }
}

function parseNameStatus(output) {
  if (!output) return [];
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+/);
      const status = parts[0]?.[0] || 'M';
      const file = parts[parts.length - 1];
      return { status, file };
    })
    .filter((entry) => Boolean(entry.file));
}

function getChangedFilesBetween(base, extraArgs = []) {
  if (!base) return [];
  const output = runGit(['diff', '--name-status', ...extraArgs, `${base}...HEAD`]);
  return parseNameStatus(output);
}

function getWorkingTreeChangedFiles() {
  const unstaged = parseNameStatus(runGit(['diff', '--name-status', 'HEAD']));
  const staged = parseNameStatus(runGit(['diff', '--name-status', '--cached']));
  const untracked = runGit(['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean)
    .map((file) => ({ status: 'A', file }));
  const byPath = new Map();

  [...unstaged, ...staged, ...untracked].forEach((entry) => {
    const existing = byPath.get(entry.file);
    if (!existing || entry.status === 'D') {
      byPath.set(entry.file, entry);
      return;
    }

    if (existing.status === 'D') {
      return;
    }

    byPath.set(entry.file, entry);
  });

  return Array.from(byPath.values());
}

function fail(message, details = []) {
  console.error(`\nMigration drift check failed: ${message}`);
  if (details.length > 0) {
    for (const detail of details) {
      console.error(` - ${detail}`);
    }
  }
  process.exit(1);
}

function main() {
  const base = getBaseCommit();
  if (!base) {
    console.log('Migration drift check skipped (no suitable git base commit found).');
    return;
  }

  const changedFiles = getChangedFilesBetween(base);
  const localChangedFiles = getWorkingTreeChangedFiles();
  const normalizedMap = new Map();

  for (const entry of changedFiles) {
    normalizedMap.set(entry.file, entry);
  }

  for (const entry of localChangedFiles) {
    normalizedMap.set(entry.file, entry);
  }

  const normalizedChanges = Array.from(normalizedMap.values());

  if (normalizedChanges.length === 0) {
    console.log('Migration drift check passed (no changed files).');
    return;
  }

  const disallowedSqlChanges = normalizedChanges.filter(
    ({ file, status }) =>
      status !== 'D' &&
      file.endsWith('.sql') &&
      (file.startsWith('supabase/migrations/') || file.startsWith('drizzle/'))
  );

  if (disallowedSqlChanges.length > 0) {
    fail(
      'SQL migrations were changed outside src/db/migrations. Use src/db/migrations as canonical.',
      disallowedSqlChanges.map((entry) => `${entry.status} ${entry.file}`)
    );
  }

  const changedPaths = normalizedChanges.map((entry) => entry.file);

  const schemaTouched = changedPaths.includes('src/db/schema.ts');
  const canonicalMigrationTouched = normalizedChanges.some(
    ({ file, status }) => status !== 'D' && file.startsWith('src/db/migrations/') && file.endsWith('.sql')
  );

  if (schemaTouched && !canonicalMigrationTouched) {
    fail('src/db/schema.ts changed without a corresponding src/db/migrations/*.sql change.');
  }

  const invalidCanonicalNames = normalizedChanges
    .filter(({ file, status }) => status !== 'D' && file.startsWith('src/db/migrations/') && file.endsWith('.sql'))
    .map(({ file }) => file)
    .filter((file) => !/^src\/db\/migrations\/\d{14}_[a-z0-9_]+\.sql$/.test(file));

  if (invalidCanonicalNames.length > 0) {
    fail(
      'Canonical migration filenames must match YYYYMMDDHHMMSS_description.sql (lower snake case).',
      invalidCanonicalNames
    );
  }

  if (changedPaths.includes('migrations-to-run.sql')) {
    fail('migrations-to-run.sql is deprecated. Add migrations under src/db/migrations instead.');
  }

  console.log('Migration drift check passed.');
}

try {
  main();
} catch (error) {
  console.error('\nMigration drift check failed unexpectedly:', error.message);
  process.exit(1);
}
