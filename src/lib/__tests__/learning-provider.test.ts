import { beforeEach, describe, expect, it, vi } from 'vitest';
import { execFile } from 'child_process';

describe('courseraProvider (smoke via tsx)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns courses for skills using API response', async () => {
    await new Promise<void>((resolve, reject) => {
      execFile(
        process.execPath,
        ['--import', 'tsx', 'scripts/smoke-learning-provider.ts'],
        (error, stdout, stderr) => {
          if (error) {
            console.error(stderr);
            reject(error);
            return;
          }
          expect(stdout).toContain('coursera smoke ok');
          resolve();
        }
      );
    });
  });
});
