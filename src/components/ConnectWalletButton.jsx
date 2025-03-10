'use client';

import { useState } from 'react';
import ChainConnectModal from '@/components/wallet/ChainConnectModal';

const VARIANT_CLASS = {
  /** Gradient CTA (site default) */
  default:
    'inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-red-magic to-blue-magic px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-fuchsia-900/25 transition hover:brightness-110',
  /** Solid blue — How it works / prominent CTAs */
  cta: 'inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-500',
  /** Outline — secondary CTA */
  outline:
    'inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white transition hover:border-white/25 hover:bg-white/10',
};

/**
 * Opens ChainConnectModal (Solana + Aptos picker). Use everywhere users tap "Connect wallet".
 */
export default function ConnectWalletButton({
  className = '',
  variant = 'default',
  label = 'Connect Wallet',
  children,
}) {
  const [open, setOpen] = useState(false);
  const base = VARIANT_CLASS[variant] || VARIANT_CLASS.default;

  return (
    <>
      <button type="button" className={`${base} ${className}`.trim()} onClick={() => setOpen(true)}>
        {children ?? label}
      </button>
      <ChainConnectModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
