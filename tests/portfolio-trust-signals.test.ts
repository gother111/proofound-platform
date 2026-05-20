import { describe, expect, it } from 'vitest';
/* eslint-disable @next/next/no-assign-module-variable */
/** @vitest-environment node */

import { buildSync } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadBuildTrustSignals() {
  const result = buildSync({
    entryPoints: [path.resolve(__dirname, '../src/lib/portfolio/trust-signals.ts')],
    bundle: false,
    platform: 'node',
    format: 'cjs',
    write: false,
  });
  // Execute the transpiled CommonJS in-memory to obtain exports
  const module = { exports: {} as any };
  const loader = new Function('module', 'exports', result.outputFiles[0].text);
  loader(module, module.exports);
  const exported = module.exports as any;
  return exported.buildTrustSignals || exported.default;
}

describe('buildTrustSignals', () => {
  it('keeps public verification checks narrow and count-based', () => {
    const buildTrustSignals = loadBuildTrustSignals();
    expect(typeof buildTrustSignals).toBe('function');

    const profile = {
      individual_profiles: [
        {
          verification_status: 'verified',
          verification_method: 'veriff',
          verified_at: '2025-01-01T00:00:00.000Z',
          work_email_verified: true,
          linkedin_verification_data: {
            hasVerificationBadge: true,
            automatedCheck: { confidence: 82 },
          },
        },
      ],
    };

    const signals = buildTrustSignals(profile as any, {
      proofsCount: 3,
      acceptedVerificationsCount: 2,
    });
    expect(signals.identity.verified).toBe(false);
    expect(signals.identity.method).toBeNull();
    expect(signals.workEmail.verified).toBe(false);
    expect(signals.linkedin.confidence).toBeUndefined();
    expect(signals.linkedin.hasVerificationBadge).toBe(false);
    expect(signals.proofs.count).toBe(3);
    expect(signals.verifications.count).toBe(2);
    expect(signals).not.toHaveProperty('attestations');
  });

  it('defaults to safe falsy values when data is missing', () => {
    const buildTrustSignals = loadBuildTrustSignals();
    expect(typeof buildTrustSignals).toBe('function');

    const signals = buildTrustSignals(null, {});
    expect(signals.identity.verified).toBe(false);
    expect(signals.workEmail.verified).toBe(false);
    expect(signals.linkedin.confidence).toBeUndefined();
    expect(signals.proofs.count).toBe(0);
    expect(signals.verifications.count).toBe(0);
    expect(signals).not.toHaveProperty('attestations');
  });

  it('keeps public badge payloads coarse', () => {
    const buildTrustSignals = loadBuildTrustSignals();
    const signals = buildTrustSignals(null, {}, {
      compatibility: {
        verified: false,
        workEmailVerified: false,
      },
      slots: {
        identity: { publicLabel: null },
        workplace: { publicLabel: null },
      },
      publicBadges: [
        {
          key: 'identity_checked',
          label: 'Identity checked',
          state: 'verified',
          meaning: 'should not be exposed',
          doesNotMean: 'should not be exposed',
        },
      ],
      activeIssues: [],
    } as any);

    expect(signals.badges).toEqual([
      {
        key: 'identity_checked',
        label: 'Identity checked',
        state: 'verified',
      },
    ]);
    expect(signals.identity.verified).toBe(false);
    expect(signals.workEmail.verified).toBe(false);
  });
});
