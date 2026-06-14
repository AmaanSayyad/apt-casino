import { ImageResponse } from 'next/og';
import { DEFAULT_SITE_URL, SITE_NAME } from '@/lib/siteMetadata';
import { GRANT_RECIPIENT_LINE, HACKATHON_WINNER_SHORT } from '@/lib/config/socialCredentials';
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
  const logoUrl = `${DEFAULT_SITE_URL}/APT-Casino-Logo.png`;

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
            flex: 1,
            alignItems: 'center',
            gap: 56,
            marginTop: 20,
            paddingLeft: 26,
          }}
        >
          <img
            src={logoUrl}
            alt="Apt Casino Logo"
            width={190}
            height={190}
            style={{
              display: 'flex',
              borderRadius: 20,
              boxShadow: '0 14px 34px rgba(0,0,0,0.35)',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              gap: 14,
              maxWidth: 780,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 66,
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.04,
                letterSpacing: -1.4,
              }}
            >
              AptCasino.fun
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: 27, color: 'rgba(255,255,255,0.82)', lineHeight: 1.38 }}>
              <div style={{ display: 'flex' }}>Provably Fair Casino Games on Solana x Aptos x Movement.</div>
              <div style={{ display: 'flex' }}>Deposit, Play Roulette, Mines, Plinko &amp; more.</div>
              <div style={{ display: 'flex' }}>Earn via 7 incentivization $APTC model.</div>
            </div>
            {valid ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  padding: '16px 20px',
                  borderRadius: 14,
                  border: '2px solid rgba(236,72,153,0.45)',
                  background: 'rgba(0,0,0,0.38)',
                  maxWidth: 430,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 3,
                    color: 'rgba(244,114,182,0.95)',
                    textTransform: 'uppercase',
                  }}
                >
                  Referral code
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontSize: 40,
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: 5,
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  {code}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 19,
            color: 'rgba(245,198,216,0.9)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex' }}>{GRANT_RECIPIENT_LINE}</div>
            <div style={{ display: 'flex', fontSize: 16, color: 'rgba(245,198,216,0.72)' }}>{HACKATHON_WINNER_SHORT}</div>
          </div>
          <div style={{ display: 'flex', textAlign: 'right', maxWidth: 520 }}>
            Autonomous Provably Transparent Casino with $APTC Rewards
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
