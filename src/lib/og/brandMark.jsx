/** Spade-on-gradient mark for `next/og` — no raster logo (avoids white JPEG padding). */
export function OgBrandMark({ size = 96 }) {
  const radius = Math.round(size * 0.22);
  return (
    <div
      style={{
        display: 'flex',
        width: size,
        height: size,
        borderRadius: radius,
        background: 'linear-gradient(180deg, #ec4899 0%, #9d174d 48%, #1a0510 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(236, 72, 153, 0.45)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: Math.round(size * 0.52),
          fontWeight: 700,
          color: '#ffffff',
          lineHeight: 1,
          marginTop: -4,
        }}
      >
        ♠
      </div>
    </div>
  );
}
