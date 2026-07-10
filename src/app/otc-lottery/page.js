'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import ChainConnectModal from '@/components/wallet/ChainConnectModal';
import {
  buildSolTransferTransaction,
  waitForSolanaSignatureConfirmed,
  formatSolanaError,
} from '@/lib/solana/client';
import {
  FaClock,
  FaCopy,
  FaCheck,
  FaExternalLinkAlt,
  FaTicketAlt,
  FaWallet,
  FaBolt,
  FaArrowRight,
  FaChartLine,
  FaBalanceScale,
  FaCoins,
  FaShieldAlt,
  FaHandshake,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { SolscanLink } from '@/components/ui/SolscanMark';

const OtcSavingsCalculator = dynamic(() => import('@/components/OtcSavingsCalculator'), {
  ssr: false,
  loading: () => <FeeSectionSkeleton />,
});

const OtcFeeBreakdown = dynamic(() => import('@/components/OtcFeeBreakdown'), {
  ssr: false,
  loading: () => <FeeSectionSkeleton />,
});

function fmtNum(n, max = 6) {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: max });
}

function fmtUsd(n) {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

function shortAddr(a) {
  if (!a) return '—';
  const s = String(a);
  return s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}

function useCountdown(unlockAt) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!unlockAt) return undefined;
    const tickMs = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 5000 : 1000;
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [unlockAt]);
  return useMemo(() => {
    if (!unlockAt) return { done: false, label: '—' };
    const end = new Date(unlockAt).getTime();
    const diff = end - now;
    if (diff <= 0) return { done: true, label: 'Processing payout' };
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { done: false, label: `${d}d ${h}h ${m}m ${s}s` };
  }, [unlockAt, now]);
}

const STATUS_STYLES = {
  pending_review: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
  approved: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
  rejected: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
  fulfilled: 'bg-blue-500/20 text-blue-200 border-blue-500/40',
};

const QUICK_AMOUNTS = [2, 5, 10, 100, 500];

const BENEFITS = [
  {
    icon: FaCoins,
    title: 'Team OTC pricing',
    body: 'We source APTC on-market or from treasury — you skip thin-book slippage on size.',
    tint: 'amber',
  },
  {
    icon: FaShieldAlt,
    title: 'Reviewed & tracked',
    body: 'Every entry is verified on-chain. Status and settlement window show in your entries below.',
    tint: 'emerald',
  },
  {
    icon: FaChartLine,
    title: 'Skip DEX drag',
    body: 'Avoid DEX trade fees, wallet swap markup, and price impact on repeated buys.',
    tint: 'cyan',
  },
  {
    icon: FaHandshake,
    title: 'Sized for power users',
    body: `${QUICK_AMOUNTS[0]}–${QUICK_AMOUNTS[QUICK_AMOUNTS.length - 1]} SOL per entry — built for allocations that move the book.`,
    tint: 'purple',
  },
];

export default function OtcLotteryPage() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [connectOpen, setConnectOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const solAddress = publicKey?.toBase58() || null;

  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [solAmount, setSolAmount] = useState('2');
  const [estimate, setEstimate] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [registeredEntry, setRegisteredEntry] = useState(null);
  const [myEntries, setMyEntries] = useState([]);
  const [copiedTreasury, setCopiedTreasury] = useState(false);
  const [detectStatus, setDetectStatus] = useState('');

  const loadConfig = useCallback(async (sol) => {
    setLoadingConfig(true);
    try {
      const q = sol && Number(sol) > 0 ? `?sol=${encodeURIComponent(sol)}` : '';
      const r = await fetch(`/api/otc-lottery/config${q}`);
      const j = await r.json();
      setConfig(j);
      if (j.estimate) setEstimate(j.estimate);
    } catch {
      setConfig(null);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    const t = setTimeout(() => {
      const n = parseFloat(solAmount);
      if (Number.isFinite(n) && n > 0) void loadConfig(n);
    }, 400);
    return () => clearTimeout(t);
  }, [solAmount, loadConfig]);

  const loadMyEntries = useCallback(async (wallet) => {
    const w = (wallet || solAddress || '').trim();
    if (!w) return;
    try {
      const r = await fetch(`/api/otc-lottery/entries?wallet=${encodeURIComponent(w)}`);
      const j = await r.json();
      if (r.ok) setMyEntries(j.entries || []);
    } catch {
      setMyEntries([]);
    }
  }, [solAddress]);

  useEffect(() => {
    if (solAddress) void loadMyEntries(solAddress);
  }, [solAddress, loadMyEntries, registeredEntry]);

  const registerEntry = async (payload) => {
    const res = await fetch('/api/otc-lottery/enter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        solSenderWallet: payload.sender,
        solTxSignature: payload.signature,
        solAmount: payload.solAmount,
        solSentAt: new Date().toISOString(),
        aptcReceiveWallet: payload.sender,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to register entry');
    return json.entry;
  };

  const applyRegisteredEntry = useCallback((entry, message) => {
    setRegisteredEntry(entry);
    setActionError('');
    setDetectStatus('');
    toast.success(
      message ||
        `Entry recorded — ${fmtNum(entry.solAmount)} SOL received. ≈ ${fmtNum(entry.estimatedAptc)} APTC pending review.`,
      { autoClose: 8000 },
    );
  }, []);

  const detectDepositWithRetries = async (
    wallet,
    { maxAttempts = 8, delayMs = 3000, signature } = {},
  ) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      setDetectStatus(
        attempt === 1
          ? 'Confirming your SOL transfer on-chain…'
          : `Still confirming… (${attempt}/${maxAttempts})`,
      );
      const res = await fetch('/api/otc-lottery/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solSenderWallet: wallet,
          aptcReceiveWallet: wallet,
          ...(signature ? { solTxSignature: signature } : {}),
        }),
      });
      const json = await res.json();
      if (res.ok && json.entry) {
        return json.entry;
      }
      if (res.status !== 404 && res.status !== 422) {
        throw new Error(json.error || 'Could not detect deposit');
      }
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    throw new Error(
      'No SOL transfer found yet. Wait 15–30 seconds after sending, then tap “Detect my deposit” again.',
    );
  };

  const handleSendSol = async () => {
    setActionError('');
    setDetectStatus('');
    setRegisteredEntry(null);
    if (!connected || !publicKey || !sendTransaction) {
      setConnectOpen(true);
      return;
    }
    if (!config?.treasuryWallet) {
      setActionError('Treasury address is not configured.');
      return;
    }
    setActionLoading(true);
    setSending(true);
    try {
      const wallet = publicKey.toBase58();
      const amount = parseFloat(solAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Choose a valid SOL amount');
      }
      const tx = await buildSolTransferTransaction(amount, wallet, config.treasuryWallet);
      const signature = await sendTransaction(tx, connection);
      await waitForSolanaSignatureConfirmed(connection, signature);
      let entry;
      try {
        entry = await registerEntry({
          sender: wallet,
          signature,
          solAmount: amount,
        });
      } catch (registerErr) {
        try {
          entry = await detectDepositWithRetries(wallet, {
            maxAttempts: 6,
            delayMs: 2500,
            signature,
          });
        } catch {
          throw registerErr;
        }
      }
      applyRegisteredEntry(entry, `SOL sent successfully. Your lottery entry is registered.`);
      await loadMyEntries(wallet);
    } catch (e) {
      const msg = formatSolanaError(e);
      if (/user rejected|cancelled/i.test(msg)) {
        setActionError('Transaction cancelled in your wallet.');
      } else {
        setActionError(msg);
      }
    } finally {
      setActionLoading(false);
      setSending(false);
      setDetectStatus('');
    }
  };

  const handleDetectDeposit = async () => {
    setActionError('');
    setDetectStatus('');
    setRegisteredEntry(null);
    if (!connected || !publicKey) {
      setConnectOpen(true);
      return;
    }
    setActionLoading(true);
    try {
      const wallet = publicKey.toBase58();
      const entry = await detectDepositWithRetries(wallet);
      applyRegisteredEntry(entry, 'Deposit detected — your entry is registered.');
      await loadMyEntries(wallet);
    } catch (e) {
      setActionError(e.message || 'Detection failed');
    } finally {
      setActionLoading(false);
      setDetectStatus('');
    }
  };

  const copyTreasury = async () => {
    if (!config?.treasuryWallet) return;
    try {
      await navigator.clipboard.writeText(config.treasuryWallet);
      setCopiedTreasury(true);
      setTimeout(() => setCopiedTreasury(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const enabled = config?.enabled;
  const treasury = config?.treasuryWallet;
  const displayError = actionError;
  const step = registeredEntry ? 4 : solAddress ? (parseFloat(solAmount) > 0 ? 3 : 2) : 1;

  return (
    <div className="site-game-page bg-[#070005] text-white">
      {/* Mobile: flat gradients only — large fixed blurs cause iOS black-screen / jank */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-[#14000f] via-[#070005] to-[#070005] md:hidden" />
        <div className="hidden md:block absolute -top-32 -left-32 w-96 h-96 rounded-full bg-red-magic/10 blur-[120px]" />
        <div className="hidden md:block absolute top-1/4 -right-24 w-80 h-80 rounded-full bg-blue-magic/10 blur-[100px]" />
        <div className="hidden md:block absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-purple-600/8 blur-[90px]" />
      </div>

      <div className="site-page-top site-page-pad-x relative z-10 mx-auto max-w-[1600px] pb-20">
        {/* Hero */}
        <header className="relative mb-12 md:mb-16">
          <div className="p-[1px] rounded-2xl bg-gradient-to-r from-red-magic via-purple-500/80 to-blue-magic">
            <div className="rounded-2xl bg-[#0c000a]/95 md:backdrop-blur-sm px-5 py-8 sm:px-6 sm:py-10 md:px-12 md:py-14 relative overflow-hidden">
              <div className="hidden md:block absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-2xl" />
              <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-400/30 text-xs font-display font-semibold text-amber-200 mb-4">
                    <FaBolt className="text-amber-400" /> OTC Deal · SOL → APTC
                  </span>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
                    <span className="bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent">
                      OTC Lottery
                    </span>
                  </h1>
                  <p className="mt-4 text-base md:text-lg text-white/65 max-w-xl leading-relaxed">
                    Send SOL, get reviewed, receive APTC straight from the APT Casino team — better than fighting DEX
                    slippage on size.
                  </p>
                </div>

                {/* Live prices strip */}
                <div className="flex flex-wrap gap-3 lg:justify-end shrink-0">
                  <PricePill label="SOL" value={fmtUsd(config?.prices?.solUsd)} loading={loadingConfig} />
                  <PricePill label="APTC" value={fmtUsd(config?.prices?.aptcUsd)} loading={loadingConfig} accent />
                </div>
              </div>
            </div>
          </div>
        </header>

        {!enabled && (
          <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-900/20 px-5 py-4 text-sm text-amber-100">
            OTC lottery entries are paused. Check back soon.
          </div>
        )}

        {/* Main grid: calculator left, action right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* Left column */}
          <div className="lg:col-span-7 space-y-8">
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                const iconClass =
                  b.tint === 'emerald'
                    ? 'text-emerald-400'
                    : b.tint === 'cyan'
                      ? 'text-cyan-400'
                      : b.tint === 'purple'
                        ? 'text-purple-300'
                        : 'text-amber-400';
                return (
                  <BenefitCard
                    key={b.title}
                    icon={<Icon className={`text-2xl ${iconClass}`} />}
                    title={b.title}
                    body={b.body}
                    tint={b.tint}
                  />
                );
              })}
            </div>

            {/* Calculator */}
            <SectionShell
              icon={<FaChartLine className="text-cyan-400" />}
              title="Conversion calculator"
              subtitle="Estimate APTC after fees"
            >
              <div className="flex flex-wrap gap-2 mb-4">
                {QUICK_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setSolAmount(String(a))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      String(solAmount) === String(a)
                        ? 'bg-cyan-500/25 border border-cyan-400/50 text-cyan-100'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:border-white/25'
                    }`}
                  >
                    {a} SOL
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Custom amount</span>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 focus-within:border-cyan-400/40">
                  <input
                    type="number"
                    min={config?.minSol}
                    max={config?.maxSol}
                    step="any"
                    value={solAmount}
                    onChange={(e) => setSolAmount(e.target.value)}
                    className="flex-1 bg-transparent text-2xl font-display font-bold text-white outline-none w-full min-w-0"
                  />
                  <span className="text-white/40 font-display text-sm shrink-0">SOL</span>
                </div>
              </label>

              {estimate ? (
                <div className="mt-6 space-y-3">
                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <div className="grid grid-cols-2 gap-3">
                    <CalcTile label="You send" value={`${fmtNum(estimate.solAmount)} SOL`} sub={fmtUsd(estimate.solUsd)} />
                    <CalcTile
                      label="Est. receive"
                      value={`${fmtNum(estimate.estimatedAptc)}`}
                      sub="APTC"
                      highlight
                    />
                  </div>
                  {estimate.breakdown ? (
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                        DEX-style fee stack (what OTC avoids)
                      </p>
                      <p className="text-white/55">
                        Swap platform ~{(estimate.breakdown.swapPlatformFeeBps / 100).toFixed(2)}% →{' '}
                        <span className="text-white/80">{fmtUsd(estimate.breakdown.swapFeeUsd)}</span>
                      </p>
                      <p className="text-white/55">
                        DEX trade fee ~{(estimate.breakdown.tokenTradeTaxBps / 100).toFixed(2)}% →{' '}
                        <span className="text-white/80">{fmtUsd(estimate.breakdown.tokenTaxUsd)}</span>
                      </p>
                      <p className="text-emerald-300/90 text-xs pt-1">
                        OTC path: SOL to treasury; APTC delivered if approved — no swap or pool fees on your entry.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 text-sm text-white/40">Enter an amount to see your estimated APTC.</p>
              )}
            </SectionShell>
          </div>

          {/* Right column — sticky enter card */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28 max-lg:static">
              <div className="p-[1px] rounded-2xl bg-gradient-to-b from-purple-500/60 via-red-magic/40 to-blue-magic/50">
                <div className="rounded-2xl bg-[#120010]/95 md:backdrop-blur-md p-5 sm:p-6 md:p-7 shadow-xl md:shadow-2xl shadow-purple-900/20">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                      <FaTicketAlt className="text-purple-300" />
                    </div>
                    <div>
                      <h2 className="text-lg font-display font-bold">Enter lottery</h2>
                      <p className="text-xs text-white/45">3 steps · auto-captured</p>
                    </div>
                  </div>

                  {/* Step indicator */}
                  <div className="flex items-center gap-1 mb-6">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex-1 flex items-center gap-1">
                        <div
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            step >= n ? 'bg-gradient-to-r from-red-magic to-blue-magic' : 'bg-white/10'
                          }`}
                        />
                        {n < 3 && <FaArrowRight className="text-[8px] text-white/20 shrink-0" />}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-white/40 mb-6 -mt-4">
                    <span className={step >= 1 ? 'text-purple-300' : ''}>Connect</span>
                    <span className={step >= 2 ? 'text-purple-300' : ''}>Amount</span>
                    <span className={step >= 3 ? 'text-purple-300' : ''}>Send</span>
                    <span className={step >= 4 ? 'text-emerald-300' : ''}>Done</span>
                  </div>

                  {/* Wallet */}
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4 mb-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-white/40">Solana wallet</p>
                        <p className="mt-1 font-mono text-sm text-cyan-200 truncate">
                          {solAddress || 'Not connected'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => (solAddress ? disconnect() : setConnectOpen(true))}
                        className="shrink-0 p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                        title={solAddress ? 'Disconnect' : 'Connect'}
                      >
                        <FaWallet className="text-purple-200" />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/30 p-4 mb-4">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Lottery Escrow</p>
                    <div className="flex gap-2">
                      {treasury && !/your_solana|<\s*your/i.test(treasury) ? (
                        <code className="text-[11px] text-white/70 break-all flex-1 leading-relaxed">
                          {treasury}
                        </code>
                      ) : (
                        <p className="text-[11px] text-amber-200/80 flex-1 leading-relaxed">
                          Set{' '}
                          <span className="font-mono text-amber-100/90">NEXT_PUBLIC_OTC_LOTTERY_SOL_WALLET</span>{' '}
                          in .env
                        </p>
                      )}
                      {treasury && !/your_solana|<\s*your/i.test(treasury) ? (
                        <button
                          type="button"
                          onClick={copyTreasury}
                          className="shrink-0 p-2 rounded-lg border border-white/15 hover:bg-white/5"
                        >
                          {copiedTreasury ? (
                            <FaCheck className="text-emerald-400 text-sm" />
                          ) : (
                            <FaCopy className="text-white/50 text-sm" />
                          )}
                        </button>
                      ) : null}
                    </div>
                    <p className="text-[10px] text-white/35 mt-2">
                      Entry size: {config?.minSol ?? 2}–{config?.maxSol ?? 500} SOL per deposit
                    </p>
                  </div>

                  {registeredEntry && (
                    <div
                      className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4"
                      role="status"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/30">
                          <FaCheck className="text-emerald-300" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-display font-bold text-emerald-100">Entry submitted</p>
                          <p className="mt-1 text-sm text-emerald-200/85 leading-relaxed">
                            We received{' '}
                            <span className="font-semibold text-white">
                              {fmtNum(registeredEntry.solAmount)} SOL
                            </span>
                            . Estimated payout ≈{' '}
                            <span className="font-semibold text-emerald-200">
                              {fmtNum(registeredEntry.estimatedAptc)} APTC
                            </span>{' '}
                            after admin review.
                          </p>
                          {registeredEntry.solTxSignature ? (
                            <SolscanLink
                              href={`https://solscan.io/tx/${registeredEntry.solTxSignature}`}
                              size={13}
                              className="mt-2 text-xs font-medium text-cyan-300 hover:underline"
                            >
                              View transaction on Solscan
                            </SolscanLink>
                          ) : null}
                          <p className="mt-2 text-[11px] text-white/45">
                            Scroll to <strong className="text-white/60">Your entries</strong> below for status and
                            settlement timer.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {detectStatus && !displayError && (
                    <div className="mb-4 text-sm text-cyan-100/90 bg-cyan-500/10 border border-cyan-500/25 rounded-xl px-4 py-3">
                      {detectStatus}
                    </div>
                  )}

                  {displayError && (
                    <div className="mb-4 text-sm text-rose-200 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
                      {displayError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSendSol}
                    disabled={!enabled || actionLoading || sending}
                    className="w-full py-4 rounded-xl magic-gradient font-display font-bold text-base shadow-lg shadow-red-magic/20 hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                  >
                    {actionLoading || sending ? (
                      <span className="inline-flex items-center gap-2 justify-center">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {sending ? 'Confirming in wallet…' : detectStatus || 'Processing…'}
                      </span>
                    ) : registeredEntry ? (
                      'Send another entry'
                    ) : (
                      `Send ${solAmount || '—'} SOL & enter`
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDetectDeposit}
                    disabled={!enabled || actionLoading}
                    className="w-full py-3 rounded-xl border border-white/15 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Already sent? Detect my deposit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-8 lg:mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch [content-visibility:auto]">
          <SectionShell
            icon={<FaBalanceScale className="text-emerald-400" />}
            title="DEX vs OTC — fee comparison"
            subtitle="Uses the SOL amount from the calculator above"
            className="h-full"
          >
            <OtcSavingsCalculator
              solPerBuy={parseFloat(solAmount) || 0}
              solPriceUsd={config?.prices?.solUsd ?? null}
              poolLiquidityUsd={config?.prices?.aptcLiquidityUsd ?? null}
              tokenTaxBps={config?.tokenTradeTaxBps ?? 200}
              showEmbeddedBreakdown={false}
            />
          </SectionShell>

          <SectionShell
            icon={<FaChartLine className="text-cyan-400" />}
            title="Fee breakdown & market mechanics"
            subtitle="Why DEX buys cost more — sources & wallet rates"
            className="h-full"
          >
            <OtcFeeBreakdown compact />
          </SectionShell>
        </section>

        {/* Status section */}
        {(registeredEntry || myEntries.length > 0) && (
          <section className="mt-14">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 rounded-full magic-gradient" />
              <h2 className="text-2xl font-display font-bold">Your entries</h2>
            </div>
            <div className="space-y-4">
              {registeredEntry && <EntryCard entry={registeredEntry} highlight />}
              {myEntries
                .filter((e) => e.id !== registeredEntry?.id)
                .map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
            </div>
          </section>
        )}
      </div>
      <ChainConnectModal open={connectOpen} onClose={() => setConnectOpen(false)} />
    </div>
  );
}

function FeeSectionSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden>
      <div className="h-10 rounded-xl bg-white/5" />
      <div className="h-28 rounded-xl bg-white/5" />
    </div>
  );
}

function PricePill({ label, value, loading, accent }) {
  return (
    <div
      className={`rounded-xl px-4 py-3 border min-w-[120px] ${
        accent ? 'bg-cyan-500/10 border-cyan-400/25' : 'bg-white/5 border-white/10'
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-white/40">{label}</p>
      <p className={`mt-0.5 text-lg font-display font-bold ${accent ? 'text-cyan-200' : 'text-white'}`}>
        {loading ? '…' : value}
      </p>
    </div>
  );
}

function SectionShell({ icon, title, subtitle, children, className = '', bodyClassName = '' }) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-[#1A0015]/70 overflow-hidden flex flex-col ${className}`}
    >
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">{icon}</div>
        <div className="min-w-0">
          <h2 className="font-display font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-white/45">{subtitle}</p>}
        </div>
      </div>
      <div className={`p-5 flex-1 min-h-0 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

function EntryCard({ entry, highlight }) {
  const countdown = useCountdown(entry.unlockAt);
  const statusClass = STATUS_STYLES[entry.status] || STATUS_STYLES.pending_review;
  const showTimer = entry.status === 'pending_review' || entry.status === 'approved';

  return (
    <div
      className={`rounded-xl border p-5 md:p-6 ${
        highlight
          ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-900/20 to-[#1A0015]/80'
          : 'border-white/10 bg-[#1A0015]/60'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span
            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusClass}`}
          >
            {entry.status.replace('_', ' ')}
          </span>
          <p className="mt-3 text-2xl font-display font-bold text-white">
            {fmtNum(entry.solAmount)} <span className="text-lg text-white/50">SOL</span>
          </p>
          <p className="text-emerald-300 font-medium">≈ {fmtNum(entry.estimatedAptc)} APTC</p>
        </div>
        {showTimer && (
          <div className="rounded-xl border border-purple-500/30 bg-purple-900/25 px-5 py-4 min-w-[200px]">
            <p className="text-[10px] uppercase tracking-widest text-purple-200/70 mb-1">Settlement window</p>
            <p className="text-xl font-display font-bold text-white flex items-center gap-2">
              <FaClock className="text-purple-400 text-base" />
              {countdown.label}
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-white/5 grid gap-2 sm:grid-cols-3 text-xs text-white/50">
        <p>
          <span className="text-white/30 block mb-0.5">Received</span>
          {entry.solSentAt ? new Date(entry.solSentAt).toLocaleString() : '—'}
        </p>
        <p>
          <span className="text-white/30 block mb-0.5">Wallet</span>
          {shortAddr(entry.aptcReceiveWallet)}
        </p>
        <p>
          <span className="text-white/30 block mb-0.5">Transaction</span>
          <SolscanLink
            href={`https://solscan.io/tx/${entry.solTxSignature}`}
            size={12}
            className="text-cyan-300 hover:underline"
          >
            View tx
          </SolscanLink>
        </p>
      </div>

      {entry.status === 'approved' && countdown.done && (
        <p className="mt-3 text-sm text-emerald-300/90">Approved — APTC payout processing.</p>
      )}
      {entry.status === 'rejected' && entry.rejectReason && (
        <p className="mt-3 text-sm text-rose-300">{entry.rejectReason}</p>
      )}
      {entry.status === 'fulfilled' && (
        <p className="mt-3 text-sm text-blue-300">
          Delivered {fmtNum(entry.actualAptcSent)} APTC
          {entry.fulfillmentTxHash && ` · ${shortAddr(entry.fulfillmentTxHash)}`}
        </p>
      )}
    </div>
  );
}

function BenefitCard({ icon, title, body, tint }) {
  const borders = {
    amber: 'border-amber-500/20 hover:border-amber-500/35',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/35',
    cyan: 'border-cyan-500/20 hover:border-cyan-500/35',
    purple: 'border-purple-500/20 hover:border-purple-500/35',
  };
  return (
    <div
      className={`rounded-xl border bg-[#1A0015]/80 p-5 transition-colors ${borders[tint] || borders.amber}`}
    >
      <div className="mb-3">{icon}</div>
      <h3 className="font-display font-semibold text-white mb-1.5">{title}</h3>
      <p className="text-sm text-white/55 leading-relaxed">{body}</p>
    </div>
  );
}

function CalcTile({ label, value, sub, highlight }) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlight ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-black/30'
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-white/40">{label}</p>
      <p className={`mt-1 text-xl font-display font-bold ${highlight ? 'text-emerald-300' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-white/45 mt-0.5">{sub}</p>}
    </div>
  );
}
