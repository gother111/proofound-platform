import { describe, expect, it } from 'vitest';
import { sanitizeReturnPath } from '@/lib/navigation/sanitize-return-path';

describe('sanitizeReturnPath', () => {
  it('keeps valid app return paths', () => {
    expect(sanitizeReturnPath('/app/i/home')).toBe('/app/i/home');
    expect(sanitizeReturnPath('/app/o/acme/home?tab=overview')).toBe(
      '/app/o/acme/home?tab=overview'
    );
  });

  it('rejects non-app paths and returns fallback', () => {
    expect(sanitizeReturnPath('/portfolio/alex')).toBe('/');
    expect(sanitizeReturnPath('https://example.com/app/i/home')).toBe('/');
    expect(sanitizeReturnPath('//evil.test/app/i/home')).toBe('/');
  });

  it('accepts a safe app fallback and rejects unsafe fallback', () => {
    expect(sanitizeReturnPath(undefined, '/app/i/home')).toBe('/app/i/home');
    expect(sanitizeReturnPath(undefined, '/portfolio/alex')).toBe('/');
  });
});
