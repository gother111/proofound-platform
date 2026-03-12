/* eslint-disable @next/next/no-assign-module-variable */
/** @vitest-environment node */

import { describe, expect, it } from 'vitest';
import { buildSync } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import type { TrustSignals } from '@/lib/portfolio/trust-signals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadGenerateTrustPdf() {
  const require = createRequire(__filename);
  const result = buildSync({
    entryPoints: [path.resolve(__dirname, '../src/lib/portfolio/pdf.ts')],
    bundle: false,
    platform: 'node',
    format: 'cjs',
    write: false,
  });
  const module = { exports: {} as any };
  const loader = new Function('module', 'exports', 'require', result.outputFiles[0].text);
  loader(module, module.exports, require);
  const exported = module.exports as any;
  return exported.generateTrustPdf || exported.default;
}

describe('generateTrustPdf', () => {
  it('creates a non-empty PDF buffer from trust data', async () => {
    const generateTrustPdf = loadGenerateTrustPdf();
    expect(typeof generateTrustPdf).toBe('function');

    const signals: TrustSignals = {
      identity: { verified: true, method: 'veriff', verifiedAt: '2025-01-01' },
      workEmail: { verified: true },
      linkedin: { confidence: 80, hasVerificationBadge: true },
      proofs: { count: 3 },
      verifications: { count: 2 },
      badges: [],
      activeIssues: [],
    };

    const buffer = await generateTrustPdf({
      profile: {
        displayName: 'Jane Doe',
        handle: 'jane',
        headline: 'Full-stack builder',
        bio: 'I ship trustworthy products with measurable impact.',
        contactEmail: 'jane@example.com',
        shareUrl: 'https://example.com/portfolio/jane',
      },
      signals,
      skills: [
        { name: 'Next.js', level: 5 },
        { name: 'Supabase', level: 4 },
      ],
      proofPacks: [
        {
          title: 'Proof Pack: Product Strategy',
          verificationStatus: 'verified',
          freshnessState: 'fresh',
          outcomesSummary: 'Shipped a trust-first MVP.',
        },
      ],
      visibility: {
        header: true,
        proofBar: true,
        workEmail: false,
        linkedin: true,
        identity: true,
        counts: true,
        skills: true,
        bio: true,
        contact: false,
      },
    });

    expect(buffer.length).toBeGreaterThan(500);
  });
});
