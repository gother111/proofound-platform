/* eslint-disable @next/next/no-img-element */
/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 */
import brandTokens from '@/design/brand-tokens.json';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const imageSize = {
  width: 1200,
  height: 630,
};

const tokenColors = brandTokens.colors;
const tokenFonts = brandTokens.typography.fontFamilies;

const fontAssetUrls = {
  crimsonPro600:
    'https://fonts.gstatic.com/s/crimsonpro/v28/q5uUsoa5M_tv7IihmnkabC5XiXCAlXGks1WZEGp8OA.ttf',
  inter500:
    'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf',
  inter600:
    'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf',
  inter700:
    'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf',
};

const previewTokens = {
  color: {
    background: tokenColors.secondary['100'],
    backgroundSoft: tokenColors.neutralLight['100'],
    foreground: tokenColors.primary['900'],
    foregroundMuted: tokenColors.neutralDark['600'],
    foregroundSoft: 'rgba(45, 51, 43, 0.74)',
    forest: tokenColors.primary['600'],
    forestSoft: 'rgba(86, 98, 79, 0.78)',
    forestMist: 'rgba(86, 98, 79, 0.08)',
    clayMist: 'rgba(175, 141, 116, 0.09)',
    stone: tokenColors.secondary['400'],
    stoneLine: 'rgba(213, 202, 186, 0.58)',
    paper: tokenColors.neutralLight['50'],
    paperWash: 'rgba(252, 251, 249, 0.72)',
    sage: tokenColors.primary['50'],
  },
  font: {
    display: tokenFonts.display.split(',')[0].replace(/'/g, ''),
    body: tokenFonts.body.split(',')[0].replace(/'/g, ''),
  },
};

async function loadFont(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load preview font from ${url}`);
  }

  return response.arrayBuffer();
}

async function loadPreviewFonts() {
  try {
    const [crimsonPro600, inter500, inter600, inter700] = await Promise.all([
      loadFont(fontAssetUrls.crimsonPro600),
      loadFont(fontAssetUrls.inter500),
      loadFont(fontAssetUrls.inter600),
      loadFont(fontAssetUrls.inter700),
    ]);

    return [
      {
        name: previewTokens.font.display,
        data: crimsonPro600,
        style: 'normal' as const,
        weight: 600 as const,
      },
      {
        name: previewTokens.font.body,
        data: inter500,
        style: 'normal' as const,
        weight: 500 as const,
      },
      {
        name: previewTokens.font.body,
        data: inter600,
        style: 'normal' as const,
        weight: 600 as const,
      },
      {
        name: previewTokens.font.body,
        data: inter700,
        style: 'normal' as const,
        weight: 700 as const,
      },
    ];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const fonts = await loadPreviewFonts();

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: previewTokens.color.background,
          color: previewTokens.color.foreground,
          fontFamily: previewTokens.font.body,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at top, ${previewTokens.color.paperWash}, ${previewTokens.color.backgroundSoft} 38%, ${previewTokens.color.background} 100%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background: `linear-gradient(180deg, ${previewTokens.color.forestMist}, rgba(86,98,79,0) 26%, ${previewTokens.color.clayMist} 100%)`,
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            padding: '34px 50px 46px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 68,
              borderBottom: `1px solid ${previewTokens.color.stoneLine}`,
              color: previewTokens.color.foregroundMuted,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                color: previewTokens.color.foregroundSoft,
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: 7,
                textTransform: 'uppercase',
              }}
            >
              <img
                src={`${origin}/logo.png`}
                alt=""
                width="1024"
                height="1024"
                style={{
                  width: 42,
                  height: 42,
                  objectFit: 'contain',
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
                  background: previewTokens.color.forest,
                  color: previewTokens.color.paper,
                  padding: '12px 22px',
                  fontWeight: 600,
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
              gap: 34,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: 626,
                gap: 28,
              }}
            >
              <h1
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  margin: 0,
                  color: previewTokens.color.foreground,
                  fontFamily: previewTokens.font.display,
                  fontSize: 84,
                  lineHeight: 0.88,
                  fontWeight: 600,
                }}
              >
                <span>Proof behind</span>
                <span>the claim</span>
              </h1>

              <p
                style={{
                  margin: 0,
                  maxWidth: 568,
                  color: previewTokens.color.foregroundSoft,
                  fontSize: 24,
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
                  color: previewTokens.color.foregroundSoft,
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
                    background: previewTokens.color.forest,
                    color: previewTokens.color.paper,
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
                    border: `1px solid ${previewTokens.color.stone}`,
                    background: previewTokens.color.paperWash,
                    color: previewTokens.color.foreground,
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
                width: 420,
                height: 548,
                marginRight: 24,
              }}
            >
              <img
                src={`${origin}/hero-resume-stack/paper-pile.png`}
                alt=""
                width="1122"
                height="1402"
                style={{
                  position: 'absolute',
                  left: -48,
                  top: -18,
                  width: 514,
                  height: 642,
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
                  left: 68,
                  top: 40,
                  width: 292,
                  height: 389,
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
                  border: `1px solid ${previewTokens.color.stoneLine}`,
                  background: previewTokens.color.background,
                  color: previewTokens.color.forestSoft,
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
    {
      ...imageSize,
      fonts,
    }
  );
}
