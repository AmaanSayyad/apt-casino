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
          justifyContent: 'space-between',
          background: 'linear-gradient(145deg, #070005 0%, #1a0510 45%, #3d0a1f 100%)',
          padding: 56,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 2,
              color: '#f5c6d8',
              textTransform: 'uppercase',
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 40 }}>
          {heroSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroSrc}
              alt=""
              width={420}
              height={236}
              style={{
                borderRadius: 16,
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.12)',
              }}
            />
          ) : null}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 20 }}>
            <div
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.1,
                maxWidth: 640,
              }}
            >
              Multichain GambleFi
            </div>
            <div
              style={{
                fontSize: 26,
                color: 'rgba(255,255,255,0.82)',
                lineHeight: 1.35,
                maxWidth: 620,
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
            fontSize: 22,
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
