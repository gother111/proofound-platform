/* eslint-disable @next/next/no-assign-module-variable */
/** @vitest-environment node */

import { describe, expect, it } from 'vitest';
import { buildSync } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import type { TrustSignals } from '@/lib/portfolio/trust-signals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadGenerateTrustPdf() {
  const exported = loadPortfolioPdfModule();
  return exported.generateTrustPdf || exported.default;
}

function loadPortfolioPdfModule() {
  const require = createRequire(__filename);
  const result = buildSync({
    entryPoints: [path.resolve(__dirname, '../src/lib/portfolio/pdf.ts')],
    bundle: true,
    external: ['pdfkit/js/pdfkit.standalone.js'],
    platform: 'node',
    format: 'cjs',
    write: false,
  });
  const module = { exports: {} as any };
  const loader = new Function('module', 'exports', 'require', result.outputFiles[0].text);
  loader(module, module.exports, require);
  return module.exports as any;
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

    const source = fs.readFileSync(path.resolve(__dirname, '../src/lib/portfolio/pdf.ts'), 'utf8');
    expect(source).toContain('Proof context');
    expect(source).not.toContain('Profile narrative');
  });
});

describe('generateOrganizationProfilePdf', () => {
  it('uses organization trust-page language instead of public-profile PDF copy', async () => {
    const exported = loadPortfolioPdfModule();
    expect(typeof exported.generateOrganizationProfilePdf).toBe('function');

    const source = fs.readFileSync(path.resolve(__dirname, '../src/lib/portfolio/pdf.ts'), 'utf8');
    expect(source).toContain('Organization Trust Page PDF');
    expect(source).not.toContain('Organization Public Profile PDF');

    const buffer = await exported.generateOrganizationProfilePdf({
      organization: {
        displayName: 'Acme Trust',
        slug: 'acme-trust',
        verifiedDomainPath: 'acme.example',
        mission: 'Review proof with care',
        whyWorkMatters: 'Clear assignments need clear trust context.',
        operatingContext: 'Small team, privacy-first review.',
        website: 'https://acme.example',
        verified: true,
        shareUrl: 'https://proofound.io/portfolio/org/acme-trust',
      },
    });

    expect(buffer.length).toBeGreaterThan(500);
  });
});
