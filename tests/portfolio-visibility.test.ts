/* eslint-disable @next/next/no-assign-module-variable */
/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { buildSync } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadMergeVisibilityFlags() {
  const require = createRequire(__filename);
  const result = buildSync({
    entryPoints: [path.resolve(__dirname, '../src/lib/portfolio/visibility.ts')],
    bundle: false,
    platform: 'node',
    format: 'cjs',
    write: false,
  });
  const module = { exports: {} as any };
  const loader = new Function('module', 'exports', 'require', result.outputFiles[0].text);
  loader(module, module.exports, require);
  return module.exports.mergeVisibilityFlags || module.exports.default;
}

describe('mergeVisibilityFlags', () => {
  it('fills defaults when missing', () => {
    const mergeVisibilityFlags = loadMergeVisibilityFlags();
    const merged = mergeVisibilityFlags(null);
    expect(merged.header).toBe(true);
    expect(merged.workEmail).toBe(false);
    expect(merged.contact).toBe(false);
    expect(merged.skills).toBe(false);
    expect(merged.bio).toBe(false);
    expect(merged.counts).toBe(false);
  });

  it('applies overrides while keeping other defaults', () => {
    const mergeVisibilityFlags = loadMergeVisibilityFlags();
    const merged = mergeVisibilityFlags({ skills: false, contact: false });
    expect(merged.skills).toBe(false);
    expect(merged.contact).toBe(false);
    expect(merged.header).toBe(true);
  });
});
