export type NormalizedOrganizationWebsite = {
  value: string | null;
  error?: string;
};

const SCHEME_REGEX = /^[a-z][a-z\d+\-.]*:\/\//i;

export function normalizeOrganizationWebsite(
  input: string | null | undefined
): NormalizedOrganizationWebsite {
  if (input == null) {
    return { value: null };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { value: null };
  }

  const candidate = SCHEME_REGEX.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      value: null,
      error: 'Website must be a valid URL (for example: https://example.com).',
    };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return {
      value: null,
      error: 'Website URL must start with http:// or https://.',
    };
  }

  if (!parsed.hostname) {
    return {
      value: null,
      error: 'Website must include a valid hostname.',
    };
  }

  return { value: parsed.toString() };
}
