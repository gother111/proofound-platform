export function toTimestampOrNull(value: Date | string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function toIsoOrNull(value: Date | string | null | undefined): string | null {
  const timestamp = toTimestampOrNull(value);
  return timestamp === null ? null : new Date(timestamp).toISOString();
}

export function toDateOrNull(value: Date | string | null | undefined): Date | null {
  const timestamp = toTimestampOrNull(value);
  return timestamp === null ? null : new Date(timestamp);
}
