import { ImageResponse } from 'next/og';

import { resolvePublicIndividualPortfolioAccessByHandle } from '@/lib/portfolio/public-projection';
import { buildIndividualProofPortfolioDescription } from '@/lib/seo/public-metadata';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = 'Proofound proof portfolio preview';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

function truncateText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

function formatProofCount(count: number): string {
  return `${count} public ${count === 1 ? 'proof' : 'proofs'}`;
}

function buildTrustTierLabel(verifiedPublicProofPackCount: number): string {
  return verifiedPublicProofPackCount > 0 ? 'Verified ✓' : 'Self-reported';
}

function PortfolioOgImage({
  displayName,
  headline,
  proofCount,
  trustTier,
}: {
  displayName: string;
  headline: string;
  proofCount: number;
  trustTier: string;
}) {
  const initial = displayName[0]?.toUpperCase() || 'P';
  const verified = trustTier === 'Verified ✓';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background: '#F4F0E7',
        color: '#1F2823',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          background:
            'linear-gradient(135deg, rgba(28,77,58,0.18), rgba(244,240,231,0.8) 42%, rgba(199,107,74,0.14))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 56,
          right: 64,
          display: 'flex',
          color: '#1C4D3A',
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        Proofound
      </div>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: '72px 76px 64px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #1C4D3A, #C76B4A)',
              color: '#FFFFFF',
              fontSize: 46,
              fontWeight: 800,
              boxShadow: '0 18px 40px rgba(28,77,58,0.24)',
            }}
          >
            {initial}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', color: '#6B665D', fontSize: 24, fontWeight: 700 }}>
              Proof Portfolio
            </div>
            <div
              style={{
                display: 'flex',
                width: 'fit-content',
                border: `2px solid ${verified ? '#B8D8C5' : '#D9D5CC'}`,
                borderRadius: 999,
                padding: '8px 18px',
                background: verified ? '#F3FAF6' : '#FCFBF8',
                color: verified ? '#1C4D3A' : '#6B665D',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {trustTier}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 940 }}>
          <div
            style={{
              display: 'flex',
              color: '#17231D',
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
            }}
          >
            {truncateText(displayName, 42)}
          </div>
          <div
            style={{
              display: 'flex',
              color: '#44504B',
              fontSize: 34,
              fontWeight: 500,
              lineHeight: 1.25,
            }}
          >
            {truncateText(headline, 96)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              border: '2px solid rgba(28,77,58,0.18)',
              borderRadius: 999,
              padding: '12px 22px',
              background: 'rgba(255,255,255,0.72)',
              color: '#1C4D3A',
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            {formatProofCount(proofCount)}
          </div>
          <div style={{ display: 'flex', color: '#6B665D', fontSize: 24, fontWeight: 600 }}>
            Public-safe proof selected by the owner
          </div>
        </div>
      </div>
    </div>
  );
}

function UnavailableOgImage() {
  return (
    <PortfolioOgImage
      displayName="Proofound portfolio"
      headline="This proof portfolio is unavailable."
      proofCount={0}
      trustTier="Self-reported"
    />
  );
}

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const access = await resolvePublicIndividualPortfolioAccessByHandle(handle);

  if (access.status !== 'accessible') {
    return new ImageResponse(<UnavailableOgImage />, size);
  }

  const data = access.projection;
  const headline = buildIndividualProofPortfolioDescription({
    displayName: data.publicDisplayName,
    headline: data.publicHeadline,
  });

  return new ImageResponse(
    (
      <PortfolioOgImage
        displayName={data.publicDisplayName}
        headline={headline}
        proofCount={data.publicProofCount}
        trustTier={buildTrustTierLabel(data.verifiedPublicProofPackCount)}
      />
    ),
    size
  );
}
