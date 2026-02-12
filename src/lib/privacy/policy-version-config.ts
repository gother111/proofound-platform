/**
 * Shared policy version metadata.
 *
 * Keep this file dependency-light so it can be safely imported from both
 * server and client modules.
 */

export const POLICY_VERSIONS = {
  tos: 'v1.1.2026-02-12',
  privacy: 'v1.3.2026-02-12',
  cookie: 'v1.1.2026-02-12',
  verification: 'v1.0.2024',
} as const;

export const POLICY_EFFECTIVE_DATES = {
  tos: '2026-02-12',
  privacy: '2026-02-12',
  cookie: '2026-02-12',
  verification: '2024-01-01',
} as const;
