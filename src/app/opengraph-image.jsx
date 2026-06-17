import { ImageResponse } from 'next/og';
import { DEFAULT_SITE_URL } from '@/lib/siteMetadata';

export const runtime = 'nodejs';
export const alt = 'AptCasino.fun — 100% Provably Fair Gaming';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logoUrl = `${DEFAULT_SITE_URL}/APT-Casino-Logo.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#030005',
          overflow: 'hidden',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Deep ambient blobs */}
        <div style={{
          position: 'absolute', top: -180, left: -180,
          width: 560, height: 560, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.28) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: -200, right: -120,
          width: 620, height: 620, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.32) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', top: '30%', left: '38%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Scanline texture overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
          display: 'flex',
        }} />

        {/* Top neon bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, #ec4899 0%, #a855f7 35%, #3b82f6 65%, #ec4899 100%)',
          display: 'flex',
          boxShadow: '0 0 24px rgba(236,72,153,0.9)',
        }} />

        {/* Bottom neon bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #3b82f6 0%, #a855f7 50%, #ec4899 100%)',
          display: 'flex',
          boxShadow: '0 0 20px rgba(139,92,246,0.8)',
        }} />

        {/* Diagonal accent lines */}
        <div style={{
          position: 'absolute', top: 0, right: 260, width: 1, height: '100%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(236,72,153,0.2) 30%, rgba(139,92,246,0.25) 70%, transparent 100%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', top: 0, right: 240, width: 1, height: '100%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.12) 30%, rgba(59,130,246,0.15) 70%, transparent 100%)',
          display: 'flex',
        }} />

        {/* === MAIN CONTENT === */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          width: '100%', height: '100%',
          padding: '42px 56px',
          position: 'relative', zIndex: 10,
        }}>

          {/* TOP ROW — logo + title + badge stack */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 36, flex: 1 }}>

            {/* Logo with glow ring */}
            <div style={{
              display: 'flex', position: 'relative',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', inset: -6, borderRadius: 28,
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)',
                display: 'flex',
                boxShadow: '0 0 32px rgba(236,72,153,0.6), 0 0 64px rgba(139,92,246,0.4)',
              }} />
              <img
                src={logoUrl}
                alt=""
                width={168}
                height={168}
                style={{
                  borderRadius: 22,
                  display: 'flex',
                  position: 'relative',
                }}
              />
            </div>

            {/* Text stack */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 0, paddingTop: 4 }}>

              {/* Pre-title chip */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
              }}>
                <div style={{
                  display: 'flex',
                  background: 'linear-gradient(90deg, rgba(236,72,153,0.25), rgba(139,92,246,0.25))',
                  border: '1px solid rgba(236,72,153,0.5)',
                  borderRadius: 100,
                  padding: '5px 14px',
                  gap: 6, alignItems: 'center',
                  boxShadow: '0 0 14px rgba(236,72,153,0.25)',
                }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#f97316',
                    display: 'flex',
                    boxShadow: '0 0 8px #f97316',
                  }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#fbbf24', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex' }}>
                    $APTC · Launching Soon on Solana
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 100,
                  padding: '5px 14px',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'flex' }}>
                    15× Hackathon Winner
                  </span>
                </div>
              </div>

              {/* Main heading */}
              <div style={{
                display: 'flex', flexDirection: 'column', lineHeight: 1.0,
              }}>
                <span style={{
                  fontSize: 78, fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: -2.5,
                  display: 'flex',
                  textShadow: '0 0 40px rgba(236,72,153,0.4)',
                }}>
                  AptCasino
                </span>
                <span style={{
                  fontSize: 78, fontWeight: 900,
                  letterSpacing: -2.5,
                  display: 'flex',
                  background: 'linear-gradient(90deg, #f472b6 0%, #c084fc 45%, #818cf8 80%, #60a5fa 100%)',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  marginTop: -6,
                }}>
                  .fun
                </span>
              </div>

              {/* Tagline */}
              <div style={{
                display: 'flex', marginTop: 18,
                fontSize: 28, fontWeight: 600,
                color: 'rgba(255,255,255,0.78)',
                letterSpacing: -0.3,
                lineHeight: 1.35,
              }}>
                100% Provably Fair · On-Chain Randomness
              </div>
            </div>
          </div>

          {/* BOTTOM ROW — feature pills + chain badges */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginTop: 28,
          }}>

            {/* Feature pills */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: '🎰 Roulette', color: '#ec4899' },
                { label: '💣 Mines',    color: '#f97316' },
                { label: '🪂 Plinko',   color: '#a855f7' },
                { label: '🎡 Wheel',    color: '#3b82f6' },
                { label: '⚡ Live Rewards', color: '#10b981' },
              ].map((p) => (
                <div key={p.label} style={{
                  display: 'flex',
                  background: `linear-gradient(135deg, ${p.color}22, ${p.color}11)`,
                  border: `1px solid ${p.color}55`,
                  borderRadius: 10,
                  padding: '8px 16px',
                  boxShadow: `0 0 12px ${p.color}30`,
                }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', display: 'flex' }}>
                    {p.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Chain stack */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7 }}>
              <div style={{
                display: 'flex', gap: 8, alignItems: 'center',
              }}>
                {['Solana', 'Aptos', 'Movement'].map((chain) => (
                  <div key={chain} style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 8,
                    padding: '6px 14px',
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'flex' }}>
                      {chain}
                    </span>
                  </div>
                ))}
              </div>
              <span style={{
                fontSize: 14, color: 'rgba(255,255,255,0.35)', fontWeight: 500, display: 'flex',
              }}>
                Movement Labs · Zo House Foundation · Solana grantee
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
