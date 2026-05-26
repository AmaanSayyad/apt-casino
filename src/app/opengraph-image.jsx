import { ImageResponse } from 'next/og';
import { OgBrandMark } from '@/lib/og/brandMark';
import { DEFAULT_DESCRIPTION, DEFAULT_SITE_URL, SITE_NAME } from '@/lib/siteMetadata';

export const runtime = 'nodejs';
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const host = DEFAULT_SITE_URL.replace(/^https?:\/\//, '');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #070005 0%, #1a0510 42%, #3d0a28 100%)',
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
            gap: 40,
            marginTop: 20,
          }}
        >
          <OgBrandMark size={140} />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              gap: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 4,
                color: '#f5c6d8',
                textTransform: 'uppercase',
              }}
            >
              {SITE_NAME}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 52,
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.06,
                letterSpacing: -1,
              }}
            >
              100% on-chain randomness
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                color: 'rgba(255,255,255,0.78)',
                lineHeight: 1.4,
                maxWidth: 720,
              }}
            >
              {DEFAULT_DESCRIPTION}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 20,
                color: 'rgba(244,114,182,0.9)',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              {host}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 20,
            color: 'rgba(245,198,216,0.9)',
          }}
        >
          <div style={{ display: 'flex' }}>Solana · Aptos</div>
          <div style={{ display: 'flex' }}>Provably fair · APTC rewards</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
