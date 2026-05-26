import { ImageResponse } from 'next/og';
import { OgBrandMark } from '@/lib/og/brandMark';
import { DEFAULT_SITE_URL, SITE_NAME } from '@/lib/siteMetadata';
import { isValidReferralCode } from '@/lib/server/referrals';

export const runtime = 'nodejs';
export const alt = 'APT Casino referral invite';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
  const { code: raw } = await params;
  const code = String(raw || '')
    .trim()
    .toUpperCase();
  const valid = isValidReferralCode(code);
  const host = DEFAULT_SITE_URL.replace(/^https?:\/\//, '');
  const shortPath = valid ? `/r/${code}` : '';

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
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: 6,
            background: 'linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6)',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginTop: 32,
          }}
        >
          <OgBrandMark size={88} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 3,
                color: '#f5c6d8',
                textTransform: 'uppercase',
              }}
            >
              {SITE_NAME}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 18,
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              {valid ? 'Referral invite' : 'Join the action'}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 20,
            marginTop: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 56,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.05,
            }}
          >
            {valid ? "You're invited" : 'Play provably fair'}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              color: 'rgba(255,255,255,0.78)',
              lineHeight: 1.35,
              maxWidth: 900,
            }}
          >
            Roulette, mines, plinko & more on Solana and Aptos.
          </div>

          {valid ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: '22px 28px',
                borderRadius: 18,
                border: '2px solid rgba(236,72,153,0.45)',
                background: 'rgba(0,0,0,0.45)',
                maxWidth: 720,
              }}
            >
              <div
                style={{
                  display: 'flex',
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
                  display: 'flex',
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
                  display: 'flex',
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

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 20,
            color: 'rgba(245,198,216,0.9)',
          }}
        >
          <div style={{ display: 'flex' }}>Deposit · Play · Earn APTC</div>
          <div style={{ display: 'flex' }}>Provably fair · Multichain</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
