export function normalizePdfParseError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Failed to parse PDF';
  }

  if (
    error.message.includes('GlobalWorkerOptions.workerSrc') ||
    error.message.includes('getDocument') ||
    error.message.includes('PDF parser initialization failed')
  ) {
    return 'PDF parser could not start. Please refresh and re-upload the file.';
  }

  return error.message;
}
