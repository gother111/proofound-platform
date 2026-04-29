import { describe, expect, it, vi } from 'vitest';
import { execFile } from 'child_process';

let supabaseMock: any;

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => supabaseMock,
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  }),
}));
type Row = Record<string, any>;

const makeBuilder = (rows: Row[]) => {
  const builder: any = {
    select: () => builder,
    eq: (col: string, val: any) => makeBuilder(rows.filter((r) => r[col] === val)),
    order: () => builder,
    limit: (n?: number) =>
      Promise.resolve({ data: typeof n === 'number' ? rows.slice(0, n) : rows, error: null }),
    in: (col: string, vals: any[]) =>
      Promise.resolve({ data: rows.filter((r) => vals.includes(r[col])), error: null }),
  };
  return builder;
};

const makeSupabaseStub = (data: Record<string, Row[]>) => ({
  from: (table: string) => makeBuilder(data[table] ?? []),
});

describe('computeSkillGaps (smoke via tsx)', () => {
  it('computes gaps and ranks by severity', async () => {
    await new Promise<void>((resolve, reject) => {
      execFile(
        process.execPath,
        ['--import', 'tsx', 'scripts/smoke-skill-gaps.ts'],
        (error, stdout, stderr) => {
          if (error) {
            console.error(stderr);
            reject(error);
            return;
          }
          expect(stdout).toContain('gap-service smoke ok');
          resolve();
        }
      );
    });
  });
});
