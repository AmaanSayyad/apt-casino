import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DEFAULT_DESCRIPTION, SITE_NAME } from '@/lib/siteMetadata';

export const runtime = 'nodejs';

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  let heroSrc = null;
  try {
    const heroPath = join(process.cwd(), 'public', 'images', 'HeroImage.png');
    const heroBytes = await readFile(heroPath);
    heroSrc = `data:image/png;base64,${heroBytes.toString('base64')}`;
  } catch {
    heroSrc = null;
  }

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
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6)',
          }}
        />

        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 3,
            color: '#f5c6d8',
            textTransform: 'uppercase',
          }}
        >
          {SITE_NAME}
        </div>

        <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 32, marginTop: 20 }}>
          {heroSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroSrc}
              alt=""
              width={360}
              height={202}
              style={{
                borderRadius: 18,
                objectFit: 'cover',
                border: '2px solid rgba(236,72,153,0.35)',
              }}
            />
          ) : null}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 16 }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.08,
              }}
            >
              100% on-chain randomness
            </div>
            <div
              style={{
                fontSize: 22,
                color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.4,
              }}
            >
              {DEFAULT_DESCRIPTION}
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
          <span>Solana · Aptos</span>
          <span>Provably fair · APTC rewards</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
