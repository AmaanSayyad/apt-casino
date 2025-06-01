'use client';

import Image from 'next/image';
import { CHAIN_UI } from '@/lib/chains/chainUi';
import { DEFAULT_PLAY_CHAIN, resolveActiveChain } from '@/lib/chains/registry';

export default function PlayChainIcon({ chain, size = 20, className = '' }) {
  const id = resolveActiveChain(chain || DEFAULT_PLAY_CHAIN);
  const src = CHAIN_UI[id]?.logo ?? CHAIN_UI.solana.logo;
  const alt = id === 'aptos' ? 'APT' : 'SOL';

  return (
    <Image
      src={src}
      width={size}
      height={size}
      alt={alt}
      className={`rounded-full object-contain shrink-0 ${className}`}
    />
  );
}
