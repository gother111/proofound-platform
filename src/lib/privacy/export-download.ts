export function buildUserExportDownloadFilename(input: Date | string = new Date()) {
  const value = input instanceof Date ? input : new Date(input);
  const safeDate = Number.isNaN(value.getTime())
    ? new Date().toISOString().slice(0, 10)
    : value.toISOString().slice(0, 10);

  return `proofound-data-export-${safeDate}.json`;
}
