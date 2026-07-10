'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle,
  Shield,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Dice5,
  Hash,
  Clock,
  Wallet,
} from 'lucide-react';
import { SolscanLink } from '@/components/ui/SolscanMark';

function shorten(str, head = 8, tail = 6) {
  if (!str || typeof str !== 'string') return '—';
  if (str.length <= head + tail + 1) return str;
  return `${str.slice(0, head)}…${str.slice(-tail)}`;
}

function formatWhen(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return '—';
  const date = n > 1e12 ? new Date(n) : new Date(n * 1000);
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function CopyField({ label, value, mono = true }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [value]);

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[0.65rem] uppercase tracking-wider text-white/45 font-medium">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className={`text-sm text-white/90 break-all leading-relaxed ${mono ? 'font-mono text-[0.8rem]' : ''}`}>
        {value || '—'}
      </p>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-4">
      <div className="flex items-center gap-2 mb-2 text-white/50">
        <Icon size={16} className={accent || 'text-purple-300'} />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-lg font-semibold ${accent || 'text-white'}`}>{value}</p>
      {sub ? <p className="text-xs text-white/45 mt-1">{sub}</p> : null}
    </div>
  );
}

function FairnessVerifyContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || '';
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [showTechnical, setShowTechnical] = useState(false);

  useEffect(() => {
    if (!ref) {
      setState({ loading: false, data: null, error: 'Missing proof reference' });
      return;
    }
    fetch(`/api/provably-fair/verify?ref=${encodeURIComponent(ref)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error || 'Not found');
        setState({ loading: false, data: json, error: null });
      })
      .catch((e) => setState({ loading: false, data: null, error: e.message }));
  }, [ref]);

  const proof = state.data?.proof;
  const event = state.data?.event;
  const valid = !!state.data?.valid;
  const winningNumber = proof?.outcome?.winningNumber;
  const currency = event?.currency || 'SOL';
  const pnl =
    Number.isFinite(event?.payoutNative) && Number.isFinite(event?.betNative)
      ? event.payoutNative - event.betNative
      : null;

  return (
    <div className="site-page-top site-page-pad-x min-h-[100dvh] bg-[#070005] py-8 text-white md:min-h-screen md:py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
            <Shield className="text-emerald-400" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Provably fair audit
            </h1>
            <p className="text-white/55 text-sm mt-1 max-w-md">
              This round used commit–reveal randomness. The outcome below is derived from the published seed and
              matches the hash committed before the spin.
            </p>
          </div>
        </div>

        {state.loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 rounded-xl bg-white/5" />
            <div className="h-32 rounded-xl bg-white/5" />
            <div className="h-48 rounded-xl bg-white/5" />
          </div>
        ) : state.error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-950/25 p-5 flex gap-3">
            <XCircle className="text-red-400 shrink-0 mt-0.5" size={22} />
            <div>
              <p className="font-semibold text-red-100">Could not load proof</p>
              <p className="text-sm text-white/60 mt-1">{state.error}</p>
              {!ref && (
                <p className="text-xs text-white/40 mt-2">
                  Open this page from a bet receipt link, or add <code className="text-emerald-300/80">?ref=…</code> to
                  the URL.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Status */}
            <div
              className={`rounded-2xl border p-5 ${
                valid
                  ? 'border-emerald-500/35 bg-gradient-to-r from-emerald-950/40 to-emerald-900/10'
                  : 'border-amber-500/35 bg-gradient-to-r from-amber-950/40 to-amber-900/10'
              }`}
            >
              <div className="flex items-center gap-3">
                {valid ? (
                  <CheckCircle className="text-emerald-400 shrink-0" size={28} />
                ) : (
                  <XCircle className="text-amber-400 shrink-0" size={28} />
                )}
                <div>
                  <p className="text-lg font-semibold">{valid ? 'Proof verified' : 'Proof mismatch'}</p>
                  <p className="text-sm text-white/60 mt-0.5">
                    {valid
                      ? 'Commit hash matches the reveal seed for this round.'
                      : 'The stored proof does not match a valid commit–reveal chain.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Round summary */}
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard
                icon={Dice5}
                label="Game"
                value={String(proof?.game || event?.game || '—').replace(/^\w/, (c) => c.toUpperCase())}
                sub={proof?.requestId ? shorten(proof.requestId, 12, 8) : null}
              />
              {winningNumber != null ? (
                <SummaryCard
                  icon={Dice5}
                  label="Outcome"
                  value={
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#14D854] text-black font-bold text-xl">
                      {winningNumber}
                    </span>
                  }
                  sub="Winning number"
                  accent="text-emerald-300"
                />
              ) : (
                <SummaryCard
                  icon={Hash}
                  label="Outcome"
                  value={event?.result ? shorten(String(event.result), 16, 8) : 'Recorded'}
                  sub="See result string"
                />
              )}
              <SummaryCard
                icon={Wallet}
                label="Player"
                value={shorten(event?.wallet || proof?.wallet, 6, 4)}
                sub="Full address below"
              />
              <SummaryCard
                icon={Clock}
                label="Recorded"
                value={formatWhen(event?.createdAt || proof?.blockTime)}
                sub={proof?.slot ? `Slot ~${proof.slot.toLocaleString()}` : null}
              />
            </div>

            {/* Bet economics */}
            {Number.isFinite(event?.betNative) && (
              <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-4">
                <p className="text-xs uppercase tracking-wider text-white/45 mb-3">Round economics</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-white/50">Wagered</p>
                    <p className="font-semibold mt-1">
                      {event.betNative} {currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Returned</p>
                    <p className="font-semibold mt-1">
                      {event.payoutNative} {currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Net</p>
                    <p
                      className={`font-semibold mt-1 ${
                        pnl != null && pnl >= 0 ? 'text-emerald-400' : 'text-red-300'
                      }`}
                    >
                      {pnl != null ? `${pnl >= 0 ? '+' : ''}${pnl} ${currency}` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* How it works — compact */}
            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
              <p className="text-sm font-medium text-white/80 mb-3">Verification chain</p>
              <ol className="space-y-2 text-sm text-white/60">
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-mono shrink-0">1.</span>
                  Before the spin, a <strong className="text-white/80">commit hash</strong> was fixed from a hidden seed.
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-mono shrink-0">2.</span>
                  After play, the <strong className="text-white/80">reveal seed</strong> was published.
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-mono shrink-0">3.</span>
                  Recomputing the hash from the seed must equal the commit — {valid ? 'it does.' : 'it does not.'}
                </li>
              </ol>
            </div>

            {/* Copyable fields */}
            <CopyField label="Proof reference" value={proof?.proofReference || ref} />
            <CopyField label="Commit hash" value={proof?.commitHash} />
            <CopyField label="Reveal seed" value={proof?.revealSeed} />
            <CopyField label="Wallet address" value={event?.wallet || proof?.wallet} />

            {/* Technical JSON toggle */}
            <button
              type="button"
              onClick={() => setShowTechnical((v) => !v)}
              className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <span>Raw proof JSON</span>
              {showTechnical ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showTechnical && (
              <pre className="rounded-xl bg-black/50 border border-white/10 p-4 text-xs overflow-auto text-emerald-100/80 font-mono leading-relaxed max-h-80">
                {JSON.stringify(proof, null, 2)}
              </pre>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {proof?.proofReference && (
                <SolscanLink
                  href={`https://solscan.io/account/${encodeURIComponent(proof.wallet || event?.wallet || '')}`}
                  size={16}
                  className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:border-white/30"
                >
                  View wallet on Solscan
                </SolscanLink>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FairnessVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="site-page-top site-page-pad-x min-h-[100dvh] bg-[#070005] py-8 text-white md:min-h-screen md:py-10">
          <div className="max-w-2xl mx-auto animate-pulse space-y-3">
            <div className="h-10 w-64 bg-white/10 rounded" />
            <div className="h-24 bg-white/5 rounded-xl" />
          </div>
        </div>
      }
    >
      <FairnessVerifyContent />
    </Suspense>
  );
}
