'use client';

import { Loader2, Shield } from 'lucide-react';

export default function FairnessRoundOverlay({ visible, phase, commitHash }) {
  if (!visible) return null;

  const label =
    phase === 'committing'
      ? 'Committing randomness seed…'
      : 'Requesting Solana VRF entropy…';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
      <div className="max-w-md w-full rounded-2xl border border-emerald-500/30 bg-[#0a0612]/95 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-emerald-500/15">
            <Shield className="text-emerald-400 animate-pulse" size={22} />
          </div>
          <div>
            <p className="text-white font-semibold">{label}</p>
            <p className="text-xs text-white/55">Provably fair round in progress</p>
          </div>
          <Loader2 className="ml-auto text-emerald-300 animate-spin" size={20} />
        </div>
        {commitHash ? (
          <div className="rounded-lg bg-black/40 border border-white/10 p-3">
            <p className="text-[10px] uppercase tracking-wider text-white/45 mb-1">Commit hash</p>
            <code className="text-[11px] text-emerald-300/90 break-all font-mono">{commitHash}</code>
          </div>
        ) : null}
      </div>
    </div>
  );
}
