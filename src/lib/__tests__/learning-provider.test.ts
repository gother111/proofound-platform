import { beforeEach, describe, expect, it, vi } from 'vitest';
import { execFile } from 'child_process';
import path from 'path';

describe('courseraProvider (smoke via tsx)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns courses for skills using API response', async () => {
    const tsxBin = path.join(process.cwd(), 'node_modules', '.bin', 'tsx');
    await new Promise<void>((resolve, reject) => {
      execFile(tsxBin, ['scripts/smoke-learning-provider.ts'], (error, stdout, stderr) => {
        if (error) {
          console.error(stderr);
          reject(error);
          return;
        }
        expect(stdout).toContain('coursera smoke ok');
        resolve();
      });
    });
  });
});

