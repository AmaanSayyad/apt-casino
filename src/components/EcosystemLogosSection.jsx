'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ECOSYSTEM_CHAIN_LOGOS, ECOSYSTEM_DEX_LOGOS } from '@/lib/config/ecosystemLogos';

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** One logo per partner — indexed once for SEO, screen readers, and reduced-motion users. */
function PartnerLogoGrid({ items, listLabel }) {
  return (
    <ul
      className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
      aria-label={listLabel}
    >
      {items.map((logo) => (
        <li key={logo.key}>
          <div
            className={`ecosystem-marquee-tile ${logo.comingSoon ? 'ecosystem-marquee-tile--soon' : ''}`}
            title={
              logo.comingSoon
                ? `${logo.alt} — ${logo.key === 'robinhood' ? 'under construction' : 'coming soon'}`
                : logo.alt
            }
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={72}
              height={72}
              className="ecosystem-marquee-img object-contain"
            />
            {logo.comingSoon && (
              <span className="ecosystem-marquee-soon">
                {logo.key === 'robinhood' ? 'Building' : 'Soon'}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Seamless infinite scroll — duplicates tiles only in this decorative layer (aria-hidden, empty alts).
 * Canonical partner names live in PartnerLogoGrid (sr-only + reduced-motion fallback).
 */
function MarqueeRow({ items, durationSeconds, reverse = false }) {
  const trackItems = useMemo(() => [...items, ...items], [items]);

  return (
    <div className="ecosystem-marquee-row relative" aria-hidden="true">
      <div
        className={`ecosystem-marquee-fade ecosystem-marquee-fade--left ${reverse ? 'ecosystem-marquee-fade--reverse' : ''}`}
      />
      <div
        className={`ecosystem-marquee-fade ecosystem-marquee-fade--right ${reverse ? 'ecosystem-marquee-fade--reverse' : ''}`}
      />
      <div
        className={`ecosystem-marquee-track ${reverse ? 'ecosystem-marquee-track--reverse' : ''}`}
        style={{ '--ecosystem-marquee-duration': `${durationSeconds}s` }}
      >
        {trackItems.map((logo, idx) => (
          <div
            key={`${logo.key}-motion-${idx}`}
            className={`ecosystem-marquee-tile ${logo.comingSoon ? 'ecosystem-marquee-tile--soon' : ''}`}
          >
            <Image
              src={logo.src}
              alt=""
              width={72}
              height={72}
              className="ecosystem-marquee-img object-contain"
              aria-hidden
            />
            {logo.comingSoon && (
              <span className="ecosystem-marquee-soon" aria-hidden>
                {logo.key === 'robinhood' ? 'Building' : 'Soon'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LogoSection({
  label,
  listLabel,
  items,
  durationSeconds,
  reverse = false,
  motionEnabled,
}) {
  return (
    <div>
      <p className="text-center text-[10px] uppercase tracking-[0.2em] text-white/30 mb-3">{label}</p>

      {/* One indexed list in HTML; visible until marquee mounts, then sr-only for a11y/SEO. */}
      <div className={motionEnabled ? 'sr-only' : 'px-4 motion-reduce:px-4'}>
        <PartnerLogoGrid items={items} listLabel={listLabel} />
      </div>

      {motionEnabled ? (
        <div className="motion-reduce:hidden">
          <MarqueeRow items={items} durationSeconds={durationSeconds} reverse={reverse} />
        </div>
      ) : null}

      <div className="hidden motion-reduce:block px-4">
        <PartnerLogoGrid items={items} listLabel={listLabel} />
      </div>
    </div>
  );
}

export default function EcosystemLogosSection() {
  const [chainLogos, setChainLogos] = useState(ECOSYSTEM_CHAIN_LOGOS);
  const [motionEnabled, setMotionEnabled] = useState(false);

  useEffect(() => {
    setChainLogos(shuffle(ECOSYSTEM_CHAIN_LOGOS));
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) setMotionEnabled(true);
  }, []);

  return (
    <section className="ecosystem-logos-section relative overflow-hidden border-y border-white/[0.06]">
      <div className="ecosystem-grid-bg pointer-events-none" aria-hidden />

      <div className="ecosystem-glow ecosystem-glow--left pointer-events-none" aria-hidden />
      <div className="ecosystem-glow ecosystem-glow--right pointer-events-none" aria-hidden />

      <div className="relative z-10 py-20 md:py-24">
        <div className="text-center px-4 mb-12 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-red-magic to-blue-magic shadow-[0_0_12px_rgba(236,72,153,0.6)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">
              Supported networks
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold font-display text-white tracking-tight leading-tight">
            Chains +{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-magic via-fuchsia-400 to-blue-magic">
              DEX ecosystem
            </span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-white/50 leading-relaxed">
            APT-Casino connects multichain play — Solana and Aptos live today — with the DEX and analytics
            stack your treasury and APTC liquidity rely on.
          </p>
        </div>

        <div className="space-y-5">
          <LogoSection
            label="Blockchains"
            listLabel="Supported blockchains"
            items={chainLogos}
            durationSeconds={32}
            motionEnabled={motionEnabled}
          />
          <LogoSection
            label="DEX & tooling"
            listLabel="DEX and analytics partners"
            items={ECOSYSTEM_DEX_LOGOS}
            durationSeconds={22}
            reverse
            motionEnabled={motionEnabled}
          />
        </div>

        <p className="text-center text-[11px] text-white/30 mt-10 px-4 max-w-xl mx-auto">
          Logos represent integrations and planned network support. Availability follows wallet and treasury rollout.
        </p>
      </div>
    </section>
  );
}
