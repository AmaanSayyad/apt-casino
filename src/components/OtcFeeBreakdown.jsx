'use client';

import {
  APTC_DEX_POOL_FEE,
  DEX_VALUE_LOSS_SOURCES,
  SOLANA_TX_FEE_SOL,
  WALLET_SWAP_FEES,
} from '@/lib/otcFeeModel';

/** Wallets omitted from the references list. */
const REFERENCE_EXCLUDED_WALLET_IDS = new Set(['glow', 'metamask', 'conservative']);

export const OTC_ADVANTAGES = [
  'Skip Uniswap pool fees and wallet swap markup on every DEX buy.',
  'Skip wallet swap markup (e.g. Phantom 0.85% on select pairs).',
  'One SOL transfer instead of many small swaps — lower network fees when you DCA often.',
  'No price impact from splitting size across repeated market buys.',
  'Team delivers APTC after review — not a guaranteed market fill; subject to approval.',
];

function buildReferences() {
  return [
    ...APTC_DEX_POOL_FEE.sources,
    ...DEX_VALUE_LOSS_SOURCES.filter((s) => s.url).map((s) => ({
      label: s.learnMoreLabel || s.label,
      url: s.url,
    })),
    ...WALLET_SWAP_FEES.filter((w) => !REFERENCE_EXCLUDED_WALLET_IDS.has(w.id)).flatMap((w) => w.sources),
  ].filter((s, i, arr) => arr.findIndex((x) => x.url === s.url) === i);
}

/**
 * @param {{ compact?: boolean }} props — `compact` = tighter spacing in embedded layouts
 */
export default function OtcFeeBreakdown({ compact = false }) {
  const references = buildReferences();

  const body = (
    <div className="space-y-5 text-sm text-white/60">
      <section>
        <h3 className="text-white/90 font-display font-semibold mb-2">Why OTC vs DEX?</h3>
        <ul className="space-y-2 list-disc pl-4 marker:text-cyan-500/60">
          {OTC_ADVANTAGES.map((line) => (
            <li key={line} className="leading-relaxed">
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-white/90 font-display font-semibold mb-2">APTC DEX pool fee</h3>
        <p className="leading-relaxed">
          {APTC_DEX_POOL_FEE.venue}: <strong className="text-white/85">{APTC_DEX_POOL_FEE.totalLabel}</strong> per
          swap on APTC/SOL — {APTC_DEX_POOL_FEE.detail}
        </p>
      </section>

      <section>
        <h3 className="text-white/90 font-display font-semibold mb-2">Market loss on DEX (beyond fees)</h3>
        <ul className="space-y-3">
          {DEX_VALUE_LOSS_SOURCES.map((s) => (
            <li key={s.id} className="leading-relaxed">
              <strong className="text-white/75">{s.label}:</strong> {s.detail}
              {s.url ? (
                <>
                  {' '}
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400/90 hover:underline"
                  >
                    {s.learnMoreLabel || 'Learn more'}
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-white/90 font-display font-semibold mb-2">Wallet swap fees (planning rates)</h3>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left border-collapse min-w-[280px]">
            <thead>
              <tr className="text-white/40 border-b border-white/10">
                <th className="py-2 pr-3 font-normal">Wallet</th>
                <th className="py-2 pr-3 font-normal">Swap fee</th>
                <th className="py-2 font-normal hidden sm:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody>
              {WALLET_SWAP_FEES.filter((w) => w.id !== 'conservative').map((w) => (
                <tr key={w.id} className="border-b border-white/5 align-top">
                  <td className="py-2 pr-3 text-white/80">{w.name}</td>
                  <td className="py-2 pr-3 text-cyan-200/90 whitespace-nowrap">{w.swapFeeLabel}</td>
                  <td className="py-2 text-white/45 text-xs hidden sm:table-cell">{w.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-white/40 mt-2">
          Solana network fee ~{SOLANA_TX_FEE_SOL} SOL per signed transaction (planning constant).
        </p>
      </section>

      <section>
        <h3 className="text-white/90 font-display font-semibold mb-2">Sources</h3>
        <ul className="space-y-1.5">
          {references.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400/80 hover:underline break-all"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );

  if (!compact) {
    return body;
  }

  return <div className="pt-1">{body}</div>;
}
