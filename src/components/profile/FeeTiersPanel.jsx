'use client';

import { motion } from 'framer-motion';
import { FaPercent } from 'react-icons/fa';
import { FEE_TIERS } from '@/lib/feeTiersClient';

export default function FeeTiersPanel({ feeTiers }) {
  const tiers = feeTiers?.tiers?.length ? feeTiers.tiers : FEE_TIERS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 via-[#1A0015]/80 to-purple-950/20 p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30">
          <FaPercent className="text-cyan-300" size={18} />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-white">Deposit tier fees</h3>
          <p className="text-xs text-white/55 mt-0.5">
            Lower deposit fees when you fund at higher USD tiers. Withdrawals stay at 10%.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[320px] text-sm">
          <thead className="bg-white/[0.03] text-left text-[10px] uppercase tracking-widest text-white/40">
            <tr>
              <th className="px-3 py-2.5">Tier</th>
              <th className="px-3 py-2.5">Deposit (USD)</th>
              <th className="px-3 py-2.5 text-right">Deposit fee</th>
              <th className="px-3 py-2.5 text-right">Withdraw fee</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t) => (
              <tr key={t.id} className="border-t border-white/5 text-white/80">
                <td className="px-3 py-2.5 font-medium text-white">{t.label}</td>
                <td className="px-3 py-2.5 text-white/60 text-xs">
                  {t.maxUsd != null
                    ? `$${t.minUsd} – $${t.maxUsd}`
                    : t.minUsd >= 500
                      ? '$500+'
                      : `Under $${(t.maxUsd ?? 49.99) + 0.01}`}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-cyan-200/90">{t.depositPct}%</td>
                <td className="px-3 py-2.5 text-right font-mono text-white/70">{t.withdrawPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-white/45 leading-relaxed">
        {feeTiers?.note ||
          'Your deposit fee tier is based on this deposit’s USD value at the time you send funds. Withdrawals always use a 10% platform fee.'}
      </p>
    </motion.div>
  );
}
