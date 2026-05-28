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
  stone: '#D5CABA',
  paper: '#FDFBF7',
  sage: '#EEF1EA',
};

export function GET(request: Request) {
  const origin = new URL(request.url).origin;

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
              'radial-gradient(circle at top, rgba(255,255,255,0.9), rgba(247,246,241,0.98) 38%, rgba(244,241,233,1) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background:
              'linear-gradient(180deg, rgba(86,98,79,0.08), rgba(86,98,79,0) 26%, rgba(139,74,54,0.08) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            padding: '34px 52px 46px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 70,
              borderBottom: `1px solid rgba(213, 202, 186, 0.56)`,
              color: colors.muted,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                color: colors.forest,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 5,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  background: colors.forest,
                }}
              />
              PROOFOUND
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 30, fontSize: 18 }}>
              <span>How it works</span>
              <span>For individuals</span>
              <span>For organizations</span>
              <span
                style={{
                  borderRadius: 999,
                  background: colors.forest,
                  color: 'white',
                  padding: '12px 22px',
                  fontWeight: 700,
                }}
              >
                Request a pilot
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 38,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: 620,
                gap: 30,
              }}
            >
              <h1
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  margin: 0,
                  color: colors.foreground,
                  fontFamily: 'Georgia, Times New Roman, serif',
                  fontSize: 82,
                  lineHeight: 0.88,
                  fontWeight: 700,
                }}
              >
                <span>Proof behind</span>
                <span>the claim</span>
              </h1>

              <p
                style={{
                  margin: 0,
                  maxWidth: 560,
                  color: 'rgba(38, 35, 31, 0.74)',
                  fontSize: 25,
                  lineHeight: 1.45,
                  fontWeight: 500,
                }}
              >
                Proofound turns real work into structured Proof Packs for privacy-safe assignment
                review before identity takes over.
              </p>

              <p
                style={{
                  margin: 0,
                  color: 'rgba(38, 35, 31, 0.7)',
                  fontSize: 18,
                  lineHeight: 1.35,
                  fontWeight: 600,
                }}
              >
                Proof portfolios for individuals. Evidence-based review for teams.
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  paddingTop: 8,
                }}
              >
                <span
                  style={{
                    borderRadius: 999,
                    background: colors.forest,
                    color: 'white',
                    padding: '18px 30px',
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  Request a pilot
                </span>
                <span
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${colors.stone}`,
                    background: 'rgba(255, 255, 255, 0.72)',
                    color: colors.foreground,
                    padding: '18px 30px',
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  Create your proof portfolio
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                position: 'relative',
                width: 430,
                height: 548,
                marginRight: 20,
              }}
            >
              <img
                src={`${origin}/hero-resume-stack/paper-pile.png`}
                alt=""
                width="1122"
                height="1402"
                style={{
                  position: 'absolute',
                  left: -42,
                  top: -18,
                  width: 510,
                  height: 637,
                  objectFit: 'contain',
                }}
              />
              <img
                src={`${origin}/hero-resume-stack/cv-sheet.png`}
                alt=""
                width="1086"
                height="1448"
                style={{
                  position: 'absolute',
                  left: 78,
                  top: 38,
                  width: 286,
                  height: 382,
                  objectFit: 'contain',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 4,
                  top: 210,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  width: 98,
                  height: 138,
                  transform: 'rotate(4deg)',
                  borderRadius: 12,
                  border: `1px solid rgba(213, 202, 186, 0.7)`,
                  background: colors.background,
                  color: 'rgba(86, 98, 79, 0.78)',
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: 1.08,
                  textAlign: 'center',
                }}
              >
                <span>Results</span>
                <span>note</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    imageSize
  );
}
