'use client';

import { IPO_LOGOS, IPO_STACK } from '@/lib/config/ipo';

function logoSize(size) {
  if (size === 'sm') return 22;
  if (size === 'lg') return 40;
  return 30;
}

function LogoTile({ logoId, size = 'md', showLabel = true }) {
  const logo = IPO_LOGOS[logoId];
  if (!logo) return null;

  const px = logoSize(size);

  return (
    <div className="flex items-center gap-2 min-w-0" title={`${logo.label} — ${logo.role}`}>
      <div className="shrink-0 rounded-lg border border-white/10 bg-black/40 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.src}
          alt={logo.alt}
          width={px}
          height={px}
          className="object-contain"
          style={{ width: px, height: px }}
        />
      </div>
      {showLabel ? (
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50 truncate">
          {logo.label}
        </span>
      ) : null}
    </div>
  );
}

export default function IpoStackLogos({ variant = 'full', className = '' }) {
  if (variant === 'inline') {
    const inlineOrder = ['solana', 'pyth', 'metaplex', 'metadao', 'pinksale', 'raydium'];
    return (
      <div
        className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 ${className}`}
        aria-label="IPO launch partners"
      >
        {inlineOrder.map((id, i) => (
          <span key={id} className="inline-flex items-center gap-2 sm:gap-3">
            {i > 0 ? (
              <span className="text-white/20 text-xs font-light select-none" aria-hidden>
                →
              </span>
            ) : null}
            <LogoTile logoId={id} size="sm" showLabel={false} />
          </span>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
        {IPO_STACK.map((block) => (
          <div
            key={block.id}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1">
              {block.phase}
            </p>
            <p className="text-[10px] text-white/35 mb-2 leading-snug">{block.blurb}</p>
            <div className="flex flex-wrap items-center gap-2">
              {block.logos.map((id) => (
                <LogoTile key={id} logoId={id} size="sm" showLabel={false} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className} aria-label="IPO launch stack">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {IPO_STACK.map((block, blockIdx) => (
          <div
            key={block.id}
            className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent px-4 py-4 md:px-5 md:py-5"
          >
            {blockIdx < IPO_STACK.length - 1 ? (
              <span
                className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-white/25 text-lg select-none"
                aria-hidden
              >
                →
              </span>
            ) : null}
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-200/70 mb-1">
              {block.phase}
            </p>
            <p className="text-[11px] text-white/40 mb-3 leading-snug">{block.blurb}</p>
            <div className="flex flex-wrap items-center gap-3">
              {block.logos.map((id) => (
                <LogoTile key={id} logoId={id} size="md" showLabel />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IpoLogoIcon({ logoId, size = 20, className = '' }) {
  const logo = IPO_LOGOS[logoId];
  if (!logo) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.src}
      alt=""
      width={size}
      height={size}
      className={`object-contain shrink-0 ${className}`}
      aria-hidden
    />
  );
}
