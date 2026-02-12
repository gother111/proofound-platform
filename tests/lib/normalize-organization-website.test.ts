import { describe, it, expect } from 'vitest';
import { normalizeOrganizationWebsite } from '@/lib/organizations/normalizeWebsite';

describe('normalizeOrganizationWebsite', () => {
  it('returns null for empty values', () => {
    expect(normalizeOrganizationWebsite('')).toEqual({ value: null });
    expect(normalizeOrganizationWebsite('   ')).toEqual({ value: null });
    expect(normalizeOrganizationWebsite(null)).toEqual({ value: null });
    expect(normalizeOrganizationWebsite(undefined)).toEqual({ value: null });
  });

  it('adds https scheme when missing', () => {
    expect(normalizeOrganizationWebsite('example.com')).toEqual({
      value: 'https://example.com/',
    });
  });

  it('preserves valid https URLs', () => {
    expect(normalizeOrganizationWebsite('https://proofound.io/about')).toEqual({
      value: 'https://proofound.io/about',
    });
  });

  it('rejects malformed URLs', () => {
    expect(normalizeOrganizationWebsite('https://')).toEqual({
      value: null,
      error: 'Website must be a valid URL (for example: https://example.com).',
    });
  });

  it('rejects unsupported URL protocols', () => {
    expect(normalizeOrganizationWebsite('ftp://example.com')).toEqual({
      value: null,
      error: 'Website URL must start with http:// or https://.',
    });
  });
});
