import { describe, expect, it } from 'vitest';

import {
  parsePositiveInt,
  withTimeout,
} from '@/archive/non_launch_python_internal/lib/python-internal/request-utils';

describe('python-internal/request-utils', () => {
  describe('parsePositiveInt', () => {
    it('returns parsed positive integers', () => {
      expect(parsePositiveInt('42', 10)).toBe(42);
    });

    it('falls back for invalid values', () => {
      expect(parsePositiveInt(undefined, 10)).toBe(10);
      expect(parsePositiveInt('0', 10)).toBe(10);
      expect(parsePositiveInt('-5', 10)).toBe(10);
      expect(parsePositiveInt('abc', 10)).toBe(10);
    });
  });

  describe('withTimeout', () => {
    it('resolves when promise completes in time', async () => {
      await expect(withTimeout(Promise.resolve('ok'), 100)).resolves.toBe('ok');
    });

    it('rejects with timeout error when promise is too slow', async () => {
      const slowPromise = new Promise<string>((resolve) => {
        setTimeout(() => resolve('late'), 25);
      });

      await expect(withTimeout(slowPromise, 1)).rejects.toThrow('Request timed out');
    });
  });
});
