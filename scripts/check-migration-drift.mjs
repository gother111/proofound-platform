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

function getChangedFiles(base) {
  if (!base) return [];
  const output = runGit(['diff', '--name-only', `${base}...HEAD`]);
  if (!output) return [];
  return output.split('\n').map((line) => line.trim()).filter(Boolean);
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

  const changedFiles = getChangedFiles(base);
  if (changedFiles.length === 0) {
    console.log('Migration drift check passed (no changed files).');
    return;
  }

  const disallowedSqlChanges = changedFiles.filter(
    (file) =>
      file.endsWith('.sql') &&
      (file.startsWith('supabase/migrations/') || file.startsWith('drizzle/'))
  );

  if (disallowedSqlChanges.length > 0) {
    fail(
      'SQL migrations were changed outside src/db/migrations. Use src/db/migrations as canonical.',
      disallowedSqlChanges
    );
  }

  const schemaTouched = changedFiles.includes('src/db/schema.ts');
  const canonicalMigrationTouched = changedFiles.some(
    (file) => file.startsWith('src/db/migrations/') && file.endsWith('.sql')
  );

  if (schemaTouched && !canonicalMigrationTouched) {
    fail('src/db/schema.ts changed without a corresponding src/db/migrations/*.sql change.');
  }

  const invalidCanonicalNames = changedFiles
    .filter((file) => file.startsWith('src/db/migrations/') && file.endsWith('.sql'))
    .filter((file) => !/^src\/db\/migrations\/\d{14}_[a-z0-9_]+\.sql$/.test(file));

  if (invalidCanonicalNames.length > 0) {
    fail(
      'Canonical migration filenames must match YYYYMMDDHHMMSS_description.sql (lower snake case).',
      invalidCanonicalNames
    );
  }

  if (changedFiles.includes('migrations-to-run.sql')) {
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
