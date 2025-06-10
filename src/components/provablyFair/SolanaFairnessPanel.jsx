'use client';

import { useState } from 'react';
import { CheckCircle, Copy, ExternalLink, Shield } from 'lucide-react';
import { fairnessVerifyPath } from '@/lib/provablyFair/solanaFairness';

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] uppercase tracking-wide text-white/50">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <code className="text-xs text-emerald-300/90 font-mono truncate flex-1">{value}</code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/70"
          title="Copy"
        >
          {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

export default function SolanaFairnessPanel({ proof, compact = false, className = '' }) {
  if (!proof) return null;

  const verifyHref = fairnessVerifyPath(proof.proofReference);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-xs text-emerald-300/90 ${className}`}>
        <Shield size={14} />
        <span>VRF record verified</span>
        <a href={verifyHref} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-200">
          View proof
        </a>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-4 space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Shield size={18} className="text-emerald-400" />
        <div>
          <p className="text-sm font-semibold text-white">Solana randomness record</p>
          <p className="text-xs text-white/55">Commit → reveal audit trail for this round</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CopyField label="Request ID" value={proof.requestId} />
        <CopyField label="Slot" value={`#${proof.slot}`} />
        <CopyField label="Commit hash" value={proof.commitHash} />
        <CopyField label="Reveal seed" value={proof.revealSeed} />
        <CopyField label="Proof reference" value={proof.proofReference} />
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <a
          href={verifyHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-200 text-xs font-medium hover:bg-emerald-600/30"
        >
          <ExternalLink size={14} />
          Verify fairness record
        </a>
      </div>
    </div>
  );
}
