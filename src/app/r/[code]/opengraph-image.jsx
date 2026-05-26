import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DEFAULT_SITE_URL, SITE_NAME } from '@/lib/siteMetadata';
import { isValidReferralCode } from '@/lib/server/referrals';

export const runtime = 'nodejs';
export const alt = 'APT Casino referral invite';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function loadImageBase64(filename) {
  try {
    const filePath = join(process.cwd(), 'public', filename);
    const bytes = await readFile(filePath);
    const ext = filename.endsWith('.png') ? 'png' : 'jpeg';
    return `data:image/${ext};base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }) {
  const { code: raw } = await params;
  const code = String(raw || '')
    .trim()
    .toUpperCase();
  const valid = isValidReferralCode(code);
  const host = DEFAULT_SITE_URL.replace(/^https?:\/\//, '');
  const shortPath = valid ? `/r/${code}` : '';

  const logoSrc = await loadImageBase64('APT-Casino-Logo.png');
  const heroSrc = await loadImageBase64('images/HeroImage.png');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #070005 0%, #1a0510 40%, #3d0a28 100%)',
          padding: 48,
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" width={52} height={52} style={{ borderRadius: 12 }} />
            ) : null}
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 3,
                color: '#f5c6d8',
                textTransform: 'uppercase',
              }}
            >
              {SITE_NAME}
            </div>
          </div>
          {valid ? (
            <div
              style={{
                fontSize: 18,
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: 1,
              }}
            >
              Referral invite
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            gap: 36,
            marginTop: 24,
          }}
        >
          {heroSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroSrc}
              alt=""
              width={340}
              height={191}
              style={{
                borderRadius: 20,
                objectFit: 'cover',
                border: '2px solid rgba(236,72,153,0.35)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
              }}
            />
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 18 }}>
            <div
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.05,
                letterSpacing: -1,
              }}
            >
              {valid ? "You're invited" : 'Join the action'}
            </div>
            <div
              style={{
                fontSize: 24,
                color: 'rgba(255,255,255,0.78)',
                lineHeight: 1.35,
                maxWidth: 560,
              }}
            >
              Provably fair casino on Solana & Aptos — roulette, mines, plinko & more.
            </div>

            {valid ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  marginTop: 8,
                  padding: '22px 28px',
                  borderRadius: 18,
                  border: '2px solid rgba(236,72,153,0.45)',
                  background: 'rgba(0,0,0,0.45)',
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 4,
                    color: 'rgba(244,114,182,0.95)',
                    textTransform: 'uppercase',
                  }}
                >
                  Referral code
                </div>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: 6,
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  {code}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    color: 'rgba(255,255,255,0.65)',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  {host}
                  {shortPath}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 20,
            color: 'rgba(245,198,216,0.9)',
            marginTop: 8,
          }}
        >
          <span>Deposit · Play · Earn APTC</span>
          <span>Provably fair · Multichain</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
