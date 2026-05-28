import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const imageSize = {
  width: 1200,
  height: 630,
};

const colors = {
  background: '#F3F0E8',
  foreground: '#26231F',
  muted: '#6E675D',
  forest: '#56624F',
  terracotta: '#8B4A36',
  stone: '#D5CABA',
  paper: '#FDFBF7',
};

function ProofItem({ label, tone }: { label: string; tone: 'forest' | 'terracotta' | 'stone' }) {
  const background = tone === 'forest' ? '#EEF1EA' : tone === 'terracotta' ? '#F4E7E1' : '#F8F4EC';
  const border =
    tone === 'forest'
      ? 'rgba(86, 98, 79, 0.32)'
      : tone === 'terracotta'
        ? 'rgba(139, 74, 54, 0.28)'
        : colors.stone;
  const dot =
    tone === 'forest' ? colors.forest : tone === 'terracotta' ? colors.terracotta : '#A19586';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        borderRadius: 22,
        border: `1px solid ${border}`,
        background,
        padding: '18px 20px',
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          background: dot,
        }}
      />
      <span
        style={{
          color: colors.foreground,
          fontFamily: 'Inter, Arial, sans-serif',
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: colors.background,
          color: colors.foreground,
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 86% 16%, rgba(139, 74, 54, 0.18), transparent 32%), radial-gradient(circle at 80% 82%, rgba(86, 98, 79, 0.18), transparent 36%), linear-gradient(135deg, rgba(255,255,255,0.9), rgba(243,240,232,0.92))',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 42,
            right: 42,
            top: 38,
            bottom: 38,
            display: 'flex',
            borderRadius: 42,
            border: `1px solid ${colors.stone}`,
            background: 'rgba(253, 251, 247, 0.72)',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            width: '100%',
            height: '100%',
            padding: '74px 78px',
            gap: 54,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: 580,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  color: colors.forest,
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: 1.4,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    background: colors.forest,
                  }}
                />
                PROOFOUND
              </div>

              <h1
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  margin: 0,
                  color: colors.foreground,
                  fontFamily: 'Georgia, Times New Roman, serif',
                  fontSize: 82,
                  lineHeight: 0.9,
                  fontWeight: 700,
                  letterSpacing: -1,
                }}
              >
                <span>Proof behind</span>
                <span>the claim</span>
              </h1>

              <p
                style={{
                  margin: 0,
                  maxWidth: 560,
                  color: colors.muted,
                  fontSize: 32,
                  lineHeight: 1.22,
                  fontWeight: 500,
                }}
              >
                Structured Proof Packs for privacy-safe assignment review before identity takes
                over.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                color: colors.terracotta,
                fontSize: 25,
                fontWeight: 800,
              }}
            >
              Evidence-based review for real work
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: 380,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                width: 380,
                borderRadius: 34,
                border: `1px solid ${colors.stone}`,
                background: colors.paper,
                padding: 28,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: colors.muted,
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: 0.7,
                }}
              >
                PROOF PACK
                <span style={{ color: colors.forest }}>Verified</span>
              </div>

              <ProofItem label="Outcome" tone="forest" />
              <ProofItem label="Artifacts" tone="terracotta" />
              <ProofItem label="Blind-safe" tone="stone" />

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 6,
                }}
              >
                {['Public page', 'Review corridor'].map((label) => (
                  <div
                    key={label}
                    style={{
                      borderRadius: 999,
                      border: `1px solid ${colors.stone}`,
                      color: colors.muted,
                      fontSize: 18,
                      fontWeight: 700,
                      padding: '10px 14px',
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    imageSize
  );
}
