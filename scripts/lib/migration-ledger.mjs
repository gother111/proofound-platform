export function parseVersionFromFile(fileName) {
  const base = fileName.replace(/\.sql$/i, '');
  const match = base.match(/^(\d{8,})/);
  if (!match) {
    return base;
  }
  return match[1];
}

function localMatchesDbVersion(localVersion, dbVersion) {
  if (localVersion === dbVersion) {
    return true;
  }

  // Some legacy files are date-only (YYYYMMDD) while DB ledger stores full timestamp.
  if (localVersion.length >= 8 && localVersion.length < dbVersion.length) {
    return dbVersion.startsWith(localVersion);
  }

  return false;
}

export function computeDrift(localEntries, dbEntries) {
  const isDbMatchedByLocal = (dbVersion) =>
    localEntries.some((entry) => localMatchesDbVersion(entry.version, dbVersion));

  const isLocalMatchedByDb = (localVersion) =>
    dbEntries.some((row) => localMatchesDbVersion(localVersion, row.version));

  const fileNotApplied = localEntries.filter((entry) => !isLocalMatchedByDb(entry.version));
  const appliedMissingFile = dbEntries.filter((row) => !isDbMatchedByLocal(row.version));
  const appliedWithFile = localEntries.filter((entry) => isLocalMatchedByDb(entry.version));

  return {
    fileNotApplied,
    appliedMissingFile,
    appliedWithFile,
  };
}

export function sanitizeMigrationName(name) {
  return String(name || 'baseline_reconciled')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'baseline_reconciled';
}

